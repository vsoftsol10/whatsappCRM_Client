import { useEffect, useState } from "react";
import { Check, Copy, Globe, Loader2 } from "lucide-react";

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

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20";

  return (
    <div>
      <div className="mb-4 flex items-center gap-2.5">
        <Globe className="h-5 w-5 text-green-700" />
        <h3 className="text-lg font-semibold text-green-800">
          Add to your Website
        </h3>
      </div>

      {/* Status */}
      <div
        className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
          lastLead
            ? "border-green-200 bg-green-50 text-green-800"
            : "border-slate-200 bg-slate-50 text-slate-500"
        }`}
      >
        {lastLead
          ? `Working. Last lead received ${lastLead}.`
          : "No leads yet. Paste the code below, then submit a test form on your site."}
      </div>

      {/* Snippet */}
      <label className="mb-2 block text-base font-semibold text-slate-900">
        Paste this one line before the closing &lt;/body&gt; tag
      </label>

      <div className="flex items-center gap-3">
        <input
          readOnly
          value={snippet}
          title={snippet}
          onFocus={(e) => e.target.select()}
          className="min-w-0 flex-1 truncate rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs text-slate-700 outline-none"
        />

        <button
          type="button"
          onClick={() => onCopy(snippet, "websiteSnippet")}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
        >
          {copiedField === "websiteSnippet" ? (
            <>
              <Check className="h-4 w-4 text-green-600" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy
            </>
          )}
        </button>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        It automatically sends every contact form on your site to this CRM.
        Your forms keep working as before.
      </p>

      {/* Options */}
      <div className="mt-6 space-y-6">
        <label className="flex cursor-pointer items-center gap-4">
          <input
            type="checkbox"
            checked={showButton}
            onChange={(e) => setShowButton(e.target.checked)}
            className="h-5 w-5 shrink-0 rounded accent-green-600"
          />
          <span className="text-base text-slate-800">
            My website has no contact form. Add a &quot;Contact us&quot; button
            to my site
          </span>
        </label>

        <div>
          <label className="mb-2 block text-base font-semibold text-slate-900">
            Only one form (optional)
          </label>

          <input
            type="text"
            value={formSelector}
            onChange={(e) => setFormSelector(e.target.value)}
            placeholder="#contact-form"
            className={inputClass}
          />

          <p className="mt-2 text-xs text-slate-500">
            Leave empty to capture all forms. Use the form&apos;s id (like
            #contact-form) to capture just one.
          </p>
        </div>
      </div>

      {/* Allowed websites */}
      <div className="mt-6">
        <label className="mb-2 block text-base font-semibold text-slate-900">
          Your website address
        </label>

        <div className="flex items-center gap-3">
          <input
            type="text"
            value={originsInput}
            onChange={(e) => setOriginsInput(e.target.value)}
            placeholder="yourcompany.com"
            className={`${inputClass} min-w-0 flex-1`}
          />

          <button
            type="button"
            disabled={!originsChanged || savingSettings}
            onClick={handleSaveOrigins}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#22C55E] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#16a34a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingSettings && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </button>
        </div>

        <p className="mt-2 text-xs text-slate-500">
          {savedOrigins.length === 0
            ? "Not set: any website using this code can send leads. Add your domain to block other sites. Separate several with commas."
            : `Only ${savedOrigins.join(", ")} (and its subdomains) can send leads.`}
        </p>
      </div>

      {/* Where to paste */}
      <div className="mt-6 rounded-2xl border border-slate-300 bg-slate-50/60 p-5 text-sm text-slate-800">
        <p className="mb-3 text-base font-semibold text-slate-900">
          Where to paste it
        </p>

        <ul className="list-disc space-y-2 pl-5">
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
            <strong>Plain HTML:</strong> paste before &lt;/body&gt; on each
            page that has a form.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default WebsiteSnippetCard;
