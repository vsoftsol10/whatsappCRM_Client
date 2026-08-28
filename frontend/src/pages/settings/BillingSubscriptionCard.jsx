import { useEffect } from "react";

import {
  CreditCard,
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

function BillingSubscriptionCard() {
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
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
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
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
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
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
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

      {/* ======================================
          HEADER CARD
      ====================================== */}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

        {/* HEADER */}

        <div className="bg-gradient-to-r from-[#25D366] to-[#128C7E] p-6 text-white">

          <div className="flex items-center gap-3">

            <div className="rounded-2xl bg-white/20 p-3">
              <CreditCard size={28} />
            </div>

            <div>

              <h2 className="text-2xl font-bold">
                Billing & Subscription
              </h2>

              <p className="text-sm text-white/80">
                Manage your WhatsApp CRM plan
              </p>

            </div>

          </div>

        </div>

        {/* BODY */}

        <div className="p-6">

          {/* ==================================
              COMPANY
          ================================== */}

          <div className="mb-6 rounded-2xl bg-slate-50 p-5">

            <h3 className="mb-3 text-lg font-bold text-slate-900">
              Company Details
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              <div>

                <p className="text-sm text-slate-500">
                  Company Name
                </p>

                <p className="font-semibold text-slate-800">
                  {company?.companyName || "-"}
                </p>

              </div>

              <div>

                <p className="text-sm text-slate-500">
                  Owner
                </p>

                <p className="font-semibold text-slate-800">
                  {company?.ownerName || "-"}
                </p>

              </div>

            </div>

          </div>

          {/* ==================================
              CURRENT PLAN
          ================================== */}

          <div className="mb-6 rounded-2xl border border-[#DCF8C6] bg-[#F6FFF8] p-5">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-500">
                  Current Plan
                </p>

                <h3 className="text-2xl font-bold text-[#128C7E]">
                  {plan?.planName}
                </h3>

              </div>

              <div className="rounded-full bg-[#DCF8C6] px-4 py-2 text-sm font-semibold text-[#128C7E]">

                {planDetails?.status}

              </div>

            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">

              <InfoCard
                icon={<CalendarDays size={18} />}
                title="Start Date"
                value={
                  planDetails?.startDate
                    ? new Date(
                        planDetails.startDate
                      ).toLocaleDateString()
                    : "-"
                }
              />

              <InfoCard
                icon={<Clock size={18} />}
                title="Expiry Date"
                value={
                  planDetails?.expiryDate
                    ? new Date(
                        planDetails.expiryDate
                      ).toLocaleDateString()
                    : "-"
                }
              />

              <InfoCard
                icon={<CreditCard size={18} />}
                title="Price"
                value={`₹${plan?.price ?? 0}/month`}
              />

              <InfoCard
                icon={<CheckCircle size={18} />}
                title="Remaining Days"
                value={`${planDetails?.remainingDays ?? 0} Days`}
              />

            </div>

          </div>

          {/* ==================================
              LIMITS
          ================================== */}

          <div className="rounded-2xl bg-slate-50 p-5">

            <h3 className="mb-4 text-lg font-bold text-slate-900">
              Plan Limits
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">

              <LimitCard
                icon={<Users />}
                title="Users"
                value={plan?.maxUsers ?? 0}
              />

              <LimitCard
                icon={<UsersRound />}
                title="Customers"
                value={plan?.maxCustomers ?? 0}
              />

              <LimitCard
                icon={<Megaphone />}
                title="Campaigns"
                value={plan?.maxCampaigns ?? 0}
              />

              <LimitCard
                icon={<FileText />}
                title="Templates"
                value={plan?.maxTemplates ?? 0}
              />

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
    <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">

      <div className="rounded-xl bg-[#DCF8C6] p-2 text-[#128C7E]">
        {icon}
      </div>

      <div>

        <p className="text-xs text-slate-500">
          {title}
        </p>

        <p className="font-semibold text-slate-800">
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
  title,
  value,
}) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">

      <div className="mb-2 text-[#25D366]">
        {icon}
      </div>

      <p className="text-sm text-slate-500">
        {title}
      </p>

      <p className="text-xl font-bold text-slate-900">
        {value}
      </p>

    </div>
  );
}

export default BillingSubscriptionCard;