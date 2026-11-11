import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import {
  Check,
  CircleAlert,
  Download,
  FileSpreadsheet,
  LoaderCircle,
  Upload,
  X,
} from "lucide-react";

import { previewKnowledgeImport, importKnowledge } from "../../api/knowledgeBaseApi";

const errorMessage = (error, fallback) => error?.response?.data?.message || fallback;

// Opens fine in Excel (the leading mark keeps Tamil / Hindi text readable)
const TEMPLATE_CSV =
  "\uFEFF" +
  [
    "Title,Description,Price,Category,Keywords,Active",
    'Kaju Katli 500g,Soft cashew sweet made with pure ghee,Rs 450,Sweets,"kaju barfi, cashew sweet",yes',
    'Delivery charges,Inside the city Rs 40. Free for orders above Rs 500.,,Delivery,"shipping, courier",yes',
  ].join("\r\n");

const downloadTemplate = () => {
  const url = URL.createObjectURL(new Blob([TEMPLATE_CSV], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "knowledge-base-template.csv";
  link.click();
  URL.revokeObjectURL(url);
};

function Tile({ label, value, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-50 text-slate-900",
    green: "bg-[#25D366]/10 text-[#128C7E]",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
  };

  return (
    <div className={`rounded-2xl px-4 py-3 ${tones[tone]}`}>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

function ErrorList({ errors, total }) {
  if (!errors?.length) return null;

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
      <p className="mb-2 text-sm font-semibold text-red-700">
        {total} row{total === 1 ? "" : "s"} can't be imported
      </p>
      <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-red-700">
        {errors.map((item) => (
          <li key={`${item.row}-${item.message}`}>
            Row {item.row}
            {item.title ? ` ("${item.title.slice(0, 40)}")` : ""}: {item.message}
          </li>
        ))}
      </ul>
      {total > errors.length && (
        <p className="mt-2 text-xs text-red-600">...and {total - errors.length} more.</p>
      )}
    </div>
  );
}

export default function KnowledgeImportModal({ onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState("update");
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape" && !busy) onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const runPreview = async (nextFile, nextMode) => {
    setBusy(true);
    setProblem("");

    try {
      const data = await previewKnowledgeImport(nextFile, nextMode);
      setPreview(data);
    } catch (error) {
      setPreview(null);
      setProblem(errorMessage(error, "Could not read the file"));
    } finally {
      setBusy(false);
    }
  };

  const handleFile = (event) => {
    const chosen = event.target.files?.[0];
    event.target.value = ""; // lets the same file be chosen again

    if (!chosen) return;

    setFile(chosen);
    setResult(null);
    runPreview(chosen, mode);
  };

  const handleMode = (nextMode) => {
    setMode(nextMode);
    if (file) runPreview(file, nextMode);
  };

  const handleImport = async () => {
    setBusy(true);
    setProblem("");

    try {
      const data = await importKnowledge(file, mode);
      setResult(data);
      setPreview(null);
      onImported();
      toast.success(data.message || "Import finished");
    } catch (error) {
      setProblem(errorMessage(error, "The import failed"));
    } finally {
      setBusy(false);
    }
  };

  const totals = preview?.totals;
  const nothingToDo = totals && totals.willCreate + totals.willUpdate === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Import from CSV or Excel</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Add your whole product list or FAQs in one go.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 px-6 py-6">
          {/* ---------- DONE ---------- */}
          {result && (
            <>
              <div className="flex items-center gap-3 rounded-2xl bg-[#25D366]/10 px-4 py-3 text-[#128C7E]">
                <Check size={20} />
                <p className="text-sm font-semibold">Import finished</p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Tile label="Added" value={result.created} tone="green" />
                <Tile label="Updated" value={result.updated} tone="green" />
                <Tile label="Skipped" value={result.skipped} />
                <Tile label="Problems" value={result.invalid} tone={result.invalid ? "red" : "slate"} />
              </div>

              <ErrorList errors={result.errors} total={result.invalid} />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#128C7E]"
                >
                  Done
                </button>
              </div>
            </>
          )}

          {/* ---------- CHOOSE / PREVIEW ---------- */}
          {!result && (
            <>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-800">How your file should look</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>
                    First row = column names. A <b>Title</b> column is required (Name, Product or
                    Question also work).
                  </li>
                  <li>
                    Optional: <b>Description</b>, <b>Category</b>, <b>Keywords</b>, <b>Active</b>{" "}
                    (yes/no).
                  </li>
                  <li>
                    Any other column, like <b>Price</b> or <b>Stock</b>, is added to the answer
                    automatically.
                  </li>
                  <li>
                    Use .xlsx, or CSV saved as "CSV UTF-8" so Tamil and other languages stay correct.
                  </li>
                </ul>
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#128C7E] underline"
                >
                  <Download size={15} />
                  Download a sample file
                </button>
              </div>

              <input
                ref={inputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFile}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 px-4 py-6 text-sm font-medium text-slate-600 transition hover:border-[#25D366] hover:text-[#128C7E] disabled:opacity-60"
              >
                {busy ? (
                  <LoaderCircle size={20} className="animate-spin" />
                ) : file ? (
                  <FileSpreadsheet size={20} />
                ) : (
                  <Upload size={20} />
                )}
                {file ? `${file.name} (click to choose another)` : "Choose a CSV or Excel file"}
              </button>

              {problem && (
                <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <CircleAlert size={18} className="mt-0.5 shrink-0" />
                  <p>{problem}</p>
                </div>
              )}

              {preview && (
                <>
                  <p className="text-xs text-slate-500">
                    Title ← <b>{preview.columns.title}</b>
                    {preview.columns.content && (
                      <>
                        {" "}· Description ← <b>{preview.columns.content}</b>
                      </>
                    )}
                    {preview.columns.addedToAnswer.length > 0 && (
                      <>
                        {" "}· Added to the answer: <b>{preview.columns.addedToAnswer.join(", ")}</b>
                      </>
                    )}
                  </p>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Tile label="New entries" value={totals.willCreate} tone="green" />
                    <Tile label="Will be updated" value={totals.willUpdate} tone={totals.willUpdate ? "amber" : "slate"} />
                    <Tile label="Left as they are" value={totals.willSkip} />
                    <Tile label="Problems" value={totals.invalid} tone={totals.invalid ? "red" : "slate"} />
                  </div>

                  {(totals.willUpdate > 0 || totals.willSkip > 0 || mode === "skip") && (
                    <div className="space-y-2 rounded-2xl border border-slate-200 p-4 text-sm">
                      <p className="font-semibold text-slate-800">
                        When an entry with the same title already exists
                      </p>
                      <label className="flex cursor-pointer items-start gap-2">
                        <input
                          type="radio"
                          checked={mode === "update"}
                          onChange={() => handleMode("update")}
                          disabled={busy}
                          className="mt-1"
                        />
                        <span>
                          <b>Update it</b> with the new details (good for a new price list)
                        </span>
                      </label>
                      <label className="flex cursor-pointer items-start gap-2">
                        <input
                          type="radio"
                          checked={mode === "skip"}
                          onChange={() => handleMode("skip")}
                          disabled={busy}
                          className="mt-1"
                        />
                        <span>
                          <b>Leave it</b> as it is and only add the new ones
                        </span>
                      </label>
                    </div>
                  )}

                  {totals.duplicatesInFile > 0 && (
                    <p className="text-xs text-amber-700">
                      {totals.duplicatesInFile} row(s) repeat a title in the file; the last one is used.
                    </p>
                  )}

                  <p
                    className={`text-sm ${
                      preview.capacity.overLimit ? "font-semibold text-red-600" : "text-slate-500"
                    }`}
                  >
                    Entries after import: {preview.capacity.afterImport} of {preview.capacity.limit}
                    {preview.capacity.overLimit && " (over the limit, remove some entries first)"}
                  </p>

                  {preview.sample.length > 0 && (
                    <div className="overflow-hidden rounded-2xl border border-slate-200">
                      <p className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-500">
                        First rows, as they will be saved
                      </p>
                      <ul className="divide-y divide-slate-100">
                        {preview.sample.map((item) => (
                          <li key={item.row} className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                                  item.action === "new"
                                    ? "bg-[#25D366]/10 text-[#128C7E]"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {item.action}
                              </span>
                              <span className="break-words text-sm font-semibold text-slate-800">
                                {item.title}
                              </span>
                            </div>
                            <p className="mt-1 line-clamp-2 whitespace-pre-line break-words text-xs text-slate-500">
                              {item.content}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <ErrorList errors={preview.errors} total={totals.invalid} />

                  <div className="flex justify-end gap-3 pt-1">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={busy}
                      className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleImport}
                      disabled={busy || nothingToDo || preview.capacity.overLimit}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#128C7E] disabled:opacity-50"
                    >
                      {busy ? <LoaderCircle size={16} className="animate-spin" /> : <Check size={16} />}
                      {nothingToDo
                        ? "Nothing to import"
                        : `Import ${totals.willCreate + totals.willUpdate} entries`}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}