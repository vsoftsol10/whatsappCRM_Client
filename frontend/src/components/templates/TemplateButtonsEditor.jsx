// frontend/src/components/templates/TemplateButtonsEditor.jsx   (NEW FILE)
//
// 1. default export  -> <TemplateButtonsEditor />  add / edit / remove buttons
// 2. TemplateButtonsPreview -> shows buttons the way WhatsApp displays them
// 3. validateTemplateButtons -> same rules as the backend, to warn early

import { Phone, ExternalLink, Reply, Copy, Plus, Trash2 } from "lucide-react";

const MAX_BUTTONS = 10;
const MAX_TEXT = 25;
const MAX_COPY_CODE = 15;

const LIMITS = { PHONE_NUMBER: 1, URL: 2, COPY_CODE: 1 };

const TYPE_INFO = {
  PHONE_NUMBER: { label: "Call us", icon: Phone },
  URL: { label: "Visit website", icon: ExternalLink },
  QUICK_REPLY: { label: "Quick reply", icon: Reply },
  COPY_CODE: { label: "Copy offer code", icon: Copy },
};

// call / website / copy code first, quick replies last (Meta needs them grouped)
const sortButtons = (buttons) => [
  ...buttons.filter((b) => b.type !== "QUICK_REPLY"),
  ...buttons.filter((b) => b.type === "QUICK_REPLY"),
];

// ------------------------------------------------------------
// Returns an error message, or "" when everything is fine.
// ------------------------------------------------------------
export const validateTemplateButtons = (buttons, category) => {
  if (!Array.isArray(buttons) || buttons.length === 0) return "";

  if (category === "AUTHENTICATION") {
    return "Authentication templates cannot have custom buttons.";
  }

  const usedTexts = new Set();

  for (let i = 0; i < buttons.length; i++) {
    const b = buttons[i];
    const label = `Button ${i + 1}`;

    if (b.type === "COPY_CODE") {
      if (category !== "MARKETING") {
        return "The copy code button can only be used in MARKETING templates.";
      }

      const code = (b.example || "").trim();

      if (!code) return `${label}: enter the offer code to copy.`;

      if (!/^[A-Za-z0-9]+$/.test(code) || code.length > MAX_COPY_CODE) {
        return `${label}: the offer code can have only letters and numbers (max ${MAX_COPY_CODE}).`;
      }

      continue;
    }

    const text = (b.text || "").trim();

    if (!text) return `${label}: button text is required.`;

    if (text.length > MAX_TEXT) {
      return `${label}: button text can be at most ${MAX_TEXT} characters.`;
    }

    if (usedTexts.has(text.toLowerCase())) {
      return `${label}: button text "${text}" is used twice.`;
    }

    usedTexts.add(text.toLowerCase());

    if (b.type === "PHONE_NUMBER") {
      const digits = (b.phoneNumber || "").replace(/[\s\-()]/g, "");

      if (!/^\+?\d{7,15}$/.test(digits)) {
        return `${label}: enter a valid phone number with country code, like +919876543210.`;
      }
    }

    if (b.type === "URL") {
      const url = (b.url || "").trim();

      if (!/^https?:\/\/\S+$/i.test(url)) {
        return `${label}: enter a full website link starting with https://`;
      }

      if (url.includes("{{")) {
        return `${label}: links with variables are not supported yet.`;
      }
    }
  }

  return "";
};

// ------------------------------------------------------------
// PREVIEW (WhatsApp style)
// ------------------------------------------------------------
export function TemplateButtonsPreview({ buttons, compact = false }) {
  if (!Array.isArray(buttons) || buttons.length === 0) return null;

  return (
    <div className={compact ? "mt-3 space-y-1" : "mt-3 space-y-1"}>
      {buttons.map((button, index) => {
        const info = TYPE_INFO[button.type] || TYPE_INFO.QUICK_REPLY;
        const Icon = info.icon;

        const text =
          button.type === "COPY_CODE"
            ? "Copy offer code"
            : button.text || info.label;

        return (
          <div
            key={`${button.type}-${index}`}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-[#027EB5] shadow-sm"
          >
            <Icon size={15} />
            <span className="truncate">{text}</span>
          </div>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------
// EDITOR
// ------------------------------------------------------------
export default function TemplateButtonsEditor({
  value,
  onChange,
  category,
  disabled = false,
}) {
  const buttons = Array.isArray(value) ? value : [];

  const countOf = (type) => buttons.filter((b) => b.type === type).length;

  const canAdd = (type) => {
    if (disabled) return false;
    if (buttons.length >= MAX_BUTTONS) return false;
    if (LIMITS[type] && countOf(type) >= LIMITS[type]) return false;
    if (type === "COPY_CODE" && category !== "MARKETING") return false;
    return true;
  };

  const addButton = (type) => {
    if (!canAdd(type)) return;

    const blank =
      type === "PHONE_NUMBER"
        ? { type, text: "Call us", phoneNumber: "" }
        : type === "URL"
        ? { type, text: "Visit website", url: "" }
        : type === "COPY_CODE"
        ? { type, example: "" }
        : { type, text: "" };

    onChange(sortButtons([...buttons, blank]));
  };

  const updateButton = (index, changes) => {
    onChange(
      buttons.map((button, i) =>
        i === index ? { ...button, ...changes } : button
      )
    );
  };

  const removeButton = (index) => {
    onChange(buttons.filter((_, i) => i !== index));
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#25D366] disabled:cursor-not-allowed disabled:bg-gray-100";

  return (
    <div>
      <h3 className="mb-2 text-lg font-semibold text-gray-800">
        Buttons <span className="text-sm font-normal text-gray-500">(optional)</span>
      </h3>

      <p className="mb-3 text-sm text-gray-500">
        Add buttons under the message: call, open a website or payment link,
        quick replies, or copy an offer code.
      </p>

      {/* ADD BUTTONS */}
      <div className="mb-4 flex flex-wrap gap-2">
        {Object.entries(TYPE_INFO).map(([type, info]) => {
          const Icon = info.icon;
          const allowed = canAdd(type);

          return (
            <button
              key={type}
              type="button"
              onClick={() => addButton(type)}
              disabled={!allowed}
              title={
                type === "COPY_CODE" && category !== "MARKETING"
                  ? "Copy code works only in MARKETING templates"
                  : undefined
              }
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                allowed
                  ? "border-gray-300 bg-white hover:bg-green-50"
                  : "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
              }`}
            >
              <Plus size={14} />
              <Icon size={15} />
              {info.label}
            </button>
          );
        })}
      </div>

      {/* BUTTON ROWS */}
      {buttons.length > 0 && (
        <div className="space-y-3">
          {buttons.map((button, index) => {
            const info = TYPE_INFO[button.type] || TYPE_INFO.QUICK_REPLY;
            const Icon = info.icon;

            return (
              <div
                key={index}
                className="rounded-xl border border-gray-200 bg-gray-50 p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Icon size={16} className="text-[#128C7E]" />
                    {info.label}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeButton(index)}
                    disabled={disabled}
                    className="rounded-md p-1 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Remove button"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {button.type !== "COPY_CODE" && (
                    <div>
                      <input
                        type="text"
                        value={button.text || ""}
                        maxLength={MAX_TEXT}
                        disabled={disabled}
                        onChange={(e) =>
                          updateButton(index, { text: e.target.value })
                        }
                        placeholder="Button text"
                        className={inputClass}
                      />
                      <p className="mt-1 text-right text-xs text-gray-400">
                        {(button.text || "").length}/{MAX_TEXT}
                      </p>
                    </div>
                  )}

                  {button.type === "PHONE_NUMBER" && (
                    <input
                      type="text"
                      value={button.phoneNumber || ""}
                      disabled={disabled}
                      onChange={(e) =>
                        updateButton(index, { phoneNumber: e.target.value })
                      }
                      placeholder="+919876543210"
                      className={inputClass}
                    />
                  )}

                  {button.type === "URL" && (
                    <input
                      type="text"
                      value={button.url || ""}
                      disabled={disabled}
                      onChange={(e) =>
                        updateButton(index, { url: e.target.value })
                      }
                      placeholder="https://yourshop.com/pay"
                      className={inputClass}
                    />
                  )}

                  {button.type === "COPY_CODE" && (
                    <input
                      type="text"
                      value={button.example || ""}
                      maxLength={MAX_COPY_CODE}
                      disabled={disabled}
                      onChange={(e) =>
                        updateButton(index, { example: e.target.value })
                      }
                      placeholder="Offer code, example: SAVE20"
                      className={inputClass}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-3 text-xs text-gray-500">
        Tip: for a <b>Pay Now</b> button, choose “Visit website”, name it
        “Pay Now” and paste your payment link (Razorpay, PayU, UPI page...).
        Up to 1 call button, 2 website buttons and 1 copy code button; quick
        replies fill the rest (max {MAX_BUTTONS} in total).
      </p>

      {buttons.length > 0 && (
        <div className="mt-4 max-w-sm rounded-xl bg-[#efeae2] p-3">
          <p className="mb-1 text-xs font-medium text-gray-500">
            How the buttons will look
          </p>

          <TemplateButtonsPreview buttons={buttons} />
        </div>
      )}
    </div>
  );
}
