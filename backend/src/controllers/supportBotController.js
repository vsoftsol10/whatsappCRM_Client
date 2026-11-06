const {
  SupportBotError,
  getPublicStatus,
  ask,
  getLatestConversation,
  saveFeedback,
} = require("../services/supportBotService");

const handleError = (res, error, label) => {
  if (error instanceof SupportBotError) {
    return res.status(error.status).json({
      success: false,
      code: error.code,
      message: error.message,
    });
  }

  console.error(`${label}:`, error);

  return res.status(500).json({
    success: false,
    message: "Something went wrong. Please try again.",
  });
};

const getStatus = async (req, res) => {
  try {
    const status = await getPublicStatus(Number(req.user.companyId));
    return res.json({ success: true, ...status });
  } catch (error) {
    return handleError(res, error, "supportBot status");
  }
};

const chat = async (req, res) => {
  try {
    const { message, conversationId, page } = req.body || {};

    const result = await ask({
      user: req.user,
      message,
      conversationId,
      page,
    });

    return res.json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error, "supportBot chat");
  }
};

const latestConversation = async (req, res) => {
  try {
    const data = await getLatestConversation(req.user);

    return res.json({
      success: true,
      conversationId: data?.conversationId || null,
      messages: data?.messages || [],
    });
  } catch (error) {
    return handleError(res, error, "supportBot latest");
  }
};

const feedback = async (req, res) => {
  try {
    const { messageId, value } = req.body || {};

    if (![1, -1].includes(Number(value))) {
      return res.status(400).json({
        success: false,
        message: "Feedback must be 1 (helpful) or -1 (not helpful).",
      });
    }

    await saveFeedback({ user: req.user, messageId, value: Number(value) });

    return res.json({ success: true });
  } catch (error) {
    return handleError(res, error, "supportBot feedback");
  }
};

module.exports = { getStatus, chat, latestConversation, feedback };