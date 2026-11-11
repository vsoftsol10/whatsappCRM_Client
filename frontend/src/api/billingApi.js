import apiClient from "./apiClient";

// ==========================================
// CREATE RAZORPAY ORDER (price is read on the server)
// ==========================================
export const createPaymentOrder = async (planId, cycles = 1) => {
  const response = await apiClient.post("/api/billing/create-order", {
    planId,
    cycles,
  });

  return response.data;
};

// ==========================================
// VERIFY PAYMENT + RENEW / SWITCH PLAN
// ==========================================
export const verifyPayment = async (payload) => {
  const response = await apiClient.post(
    "/api/billing/verify-payment",
    payload
  );

  return response.data;
};