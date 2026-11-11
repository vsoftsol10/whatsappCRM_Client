import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  Check,
  CircleAlert,
  Library,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import {
  getKnowledgeBase,
  createKnowledgeEntry,
  updateKnowledgeEntry,
  deleteKnowledgeEntry,
  deleteAllKnowledge,
} from "../../api/knowledgeBaseApi";
import { updateAiSettings, testAiSettings } from "../../api/aiSettingsApi";
import ConfirmModal from "../../components/common/ConfirmModal";
import KnowledgeImportModal from "./KnowledgeImportModal";

// =====================================================
// LIMITS (same as the server)
// =====================================================
const LIMITS = { title: 200, category: 60, keywords: 300, content: 4000 };
const PAGE_SIZE = 10;
const CATEGORY_SUGGESTIONS = ["General", "Pricing", "Delivery", "Policies", "Services", "Timings"];

const EMPTY_FORM = { title: "", category: "General", keywords: "", content: "", isActive: true };

const errorMessage = (error, fallback) => error?.response?.data?.message || fallback;

// =====================================================
// SMALL REUSABLE PIECES
// =====================================================
function Toggle({ checked, onChange, label, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-60 ${
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

function Card({ title, subtitle, children }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function StatTile({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20";

// =====================================================
// ADD / EDIT MODAL
// =====================================================
function EntryModal({ entry, saving, onSave, onClose }) {
  const [form, setForm] = useState(
    entry
      ? {
          title: entry.title,
          category: entry.category || "General",
          keywords: entry.keywords || "",
          content: entry.content,
          isActive: entry.isActive,
        }
      : EMPTY_FORM
  );

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape" && !saving) onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();

    const title = form.title.trim();
    const content = form.content.trim();

    if (!title) return toast.error("Please enter a title");
    if (!content) return toast.error("Please enter the answer / content");

    onSave({
      title,
      content,
      category: form.category.trim() || "General",
      keywords: form.keywords.trim(),
      isActive: form.isActive,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {entry ? "Edit entry" : "Add knowledge base entry"}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Write it the way you want the AI to answer customers.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5 px-6 py-6">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">
                Title / question <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-slate-400">
                {form.title.length}/{LIMITS.title}
              </span>
            </div>
            <input
              value={form.title}
              onChange={set("title")}
              maxLength={LIMITS.title}
              placeholder="e.g. Delivery charges and timing"
              className={inputClass}
              autoFocus
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">
                Answer / content <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-slate-400">
                {form.content.length}/{LIMITS.content}
              </span>
            </div>
            <textarea
              value={form.content}
              onChange={set("content")}
              maxLength={LIMITS.content}
              rows={7}
              placeholder="e.g. Delivery inside the city is Rs 40. Orders above Rs 500 ship free. Delivery takes 1-2 days."
              className={`${inputClass} resize-y`}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Category</label>
              <input
                value={form.category}
                onChange={set("category")}
                maxLength={LIMITS.category}
                list="kb-categories"
                className={inputClass}
              />
              <datalist id="kb-categories">
                {CATEGORY_SUGGESTIONS.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Also known as (keywords)
              </label>
              <input
                value={form.keywords}
                onChange={set("keywords")}
                maxLength={LIMITS.keywords}
                placeholder="shipping, courier, delivery fee"
                className={inputClass}
              />
            </div>
          </div>
          <p className="-mt-2 text-xs text-slate-400">
            Keywords help the AI find this entry when customers use different words, in any language.
          </p>

          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">Active</p>
              <p className="text-xs text-slate-500">Inactive entries are never used by the AI.</p>
            </div>
            <Toggle
              checked={form.isActive}
              onChange={(value) => setForm((prev) => ({ ...prev, isActive: value }))}
              label="Entry active"
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#128C7E] disabled:opacity-60"
            >
              {saving ? <LoaderCircle size={16} className="animate-spin" /> : <Check size={16} />}
              {entry ? "Save changes" : "Add entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =====================================================
// PAGE
// =====================================================
export default function KnowledgeBase() {
  const [entries, setEntries] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, limit: 300 });
  const [useKb, setUseKb] = useState(true);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const [modal, setModal] = useState(null); // null | { entry: object|null }
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [switching, setSwitching] = useState(false);

  const [showImport, setShowImport] = useState(false);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [deleteAllText, setDeleteAllText] = useState("");
  const [deletingAll, setDeletingAll] = useState(false);

  const [testMessage, setTestMessage] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Bump this to fetch the list again (after add / edit / delete)
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((key) => key + 1);

  // Load the list. `cancelled` drops the answer of an older request when the
  // admin types or clicks quickly, so a slow response can't overwrite a newer one.
  useEffect(() => {
    let cancelled = false;

    getKnowledgeBase({ search, status, page, limit: PAGE_SIZE })
      .then((data) => {
        if (cancelled) return;

        setEntries(data.entries || []);
        setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
        setStats(data.stats || { total: 0, active: 0, inactive: 0, limit: 300 });
        setUseKb(data.useKnowledgeBase !== false);
        setLoadError("");
      })
      .catch((error) => {
        if (cancelled) return;
        setLoadError(errorMessage(error, "Failed to load the knowledge base"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [search, status, page, reloadKey]);

  // Search as the admin types (small delay so we don't call the server on every key)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // ---------- master switch ----------
  const handleSwitch = async (next) => {
    setSwitching(true);
    setUseKb(next);

    try {
      await updateAiSettings({ useKnowledgeBase: next });
      toast.success(next ? "AI will use your knowledge base" : "AI will ignore the knowledge base");
    } catch (error) {
      setUseKb(!next);
      toast.error(errorMessage(error, "Failed to update the setting"));
    } finally {
      setSwitching(false);
    }
  };

  // ---------- add / edit ----------
  const handleSave = async (payload) => {
    setSaving(true);

    try {
      if (modal?.entry) {
        await updateKnowledgeEntry(modal.entry.id, payload);
        toast.success("Entry updated");
      } else {
        await createKnowledgeEntry(payload);
        toast.success("Entry added");
      }

      setModal(null);
      reload();
    } catch (error) {
      toast.error(errorMessage(error, "Failed to save the entry"));
    } finally {
      setSaving(false);
    }
  };

  // ---------- active on/off ----------
  const handleToggleEntry = async (entry) => {
    try {
      await updateKnowledgeEntry(entry.id, { isActive: !entry.isActive });
      reload();
    } catch (error) {
      toast.error(errorMessage(error, "Failed to update the entry"));
    }
  };

  // ---------- delete ----------
  const handleDelete = async () => {
    const target = deleteTarget;
    setDeleteTarget(null);

    if (!target) return;

    try {
      await deleteKnowledgeEntry(target.id);
      toast.success("Entry deleted");

      // Deleted the last row of a page -> go back one page
      if (entries.length === 1 && page > 1) setPage(page - 1);
      else reload();
    } catch (error) {
      toast.error(errorMessage(error, "Failed to delete the entry"));
    }
  };

  // ---------- delete everything (typed confirmation) ----------
  const handleDeleteAll = async () => {
    setDeletingAll(true);

    try {
      const data = await deleteAllKnowledge();
      toast.success(data.message || "All entries deleted");
      setShowDeleteAll(false);
      setDeleteAllText("");
      setPage(1);
      reload();
    } catch (error) {
      toast.error(errorMessage(error, "Failed to delete the entries"));
    } finally {
      setDeletingAll(false);
    }
  };

  // ---------- try it ----------
  const handleTest = async () => {
    const message = testMessage.trim();

    if (!message) return toast.error("Type a customer question to try");

    setTesting(true);
    setTestResult(null);

    try {
      const data = await testAiSettings({ message });
      setTestResult({
        reply: data.reply,
        handoff: Boolean(data.handoff),
        matches: data.kbMatches || [],
      });
    } catch (error) {
      toast.error(errorMessage(error, "The test failed"));
    } finally {
      setTesting(false);
    }
  };

  // ---------- render ----------
  if (loading) {
    return (
      <div className="crm-page bg-slate-50">
        <div className="mb-8 h-12 w-72 animate-pulse rounded-xl bg-slate-200" />
        <div className="space-y-4">
          <div className="h-28 animate-pulse rounded-3xl bg-slate-200" />
          <div className="h-28 animate-pulse rounded-3xl bg-slate-200" />
          <div className="h-28 animate-pulse rounded-3xl bg-slate-200" />
        </div>
      </div>
    );
  }

  if (loadError && entries.length === 0 && stats.total === 0) {
    return (
      <div className="crm-page bg-slate-50">
        <div className="flex items-start gap-3 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
          <CircleAlert size={20} className="mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium">{loadError}</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                reload();
              }}
              className="mt-2 text-sm font-semibold underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filtering = Boolean(search) || status !== "all";

  return (
    <div className="crm-page bg-slate-50">
      {/* ================= HEADER ================= */}
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#25D366]/10 text-[#128C7E]">
            <Library size={24} />
          </div>
          <div>
            <h1 className="crm-title text-slate-900">Knowledge Base</h1>
            <p className="mt-1 text-sm text-slate-500 sm:text-base">
              Teach the AI your business. It answers customers from these entries only for your company.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
          <div>
            <p className="text-sm font-semibold text-slate-900">Use in AI replies</p>
            <p className="text-xs text-slate-500">{useKb ? "On" : "Off"}</p>
          </div>
          <Toggle
            checked={useKb}
            onChange={handleSwitch}
            disabled={switching}
            label="Use the knowledge base in AI replies"
          />
        </div>
      </div>

      {!useKb && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          <CircleAlert size={18} className="mt-0.5 shrink-0" />
          <p>The knowledge base is switched off, so the AI is not using these entries.</p>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatTile label="Entries" value={`${stats.total} / ${stats.limit}`} />
        <StatTile label="Active" value={stats.active} />
        <StatTile label="Inactive" value={stats.inactive} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* ================= ENTRIES ================= */}
        <div className="space-y-4 xl:col-span-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search entries..."
                className={`${inputClass} pl-10`}
              />
            </div>

            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-[#25D366]"
              aria-label="Filter by status"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <button
              type="button"
              onClick={() => setShowImport(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <Upload size={16} />
              Import
            </button>

            <button
              type="button"
              onClick={() => setModal({ entry: null })}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#128C7E]"
            >
              <Plus size={16} />
              Add entry
            </button>
          </div>

          {entries.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Library size={22} />
              </div>
              <p className="text-base font-semibold text-slate-800">
                {filtering ? "No entries match your search" : "Your knowledge base is empty"}
              </p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                {filtering
                  ? "Try a different word or clear the filter."
                  : "Add your prices, policies, timings and common answers. The AI will use them when customers ask."}
              </p>
              {!filtering && (
                <button
                  type="button"
                  onClick={() => setModal({ entry: null })}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#128C7E]"
                >
                  <Plus size={16} />
                  Add your first entry
                </button>
              )}
            </div>
          ) : (
            <ul className="space-y-3">
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  className={`rounded-2xl border bg-white p-5 shadow-sm transition ${
                    entry.isActive ? "border-slate-200" : "border-slate-200 opacity-70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="break-words text-base font-semibold text-slate-900">
                          {entry.title}
                        </h3>
                        <span className="rounded-full bg-[#25D366]/10 px-2.5 py-0.5 text-xs font-medium text-[#128C7E]">
                          {entry.category}
                        </span>
                        {!entry.isActive && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                            Inactive
                          </span>
                        )}
                      </div>
                      {entry.keywords && (
                        <p className="mt-1 break-words text-xs text-slate-400">
                          Also known as: {entry.keywords}
                        </p>
                      )}
                    </div>

                    <Toggle
                      checked={entry.isActive}
                      onChange={() => handleToggleEntry(entry)}
                      label={`Entry "${entry.title}" active`}
                    />
                  </div>

                  <p className="mt-3 line-clamp-3 whitespace-pre-line break-words text-sm text-slate-600">
                    {entry.content}
                  </p>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      Updated {new Date(entry.updatedAt).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setModal({ entry })}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(entry)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-slate-500">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((prev) => prev + 1)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}

          {stats.total > 0 && (
            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => {
                  setDeleteAllText("");
                  setShowDeleteAll(true);
                }}
                className="text-xs font-medium text-slate-400 transition hover:text-red-600"
              >
                Delete all entries...
              </button>
            </div>
          )}
        </div>

        {/* ================= SIDE ================= */}
        <div className="space-y-6 xl:col-span-4">
          <Card title="Try it" subtitle="See how the AI answers a customer question.">
            <div className="space-y-3">
              <textarea
                value={testMessage}
                onChange={(event) => setTestMessage(event.target.value)}
                maxLength={500}
                rows={3}
                placeholder="e.g. How much is delivery?"
                className={`${inputClass} resize-none`}
              />
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
              >
                {testing ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} />}
                Send test message
              </button>

              {testResult && (
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="whitespace-pre-line break-words text-sm text-slate-800">
                    {testResult.reply}
                  </p>

                  {testResult.handoff && (
                    <p className="text-xs font-medium text-amber-700">
                      The AI would pass this chat to your team.
                    </p>
                  )}

                  <div className="border-t border-slate-200 pt-3">
                    <p className="text-xs font-medium text-slate-500">Entries the AI used</p>
                    {testResult.matches.length === 0 ? (
                      <p className="mt-1 text-xs text-slate-400">
                        None matched{useKb ? "" : " (knowledge base is off)"}.
                      </p>
                    ) : (
                      <ul className="mt-1 space-y-0.5">
                        {testResult.matches.map((match) => (
                          <li key={match.id} className="text-xs text-slate-700">
                            • {match.title}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card title="Tips">
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li>One topic per entry works best (delivery, refunds, timings).</li>
              <li>Add keywords for other words customers use, like "shipping" or "courier".</li>
              <li>If nothing matches, the AI hands the chat to your team instead of guessing.</li>
              <li>
                Switch the AI itself on or off in{" "}
                <Link to="/settings/ai-auto-reply" className="font-semibold text-[#128C7E] underline">
                  AI Auto-Reply
                </Link>
                .
              </li>
            </ul>
          </Card>
        </div>
      </div>

      {modal && (
        <EntryModal
          key={modal.entry?.id ?? "new"}
          entry={modal.entry}
          saving={saving}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {showImport && (
        <KnowledgeImportModal
          onClose={() => setShowImport(false)}
          onImported={() => {
            setPage(1);
            reload();
          }}
        />
      )}

      {showDeleteAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900">Delete all entries?</h2>
            <p className="mt-2 text-sm text-slate-600">
              This removes all {stats.total} entries of your knowledge base. The AI will stop using
              them. This cannot be undone.
            </p>
            <p className="mt-4 text-sm text-slate-700">
              Type <b>DELETE ALL</b> to confirm:
            </p>
            <input
              value={deleteAllText}
              onChange={(event) => setDeleteAllText(event.target.value)}
              className={`${inputClass} mt-2`}
              autoFocus
            />
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteAll(false)}
                disabled={deletingAll}
                className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAll}
                disabled={deleteAllText !== "DELETE ALL" || deletingAll}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {deletingAll && <LoaderCircle size={16} className="animate-spin" />}
                Delete everything
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete this entry?"
        message={`"${deleteTarget?.title || ""}" will be removed and the AI will stop using it.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}