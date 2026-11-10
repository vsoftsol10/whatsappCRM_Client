import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle } from "lucide-react";

import { useSubscriptionStore } from "../../store/subscriptionStore";
import { useAuthStore } from "../../store/authStore";
import { createPaymentOrder, verifyPayment } from "../../api/billingApi";
import PaymentConfirmModal from "./PaymentConfirmModal";

// ==========================================
// Helpers
// ==========================================
const formatPrice = (price) =>
  `₹${Number(price || 0).toLocaleString("en-IN")}`;

const formatPeriod = (days) => {
  const d = Number(days);
  if (d >= 28 && d <= 31) return "/ month";
  if (d >= 365 && d <= 366) return "/ year";
  if (d > 0) return `/ ${d} days`;
  return "";
};

const limitText = (value, label) =>
  Number(value) < 0 ? `Unlimited ${label}` : `${value} ${label}`;

const getFeatures = (features) => {
  if (Array.isArray(features)) return features;
  if (typeof features === "string") {
    try {
      const parsed = JSON.parse(features);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

// Loads Razorpay checkout.js once
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);

    const existing = document.getElementById("razorpay-checkout-js");
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

function Plans() {
  const { plans, plansLoading, fetchPlans, subscription, fetchMySubscription } =
    useSubscriptionStore();

  const user = useAuthStore((state) => state.user);

  // { mode: "renew" | "change", planId } while the popup is open
  const [modal, setModal] = useState(null);
  const [paying, setPaying] = useState(false);

  // Plans come from the same database table that Super Admin edits
  // and the landing page reads.
  useEffect(() => {
    fetchPlans();
    fetchMySubscription();
  }, [fetchPlans, fetchMySubscription]);

  const currentPlanId = subscription?.plan?.id;

  // Never show the same plan twice
  const visiblePlans = useMemo(() => {
    const seen = new Set();
    return (plans || []).filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [plans]);

  // Only paid plans can be bought
  const paidPlans = useMemo(
    () => visiblePlans.filter((p) => !p.isTrial && Number(p.price) > 0),
    [visiblePlans]
  );

  const currentPlan = subscription?.plan || null;
  const currentSub = subscription?.subscription || null;

  const openRenew = () => {
    const defaultPlan =
      paidPlans.find((p) => p.id === currentPlan?.id) || paidPlans[0];

    if (defaultPlan) setModal({ mode: "renew", planId: defaultPlan.id });
  };

  const openChange = (plan) => setModal({ mode: "change", planId: plan.id });

  const closeModal = () => {
    if (!paying) setModal(null);
  };

  // ==========================================
  // Pay & Continue: create order -> Razorpay -> verify
  // ==========================================
  const handlePay = async ({ planId, cycles }) => {
    if (paying) return;

    setPaying(true);

    let data;

    try {
      data = await createPaymentOrder(planId, cycles);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Could not start payment."
      );
      setPaying(false);
      return;
    }

    if (!data?.success) {
      toast.error(data?.message || "Could not start payment.");
      setPaying(false);
      return;
    }

    const loaded = await loadRazorpayScript();

    if (!loaded || !window.Razorpay) {
      toast.error(
        "Unable to load the payment gateway. Check your internet connection and try again."
      );
      setPaying(false);
      return;
    }

    const { order, keyId, summary } = data;

    const options = {
      key: keyId,
      amount: order.amount,
      currency: order.currency,
      name: "WhatsApp CRM",
      description: `${summary.planName} Plan`,
      order_id: order.id,
      prefill: {
        name: user?.name || "",
        email: user?.email || "",
      },
      handler: async (response) => {
        try {
          const result = await verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            planId: summary.planId,
            cycles: summary.cycles,
          });

          if (result.success) {
            toast.success(result.message || "Payment successful.");
            setModal(null);

            // refresh current plan + company info
            await fetchMySubscription();
            try {
              await useAuthStore.getState().fetchMe?.();
            } catch {
              /* not critical */
            }
          } else {
            toast.error(result.message || "Payment verification failed.");
          }
        } catch (error) {
          toast.error(
            `${
              error.response?.data?.message ||
              "Payment was received but could not be verified."
            } Payment ID: ${response.razorpay_payment_id}. Please contact support.`,
            { duration: 10000 }
          );
        } finally {
          setPaying(false);
        }
      },
      modal: {
        ondismiss: () => setPaying(false),
      },
      theme: { color: "#22c55e" },
    };

    const razorpay = new window.Razorpay(options);

    razorpay.on("payment.failed", (response) => {
      toast.error(response?.error?.description || "Payment failed.");
      setPaying(false);
    });

    razorpay.open();
  };

  const base =
    "mt-8 w-full rounded-xl py-3 text-base font-semibold transition-all duration-200";
  const disabledCls = "cursor-not-allowed bg-slate-100 text-slate-400";

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Plans</h1>
          <p className="mt-1 text-sm text-slate-500">
            Pick the plan that fits your team.
          </p>
        </div>

        <button
          type="button"
          onClick={openRenew}
          disabled={paidPlans.length === 0 || paying}
          className="rounded-xl bg-[#25D366] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#128C7E] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Renew Plan
        </button>
      </div>

      {plansLoading ? (
        <div className="py-16 text-center text-slate-500">Loading plans...</div>
      ) : visiblePlans.length === 0 ? (
        <div className="py-16 text-center text-slate-500">
          No plans available right now.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {visiblePlans.map((plan) => {
            const isCurrent = currentPlanId === plan.id;
            const features = getFeatures(plan.features);

            return (
              <div
                key={plan.id}
                className={`flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-lg ${
                  isCurrent
                    ? "border-[#25D366] ring-1 ring-[#25D366]"
                    : "border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">
                    {plan.planName}
                  </h2>
                  {isCurrent && (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      Current
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold text-slate-900">
                    {formatPrice(plan.price)}
                  </span>
                  <span className="text-xs text-slate-500">
                    {plan.isTrial || Number(plan.price) === 0
                      ? `Free trial · ${plan.durationDays} days`
                      : formatPeriod(plan.durationDays)}
                  </span>
                </div>

                <p className="mt-3 text-sm text-slate-500">
                  {limitText(plan.maxUsers, "users")},{" "}
                  {limitText(plan.maxCustomers, "contacts")},{" "}
                  {limitText(plan.maxCampaigns, "campaigns")},{" "}
                  {limitText(plan.maxTemplates, "templates")}.
                </p>

                <ul className="mt-5 flex-1 space-y-3">
                  {features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2.5 text-sm text-slate-700"
                    >
                      <CheckCircle
                        size={18}
                        className="mt-0.5 shrink-0 text-[#25D366]"
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <button type="button" disabled className={`${base} ${disabledCls}`}>
                    Current Plan
                  </button>
                ) : plan.isTrial ? (
                  <button type="button" disabled className={`${base} ${disabledCls}`}>
                    Trial Only
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => openChange(plan)}
                    disabled={paying}
                    className={`${base} bg-[#25D366] text-white hover:bg-[#128C7E] disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    Get Started
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <PaymentConfirmModal
        isOpen={Boolean(modal)}
        mode={modal?.mode}
        plans={paidPlans}
        currentPlanId={currentPlan?.id}
        currentSub={currentSub}
        initialPlanId={modal?.planId}
        paying={paying}
        onClose={closeModal}
        onPay={handlePay}
      />
    </div>
  );
}

export default Plans;
