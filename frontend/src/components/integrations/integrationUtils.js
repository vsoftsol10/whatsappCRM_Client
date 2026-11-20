export const TYPE_LABELS = {
  BILLING: "Billing",
  ECOMMERCE: "E-commerce",
  POS: "POS",
  ERP: "ERP",
  PAYMENT: "Payment",
  CUSTOM: "Custom",
};

export const formatDate = (date, empty = "-") => {
  if (!date) return empty;

  try {
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return empty;
  }
};
