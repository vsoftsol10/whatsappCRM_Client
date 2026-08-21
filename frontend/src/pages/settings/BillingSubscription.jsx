import BillingSubscriptionCard from "./BillingSubscriptionCard";

function BillingSubscription() {
  return (
    <div className="crm-page bg-slate-50">
      <div className="mb-8">
        <h1 className="crm-title text-slate-900">
          Billing & Subscription
        </h1>

        <p className="mt-2 text-slate-500">
          Manage your subscription and billing information.
        </p>
      </div>

      <BillingSubscriptionCard />
    </div>
  );
}

export default BillingSubscription;