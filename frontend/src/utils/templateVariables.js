// frontend/src/utils/templateVariables.js
//
// Helpers for filling template variables ({{1}}, {{2}}, {{3}}...) in campaigns.
//
// A variable setting looks like:
//   { source: "name" | "company" | "custom", value: "text for custom" }
// and the settings of a whole template are an object keyed by variable number:
//   { 1: { source: "name", value: "" }, 2: { source: "custom", value: "50% off" } }

// Distinct variable numbers in the template body, e.g. [1, 2, 3]
export const getVariableNumbers = (content) => {
  const numbers = [
    ...String(content || "").matchAll(/\{\{\s*(\d+)\s*\}\}/g),
  ].map((match) => Number(match[1]));

  return [...new Set(numbers)].sort((a, b) => a - b);
};

// Adds a default setting for every variable that has none yet.
// Defaults keep the OLD campaign behaviour:
//   {{1}} = customer name, {{2}} = campaign content, others = custom value.
export const mergeVariableConfigs = (numbers, previous = {}, legacyValue = "") => {
  const next = { ...previous };

  numbers.forEach((number) => {
    if (next[number]) return;

    if (number === 1) {
      next[number] = { source: "name", value: "" };
    } else if (number === 2) {
      next[number] = { source: "custom", value: legacyValue || "" };
    } else {
      next[number] = { source: "custom", value: "" };
    }
  });

  return next;
};

// Builds the settings from what the server saved on the campaign.
// Old campaigns (nothing saved) fall back to the old behaviour.
export const configsFromSaved = (saved, legacyValue = "") => {
  const configs = {};

  if (Array.isArray(saved) && saved.length > 0) {
    saved.forEach((item) => {
      configs[Number(item.index)] = {
        source: item.source || "custom",
        value: item.value || "",
      };
    });

    return configs;
  }

  configs[1] = { source: "name", value: "" };
  configs[2] = { source: "custom", value: legacyValue || "" };

  return configs;
};

// What is sent to the server: [{ index, source, value }]
export const configsToPayload = (numbers, configs) =>
  numbers.map((number) => ({
    index: number,
    source: configs[number]?.source || "custom",
    value: configs[number]?.value || "",
  }));

// True when a custom variable is still empty
export const hasMissingVariable = (numbers, configs) =>
  numbers.some((number) => {
    const config = configs[number];

    return !config || (config.source === "custom" && !config.value?.trim());
  });

// Template text with the settings filled in (for previews)
export const fillTemplatePreview = (
  content,
  configs,
  customerName = "[Customer Name]",
  companyName = "[Customer Company]"
) =>
  String(content || "").replace(/\{\{\s*(\d+)\s*\}\}/g, (full, number) => {
    const config = configs?.[Number(number)];

    if (!config) return full;

    if (config.source === "name") return customerName;
    if (config.source === "company") return companyName;

    return config.value?.trim() || full;
  });