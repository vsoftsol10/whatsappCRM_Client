// ======================================================
// frontend/src/components/integrations/WebsiteSnippetCard.jsx
//
// Shown inside IntegrationDetailsModal for provider "WEBSITE".
// Gives the customer ONE line of code to paste on their website,
// plus the "allowed websites" setting and a live status line.
// ======================================================
import React, { useEffect, useState } from "react";
import { Check, Copy, Globe, Loader2, Save } from "lucide-react";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

const timeAgo = (value) => {
  if (!value) return null;
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  if (Number.isNaN(seconds)) return null;
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
};

const WebsiteSnippetCard = ({
  integration,
  onSaveSettings,
  savingSettings,
  onCopy,
  copiedField,
}) => {
  const [showButton, setShowButton] = useState(false);
  const [formSelector, setFormSelector] = useState("");
  const [originsInput, setOriginsInput] = useState("");

  useEffect(() => {
    setOriginsInput((integration?.settings?.allowedOrigins || []).join(", "));
  }, [integration]);

  if (!integration) return null;

  // ---- build the one-line snippet ----
  const attrs = [
    `src="${API_URL}/api/public/widget.js?key=${integration.webhookKey}"`,
    showButton ? 'data-widget="true"' : "",
    formSelector.trim()
      ? `data-form="${formSelector.trim().replace(/"/g, "'")}"`
      : "",
    "async",
  ]
    .filter(Boolean)
    .join(" ");
  const snippet = `<script ${attrs}></script>`;

  // ---- allowed websites ----
  const parsedOrigins = originsInput
    .split(/[,\n]/)
    .map((v) => v.trim())
    .filter(Boolean);
  const savedOrigins = integration.settings?.allowedOrigins || [];
  const originsChanged =
    JSON.stringify(parsedOrigins) !== JSON.stringify(savedOrigins);

  const handleSaveOrigins = () => {
    if (!onSaveSettings) return;
    // send ALL settings, because saving replaces them
    onSaveSettings(integration.id, {
      autoCreateCustomer: integration.settings?.autoCreateCustomer ?? true,
      autoCreatePurchase: integration.settings?.autoCreatePurchase ?? true,
      allowedEventTypes: integration.settings?.allowedEventTypes || [],
      allowedOrigins: parsedOrigins,
    });
  };

  const lastLead = timeAgo(integration.lastEventAt);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Globe className="w-5 h-5 text-green-600" />
        <h3 className="text-base font-semibold text-gray-900">
          Add to your website
        </h3>
      </div>

      {/* Status */}
      <div
        className={`mb-4 px-3 py-2.5 rounded-lg text-sm ${
          lastLead
            ? "bg-green-50 text-green-800 border border-green-200"
            : "bg-gray-50 text-gray-600 border border-gray-200"
        }`}
      >
        {lastLead
          ? `Working. Last lead received ${lastLead}.`
          : "No leads yet. Paste the code below, then submit a test form on your website."}
      </div>

      {/* Snippet */}
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Paste this one line before the closing &lt;/body&gt; tag
      </label>
      <div className="flex gap-2">
        <textarea
          readOnly
          rows={3}
          value={snippet}
          className="flex-1 min-w-0 px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono text-gray-700 resize-none"
        />
        <button
          type="button"
          onClick={() => onCopy(snippet, "websiteSnippet")}
          className="self-start inline-flex items-center gap-2 px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
        >
          {copiedField === "websiteSnippet" ? (
            <>
              <Check className="w-4 h-4 text-green-600" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy
            </>
          )}
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        It automatically sends every contact form on your site to this CRM.
        Your forms keep working as before.
      </p>

      {/* Options */}
      <div className="mt-4 space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={showButton}
            onChange={(e) => setShowButton(e.target.checked)}
            className="mt-1 h-4 w-4 accent-green-600"
          />
          <span className="text-sm text-gray-700">
            My website has no contact form. Add a &quot;Contact us&quot; button
            to my site.
          </span>
        </label>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Only one form (optional)
          </label>
          <input
            type="text"
            value={formSelector}
            onChange={(e) => setFormSelector(e.target.value)}
            placeholder="#contact-form"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Leave empty to capture all forms. Use the form&apos;s id (like
            #contact-form) to capture just one.
          </p>
        </div>
      </div>

      {/* Allowed websites */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Your website address
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={originsInput}
            onChange={(e) => setOriginsInput(e.target.value)}
            placeholder="yourcompany.com"
            className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <button
            type="button"
            disabled={!originsChanged || savingSettings}
            onClick={handleSaveOrigins}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors flex-shrink-0"
          >
            {savingSettings ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          {savedOrigins.length === 0
            ? "Not set: any website using this code can send leads. Add your domain to block other sites. Separate several with commas."
            : `Only ${savedOrigins.join(", ")} (and its subdomains) can send leads.`}
        </p>
      </div>

      {/* Where to paste */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
        <p className="font-medium text-gray-900 mb-2">Where to paste it</p>
        <ul className="space-y-1.5 list-disc pl-5">
          <li>
            <strong>WordPress:</strong> install the free &quot;WPCode&quot;
            plugin, add a new snippet, choose &quot;Footer&quot;, paste.
          </li>
          <li>
            <strong>Wix:</strong> Settings, Custom Code, Add code to the
            &quot;Body - end&quot; (needs a paid plan).
          </li>
          <li>
            <strong>Webflow:</strong> Site settings, Custom code, Footer code.
          </li>
          <li>
            <strong>Shopify:</strong> Online Store, Themes, Edit code,
            theme.liquid, paste above &lt;/body&gt;.
          </li>
          <li>
            <strong>Plain HTML:</strong> paste before &lt;/body&gt; on each page
            that has a form.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default WebsiteSnippetCard;
