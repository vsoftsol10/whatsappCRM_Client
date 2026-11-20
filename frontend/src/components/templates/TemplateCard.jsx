import { FileText, AlertCircle } from "lucide-react";

import RowActionsMenu from "../common/RowActionsMenu";
import { StatusPill } from "./templateUi";
import {
  formatDate,
  getTemplateActions,
  ACTIONS_MENU_WIDTH,
} from "./templateHelpers";

export default function TemplateCard({
  template,
  onEdit,
  onDelete,
  onPreview,
  onSend,
  onSubmitForApproval,
}) {
  const isRejected = template.status === "REJECTED";

  const actions = getTemplateActions(template, {
    onSend,
    onPreview,
    onEdit,
    onDelete,
    onSubmitForApproval,
  });

  return (
    <div className="flex h-full min-w-0 flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      {/* HEADER: icon, name + category, actions */}
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-100">
          <FileText size={20} className="text-green-600" />
        </div>

        <div className="min-w-0 flex-1">
          <h2
            className="truncate text-[15px] font-semibold text-slate-900"
            title={template.name}
          >
            {template.name}
          </h2>

          <p className="mt-0.5 truncate text-xs uppercase text-slate-500">
            {template.category}
          </p>
        </div>

        <RowActionsMenu
          ariaLabel={`Actions for ${template.name}`}
          items={actions}
          width={ACTIONS_MENU_WIDTH}
          buttonClassName="bg-slate-50"
        />
      </div>

      {/* STATUS */}
      <div className="mt-3">
        <StatusPill status={template.status} uppercase />
      </div>

      {/* CONTENT PREVIEW (2 lines) */}
      <p className="mt-3 line-clamp-2 whitespace-pre-line break-words text-sm leading-6 text-slate-600">
        {template.content}
      </p>

      {/* REJECTION REASON */}
      {isRejected && template.rejectionReason && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" />

          <p className="line-clamp-2 break-words text-xs text-red-600">
            <span className="font-semibold">Rejected by Meta: </span>
            {template.rejectionReason}
          </p>
        </div>
      )}

      {/* FOOTER pinned to the bottom so every card lines up */}
      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-xs">
          <span className="text-slate-400">
            {formatDate(template.createdAt)}
          </span>

          <button
            type="button"
            onClick={() => onPreview?.(template)}
            className="font-medium text-blue-600 hover:underline"
          >
            View ›
          </button>
        </div>
      </div>
    </div>
  );
}
