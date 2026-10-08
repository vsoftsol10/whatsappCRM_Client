// ======================================================
// INTEGRATION AUTOMATION SETTINGS
// ======================================================
//
// Single source of truth for what an Integration's
// `settings` JSON column looks like, and what happens
// when a field is missing (older integrations created
// before this feature existed will have settings = null).
//
// Shape:
// {
//   autoCreateCustomer: boolean, // create a NEW customer when phone not found
//   autoCreatePurchase: boolean, // record a Purchase row for the event
//   allowedEventTypes: string[]  // [] / missing = allow every event type
// }
// ======================================================

const DEFAULT_SETTINGS = {
  autoCreateCustomer: true,
  autoCreatePurchase: true,
  allowedEventTypes: [],
  // WEBSITE integrations: websites allowed to send leads ([] = any website)
  allowedOrigins: [],
};

// ------------------------------------------------------
// Merge whatever is stored (possibly null / partial /
// from an older integration) with safe defaults.
// ------------------------------------------------------

const getIntegrationSettings = (integration) => {
  const stored =
    integration && typeof integration.settings === "object" && integration.settings
      ? integration.settings
      : {};

  return {
    autoCreateCustomer:
      typeof stored.autoCreateCustomer === "boolean"
        ? stored.autoCreateCustomer
        : DEFAULT_SETTINGS.autoCreateCustomer,

    autoCreatePurchase:
      typeof stored.autoCreatePurchase === "boolean"
        ? stored.autoCreatePurchase
        : DEFAULT_SETTINGS.autoCreatePurchase,

    allowedEventTypes: Array.isArray(stored.allowedEventTypes)
      ? stored.allowedEventTypes.filter((v) => typeof v === "string" && v.trim())
      : DEFAULT_SETTINGS.allowedEventTypes,

    allowedOrigins: Array.isArray(stored.allowedOrigins)
      ? stored.allowedOrigins.filter((v) => typeof v === "string" && v.trim())
      : DEFAULT_SETTINGS.allowedOrigins,
  };
};

// ------------------------------------------------------
// Validate + sanitize settings coming from the API
// (create integration / update settings endpoints).
// Throws a string error message on invalid input so
// controllers can turn it into a 400 response.
// ------------------------------------------------------

const sanitizeIncomingSettings = (input) => {
  if (input === undefined || input === null) {
    return { ...DEFAULT_SETTINGS };
  }

  if (typeof input !== "object" || Array.isArray(input)) {
    throw new Error("settings must be an object");
  }

  const result = { ...DEFAULT_SETTINGS };

  if (input.autoCreateCustomer !== undefined) {
    if (typeof input.autoCreateCustomer !== "boolean") {
      throw new Error("settings.autoCreateCustomer must be a boolean");
    }
    result.autoCreateCustomer = input.autoCreateCustomer;
  }

  if (input.autoCreatePurchase !== undefined) {
    if (typeof input.autoCreatePurchase !== "boolean") {
      throw new Error("settings.autoCreatePurchase must be a boolean");
    }
    result.autoCreatePurchase = input.autoCreatePurchase;
  }

  if (input.allowedEventTypes !== undefined) {
    if (
      !Array.isArray(input.allowedEventTypes) ||
      !input.allowedEventTypes.every((v) => typeof v === "string")
    ) {
      throw new Error("settings.allowedEventTypes must be an array of strings");
    }
    result.allowedEventTypes = input.allowedEventTypes
      .map((v) => v.trim())
      .filter(Boolean);
  }

  if (input.allowedOrigins !== undefined) {
    if (
      !Array.isArray(input.allowedOrigins) ||
      !input.allowedOrigins.every((v) => typeof v === "string")
    ) {
      throw new Error("settings.allowedOrigins must be an array of strings");
    }

    // Keep only the domain: "https://www.Shop.com/page" -> "shop.com"
    const hosts = input.allowedOrigins
      .map((v) => {
        try {
          const t = v.trim();
          if (!t) return "";
          return new URL(t.includes("://") ? t : `https://${t}`).hostname
            .toLowerCase()
            .replace(/^www\./, "");
        } catch (e) {
          return "";
        }
      })
      .filter(Boolean);

    result.allowedOrigins = [...new Set(hosts)].slice(0, 20);
  }

  return result;
};

module.exports = {
  DEFAULT_SETTINGS,
  getIntegrationSettings,
  sanitizeIncomingSettings,
};