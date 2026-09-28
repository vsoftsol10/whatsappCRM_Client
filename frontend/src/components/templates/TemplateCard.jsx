import {
  FileText,
  Eye,
  SquarePen,
  Send,
  Trash2,
  ClipboardCheck,
  AlertCircle,
} from "lucide-react";

// Status badge styles (same colours as before, kept in one place)
const STATUS_STYLES = {
  APPROVED: { badge: "bg-green-100 text-green-700", dot: "bg-green-500" },
  PENDING: { badge: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-500" },
  REJECTED: { badge: "bg-red-100 text-red-700", dot: "bg-red-500" },
  PAUSED: { badge: "bg-orange-100 text-orange-700", dot: "bg-orange-500" },
  DISABLED: { badge: "bg-red-100 text-red-700", dot: "bg-red-500" },
  DRAFT: { badge: "bg-gray-100 text-gray-700", dot: "bg-gray-400" },
};

const DEFAULT_STATUS_STYLE = {
  badge: "bg-gray-100 text-gray-700",
  dot: "bg-gray-400",
};

export default function TemplateCard({
  template,
  onEdit,
  onDelete,
  onPreview,
  onSend,
  onSubmitForApproval,
}) {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN");
  };

  const isDraft = template.status === "DRAFT";
  const isRejected = template.status === "REJECTED";

  // Templates can be edited and (re)submitted from DRAFT or REJECTED
  const canEdit = isDraft || isRejected;
  const canSubmit = isDraft || isRejected;

  const statusStyle =
    STATUS_STYLES[template.status] || DEFAULT_STATUS_STYLE;

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* ===========================
          HEADER
          Fixed layout: the name always takes ONE line (long names
          are shortened with "…", full name shows on hover), and
          the category + status badge share the second line. This
          keeps every card's header the same height so all cards
          line up in the grid.
      =========================== */}
      <div className="flex items-center gap-4 p-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-100">
          <FileText size={28} className="text-green-600" />
        </div>

        <div className="min-w-0 flex-1">
          <h2
            className="truncate text-lg font-bold text-gray-800"
            title={template.name}
          >
            {template.name}
          </h2>

          <div className="mt-1.5 flex items-center justify-between gap-3">
            <p className="truncate text-xs font-medium uppercase tracking-wide text-gray-500">
              {template.category}
            </p>

            <span
              className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${statusStyle.badge}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`}
              />
              {template.status}
            </span>
          </div>
        </div>
      </div>

      {/* DIVIDER */}
      <div className="border-t border-gray-200" />

      {/* ===========================
          CONTENT
      =========================== */}
      <div className="flex flex-1 flex-col p-5">
        <div className="h-72 overflow-y-auto rounded-2xl bg-green-50 p-5">
          <p className="whitespace-pre-line break-words text-gray-700">
            {template.content}
          </p>
        </div>

        {/* REJECTION REASON */}
        {isRejected && template.rejectionReason && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0 text-red-500"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-red-700">
                Rejected by Meta
              </p>
              <p className="mt-0.5 break-words text-sm text-red-600">
                {template.rejectionReason}
              </p>
            </div>
          </div>
        )}

        {/* INFO — pinned to the bottom of the content area so the
            footer lines up across all cards, whatever the content */}
        <div className="mt-auto pt-5">
          <div className="space-y-1 border-t border-gray-200 pt-4 text-sm text-gray-600">
            <p className="truncate">
              <span className="font-semibold text-gray-800">
                Created By:
              </span>{" "}
              {template.createdBy?.name || "Admin"}
            </p>

            <p>
              <span className="font-semibold text-gray-800">
                Created:
              </span>{" "}
              {formatDate(template.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* DIVIDER */}
      <div className="border-t border-gray-200" />

      {/* ===========================
          ACTIONS
      =========================== */}
      <div
        className={`grid ${
          canSubmit ? "grid-cols-5" : "grid-cols-4"
        } gap-1 p-2 text-center`}
      >
        {/* Preview */}
        <button
          onClick={() => onPreview?.(template)}
          className="flex flex-col items-center gap-1 rounded-xl py-2 text-blue-600 transition hover:bg-blue-50 hover:text-blue-700"
        >
          <Eye size={22} />

          <span className="text-sm">View</span>
        </button>

        {/* Edit */}
        <button
          onClick={() => onEdit?.(template)}
          disabled={!canEdit}
          className={`flex flex-col items-center gap-1 rounded-xl py-2 transition ${
            canEdit
              ? "text-amber-500 hover:bg-amber-50 hover:text-amber-600"
              : "cursor-not-allowed text-gray-300"
          }`}
        >
          <SquarePen size={22} />

          <span className="text-sm">Edit</span>
        </button>

        {/* Submit For Approval (available for DRAFT and REJECTED) */}
        {canSubmit && (
          <button
            onClick={() => onSubmitForApproval?.(template.id)}
            className="flex flex-col items-center gap-1 rounded-xl py-2 text-purple-600 transition hover:bg-purple-50 hover:text-purple-700"
          >
            <ClipboardCheck size={22} />

            <span className="text-sm">
              {isRejected ? "Resubmit" : "Submit"}
            </span>
          </button>
        )}

        {/* Send */}
        <button
          onClick={() => onSend?.(template)}
          disabled={template.status !== "APPROVED"}
          className={`flex flex-col items-center gap-1 rounded-xl py-2 transition ${
            template.status === "APPROVED"
              ? "text-green-600 hover:bg-green-50 hover:text-green-700"
              : "cursor-not-allowed text-gray-300"
          }`}
        >
          <Send size={22} />

          <span className="text-sm">Send</span>
        </button>

        {/* Delete */}
        <button
          onClick={() => onDelete?.(template.id)}
          className="flex flex-col items-center gap-1 rounded-xl py-2 text-red-600 transition hover:bg-red-50 hover:text-red-700"
        >
          <Trash2 size={22} />

          <span className="text-sm">Delete</span>
        </button>
      </div>
    </div>
  );
}
