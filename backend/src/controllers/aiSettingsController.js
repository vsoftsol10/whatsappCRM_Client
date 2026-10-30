// const prisma = require("../config/prisma");

// const {
//   getOrCreateSettings,
//   serializeSettings,
//   getPlatformAi,
//   testAutoReply,
// } = require("../services/aiService");
// const { sanitizeProfile } = require("../services/ai/businessPrompt");

// const MAX_PROMPT_LENGTH = 4000;

// const isAdmin = (req) => req.user?.role === "ADMIN";

// const forbidden = (res, action) =>
//   res.status(403).json({
//     success: false,
//     message: `Only admins can ${action}`,
//   });

// const badRequest = (res, message) =>
//   res.status(400).json({ success: false, message });

// // Tiny in-memory limiter for the test button (10 tests / minute / company)
// const testCalls = new Map();

// const isTestRateLimited = (companyId) => {
//   const now = Date.now();
//   const recent = (testCalls.get(companyId) || []).filter(
//     (time) => now - time < 60000
//   );

//   if (recent.length >= 10) {
//     testCalls.set(companyId, recent);
//     return true;
//   }

//   recent.push(now);
//   testCalls.set(companyId, recent);
//   return false;
// };

// // ============================================
// // GET /api/ai-settings
// // ============================================
// const getAiSettings = async (req, res) => {
//   try {
//     if (!isAdmin(req)) return forbidden(res, "view AI settings");

//     const settings = await getOrCreateSettings(req.user.companyId);

//     // Shown as the placeholder for "Business name" on the settings page
//     const company = await prisma.company.findUnique({
//       where: { id: req.user.companyId },
//       select: { companyName: true },
//     });

//     // Employees a new AI lead can be assigned to (same rule as manual leads)
//     const employees = await prisma.user.findMany({
//       where: { companyId: req.user.companyId, role: "USER", status: "ACTIVE" },
//       select: { id: true, name: true },
//       orderBy: { name: "asc" },
//     });

//     return res.status(200).json({
//       success: true,
//       settings: serializeSettings(settings),
//       companyName: company?.companyName || "",
//       employees,
//     });
//   } catch (error) {
//     console.error("Get AI settings error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch AI settings",
//     });
//   }
// };

// // ============================================
// // PATCH /api/ai-settings
// // ============================================
// // Body (all optional): isEnabled, businessProfile, systemPrompt (extra
// // instructions, may be empty), historyLimit, leadCaptureEnabled,
// // leadAssigneeId (employee id or null)
// // The AI provider, model and key are platform-wide (server .env) and
// // cannot be changed from here.
// const updateAiSettings = async (req, res) => {
//   try {
//     if (!isAdmin(req)) return forbidden(res, "update AI settings");

//     const companyId = req.user.companyId;
//     const body = req.body || {};

//     const existing = await getOrCreateSettings(companyId);
//     const data = {};

//     // ---------- business profile ----------
//     if (body.businessProfile !== undefined) {
//       const { profile, error } = sanitizeProfile(body.businessProfile);

//       if (error) return badRequest(res, error);

//       data.businessProfile = profile;
//     }

//     // ---------- extra instructions (the old "system prompt") ----------
//     if (body.systemPrompt !== undefined) {
//       const prompt = String(body.systemPrompt).trim();

//       if (prompt.length > MAX_PROMPT_LENGTH) {
//         return badRequest(
//           res,
//           `Extra instructions must be ${MAX_PROMPT_LENGTH} characters or fewer`
//         );
//       }

//       data.systemPrompt = prompt;
//     }

//     // ---------- history limit ----------
//     if (body.historyLimit !== undefined) {
//       const limit = Number(body.historyLimit);

//       if (!Number.isFinite(limit) || limit < 1) {
//         return badRequest(res, "History limit must be a number from 1 to 50");
//       }

//       data.historyLimit = Math.min(50, Math.floor(limit));
//     }

//     // ---------- master switch ----------
//     if (body.isEnabled !== undefined) {
//       if (typeof body.isEnabled !== "boolean") {
//         return badRequest(res, "isEnabled must be true or false");
//       }

//       data.isEnabled = body.isEnabled;
//     }

//     // ---------- lead capture ----------
//     if (body.leadCaptureEnabled !== undefined) {
//       if (typeof body.leadCaptureEnabled !== "boolean") {
//         return badRequest(res, "leadCaptureEnabled must be true or false");
//       }

//       data.leadCaptureEnabled = body.leadCaptureEnabled;
//     }

//     if (body.leadAssigneeId !== undefined) {
//       const assigneeId = body.leadAssigneeId ? String(body.leadAssigneeId) : null;

//       if (assigneeId) {
//         const employee = await prisma.user.findFirst({
//           where: { id: assigneeId, companyId, role: "USER", status: "ACTIVE" },
//           select: { id: true },
//         });

//         if (!employee) {
//           return badRequest(res, "Invalid employee selected for new leads");
//         }
//       }

//       data.leadAssigneeId = assigneeId;
//     }

//     // ---------- can it actually run? ----------
//     const willBeEnabled = data.isEnabled ?? existing.isEnabled;

//     if (data.isEnabled === true && willBeEnabled && !getPlatformAi().available) {
//       return badRequest(
//         res,
//         "AI auto-reply is not available right now. Please contact support."
//       );
//     }

//     // Turning it on again deserves a fresh start, so an old error
//     // message doesn't linger on the page.
//     if (data.isEnabled === true) {
//       data.lastError = null;
//       data.lastErrorAt = null;
//     }

//     const settings = await prisma.aiSettings.update({
//       where: { id: existing.id },
//       data,
//     });

//     return res.status(200).json({
//       success: true,
//       message: "AI settings updated successfully",
//       settings: serializeSettings(settings),
//     });
//   } catch (error) {
//     console.error("Update AI settings error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to update AI settings",
//     });
//   }
// };

// // ============================================
// // POST /api/ai-settings/test
// // ============================================
// // Sends ONE sample customer message to the AI and returns its reply.
// // Nothing is sent on WhatsApp. Accepts an unsaved business profile
// // and extra instructions.
// const testAiSettings = async (req, res) => {
//   try {
//     if (!isAdmin(req)) return forbidden(res, "test AI settings");

//     const companyId = req.user.companyId;

//     if (isTestRateLimited(companyId)) {
//       return res.status(429).json({
//         success: false,
//         message: "Too many tests. Please wait a minute and try again.",
//       });
//     }

//     const body = req.body || {};

//     if (typeof body.message === "string" && body.message.length > 500) {
//       return badRequest(res, "Test message must be 500 characters or fewer");
//     }

//     let businessProfile;

//     if (body.businessProfile !== undefined) {
//       const { profile, error } = sanitizeProfile(body.businessProfile);

//       if (error) return badRequest(res, error);

//       businessProfile = profile;
//     }

//     const result = await testAutoReply(companyId, {
//       businessProfile,
//       systemPrompt:
//         typeof body.systemPrompt === "string" ? body.systemPrompt : undefined,
//       message: typeof body.message === "string" ? body.message : undefined,
//     });

//     if (!result.success) {
//       return res.status(400).json({ success: false, message: result.error });
//     }

//     return res.status(200).json({
//       success: true,
//       reply: result.reply,
//       handoff: Boolean(result.handoff),
//       latencyMs: result.latencyMs,
//     });
//   } catch (error) {
//     console.error("Test AI settings error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to test AI settings",
//     });
//   }
// };

// module.exports = {
//   getAiSettings,
//   updateAiSettings,
//   testAiSettings,
// };





const prisma = require("../config/prisma");

const {
  getOrCreateSettings,
  serializeSettings,
  getPlatformAi,
  testAutoReply,
} = require("../services/aiService");
const { sanitizeProfile } = require("../services/ai/businessPrompt");

const MAX_PROMPT_LENGTH = 4000;

const isAdmin = (req) => req.user?.role === "ADMIN";

const forbidden = (res, action) =>
  res.status(403).json({
    success: false,
    message: `Only admins can ${action}`,
  });

const badRequest = (res, message) =>
  res.status(400).json({ success: false, message });

// Tiny in-memory limiter for the test button (10 tests / minute / company)
const testCalls = new Map();

const isTestRateLimited = (companyId) => {
  const now = Date.now();
  const recent = (testCalls.get(companyId) || []).filter(
    (time) => now - time < 60000
  );

  if (recent.length >= 10) {
    testCalls.set(companyId, recent);
    return true;
  }

  recent.push(now);
  testCalls.set(companyId, recent);
  return false;
};

// ============================================
// GET /api/ai-settings
// ============================================
const getAiSettings = async (req, res) => {
  try {
    if (!isAdmin(req)) return forbidden(res, "view AI settings");

    const settings = await getOrCreateSettings(req.user.companyId);

    // Shown as the placeholder for "Business name" on the settings page
    const company = await prisma.company.findUnique({
      where: { id: req.user.companyId },
      select: { companyName: true },
    });

    // Employees a new AI lead can be assigned to (same rule as manual leads)
    const employees = await prisma.user.findMany({
      where: { companyId: req.user.companyId, role: "USER", status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return res.status(200).json({
      success: true,
      settings: serializeSettings(settings),
      companyName: company?.companyName || "",
      employees,
    });
  } catch (error) {
    console.error("Get AI settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch AI settings",
    });
  }
};

// ============================================
// PATCH /api/ai-settings
// ============================================
// Body (all optional): isEnabled, businessProfile, systemPrompt (extra
// instructions, may be empty), historyLimit, leadCaptureEnabled,
// leadAssigneeId (employee id or null), leadAutoAssign (true = share new
// leads between all active employees automatically)
// The AI provider, model and key are platform-wide (server .env) and
// cannot be changed from here.
const updateAiSettings = async (req, res) => {
  try {
    if (!isAdmin(req)) return forbidden(res, "update AI settings");

    const companyId = req.user.companyId;
    const body = req.body || {};

    const existing = await getOrCreateSettings(companyId);
    const data = {};

    // ---------- business profile ----------
    if (body.businessProfile !== undefined) {
      const { profile, error } = sanitizeProfile(body.businessProfile);

      if (error) return badRequest(res, error);

      data.businessProfile = profile;
    }

    // ---------- extra instructions (the old "system prompt") ----------
    if (body.systemPrompt !== undefined) {
      const prompt = String(body.systemPrompt).trim();

      if (prompt.length > MAX_PROMPT_LENGTH) {
        return badRequest(
          res,
          `Extra instructions must be ${MAX_PROMPT_LENGTH} characters or fewer`
        );
      }

      data.systemPrompt = prompt;
    }

    // ---------- history limit ----------
    if (body.historyLimit !== undefined) {
      const limit = Number(body.historyLimit);

      if (!Number.isFinite(limit) || limit < 1) {
        return badRequest(res, "History limit must be a number from 1 to 50");
      }

      data.historyLimit = Math.min(50, Math.floor(limit));
    }

    // ---------- master switch ----------
    if (body.isEnabled !== undefined) {
      if (typeof body.isEnabled !== "boolean") {
        return badRequest(res, "isEnabled must be true or false");
      }

      data.isEnabled = body.isEnabled;
    }

    // ---------- lead capture ----------
    if (body.leadCaptureEnabled !== undefined) {
      if (typeof body.leadCaptureEnabled !== "boolean") {
        return badRequest(res, "leadCaptureEnabled must be true or false");
      }

      data.leadCaptureEnabled = body.leadCaptureEnabled;
    }

    if (body.leadAssigneeId !== undefined) {
      const assigneeId = body.leadAssigneeId ? String(body.leadAssigneeId) : null;

      if (assigneeId) {
        const employee = await prisma.user.findFirst({
          where: { id: assigneeId, companyId, role: "USER", status: "ACTIVE" },
          select: { id: true },
        });

        if (!employee) {
          return badRequest(res, "Invalid employee selected for new leads");
        }
      }

      data.leadAssigneeId = assigneeId;
    }

    if (body.leadAutoAssign !== undefined) {
      if (typeof body.leadAutoAssign !== "boolean") {
        return badRequest(res, "leadAutoAssign must be true or false");
      }

      data.leadAutoAssign = body.leadAutoAssign;

      // Auto-assign and one fixed employee cannot be used together
      if (body.leadAutoAssign === true) {
        data.leadAssigneeId = null;
      }
    }

    // ---------- can it actually run? ----------
    const willBeEnabled = data.isEnabled ?? existing.isEnabled;

    if (data.isEnabled === true && willBeEnabled && !getPlatformAi().available) {
      return badRequest(
        res,
        "AI auto-reply is not available right now. Please contact support."
      );
    }

    // Turning it on again deserves a fresh start, so an old error
    // message doesn't linger on the page.
    if (data.isEnabled === true) {
      data.lastError = null;
      data.lastErrorAt = null;
    }

    const settings = await prisma.aiSettings.update({
      where: { id: existing.id },
      data,
    });

    return res.status(200).json({
      success: true,
      message: "AI settings updated successfully",
      settings: serializeSettings(settings),
    });
  } catch (error) {
    console.error("Update AI settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update AI settings",
    });
  }
};

// ============================================
// POST /api/ai-settings/test
// ============================================
// Sends ONE sample customer message to the AI and returns its reply.
// Nothing is sent on WhatsApp. Accepts an unsaved business profile
// and extra instructions.
const testAiSettings = async (req, res) => {
  try {
    if (!isAdmin(req)) return forbidden(res, "test AI settings");

    const companyId = req.user.companyId;

    if (isTestRateLimited(companyId)) {
      return res.status(429).json({
        success: false,
        message: "Too many tests. Please wait a minute and try again.",
      });
    }

    const body = req.body || {};

    if (typeof body.message === "string" && body.message.length > 500) {
      return badRequest(res, "Test message must be 500 characters or fewer");
    }

    let businessProfile;

    if (body.businessProfile !== undefined) {
      const { profile, error } = sanitizeProfile(body.businessProfile);

      if (error) return badRequest(res, error);

      businessProfile = profile;
    }

    const result = await testAutoReply(companyId, {
      businessProfile,
      systemPrompt:
        typeof body.systemPrompt === "string" ? body.systemPrompt : undefined,
      message: typeof body.message === "string" ? body.message : undefined,
    });

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }

    return res.status(200).json({
      success: true,
      reply: result.reply,
      handoff: Boolean(result.handoff),
      latencyMs: result.latencyMs,
    });
  } catch (error) {
    console.error("Test AI settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to test AI settings",
    });
  }
};

module.exports = {
  getAiSettings,
  updateAiSettings,
  testAiSettings,
};