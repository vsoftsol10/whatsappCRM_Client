import { useEffect, useState } from "react";
import { Bot, Save, Eye, EyeOff } from "lucide-react";
import { toast } from "react-hot-toast";

import { getAiSettings, updateAiSettings } from "../../api/aiSettingsApi";

export default function AiAutoReply() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const [isEnabled, setIsEnabled] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);
  const [model, setModel] = useState("grok-4");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [historyLimit, setHistoryLimit] = useState(10);

  // =====================================================
  // FETCH SETTINGS
  // =====================================================
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await getAiSettings();

        setIsEnabled(data.settings.isEnabled);
        setHasApiKey(data.settings.hasApiKey);
        setModel(data.settings.model);
        setSystemPrompt(data.settings.systemPrompt);
        setHistoryLimit(data.settings.historyLimit);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load AI settings");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // =====================================================
  // SAVE SETTINGS
  // =====================================================
  const handleSave = async () => {
    try {
      setSaving(true);

      const payload = {
        isEnabled,
        model,
        systemPrompt,
        historyLimit: Number(historyLimit),
      };

      // Only send the key if the admin actually typed a new one
      if (apiKey.trim()) {
        payload.apiKey = apiKey.trim();
      }

      const data = await updateAiSettings(payload);

      setHasApiKey(data.settings.hasApiKey);
      setApiKey("");
      toast.success("AI settings saved");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save AI settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="crm-page bg-slate-50">
        <p className="text-slate-500">Loading AI settings...</p>
      </div>
    );
  }

  return (
    <div className="crm-page bg-slate-50">
      {/* ================= HEADER ================= */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#25D366]/10 text-[#128C7E]">
          <Bot size={22} />
        </div>

        <div>
          <h1 className="crm-title text-slate-900">AI Auto-Reply</h1>
          <p className="mt-1 text-slate-500">
            Configure Grok to automatically reply to customer WhatsApp
            messages. Each conversation also has its own on/off switch.
          </p>
        </div>
      </div>

      <div className="max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* MASTER ENABLE */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-5">
          <div>
            <p className="font-semibold text-slate-800">
              Enable AI Auto-Reply
            </p>
            <p className="text-sm text-slate-500">
              Master switch — turns Grok auto-reply on/off for the whole
              CRM. Individual chats can still be toggled from the
              Conversations page.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsEnabled((prev) => !prev)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition ${
              isEnabled ? "bg-[#25D366]" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                isEnabled ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>

        {/* API KEY */}
        <div className="mt-5">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Grok API Key
          </label>

          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={
                hasApiKey
                  ? "•••••••••••••••• (saved — enter a new key to replace)"
                  : "xai-..."
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 pr-11 text-sm focus:border-[#25D366] focus:outline-none"
            />

            <button
              type="button"
              onClick={() => setShowKey((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <p className="mt-1 text-xs text-slate-400">
            {hasApiKey
              ? "A key is already saved. Leave blank to keep it."
              : "No key saved yet — auto-reply won't work until one is added."}
          </p>
        </div>

        {/* MODEL */}
        <div className="mt-5">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Model
          </label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-[#25D366] focus:outline-none"
          />
        </div>

        {/* SYSTEM PROMPT */}
        <div className="mt-5">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            System Prompt
          </label>
          <textarea
            rows={5}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="w-full resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-[#25D366] focus:outline-none"
          />
          <p className="mt-1 text-xs text-slate-400">
            This tells Grok how to behave — tone, what it knows about
            your business, and when to hand off to a human.
          </p>
        </div>

        {/* HISTORY LIMIT */}
        <div className="mt-5">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Conversation History Sent to Grok
          </label>
          <input
            type="number"
            min={1}
            max={50}
            value={historyLimit}
            onChange={(e) => setHistoryLimit(e.target.value)}
            className="w-32 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-[#25D366] focus:outline-none"
          />
          <p className="mt-1 text-xs text-slate-400">
            Number of previous messages (both sides) used as context for
            each reply.
          </p>
        </div>

        {/* SAVE */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#128C7E] disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}