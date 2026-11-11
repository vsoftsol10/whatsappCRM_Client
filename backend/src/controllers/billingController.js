// const crypto = require("crypto");
// const Razorpay = require("razorpay");

// const prisma = require("../config/prisma");

// // Same GST rule as the landing page
// const GST_RATE = 0.18;

// // How many plan periods can be bought at once (1, 3, 6 or 12)
// const ALLOWED_CYCLES = [1, 3, 6, 12];

// const parseCycles = (value) => {
//   const cycles = Number(value ?? 1);

//   if (!ALLOWED_CYCLES.includes(cycles)) {
//     const err = new Error("Invalid duration selected.");
//     err.status = 400;
//     throw err;
//   }

//   return cycles;
// };

// // ==========================================
// // HELPERS
// // ==========================================

// // Created lazily so the server still starts if keys are missing
// const getRazorpay = () => {
//   const keyId = process.env.RAZORPAY_KEY_ID;
//   const keySecret = process.env.RAZORPAY_KEY_SECRET;

//   if (!keyId || !keySecret) {
//     const err = new Error("Online payment is not configured.");
//     err.status = 503;
//     throw err;
//   }

//   return new Razorpay({ key_id: keyId, key_secret: keySecret });
// };

// // Price always comes from the database, never from the browser
// const calcAmounts = (plan, cycles = 1) => {
//   const amount = Number(plan.price) * cycles;
//   const tax = Math.round(amount * GST_RATE);
//   const totalAmount = amount + tax;

//   return { amount, tax, totalAmount };
// };

// // Current ACTIVE/TRIAL subscription, else the latest one (expired customers)
// const findCurrentSubscription = async (client, companyId) => {
//   const active = await client.subscription.findFirst({
//     where: { companyId, status: { in: ["ACTIVE", "TRIAL"] } },
//     orderBy: { expiryDate: "desc" },
//   });

//   if (active) return active;

//   return client.subscription.findFirst({
//     where: { companyId },
//     orderBy: { expiryDate: "desc" },
//   });
// };

// // RENEW  = same plan as current one
// // SWITCH = any other plan
// //
// // RENEW while still running -> new period is added AFTER the current expiry
// // RENEW after expiry / SWITCH -> new period starts today
// const calcDates = (subscription, plan, cycles = 1) => {
//   const now = new Date();

//   const isRenew = subscription.planId === plan.id;

//   const stillRunning =
//     isRenew &&
//     subscription.status === "ACTIVE" &&
//     new Date(subscription.expiryDate) > now;

//   const startDate = stillRunning ? subscription.startDate : now;

//   const expiryDate = new Date(
//     stillRunning ? subscription.expiryDate : now
//   );
//   expiryDate.setDate(expiryDate.getDate() + plan.durationDays * cycles);

//   return {
//     type: isRenew ? "RENEW" : "SWITCH",
//     startDate,
//     expiryDate,
//   };
// };

// // Loads plan + company and runs every rule that applies to a purchase
// const loadPurchaseContext = async (companyId, planId) => {
//   if (!planId) {
//     const err = new Error("Plan is required.");
//     err.status = 400;
//     throw err;
//   }

//   const plan = await prisma.subscriptionPlan.findUnique({
//     where: { id: Number(planId) },
//   });

//   if (!plan || plan.status !== "ACTIVE") {
//     const err = new Error("This plan is not available.");
//     err.status = 404;
//     throw err;
//   }

//   if (plan.isTrial || Number(plan.price) <= 0) {
//     const err = new Error("This plan cannot be purchased.");
//     err.status = 400;
//     throw err;
//   }

//   const company = await prisma.company.findUnique({
//     where: { id: companyId },
//   });

//   if (!company) {
//     const err = new Error("Company not found.");
//     err.status = 404;
//     throw err;
//   }

//   // INACTIVE = suspended by Super Admin. EXPIRED companies may pay.
//   if (company.status === "INACTIVE") {
//     const err = new Error(
//       "Your account is inactive. Please contact support."
//     );
//     err.status = 403;
//     throw err;
//   }

//   const subscription = await findCurrentSubscription(prisma, companyId);

//   if (!subscription) {
//     const err = new Error("No subscription found for your company.");
//     err.status = 404;
//     throw err;
//   }

//   return { plan, company, subscription };
// };

// const sendError = (res, error, fallback) => {
//   console.error(fallback, error);

//   return res.status(error.status || 500).json({
//     success: false,
//     message: error.status ? error.message : fallback,
//   });
// };

// // ==========================================
// // CREATE ORDER
// // POST /api/billing/create-order   { planId }
// // ==========================================
// const createOrder = async (req, res) => {
//   try {
//     const companyId = req.user.companyId;
//     const { planId } = req.body;
//     const cycles = parseCycles(req.body.cycles);

//     const { plan, subscription } = await loadPurchaseContext(
//       companyId,
//       planId
//     );

//     const { amount, tax, totalAmount } = calcAmounts(plan, cycles);
//     const { type, expiryDate } = calcDates(subscription, plan, cycles);

//     const razorpay = getRazorpay();

//     const order = await razorpay.orders.create({
//       amount: Math.round(totalAmount * 100),
//       currency: "INR",
//       receipt: `crm_${companyId}_${Date.now()}`,
//       notes: {
//         companyId: String(companyId),
//         planId: String(plan.id),
//         cycles: String(cycles),
//         type,
//       },
//     });

//     return res.status(200).json({
//       success: true,
//       order,
//       keyId: process.env.RAZORPAY_KEY_ID,
//       summary: {
//         type,
//         planId: plan.id,
//         planName: plan.planName,
//         amount,
//         tax,
//         totalAmount,
//         cycles,
//         durationDays: plan.durationDays * cycles,
//         newExpiryDate: expiryDate,
//       },
//     });
//   } catch (error) {
//     return sendError(res, error, "Failed to create payment order.");
//   }
// };

// // ==========================================
// // VERIFY PAYMENT
// // POST /api/billing/verify-payment
// // { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId }
// // ==========================================
// const verifyPayment = async (req, res) => {
//   try {
//     const companyId = req.user.companyId;

//     const {
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//       planId,
//     } = req.body;

//     if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
//       return res.status(400).json({
//         success: false,
//         message: "Payment verification details are required.",
//       });
//     }

//     const cycles = parseCycles(req.body.cycles);

//     // 1) Signature check (proves Razorpay sent this payment)
//     const expectedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
//       .update(`${razorpay_order_id}|${razorpay_payment_id}`)
//       .digest("hex");

//     const given = Buffer.from(String(razorpay_signature));
//     const expected = Buffer.from(expectedSignature);

//     if (
//       given.length !== expected.length ||
//       !crypto.timingSafeEqual(given, expected)
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid payment signature.",
//       });
//     }

//     // 2) Already processed? (page refresh / double click)
//     const existingPayment = await prisma.payment.findUnique({
//       where: { razorpayPaymentId: razorpay_payment_id },
//     });

//     if (existingPayment) {
//       return res.status(200).json({
//         success: true,
//         message: "Payment already processed.",
//         alreadyProcessed: true,
//       });
//     }

//     // 3) Same rules as create-order
//     const { plan, company } = await loadPurchaseContext(
//       companyId,
//       planId
//     );

//     const { amount, tax, totalAmount } = calcAmounts(plan, cycles);

//     // 4) The paid order must be for THIS company, THIS plan, THIS amount
//     const razorpay = getRazorpay();
//     const order = await razorpay.orders.fetch(razorpay_order_id);

//     if (
//       String(order.notes?.companyId) !== String(companyId) ||
//       String(order.notes?.planId) !== String(plan.id) ||
//       String(order.notes?.cycles) !== String(cycles)
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "This payment does not belong to the selected plan.",
//       });
//     }

//     if (Number(order.amount) !== Math.round(totalAmount * 100)) {
//       return res.status(400).json({
//         success: false,
//         message: "Payment amount does not match the selected plan.",
//       });
//     }

//     // 5) Update everything in ONE transaction
//     const result = await prisma.$transaction(async (tx) => {
//       const subscription = await findCurrentSubscription(tx, companyId);

//       if (!subscription) {
//         throw Object.assign(new Error("No subscription found."), {
//           status: 404,
//         });
//       }

//       const { type, startDate, expiryDate } = calcDates(
//         subscription,
//         plan,
//         cycles
//       );

//       const updatedSubscription = await tx.subscription.update({
//         where: { id: subscription.id },
//         data: {
//           planId: plan.id,
//           startDate,
//           expiryDate,
//           status: "ACTIVE",
//           paymentStatus: "PAID",
//         },
//       });

//       await tx.company.update({
//         where: { id: companyId },
//         data: {
//           plan: plan.planName,
//           expiryDate,
//           status: "ACTIVE",
//         },
//       });

//       const payment = await tx.payment.create({
//         data: {
//           paymentId: `PAY-${Date.now()}-${Math.floor(
//             Math.random() * 1000
//           )}`,
//           companyId,
//           subscriptionId: updatedSubscription.id,
//           planId: plan.id,
//           companyName: company.companyName,
//           ownerName: company.ownerName,
//           email: company.email,
//           phone: company.phone,
//           amount,
//           tax,
//           discount: 0,
//           totalAmount,
//           paymentMethod: "RAZORPAY",
//           paymentStatus: "PAID",
//           gateway: "RAZORPAY",
//           transactionId: razorpay_payment_id,
//           razorpayOrderId: razorpay_order_id,
//           razorpayPaymentId: razorpay_payment_id,
//           razorpaySignature: razorpay_signature,
//           paidAt: new Date(),
//         },
//       });

//       return { type, updatedSubscription, payment };
//     });

//     // 6) Notifications (never block the response)
//     try {
//       await prisma.userNotification.create({
//         data: {
//           userId: req.user.userId,
//           title:
//             result.type === "RENEW"
//               ? "Plan Renewed"
//               : "Plan Changed",
//           message: `Your ${plan.planName} plan is active until ${new Date(
//             result.updatedSubscription.expiryDate
//           ).toLocaleDateString("en-IN")}. Payment of ₹${totalAmount} received.`,
//           type: "SYSTEM",
//           isRead: false,
//         },
//       });

//       const superAdmin = await prisma.superAdmin.findFirst({
//         select: { id: true },
//       });

//       if (superAdmin) {
//         await prisma.notification.create({
//           data: {
//             superAdminId: superAdmin.id,
//             title:
//               result.type === "RENEW"
//                 ? "Plan Renewed"
//                 : "Plan Changed",
//             message: `${company.companyName} (${company.companyId}) ${
//               result.type === "RENEW" ? "renewed" : "switched to"
//             } the ${plan.planName} plan. Payment of ₹${totalAmount} received. Payment ID: ${result.payment.paymentId}.`,
//           },
//         });
//       }
//     } catch (notifyError) {
//       console.error("BILLING NOTIFICATION ERROR:", notifyError.message);
//     }

//     return res.status(200).json({
//       success: true,
//       message:
//         result.type === "RENEW"
//           ? "Plan renewed successfully."
//           : "Plan changed successfully.",
//       type: result.type,
//       subscription: {
//         planName: plan.planName,
//         startDate: result.updatedSubscription.startDate,
//         expiryDate: result.updatedSubscription.expiryDate,
//         status: result.updatedSubscription.status,
//       },
//       payment: {
//         paymentId: result.payment.paymentId,
//         totalAmount: result.payment.totalAmount,
//       },
//     });
//   } catch (error) {
//     // Two requests with the same payment arrived together
//     if (error.code === "P2002") {
//       return res.status(200).json({
//         success: true,
//         message: "Payment already processed.",
//         alreadyProcessed: true,
//       });
//     }

//     return sendError(res, error, "Payment verification failed.");
//   }
// };

// module.exports = {
//   createOrder,
//   verifyPayment,
// };


const crypto = require("crypto");
const Razorpay = require("razorpay");

const prisma = require("../config/prisma");

// No GST is added on plan purchases

// How many plan periods can be bought at once (1, 3, 6 or 12)
const ALLOWED_CYCLES = [1, 3, 6, 12];

const parseCycles = (value) => {
  const cycles = Number(value ?? 1);

  if (!ALLOWED_CYCLES.includes(cycles)) {
    const err = new Error("Invalid duration selected.");
    err.status = 400;
    throw err;
  }

  return cycles;
};

// ==========================================
// HELPERS
// ==========================================

// Created lazily so the server still starts if keys are missing
const getRazorpay = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    const err = new Error("Online payment is not configured.");
    err.status = 503;
    throw err;
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

// Price always comes from the database, never from the browser
const calcAmounts = (plan, cycles = 1) => {
  const amount = Number(plan.price) * cycles;
  const tax = 0;
  const totalAmount = amount;

  return { amount, tax, totalAmount };
};

// Current ACTIVE/TRIAL subscription, else the latest one (expired customers)
const findCurrentSubscription = async (client, companyId) => {
  const active = await client.subscription.findFirst({
    where: { companyId, status: { in: ["ACTIVE", "TRIAL"] } },
    orderBy: { expiryDate: "desc" },
  });

  if (active) return active;

  return client.subscription.findFirst({
    where: { companyId },
    orderBy: { expiryDate: "desc" },
  });
};

// RENEW  = same plan as current one
// SWITCH = any other plan
//
// RENEW while still running -> new period is added AFTER the current expiry
// RENEW after expiry / SWITCH -> new period starts today
const calcDates = (subscription, plan, cycles = 1) => {
  const now = new Date();

  const isRenew = subscription.planId === plan.id;

  const stillRunning =
    isRenew &&
    subscription.status === "ACTIVE" &&
    new Date(subscription.expiryDate) > now;

  const startDate = stillRunning ? subscription.startDate : now;

  const expiryDate = new Date(
    stillRunning ? subscription.expiryDate : now
  );
  expiryDate.setDate(expiryDate.getDate() + plan.durationDays * cycles);

  return {
    type: isRenew ? "RENEW" : "SWITCH",
    startDate,
    expiryDate,
  };
};

// Loads plan + company and runs every rule that applies to a purchase
const loadPurchaseContext = async (companyId, planId) => {
  if (!planId) {
    const err = new Error("Plan is required.");
    err.status = 400;
    throw err;
  }

  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: Number(planId) },
  });

  if (!plan || plan.status !== "ACTIVE") {
    const err = new Error("This plan is not available.");
    err.status = 404;
    throw err;
  }

  if (plan.isTrial || Number(plan.price) <= 0) {
    const err = new Error("This plan cannot be purchased.");
    err.status = 400;
    throw err;
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    const err = new Error("Company not found.");
    err.status = 404;
    throw err;
  }

  // INACTIVE = suspended by Super Admin. EXPIRED companies may pay.
  if (company.status === "INACTIVE") {
    const err = new Error(
      "Your account is inactive. Please contact support."
    );
    err.status = 403;
    throw err;
  }

  const subscription = await findCurrentSubscription(prisma, companyId);

  if (!subscription) {
    const err = new Error("No subscription found for your company.");
    err.status = 404;
    throw err;
  }

  return { plan, company, subscription };
};

const sendError = (res, error, fallback) => {
  console.error(fallback, error);

  return res.status(error.status || 500).json({
    success: false,
    message: error.status ? error.message : fallback,
  });
};

// ==========================================
// CREATE ORDER
// POST /api/billing/create-order   { planId }
// ==========================================
const createOrder = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { planId } = req.body;
    const cycles = parseCycles(req.body.cycles);

    const { plan, subscription } = await loadPurchaseContext(
      companyId,
      planId
    );

    const { amount, tax, totalAmount } = calcAmounts(plan, cycles);
    const { type, expiryDate } = calcDates(subscription, plan, cycles);

    const razorpay = getRazorpay();

    const order = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: `crm_${companyId}_${Date.now()}`,
      notes: {
        companyId: String(companyId),
        planId: String(plan.id),
        cycles: String(cycles),
        type,
      },
    });

    return res.status(200).json({
      success: true,
      order,
      keyId: process.env.RAZORPAY_KEY_ID,
      summary: {
        type,
        planId: plan.id,
        planName: plan.planName,
        amount,
        tax,
        totalAmount,
        cycles,
        durationDays: plan.durationDays * cycles,
        newExpiryDate: expiryDate,
      },
    });
  } catch (error) {
    return sendError(res, error, "Failed to create payment order.");
  }
};

// ==========================================
// VERIFY PAYMENT
// POST /api/billing/verify-payment
// { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId }
// ==========================================
const verifyPayment = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification details are required.",
      });
    }

    const cycles = parseCycles(req.body.cycles);

    // 1) Signature check (proves Razorpay sent this payment)
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const given = Buffer.from(String(razorpay_signature));
    const expected = Buffer.from(expectedSignature);

    if (
      given.length !== expected.length ||
      !crypto.timingSafeEqual(given, expected)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature.",
      });
    }

    // 2) Already processed? (page refresh / double click)
    const existingPayment = await prisma.payment.findUnique({
      where: { razorpayPaymentId: razorpay_payment_id },
    });

    if (existingPayment) {
      return res.status(200).json({
        success: true,
        message: "Payment already processed.",
        alreadyProcessed: true,
      });
    }

    // 3) Same rules as create-order
    const { plan, company } = await loadPurchaseContext(
      companyId,
      planId
    );

    const { amount, tax, totalAmount } = calcAmounts(plan, cycles);

    // 4) The paid order must be for THIS company, THIS plan, THIS amount
    const razorpay = getRazorpay();
    const order = await razorpay.orders.fetch(razorpay_order_id);

    if (
      String(order.notes?.companyId) !== String(companyId) ||
      String(order.notes?.planId) !== String(plan.id) ||
      String(order.notes?.cycles) !== String(cycles)
    ) {
      return res.status(400).json({
        success: false,
        message: "This payment does not belong to the selected plan.",
      });
    }

    if (Number(order.amount) !== Math.round(totalAmount * 100)) {
      return res.status(400).json({
        success: false,
        message: "Payment amount does not match the selected plan.",
      });
    }

    // 5) Update everything in ONE transaction
    const result = await prisma.$transaction(async (tx) => {
      const subscription = await findCurrentSubscription(tx, companyId);

      if (!subscription) {
        throw Object.assign(new Error("No subscription found."), {
          status: 404,
        });
      }

      const { type, startDate, expiryDate } = calcDates(
        subscription,
        plan,
        cycles
      );

      const updatedSubscription = await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          planId: plan.id,
          startDate,
          expiryDate,
          status: "ACTIVE",
          paymentStatus: "PAID",
        },
      });

      await tx.company.update({
        where: { id: companyId },
        data: {
          plan: plan.planName,
          expiryDate,
          status: "ACTIVE",
        },
      });

      const payment = await tx.payment.create({
        data: {
          paymentId: `PAY-${Date.now()}-${Math.floor(
            Math.random() * 1000
          )}`,
          companyId,
          subscriptionId: updatedSubscription.id,
          planId: plan.id,
          companyName: company.companyName,
          ownerName: company.ownerName,
          email: company.email,
          phone: company.phone,
          amount,
          tax,
          discount: 0,
          totalAmount,
          paymentMethod: "RAZORPAY",
          paymentStatus: "PAID",
          gateway: "RAZORPAY",
          transactionId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          paidAt: new Date(),
        },
      });

      return { type, updatedSubscription, payment };
    });

    // 6) Notifications (never block the response)
    try {
      await prisma.userNotification.create({
        data: {
          userId: req.user.userId,
          title:
            result.type === "RENEW"
              ? "Plan Renewed"
              : "Plan Changed",
          message: `Your ${plan.planName} plan is active until ${new Date(
            result.updatedSubscription.expiryDate
          ).toLocaleDateString("en-IN")}. Payment of ₹${totalAmount} received.`,
          type: "SYSTEM",
          isRead: false,
        },
      });

      const superAdmin = await prisma.superAdmin.findFirst({
        select: { id: true },
      });

      if (superAdmin) {
        await prisma.notification.create({
          data: {
            superAdminId: superAdmin.id,
            title:
              result.type === "RENEW"
                ? "Plan Renewed"
                : "Plan Changed",
            message: `${company.companyName} (${company.companyId}) ${
              result.type === "RENEW" ? "renewed" : "switched to"
            } the ${plan.planName} plan. Payment of ₹${totalAmount} received. Payment ID: ${result.payment.paymentId}.`,
          },
        });
      }
    } catch (notifyError) {
      console.error("BILLING NOTIFICATION ERROR:", notifyError.message);
    }

    return res.status(200).json({
      success: true,
      message:
        result.type === "RENEW"
          ? "Plan renewed successfully."
          : "Plan changed successfully.",
      type: result.type,
      subscription: {
        planName: plan.planName,
        startDate: result.updatedSubscription.startDate,
        expiryDate: result.updatedSubscription.expiryDate,
        status: result.updatedSubscription.status,
      },
      payment: {
        paymentId: result.payment.paymentId,
        totalAmount: result.payment.totalAmount,
      },
    });
  } catch (error) {
    // Two requests with the same payment arrived together
    if (error.code === "P2002") {
      return res.status(200).json({
        success: true,
        message: "Payment already processed.",
        alreadyProcessed: true,
      });
    }

    return sendError(res, error, "Payment verification failed.");
  }
};

module.exports = {
  createOrder,
  verifyPayment,
};