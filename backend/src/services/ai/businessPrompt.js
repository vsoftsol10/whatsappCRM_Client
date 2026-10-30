// // ============================================
// // BUSINESS PROFILE -> SYSTEM PROMPT
// // ============================================
// // Customers fill in a short form about their business. This file turns
// // that form into the system prompt, so the AI knows who it is speaking
// // for. The old free-text prompt is kept as "extra instructions".

// const TONES = {
//   FRIENDLY: "friendly and warm",
//   PROFESSIONAL: "professional and polite",
//   CASUAL: "casual and relaxed",
//   FORMAL: "formal and respectful",
// };

// // field -> { label, max length }
// const PROFILE_FIELDS = {
//   businessName: { label: "Business name", max: 100 },
//   description: { label: "What your business does", max: 1000 },
//   workingHours: { label: "Working hours", max: 200 },
//   location: { label: "Location", max: 300 },
//   contact: { label: "Contact details", max: 300 },
//   languages: { label: "Languages", max: 200 },
//   policies: { label: "Policies and key information", max: 1500 },
// };

// const GENERIC_PROMPT =
//   "You are a helpful, friendly customer support assistant for this business. Keep replies short, clear, and polite. If you don't know the answer or the customer wants a human, say you'll connect them to the team.";

// // Lenient reader for data already stored in the database. Never throws.
// const readProfile = (input) => {
//   const src = input && typeof input === "object" && !Array.isArray(input) ? input : {};
//   const profile = {};

//   for (const [key, { max }] of Object.entries(PROFILE_FIELDS)) {
//     profile[key] = typeof src[key] === "string" ? src[key].trim().slice(0, max) : "";
//   }

//   const tone = String(src.tone || "").toUpperCase();
//   profile.tone = TONES[tone] ? tone : "FRIENDLY";

//   return profile;
// };

// // Strict validator for data typed by a customer.
// // Returns { profile } or { error }.
// const sanitizeProfile = (input) => {
//   if (!input || typeof input !== "object" || Array.isArray(input)) {
//     return { error: "Business profile is not valid" };
//   }

//   const profile = {};

//   for (const [key, { label, max }] of Object.entries(PROFILE_FIELDS)) {
//     const value = input[key];

//     if (value === undefined || value === null) {
//       profile[key] = "";
//       continue;
//     }

//     if (typeof value !== "string") return { error: `${label} must be text` };

//     const trimmed = value.trim();

//     if (trimmed.length > max) {
//       return { error: `${label} must be ${max} characters or fewer` };
//     }

//     profile[key] = trimmed;
//   }

//   const tone = String(input.tone || "FRIENDLY").toUpperCase();
//   if (!TONES[tone]) return { error: "Unknown tone" };

//   profile.tone = tone;

//   return { profile };
// };

// const hasProfileDetails = (profile) =>
//   Object.keys(PROFILE_FIELDS).some(
//     (key) => key !== "businessName" && Boolean(profile[key])
//   );

// // companyName       -> used when the customer left "Business name" empty
// // profile           -> stored business profile (JSON or null)
// // extraInstructions -> the customer's own free-text prompt (may be empty)
// const buildSystemPrompt = ({ companyName, profile, extraInstructions }) => {
//   const details = readProfile(profile);
//   const extra = String(extraInstructions || "").trim();
//   const name = details.businessName || String(companyName || "").trim();

//   // Nothing filled in yet: behave exactly like before this feature.
//   if (!hasProfileDetails(details)) {
//     return extra || GENERIC_PROMPT;
//   }

//   const lines = [
//     `You are the WhatsApp customer support assistant for ${name || "this business"}.`,
//   ];

//   if (details.description) {
//     lines.push("", "About the business:", details.description);
//   }

//   const facts = [
//     ["Working hours", details.workingHours],
//     ["Location", details.location],
//     ["Contact", details.contact],
//     ["Languages we support", details.languages],
//   ].filter(([, value]) => value);

//   if (facts.length) {
//     lines.push("", "Business details:");
//     for (const [label, value] of facts) lines.push(`- ${label}: ${value}`);
//   }

//   if (details.policies) {
//     lines.push("", "Policies and key information:", details.policies);
//   }

//   lines.push(
//     "",
//     `Tone: ${TONES[details.tone]}.`,
//     "",
//     "Rules:",
//     "- Answer only from the business information above and the conversation. If something is not covered there, do not guess.",
//     "- Never invent prices, offers, discounts, availability, delivery times, policies or contact details.",
//     "- If you do not know the answer, or the customer asks for a human, or wants to complain, negotiate, pay or get a refund, tell them our team will contact them shortly.",
//     "- Stay on topics related to this business and politely steer back if the customer goes off topic."
//   );

//   if (extra) {
//     lines.push("", "Additional instructions from the business owner:", extra);
//   }

//   return lines.join("\n");
// };

// module.exports = {
//   TONES,
//   PROFILE_FIELDS,
//   readProfile,
//   sanitizeProfile,
//   buildSystemPrompt,
// };



// ============================================
// BUSINESS PROFILE -> SYSTEM PROMPT
// ============================================
// Customers fill in a short form about their business. This file turns
// that form into the system prompt, so the AI knows who it is speaking
// for. The old free-text prompt is kept as "extra instructions".

const TONES = {
  FRIENDLY: "friendly and warm",
  PROFESSIONAL: "professional and polite",
  CASUAL: "casual and relaxed",
  FORMAL: "formal and respectful",
};

// field -> { label, max length }
const PROFILE_FIELDS = {
  businessName: { label: "Business name", max: 100 },
  description: { label: "What your business does", max: 1000 },
  workingHours: { label: "Working hours", max: 200 },
  location: { label: "Location", max: 300 },
  contact: { label: "Contact details", max: 300 },
  languages: { label: "Languages", max: 200 },
  policies: { label: "Policies and key information", max: 1500 },
};

const GENERIC_PROMPT =
  "You are a helpful, friendly customer support assistant for this business. Keep replies short, clear, and polite. If you don't know the answer or the customer wants a human, say you'll connect them to the team.";

// Lenient reader for data already stored in the database. Never throws.
const readProfile = (input) => {
  const src = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const profile = {};

  for (const [key, { max }] of Object.entries(PROFILE_FIELDS)) {
    profile[key] = typeof src[key] === "string" ? src[key].trim().slice(0, max) : "";
  }

  const tone = String(src.tone || "").toUpperCase();
  profile.tone = TONES[tone] ? tone : "FRIENDLY";

  return profile;
};

// Strict validator for data typed by a customer.
// Returns { profile } or { error }.
const sanitizeProfile = (input) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { error: "Business profile is not valid" };
  }

  const profile = {};

  for (const [key, { label, max }] of Object.entries(PROFILE_FIELDS)) {
    const value = input[key];

    if (value === undefined || value === null) {
      profile[key] = "";
      continue;
    }

    if (typeof value !== "string") return { error: `${label} must be text` };

    const trimmed = value.trim();

    if (trimmed.length > max) {
      return { error: `${label} must be ${max} characters or fewer` };
    }

    profile[key] = trimmed;
  }

  const tone = String(input.tone || "FRIENDLY").toUpperCase();
  if (!TONES[tone]) return { error: "Unknown tone" };

  profile.tone = tone;

  return { profile };
};

// ============================================
// ASK FOR CONTACT DETAILS (optional, off by default)
// ============================================
// The owner switches this on and picks what the AI should collect from a
// customer who shows interest. Nothing is added to the prompt while it is off.
const CONTACT_LIMITS = { other: 200, wording: 300 };

const cleanLine = (value, max) =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";

// Lenient reader for data already stored in the database. Never throws.
const readContactRequest = (input) => {
  const src = input && typeof input === "object" && !Array.isArray(input) ? input : {};

  return {
    enabled: src.enabled === true,
    name: src.name === true,
    phone: src.phone === true,
    email: src.email === true,
    other: cleanLine(src.other, CONTACT_LIMITS.other),
    wording: cleanLine(src.wording, CONTACT_LIMITS.wording),
  };
};

// Strict validator for data typed by a customer.
// Returns { contactRequest } or { error }.
const sanitizeContactRequest = (input) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { error: "Contact details setting is not valid" };
  }

  for (const key of ["enabled", "name", "phone", "email"]) {
    if (input[key] !== undefined && typeof input[key] !== "boolean") {
      return { error: `Contact details: ${key} must be true or false` };
    }
  }

  for (const key of ["other", "wording"]) {
    const value = input[key];

    if (value === undefined || value === null) continue;

    if (typeof value !== "string") {
      return { error: `Contact details: ${key} must be text` };
    }

    if (value.trim().length > CONTACT_LIMITS[key]) {
      return {
        error: `Contact details: ${key === "other" ? "extra details" : "wording"} must be ${CONTACT_LIMITS[key]} characters or fewer`,
      };
    }
  }

  const contactRequest = readContactRequest(input);

  if (
    contactRequest.enabled &&
    !contactRequest.name &&
    !contactRequest.phone &&
    !contactRequest.email &&
    !contactRequest.other
  ) {
    return { error: "Pick at least one detail for the AI to ask for" };
  }

  return { contactRequest };
};

// channel: undefined / "WhatsApp" -> WhatsApp, "Instagram", "Messenger".
// On WhatsApp the customer's number is already known, so it is never asked.
// Returns "" when the setting is off (prompt stays exactly as before).
const buildContactRule = (contactRequest, channel) => {
  const settings = readContactRequest(contactRequest);

  if (!settings.enabled) return "";

  const isWhatsApp = !channel || channel === "WhatsApp";
  const skipPhone = settings.phone && isWhatsApp;

  const items = [];
  if (settings.name) items.push("name");
  if (settings.phone && !isWhatsApp) items.push("mobile number");
  if (settings.email) items.push("email address");
  if (settings.other) items.push(settings.other);

  if (items.length === 0) return "";

  const list =
    items.length === 1
      ? items[0]
      : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

  const lines = [
    "Collecting contact details:",
    `- When the customer shows real interest in what this business offers, first answer their question. Then politely ask once for their ${list} so our team can contact them.`,
    "- Ask only once. Do not ask again if they have already given it, and do not pressure them if they decline or ignore the question.",
    "- Do not ask during a simple greeting or a general question with no interest, and do not ask for anything that is not listed here.",
  ];

  if (skipPhone) {
    lines.push(
      "- We already have the customer's phone number from this chat, so never ask for it, even if the preferred wording below mentions it."
    );
  }

  if (settings.wording) {
    lines.push(
      `- Preferred wording (adapt it naturally to the conversation and the customer's language, keep the meaning): "${settings.wording}"`
    );
  }

  return lines.join("\n");
};

const hasProfileDetails = (profile) =>
  Object.keys(PROFILE_FIELDS).some(
    (key) => key !== "businessName" && Boolean(profile[key])
  );

// companyName       -> used when the customer left "Business name" empty
// profile           -> stored business profile (JSON or null)
// extraInstructions -> the customer's own free-text prompt (may be empty)
// contactRequest    -> "ask for contact details" setting (JSON or null)
// channel           -> undefined/"WhatsApp", "Instagram" or "Messenger"
const buildSystemPrompt = ({
  companyName,
  profile,
  extraInstructions,
  contactRequest,
  channel,
}) => {
  const details = readProfile(profile);
  const extra = String(extraInstructions || "").trim();
  const name = details.businessName || String(companyName || "").trim();
  const contactRule = buildContactRule(contactRequest, channel);

  // Nothing filled in yet: behave exactly like before this feature.
  if (!hasProfileDetails(details)) {
    const base = extra || GENERIC_PROMPT;
    return contactRule ? `${base}\n\n${contactRule}` : base;
  }

  const lines = [
    `You are the WhatsApp customer support assistant for ${name || "this business"}.`,
  ];

  if (details.description) {
    lines.push("", "About the business:", details.description);
  }

  const facts = [
    ["Working hours", details.workingHours],
    ["Location", details.location],
    ["Contact", details.contact],
    ["Languages we support", details.languages],
  ].filter(([, value]) => value);

  if (facts.length) {
    lines.push("", "Business details:");
    for (const [label, value] of facts) lines.push(`- ${label}: ${value}`);
  }

  if (details.policies) {
    lines.push("", "Policies and key information:", details.policies);
  }

  lines.push(
    "",
    `Tone: ${TONES[details.tone]}.`,
    "",
    "Rules:",
    "- Answer only from the business information above and the conversation. If something is not covered there, do not guess.",
    "- Never invent prices, offers, discounts, availability, delivery times, policies or contact details.",
    "- If you do not know the answer, or the customer asks for a human, or wants to complain, negotiate, pay or get a refund, tell them our team will contact them shortly.",
    "- Stay on topics related to this business and politely steer back if the customer goes off topic."
  );

  if (contactRule) {
    lines.push("", contactRule);
  }

  if (extra) {
    lines.push("", "Additional instructions from the business owner:", extra);
  }

  return lines.join("\n");
};

module.exports = {
  TONES,
  PROFILE_FIELDS,
  readProfile,
  sanitizeProfile,
  readContactRequest,
  sanitizeContactRequest,
  buildSystemPrompt,
};