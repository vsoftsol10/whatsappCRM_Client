import RowActionsMenu from "../common/RowActionsMenu";
import { StatusPill } from "./templateUi";
import {
  formatCategory,
  formatLanguage,
  getTemplateActions,
  ACTIONS_MENU_WIDTH,
} from "./templateHelpers";

const TH = "px-5 py-3.5 text-left text-xs font-semibold text-green-900";

export default function TemplateTable({
  templates = [],
  onEdit,
  onDelete,
  onPreview,
  onSend,
  onSubmitForApproval,
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="bg-green-100/70">
              <th className={TH}>Name</th>
              <th className={TH}>Category</th>
              <th className={TH}>Language</th>
              <th className={TH}>Status</th>
              <th className={`${TH} text-center uppercase`}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {templates.map((template) => (
              <tr
                key={template.id}
                className="border-t border-slate-100 transition hover:bg-slate-50/70"
              >
                <td className="max-w-[260px] px-5 py-4">
                  <button
                    type="button"
                    onClick={() => onPreview?.(template)}
                    title={template.name}
                    className="block max-w-full truncate text-left text-slate-800 hover:text-green-700"
                  >
                    {template.name}
                  </button>
                </td>

                <td className="px-5 py-4 text-slate-700">
                  {formatCategory(template.category)}
                </td>

                <td className="px-5 py-4 text-slate-700">
                  {formatLanguage(template.language)}
                </td>

                <td className="px-5 py-4">
                  <StatusPill status={template.status} />
                </td>

                <td className="px-5 py-2.5">
                  <div className="flex justify-center">
                    <RowActionsMenu
                      ariaLabel={`Actions for ${template.name}`}
                      items={getTemplateActions(template, {
                        onSend,
                        onPreview,
                        onEdit,
                        onDelete,
                        onSubmitForApproval,
                      })}
                      width={ACTIONS_MENU_WIDTH}
                      buttonClassName="bg-slate-50"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
