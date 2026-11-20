import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
  CalendarDays,
  Users,
  UsersRound,
  Megaphone,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
} from "lucide-react";

import { useSubscriptionStore } from "../../store/subscriptionStore";
import { useAuthStore } from "../../store/authStore";

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString() : "-";

function BillingSubscriptionCard() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const {
    subscription,
    fetchMySubscription,
    isLoading,

    upgradeRequest,
    fetchMyUpgradeRequest,
    upgradeRequestLoading,

    error,
    upgradeRequestError,
  } = useSubscriptionStore();

  // ==========================================
  // LOAD SUBSCRIPTION + UPGRADE REQUEST
  // ==========================================
  useEffect(() => {
    fetchMySubscription();
    fetchMyUpgradeRequest();
  }, [fetchMySubscription, fetchMyUpgradeRequest]);

  // ==========================================
  // LOADING
  // ==========================================
  if (isLoading || upgradeRequestLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-slate-500">
          Loading subscription details...
        </p>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================
  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="font-medium text-red-600">
          {error}
        </p>
      </div>
    );
  }

  // ==========================================
  // NO SUBSCRIPTION
  // ==========================================
  if (!subscription) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-slate-500">
          No active subscription found.
        </p>
      </div>
    );
  }

  const {
    company,
    plan,
    subscription: planDetails,
  } = subscription;

  const requestStatus =
    upgradeRequest?.status;

  // ==========================================
  // STATUS HELPERS
  // ==========================================
  const isPending =
    requestStatus === "PENDING";

  const isApproved =
    requestStatus === "APPROVED";

  const isRejected =
    requestStatus === "REJECTED";

  const priceText = plan?.isCustom
    ? "Custom Plan"
    : `₹${plan?.price ?? 0}/month`;

  return (
    <div className="space-y-6">

      {/* ======================================
          UPGRADE REQUEST STATUS
      ====================================== */}

      {upgradeRequest && (
        <UpgradeRequestStatus
          request={upgradeRequest}
          isPending={isPending}
          isApproved={isApproved}
          isRejected={isRejected}
        />
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">

        {/* HEADER */}

        <div className="border-b border-slate-200 pb-5">
          <h2 className="text-lg font-bold leading-tight text-slate-900">
            Billing & Subscription
          </h2>

          <p className="mt-0.5 text-xs text-slate-500">
            Manage your WhatsApp CRM plan
          </p>
        </div>

        {/* ==================================
            CURRENT PLAN + PLAN DETAILS
        ================================== */}

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-5">

          {/* CURRENT PLAN */}

          <div className="relative flex flex-col justify-between gap-6 rounded-2xl bg-gradient-to-br from-green-100 via-green-50 to-emerald-50 p-6 lg:col-span-3">

            <div className="flex items-start justify-between gap-4">

              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-green-800">
                    Current Plan
                  </p>

                  {planDetails?.status && (
                    <span className="rounded-full bg-white/70 px-2.5 py-0.5 text-[11px] font-semibold text-green-700">
                      {planDetails.status}
                    </span>
                  )}
                </div>

                <h3 className="mt-2 text-2xl font-bold text-green-700">
                  {plan?.planName}
                </h3>

                <div className="mt-4 flex items-center gap-3">
                  <CalendarDays size={16} className="text-green-700" />

                  <div>
                    <p className="text-[11px] text-slate-500">
                      Next billing date
                    </p>
                    <p className="text-sm font-semibold text-slate-800">
                      {formatDate(planDetails?.expiryDate)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="shrink-0 rounded-xl bg-white px-4 py-2.5 shadow-sm">
                {plan?.isCustom ? (
                  <span className="text-base font-bold text-slate-900">
                    Custom Plan
                  </span>
                ) : (
                  <>
                    <span className="text-xl font-bold text-slate-900">
                      ₹{plan?.price ?? 0}
                    </span>
                    <span className="ml-1 text-[11px] text-slate-500">
                      /month
                    </span>
                  </>
                )}
              </div>

            </div>

            {user?.role === "ADMIN" && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate("/plans")}
                  className="rounded-lg bg-green-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-600"
                >
                  Upgrade Plan
                </button>
              </div>
            )}

          </div>

          {/* PLAN DETAILS */}

          <div className="rounded-2xl border border-slate-200 p-6 lg:col-span-2">

            <h3 className="mb-5 text-sm font-semibold text-slate-900">
              Plan Details
            </h3>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

              <InfoCard
                icon={<CalendarDays size={16} />}
                title="Start Date"
                value={formatDate(planDetails?.startDate)}
              />

              <InfoCard
                icon={<Clock size={16} />}
                title="Expiry Date"
                value={formatDate(planDetails?.expiryDate)}
              />

              <InfoCard
                icon={<span className="text-sm font-bold leading-none">₹</span>}
                title="Price"
                value={priceText}
              />

              <InfoCard
                icon={<CheckCircle size={16} />}
                title="Remaining Days"
                value={`${planDetails?.remainingDays ?? 0} Days`}
              />

            </div>

          </div>

        </div>

        {/* ==================================
            PLAN LIMITS
        ================================== */}

        <div className="mt-4 rounded-2xl border border-slate-200 p-6">

          <h3 className="mb-4 text-sm font-semibold text-slate-900">
            Plan Limits
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <LimitCard
              icon={<Users size={18} />}
              iconClass="bg-blue-100 text-blue-600"
              boxClass="border-blue-100"
              title="Users"
              value={plan?.maxUsers ?? 0}
            />

            <LimitCard
              icon={<UsersRound size={18} />}
              iconClass="bg-green-100 text-green-600"
              boxClass="border-green-100"
              title="Customers"
              value={plan?.maxCustomers ?? 0}
            />

            <LimitCard
              icon={<Megaphone size={18} />}
              iconClass="bg-orange-100 text-orange-600"
              boxClass="border-orange-100"
              title="Campaigns"
              value={plan?.maxCampaigns ?? 0}
            />

            <LimitCard
              icon={<FileText size={18} />}
              iconClass="bg-purple-100 text-purple-600"
              boxClass="border-purple-100"
              title="Templates"
              value={plan?.maxTemplates ?? 0}
            />

          </div>

        </div>

        {/* ==================================
            COMPANY DETAILS
        ================================== */}

        <div className="mt-4 rounded-2xl border border-slate-200 p-6">

          <h3 className="mb-4 text-sm font-semibold text-slate-900">
            Company Details
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-400">
                Company Name
              </p>

              <p className="text-sm font-semibold text-slate-800">
                {company?.companyName || "-"}
              </p>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-400">
                Owner
              </p>

              <p className="text-sm font-semibold text-slate-800">
                {company?.ownerName || "-"}
              </p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}


// =====================================================
// UPGRADE REQUEST STATUS
// =====================================================

function UpgradeRequestStatus({
  request,
  isPending,
  isApproved,
  isRejected,
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        isPending
          ? "border-yellow-200 bg-yellow-50"
          : isApproved
          ? "border-green-200 bg-green-50"
          : isRejected
          ? "border-red-200 bg-red-50"
          : "border-slate-200 bg-slate-50"
      }`}
    >

      <div className="flex items-start gap-4">

        {/* ICON */}

        <div
          className={`rounded-xl p-3 ${
            isPending
              ? "bg-yellow-100 text-yellow-600"
              : isApproved
              ? "bg-green-100 text-green-600"
              : isRejected
              ? "bg-red-100 text-red-600"
              : "bg-slate-100 text-slate-600"
          }`}
        >

          {isPending && (
            <Clock size={24} />
          )}

          {isApproved && (
            <CheckCircle size={24} />
          )}

          {isRejected && (
            <XCircle size={24} />
          )}

        </div>

        {/* CONTENT */}

        <div className="flex-1">

          <div className="flex flex-wrap items-center justify-between gap-2">

            <h3 className="text-lg font-bold text-slate-900">
              Upgrade Request
            </h3>

            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                isPending
                  ? "bg-yellow-100 text-yellow-700"
                  : isApproved
                  ? "bg-green-100 text-green-700"
                  : isRejected
                  ? "bg-red-100 text-red-700"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {request.status}
            </span>

          </div>

          {/* PLAN CHANGE */}

          <p className="mt-2 text-sm text-slate-600">

            Requested upgrade from{" "}

            <span className="font-semibold">
              {request.currentPlan?.planName}
            </span>

            {" "}to{" "}

            <span className="font-semibold">
              {request.requestedPlan?.planName}
            </span>

          </p>

          {/* PENDING */}

          {isPending && (
            <p className="mt-3 text-sm font-medium text-yellow-700">
              Your upgrade request is waiting for Super Admin approval.
            </p>
          )}

          {/* APPROVED */}

          {isApproved && (
            <p className="mt-3 text-sm font-medium text-green-700">
              Your upgrade request has been approved by the Super Admin.
            </p>
          )}

          {/* REJECTED */}

          {isRejected && (
            <div className="mt-3 rounded-xl border border-red-200 bg-white p-4">

              <div className="flex gap-2">

                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0 text-red-500"
                />

                <div>

                  <p className="text-sm font-semibold text-red-700">
                    Upgrade request rejected
                  </p>

                  {request.rejectionReason ? (
                    <p className="mt-1 text-sm text-slate-600">
                      Reason: {request.rejectionReason}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-slate-500">
                      No rejection reason was provided.
                    </p>
                  )}

                </div>

              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}


// =====================================================
// INFO CARD
// =====================================================

function InfoCard({
  icon,
  title,
  value,
}) {
  return (
    <div className="flex items-center gap-3">

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
        {icon}
      </div>

      <div className="min-w-0">

        <p className="text-[11px] text-slate-500">
          {title}
        </p>

        <p className="truncate text-sm font-semibold text-slate-800">
          {value}
        </p>

      </div>

    </div>
  );
}


// =====================================================
// LIMIT CARD
// =====================================================

function LimitCard({
  icon,
  iconClass,
  boxClass,
  title,
  value,
}) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border bg-white p-4 ${boxClass}`}>

      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconClass}`}>
        {icon}
      </div>

      <div>

        <p className="text-xs text-slate-500">
          {title}
        </p>

        <p className="text-xl font-bold text-slate-900">
          {value}
        </p>

      </div>

    </div>
  );
}

export default BillingSubscriptionCard;