// backend/src/utils/templateVariables.js
//
// Helpers for filling {{1}}, {{2}}, ... when a template is sent
// DIRECTLY to customers (Templates page -> Send Template).
//
// Campaigns keep using their own logic in campaignController.js.

// Same cleaning campaigns already apply: Meta rejects body parameters
// that contain newlines/tabs or 4+ consecutive spaces (error 132018).
const sanitizeTemplateParam = (text) =>
  String(text ?? "")
    .replace(/[\n\r\t]+/g, " ")
    .replace(/ {2,}/g, " ")
    .trim();

// Returns the distinct variable numbers used in the template body,
// sorted, e.g. "Hi {{1}} ... {{3}} ... {{1}}" -> [1, 3]
const getVariableNumbers = (content) => {
  const numbers = [
    ...String(content || "").matchAll(/\{\{\s*(\d+)\s*\}\}/g),
  ].map((match) => Number(match[1]));

  return [...new Set(numbers)].sort((a, b) => a - b);
};

// Replaces {{n}} in the template body with the given values.
// `valuesByNumber` is an object like { 1: "Malar", 2: "Acme" }.
// Used to show the CRM chat exactly what the customer received.
const fillTemplateContent = (content, valuesByNumber = {}) =>
  String(content || "").replace(/\{\{\s*(\d+)\s*\}\}/g, (full, number) => {
    const value = valuesByNumber[Number(number)];
    return value === undefined || value === null ? full : String(value);
  });

// Validates the `variableValues` sent by the frontend.
// Expected shape: [{ index: 1, source: "name" | "company" | "custom", value?: "text" }]
// Returns { ok: true } or { ok: false, message }.
const validateVariableValues = (content, variableValues) => {
  const numbers = getVariableNumbers(content);

  if (numbers.length === 0) return { ok: true };

  if (!Array.isArray(variableValues)) {
    return {
      ok: false,
      message: "Please provide values for the template variables.",
    };
  }

  for (const number of numbers) {
    const item = variableValues.find((v) => Number(v?.index) === number);

    if (!item) {
      return { ok: false, message: `Value for {{${number}}} is required.` };
    }

    if (!["name", "company", "custom"].includes(item.source)) {
      return {
        ok: false,
        message: `Invalid value type for {{${number}}}.`,
      };
    }

    if (item.source === "custom" && !sanitizeTemplateParam(item.value)) {
      return { ok: false, message: `Value for {{${number}}} is required.` };
    }
  }

  return { ok: true };
};

// Builds the final values for ONE customer.
// Returns { numbers: [1,2,...], byNumber: { 1: "...", 2: "..." }, list: ["...", "..."] }
// `list` is ordered by variable number, ready for the Meta send call.
const resolveVariablesForCustomer = (content, variableValues, customer) => {
  const numbers = getVariableNumbers(content);
  const byNumber = {};

  for (const number of numbers) {
    const item =
      variableValues.find((v) => Number(v?.index) === number) || {
        source: "custom",
        value: "",
      };

    let raw;
    if (item.source === "name") {
      raw = customer.name;
    } else if (item.source === "company") {
      raw = customer.companyName;
    } else {
      raw = item.value;
    }

    // Meta rejects empty values, so fall back to "-"
    byNumber[number] = sanitizeTemplateParam(raw) || "-";
  }

  return {
    numbers,
    byNumber,
    list: numbers.map((number) => byNumber[number]),
  };
};

module.exports = {
  sanitizeTemplateParam,
  getVariableNumbers,
  fillTemplateContent,
  validateVariableValues,
  resolveVariablesForCustomer,
};