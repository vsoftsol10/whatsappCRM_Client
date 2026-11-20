import { fillTemplatePreview } from "../../utils/templateVariables";

// One input per template variable ({{1}}, {{2}}, {{3}}...) for a campaign.
// Each variable can be the customer's name, the customer's company,
// or a custom value that is the same for every customer.

const controlClass =
  "h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-2 focus:ring-green-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-600";

export default function CampaignVariableInputs({
  content,
  numbers,
  configs,
  onChange,
  disabled = false,
}) {
  if (!numbers || numbers.length === 0) return null;

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
      <p className="text-sm font-medium text-slate-800">Template Variables</p>

      <p className="mt-1 text-xs text-slate-500">
        Choose what goes into each variable. Name and company are filled
        separately for every customer.
      </p>

      <div className="mt-3 space-y-2.5">
        {numbers.map((number) => {
          const config = configs[number] || { source: "custom", value: "" };

          return (
            <div key={number} className="flex items-center gap-2">
              <span className="w-11 shrink-0 text-xs font-semibold text-slate-600">
                {`{{${number}}}`}
              </span>

              <select
                aria-label={`Source for {{${number}}}`}
                value={config.source}
                disabled={disabled}
                onChange={(e) => onChange(number, { source: e.target.value })}
                className={`${controlClass} w-36 shrink-0`}
              >
                <option value="name">Customer name</option>
                <option value="company">Customer company</option>
                <option value="custom">Custom value</option>
              </select>

              {config.source === "custom" ? (
                <input
                  type="text"
                  aria-label={`Value for {{${number}}}`}
                  value={config.value}
                  disabled={disabled}
                  onChange={(e) => onChange(number, { value: e.target.value })}
                  placeholder="Enter value"
                  className={`${controlClass} min-w-0 flex-1`}
                />
              ) : (
                <span className="min-w-0 flex-1 text-xs text-slate-500">
                  Filled for each customer
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
        <p className="mb-1 text-xs text-slate-500">Preview</p>

        <p className="whitespace-pre-wrap text-sm text-slate-700">
          {fillTemplatePreview(content, configs)}
        </p>
      </div>
    </div>
  );
}
