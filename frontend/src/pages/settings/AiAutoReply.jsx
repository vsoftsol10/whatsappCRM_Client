import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  Bot,
  Check,
  CircleAlert,
  Clock,
  Cpu,
  Eye,
  EyeOff,
  ExternalLink,
  FileText,
  KeyRound,
  LoaderCircle,
  Lock,
  Plug,
  RotateCcw,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";

import {
  getAiSettings,
  updateAiSettings,
  testAiSettings,
} from "../../api/aiSettingsApi";

// =====================================================
// STATIC UI DATA
// =====================================================

// Full class names (Tailwind needs them written out literally).
const PROVIDER_STYLES = {
  GEMINI: { initial: "G", badge: "bg-blue-50 text-blue-600" },
  OPENAI: { initial: "O", badge: "bg-emerald-50 text-emerald-600" },
  ANTHROPIC: { initial: "C", badge: "bg-orange-50 text-orange-600" },
  GROK: { initial: "X", badge: "bg-slate-100 text-slate-800" },
  DEEPSEEK: { initial: "D", badge: "bg-indigo-50 text-indigo-600" },
  GROQ: { initial: "Q", badge: "bg-rose-50 text-rose-600" },
  MISTRAL: { initial: "M", badge: "bg-amber-50 text-amber-600" },
  CUSTOM: { initial: null, badge: "bg-purple-50 text-purple-600" },
};

const PROMPT_TEMPLATES = [
  {
    label: "Customer support",
    text: `You are the friendly customer support assistant for [Your business name]. Answer questions about our products, pricing, working hours and policies using only the information below.

Business details:
- Working hours: [e.g. Mon–Sat, 9 AM – 7 PM]
- Location: [address]
- Contact: [phone / email]

Rules:
- Keep replies short, clear and polite.
- If you don't know the answer, or the customer asks for a human, say our team will contact them shortly.
- Never make up prices, offers or policies.`,
  },
  {
    label: "Sales assistant",
    text: `You are a helpful sales assistant for [Your business name]. Understand what the customer needs, recommend the most suitable product or plan, and guide them to the next step.

Products / plans:
- [Product 1] — [price] — [short benefit]
- [Product 2] — [price] — [short benefit]

Rules:
- Ask one question at a time and keep replies short.
- Be friendly, never pushy.
- For discounts, custom quotes or payments, say a team member will confirm shortly.
- Never invent prices or offers.`,
  },
  {
    label: "Appointment booking",
    text: `You are the appointment assistant for [Your business name]. Help customers book, reschedule or cancel appointments.

Collect these details, one question at a time:
1. Full name
2. Service needed
3. Preferred date and time

Opening hours: [e.g. Mon–Sat, 9 AM – 7 PM]
Services: [list your services]

After you have all the details, summarise them and say our team will confirm the booking shortly. Do not confirm availability yourself.`,
  },
];

const MAX_PROMPT_LENGTH = 4000;

const EMPTY_FORM = {
  isEnabled: false,
  provider: "GEMINI",
  model: "",
  baseUrl: "",
  systemPrompt: "",
  historyLimit: 10,
};

const toForm = (settings) => ({
  isEnabled: settings.isEnabled,
  provider: settings.provider,
  model: settings.model || "",
  baseUrl: settings.baseUrl || "",
  systemPrompt: settings.systemPrompt || "",
  historyLimit: settings.historyLimit || 10,
});

const errorMessage = (error, fallback) =>
  error?.response?.data?.message || fallback;

// =====================================================
// SMALL REUSABLE PIECES
// =====================================================

function Card({ icon: Icon, title, subtitle, action, children }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#25D366]/10 text-[#128C7E]">
              <Icon size={19} />
            </div>
          )}
          <div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {subtitle && (
              <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
            )}
          </div>
        </div>
        {action}
      </div>

      <div className="p-6">{children}</div>
    </section>
  );
}

function Field({ label, hint, right, children }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        {right}
      </div>
      {children}
      {hint && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-[#25D366] focus:outline-none focus:ring-4 focus:ring-[#25D366]/10";

function ProviderBadge({ providerId, size = "h-10 w-10" }) {
  const style = PROVIDER_STYLES[providerId] || PROVIDER_STYLES.CUSTOM;

  return (
    <div
      className={`flex ${size} shrink-0 items-center justify-center rounded-xl text-base font-bold ${style.badge}`}
    >
      {style.initial || <Plug size={18} />}
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${
        checked ? "bg-[#25D366]" : "bg-slate-300"
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
          checked ? "left-6" : "left-1"
        }`}
      />
    </button>
  );
}

function StatusRow({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="max-w-[60%] truncate text-right text-sm font-medium text-slate-800">
        {children}
      </span>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="crm-page bg-slate-50">
      <div className="mb-8 h-12 w-72 animate-pulse rounded-xl bg-slate-200" />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <div className="h-64 animate-pulse rounded-3xl bg-slate-200" />
          <div className="h-72 animate-pulse rounded-3xl bg-slate-200" />
        </div>
        <div className="space-y-6 xl:col-span-4">
          <div className="h-56 animate-pulse rounded-3xl bg-slate-200" />
          <div className="h-72 animate-pulse rounded-3xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

// =====================================================
// PAGE
// =====================================================

export default function AiAutoReply() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [providers, setProviders] = useState([]);
  const [saved, setSaved] = useState(null); // settings as stored on the server
  const [form, setForm] = useState(EMPTY_FORM);

  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);

  const [saving, setSaving] = useState(false);
  const [removingKey, setRemovingKey] = useState(false);

  const [testMessage, setTestMessage] = useState(
    "Hi, what are your working hours?"
  );
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testError, setTestError] = useState("");

  // ---------- load ----------
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getAiSettings();

        setProviders(data.providers || []);
        setSaved(data.settings);
        setForm(toForm(data.settings));
      } catch (error) {
        console.error(error);
        setLoadError(
          error?.response?.status === 403
            ? "Only admins can manage AI auto-reply settings."
            : errorMessage(error, "Failed to load AI settings")
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // ---------- derived ----------
  const activeProvider = useMemo(
    () => providers.find((p) => p.id === form.provider),
    [providers, form.provider]
  );

  const keyInfo = saved?.keys?.[form.provider];
  const hasSavedKey = Boolean(keyInfo?.saved);
  const hasKey = hasSavedKey || Boolean(apiKeyInput.trim());

  const dirty = useMemo(() => {
    if (!saved) return false;
    if (apiKeyInput.trim()) return true;
    return JSON.stringify(form) !== JSON.stringify(toForm(saved));
  }, [form, saved, apiKeyInput]);

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  // ---------- actions ----------
  const selectProvider = (providerId) => {
    if (providerId === form.provider) return;

    const next = providers.find((p) => p.id === providerId);

    update({
      provider: providerId,
      // keep the saved model if we are returning to the saved provider
      model:
        saved?.provider === providerId ? saved.model : next?.defaultModel || "",
    });

    setApiKeyInput("");
    setShowKey(false);
    setTestResult(null);
    setTestError("");
  };

  const applyTemplate = (template) => {
    const current = form.systemPrompt.trim();

    if (
      current &&
      current !== template.text &&
      !window.confirm("Replace the current prompt with this template?")
    ) {
      return;
    }

    update({ systemPrompt: template.text });
    toast.success("Template applied — replace the [brackets] with your details");
  };

  const handleDiscard = () => {
    if (!saved) return;
    setForm(toForm(saved));
    setApiKeyInput("");
    setShowKey(false);
  };

  const validate = () => {
    if (!form.systemPrompt.trim()) return "System prompt cannot be empty";
    if (form.systemPrompt.length > MAX_PROMPT_LENGTH)
      return `System prompt must be ${MAX_PROMPT_LENGTH} characters or fewer`;

    if (form.isEnabled) {
      if (!hasKey)
        return `Add an API key for ${activeProvider?.name || "this provider"} before enabling auto-reply`;
      if (!form.model.trim()) return "Enter a model name before enabling";
      if (activeProvider?.requiresBaseUrl && !form.baseUrl.trim())
        return "Enter the Base URL before enabling";
    }

    return "";
  };

  const handleSave = async () => {
    const problem = validate();

    if (problem) {
      toast.error(problem);
      return;
    }

    try {
      setSaving(true);

      const payload = {
        isEnabled: form.isEnabled,
        provider: form.provider,
        model: form.model.trim(),
        systemPrompt: form.systemPrompt,
        historyLimit: Number(form.historyLimit),
      };

      if (activeProvider?.requiresBaseUrl) payload.baseUrl = form.baseUrl.trim();
      if (apiKeyInput.trim()) payload.apiKey = apiKeyInput.trim();

      const data = await updateAiSettings(payload);

      setSaved(data.settings);
      setForm(toForm(data.settings));
      setApiKeyInput("");
      setShowKey(false);

      toast.success("AI settings saved");
    } catch (error) {
      console.error(error);
      toast.error(errorMessage(error, "Failed to save AI settings"));
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveKey = async () => {
    if (
      !window.confirm(
        `Remove the saved ${activeProvider?.name || ""} API key?${
          form.isEnabled && saved?.provider === form.provider
            ? " Auto-reply will be turned off."
            : ""
        }`
      )
    ) {
      return;
    }

    try {
      setRemovingKey(true);

      const data = await updateAiSettings({
        provider: form.provider,
        removeKeyFor: form.provider,
      });

      setSaved(data.settings);
      setForm((prev) => ({ ...prev, isEnabled: data.settings.isEnabled }));
      toast.success("API key removed");
    } catch (error) {
      console.error(error);
      toast.error(errorMessage(error, "Failed to remove the key"));
    } finally {
      setRemovingKey(false);
    }
  };

  const handleTest = async () => {
    if (!hasKey) {
      toast.error("Add an API key first");
      return;
    }

    try {
      setTesting(true);
      setTestResult(null);
      setTestError("");

      const data = await testAiSettings({
        message: testMessage,
        provider: form.provider,
        model: form.model.trim(),
        baseUrl: form.baseUrl.trim(),
        systemPrompt: form.systemPrompt,
        apiKey: apiKeyInput.trim() || undefined,
      });

      setTestResult({ ...data, question: testMessage });
    } catch (error) {
      console.error(error);
      setTestError(errorMessage(error, "The test failed. Please try again."));
    } finally {
      setTesting(false);
    }
  };

  // ---------- states ----------
  if (loading) return <PageSkeleton />;

  if (loadError) {
    return (
      <div className="crm-page bg-slate-50">
        <div className="flex items-start gap-3 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
          <CircleAlert size={20} className="mt-0.5 shrink-0" />
          <p className="text-sm font-medium">{loadError}</p>
        </div>
      </div>
    );
  }

  const isLive = Boolean(saved?.isEnabled);

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <div className="crm-page bg-slate-50">
      {/* ================= HEADER ================= */}
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#25D366]/10 text-[#128C7E]">
            <Bot size={24} />
          </div>

          <div>
            <h1 className="crm-title text-slate-900">AI Auto-Reply</h1>
            <p className="mt-1 text-sm text-slate-500 sm:text-base">
              Connect your own AI account and let it answer customer WhatsApp
              messages automatically.
            </p>
          </div>
        </div>

        {/* master switch */}
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Auto-reply {form.isEnabled ? "enabled" : "disabled"}
            </p>
            <p className="text-xs text-slate-500">
              Master switch for your whole CRM
            </p>
          </div>

          <Toggle
            checked={form.isEnabled}
            onChange={(value) => update({ isEnabled: value })}
            label="Enable AI auto-reply"
          />
        </div>
      </div>

      {/* ================= MAIN GRID ================= */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* ============ LEFT: CONFIGURATION ============ */}
        <div className="space-y-6 xl:col-span-8">
          {/* ---------- PROVIDER ---------- */}
          <Card
            icon={Cpu}
            title="AI provider"
            subtitle="Choose which AI service answers your customers. You can keep a key for each and switch any time."
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-4">
              {providers.map((provider) => {
                const selected = provider.id === form.provider;
                const keySaved = saved?.keys?.[provider.id]?.saved;

                return (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => selectProvider(provider.id)}
                    className={`relative flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
                      selected
                        ? "border-[#25D366] bg-[#25D366]/5 ring-4 ring-[#25D366]/10"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <ProviderBadge providerId={provider.id} />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {provider.name}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {keySaved ? (
                          <span className="font-medium text-emerald-600">
                            Key saved
                          </span>
                        ) : (
                          provider.description
                        )}
                      </p>
                    </div>

                    {selected && (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white">
                        <Check size={13} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* ---------- CONNECTION ---------- */}
          <Card
            icon={KeyRound}
            title={`${activeProvider?.name || "Provider"} connection`}
            subtitle="Your API key and model. Usage is billed by the AI provider to your own account."
          >
            <div className="space-y-5">
              {/* API key */}
              <Field
                label="API key"
                right={
                  activeProvider?.keyUrl && (
                    <a
                      href={activeProvider.keyUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#128C7E] hover:underline"
                    >
                      Get an API key <ExternalLink size={12} />
                    </a>
                  )
                }
              >
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder={
                      hasSavedKey
                        ? `${keyInfo.hint}  (saved — paste a new key to replace it)`
                        : activeProvider?.keyPlaceholder || "Paste your API key"
                    }
                    className={`${inputClass} pr-11`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowKey((prev) => !prev)}
                    aria-label={showKey ? "Hide key" : "Show key"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  {hasSavedKey ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                      <ShieldCheck size={14} />
                      Key saved securely ({keyInfo.hint})
                    </span>
                  ) : keyInfo?.needsReentry ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600">
                      <CircleAlert size={14} />
                      The saved key can no longer be read — please paste it again
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">
                      No key saved for this provider yet.
                    </span>
                  )}

                  {(hasSavedKey || keyInfo?.needsReentry) && (
                    <button
                      type="button"
                      onClick={handleRemoveKey}
                      disabled={removingKey}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-600 disabled:opacity-60"
                    >
                      <Trash2 size={13} />
                      {removingKey ? "Removing..." : "Remove key"}
                    </button>
                  )}
                </div>

                <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                  <Lock size={12} />
                  Keys are encrypted before they are stored and are never shown
                  again.
                </p>
              </Field>

              {/* Base URL (custom only) */}
              {activeProvider?.requiresBaseUrl && (
                <Field
                  label="Base URL"
                  hint="The https address of your OpenAI-compatible API, for example https://api.together.xyz/v1"
                >
                  <input
                    type="text"
                    value={form.baseUrl}
                    onChange={(e) => update({ baseUrl: e.target.value })}
                    placeholder="https://api.your-provider.com/v1"
                    className={inputClass}
                  />
                </Field>
              )}

              {/* Model */}
              <Field
                label="Model"
                hint="Pick a suggestion or type any model name your account has access to."
              >
                <input
                  type="text"
                  value={form.model}
                  onChange={(e) => update({ model: e.target.value })}
                  placeholder={activeProvider?.defaultModel || "model-name"}
                  className={inputClass}
                />

                {activeProvider?.models?.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {activeProvider.models.map((modelName) => (
                      <button
                        key={modelName}
                        type="button"
                        onClick={() => update({ model: modelName })}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                          form.model === modelName
                            ? "border-[#25D366] bg-[#25D366]/10 text-[#128C7E]"
                            : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {modelName}
                      </button>
                    ))}
                  </div>
                )}
              </Field>
            </div>
          </Card>

          {/* ---------- BEHAVIOUR ---------- */}
          <Card
            icon={FileText}
            title="AI behavior"
            subtitle="Tell the AI who it is, what your business offers and when to hand over to a human."
          >
            <div className="space-y-6">
              <Field
                label="System prompt"
                right={
                  <span
                    className={`text-xs ${
                      form.systemPrompt.length > MAX_PROMPT_LENGTH
                        ? "font-semibold text-red-500"
                        : "text-slate-400"
                    }`}
                  >
                    {form.systemPrompt.length} / {MAX_PROMPT_LENGTH}
                  </span>
                }
              >
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <Sparkles size={13} /> Start from a template:
                  </span>

                  {PROMPT_TEMPLATES.map((template) => (
                    <button
                      key={template.label}
                      type="button"
                      onClick={() => applyTemplate(template)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-[#25D366] hover:bg-[#25D366]/5 hover:text-[#128C7E]"
                    >
                      {template.label}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={10}
                  value={form.systemPrompt}
                  onChange={(e) => update({ systemPrompt: e.target.value })}
                  className={`${inputClass} resize-y leading-relaxed`}
                />
              </Field>

              <Field
                label="Conversation memory"
                hint="How many recent messages (both sides) the AI reads before replying. More memory means better context but higher cost."
                right={
                  <span className="rounded-lg bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                    {form.historyLimit} messages
                  </span>
                }
              >
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={form.historyLimit}
                  onChange={(e) =>
                    update({ historyLimit: Number(e.target.value) })
                  }
                  className="w-full accent-[#25D366]"
                />
                <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                  <span>1</span>
                  <span>50</span>
                </div>
              </Field>
            </div>
          </Card>
        </div>

        {/* ============ RIGHT: STATUS + TEST ============ */}
        <div className="space-y-6 xl:col-span-4">
          {/* ---------- STATUS ---------- */}
          <Card icon={Zap} title="Live status">
            <div className="divide-y divide-slate-100">
              <StatusRow label="Auto-reply">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    isLive
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isLive ? "bg-emerald-500" : "bg-slate-400"
                    }`}
                  />
                  {isLive ? "Active" : "Off"}
                </span>
              </StatusRow>

              <StatusRow label="Provider">
                {providers.find((p) => p.id === saved?.provider)?.name || "—"}
              </StatusRow>

              <StatusRow label="Model">{saved?.model || "—"}</StatusRow>

              <StatusRow label="API key">
                {saved?.keys?.[saved?.provider]?.saved ? (
                  <span className="text-emerald-600">
                    {saved.keys[saved.provider].hint}
                  </span>
                ) : (
                  <span className="text-amber-600">Missing</span>
                )}
              </StatusRow>
            </div>

            {saved?.lastError && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-2.5">
                  <CircleAlert size={17} className="mt-0.5 shrink-0 text-red-500" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-red-700">
                      Last auto-reply failed
                    </p>
                    <p className="mt-1 break-words text-xs text-red-600">
                      {saved.lastError}
                    </p>
                    {saved.lastErrorAt && (
                      <p className="mt-1.5 flex items-center gap-1 text-[11px] text-red-400">
                        <Clock size={11} />
                        {new Date(saved.lastErrorAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* ---------- TEST ---------- */}
          <Card
            icon={Send}
            title="Test your setup"
            subtitle="Sends one sample message to the AI. Nothing goes to WhatsApp."
          >
            <div className="space-y-3">
              <Field label="Sample customer message">
                <input
                  type="text"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  maxLength={500}
                  className={inputClass}
                />
              </Field>

              <button
                type="button"
                onClick={handleTest}
                disabled={testing || !testMessage.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#25D366] px-4 py-2.5 text-sm font-semibold text-[#128C7E] transition hover:bg-[#25D366]/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {testing ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                {testing ? "Waiting for the AI..." : "Send test message"}
              </button>

              <p className="text-xs text-slate-400">
                Uses what is on this page, including a key you have typed but
                not saved yet.
              </p>

              {/* result */}
              {(testResult || testError) && (
                <div className="mt-2 space-y-2 rounded-2xl bg-[#ECE5DD] p-3">
                  {testResult && (
                    <>
                      <div className="flex justify-start">
                        <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-3.5 py-2 text-sm text-slate-800 shadow-sm">
                          {testResult.question}
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-[#D9FDD3] px-3.5 py-2 text-sm text-slate-800 shadow-sm">
                          {testResult.reply}
                          <p className="mt-1 text-right text-[10px] text-slate-500">
                            {testResult.provider} · {testResult.model} ·{" "}
                            {(testResult.latencyMs / 1000).toFixed(1)}s
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  {testError && (
                    <div className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs text-red-600">
                      <CircleAlert size={15} className="mt-0.5 shrink-0" />
                      <span className="break-words">{testError}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* ---------- HOW IT WORKS ---------- */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">
              How it works
            </h3>

            <ol className="mt-4 space-y-3.5">
              {[
                "A customer sends you a WhatsApp message.",
                "If auto-reply and the chat's Bot switch are ON, the AI reads the recent conversation.",
                "It writes a reply using your prompt and sends it on WhatsApp.",
                "When an agent replies manually, the Bot switch for that chat turns OFF automatically.",
              ].map((step, index) => (
                <li key={step} className="flex gap-3 text-sm text-slate-600">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#25D366]/10 text-xs font-bold text-[#128C7E]">
                    {index + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* ================= SAVE BAR ================= */}
      <div className="sticky bottom-4 z-10 mt-6">
        <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 px-5 py-3.5 shadow-lg backdrop-blur sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-sm">
            {dirty ? (
              <>
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="font-medium text-slate-700">
                  You have unsaved changes
                </span>
              </>
            ) : (
              <>
                <Check size={16} className="text-emerald-500" />
                <span className="text-slate-500">All changes saved</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDiscard}
              disabled={!dirty || saving}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw size={15} />
              Discard
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={!dirty || saving}
              className="flex items-center gap-2 rounded-xl bg-[#25D366] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#128C7E] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
