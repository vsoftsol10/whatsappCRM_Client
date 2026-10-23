// backend/src/utils/templateButtons.js   (NEW FILE)
//
// Everything about WhatsApp TEMPLATE BUTTONS in one place:
//   1. validateTemplateButtons()  - checks Meta's rules, returns clean buttons
//   2. toMetaButtonsComponent()   - the BUTTONS block sent to Meta for approval
//   3. buildButtonSendComponents()- the extra parameters needed when SENDING
//
// A button is stored on the Template (Template.buttons, JSON) like this:
//   { type: "PHONE_NUMBER", text: "Call us",     phoneNumber: "+919876543210" }
//   { type: "URL",          text: "Pay Now",     url: "https://pay.example.com/abc" }
//   { type: "QUICK_REPLY",  text: "Interested" }
//   { type: "COPY_CODE",    example: "SAVE20" }

const MAX_BUTTONS = 10;
const MAX_TEXT_LENGTH = 25;
const MAX_URL_LENGTH = 2000;
const MAX_COPY_CODE_LENGTH = 15;

const LIMITS = {
  PHONE_NUMBER: 1,
  URL: 2,
  COPY_CODE: 1,
};

const VALID_TYPES = ["PHONE_NUMBER", "URL", "QUICK_REPLY", "COPY_CODE"];

// Meta wants quick replies grouped together, so call-to-action buttons
// (call / website / copy code) go first, quick replies last.
const sortButtons = (buttons) => [
  ...buttons.filter((b) => b.type !== "QUICK_REPLY"),
  ...buttons.filter((b) => b.type === "QUICK_REPLY"),
];

// ------------------------------------------------------------
// Validate + clean. Returns { buttons } or { error }.
// Empty / missing input is fine (a template without buttons).
// ------------------------------------------------------------
const validateTemplateButtons = (input, category) => {
  if (input === undefined || input === null || input === "") {
    return { buttons: [] };
  }

  if (!Array.isArray(input)) {
    return { error: "Buttons must be a list." };
  }

  if (input.length === 0) {
    return { buttons: [] };
  }

  if (category === "AUTHENTICATION") {
    return {
      error: "Authentication templates cannot have custom buttons.",
    };
  }

  if (input.length > MAX_BUTTONS) {
    return { error: `You can add at most ${MAX_BUTTONS} buttons.` };
  }

  const cleaned = [];
  const counts = {};
  const usedTexts = new Set();

  for (let i = 0; i < input.length; i++) {
    const raw = input[i] || {};
    const type = String(raw.type || "").toUpperCase();
    const label = `Button ${i + 1}`;

    if (!VALID_TYPES.includes(type)) {
      return { error: `${label}: please choose a button type.` };
    }

    counts[type] = (counts[type] || 0) + 1;

    if (LIMITS[type] && counts[type] > LIMITS[type]) {
      const names = {
        PHONE_NUMBER: "call button",
        URL: "website buttons",
        COPY_CODE: "copy code button",
      };

      return {
        error: `You can add only ${LIMITS[type]} ${names[type]}.`,
      };
    }

    // ---------------- COPY CODE (no text, only the code) ----------------
    if (type === "COPY_CODE") {
      if (category !== "MARKETING") {
        return {
          error: "The copy code button can only be used in MARKETING templates.",
        };
      }

      const example = String(raw.example || "").trim();

      if (!example) {
        return { error: `${label}: enter the offer code to copy.` };
      }

      if (example.length > MAX_COPY_CODE_LENGTH) {
        return {
          error: `${label}: the offer code can be at most ${MAX_COPY_CODE_LENGTH} characters.`,
        };
      }

      if (!/^[A-Za-z0-9]+$/.test(example)) {
        return {
          error: `${label}: the offer code can only have letters and numbers.`,
        };
      }

      cleaned.push({ type, example });
      continue;
    }

    // ---------------- buttons with a visible text ----------------
    const text = String(raw.text || "").trim();

    if (!text) {
      return { error: `${label}: button text is required.` };
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return {
        error: `${label}: button text can be at most ${MAX_TEXT_LENGTH} characters.`,
      };
    }

    const textKey = text.toLowerCase();

    if (usedTexts.has(textKey)) {
      return { error: `${label}: button text "${text}" is used twice.` };
    }

    usedTexts.add(textKey);

    if (type === "PHONE_NUMBER") {
      const digits = String(raw.phoneNumber || "").replace(/[\s\-()]/g, "");

      if (!/^\+?\d{7,15}$/.test(digits)) {
        return {
          error: `${label}: enter a valid phone number with country code, like +919876543210.`,
        };
      }

      cleaned.push({
        type,
        text,
        phoneNumber: digits.startsWith("+") ? digits : `+${digits}`,
      });
      continue;
    }

    if (type === "URL") {
      const url = String(raw.url || "").trim();

      if (!/^https?:\/\/\S+$/i.test(url)) {
        return {
          error: `${label}: enter a full website link starting with https://`,
        };
      }

      if (url.length > MAX_URL_LENGTH) {
        return { error: `${label}: the link is too long.` };
      }

      if (url.includes("{{")) {
        return {
          error: `${label}: links with variables are not supported yet. Use a fixed link.`,
        };
      }

      cleaned.push({ type, text, url });
      continue;
    }

    // QUICK_REPLY
    cleaned.push({ type, text });
  }

  return { buttons: sortButtons(cleaned) };
};

// ------------------------------------------------------------
// The BUTTONS component sent to Meta when submitting the template.
// Returns null when there are no buttons.
// ------------------------------------------------------------
const toMetaButtonsComponent = (buttons) => {
  if (!Array.isArray(buttons) || buttons.length === 0) return null;

  const metaButtons = buttons.map((button) => {
    switch (button.type) {
      case "PHONE_NUMBER":
        return {
          type: "PHONE_NUMBER",
          text: button.text,
          phone_number: button.phoneNumber,
        };

      case "URL":
        return { type: "URL", text: button.text, url: button.url };

      case "COPY_CODE":
        return { type: "COPY_CODE", example: button.example };

      default:
        return { type: "QUICK_REPLY", text: button.text };
    }
  });

  return { type: "BUTTONS", buttons: metaButtons };
};

// ------------------------------------------------------------
// Extra components needed when SENDING an approved template.
// Call / website / quick-reply buttons need nothing (Meta already has
// them). Only the copy-code button needs its code at send time.
// "index" is the button's position in the template, so the order must
// be the stored order (which is the order sent to Meta).
// ------------------------------------------------------------
const buildButtonSendComponents = (buttons) => {
  if (!Array.isArray(buttons)) return [];

  const components = [];

  buttons.forEach((button, index) => {
    if (button?.type === "COPY_CODE" && button.example) {
      components.push({
        type: "button",
        sub_type: "copy_code",
        index: String(index),
        parameters: [{ type: "coupon_code", coupon_code: button.example }],
      });
    }
  });

  return components;
};

module.exports = {
  validateTemplateButtons,
  toMetaButtonsComponent,
  buildButtonSendComponents,
};