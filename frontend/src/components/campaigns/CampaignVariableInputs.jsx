import { fillTemplatePreview } from "../../utils/templateVariables";

// One input per template variable ({{1}}, {{2}}, {{3}}...) for a campaign.
// Each variable can be the customer's name, the customer's company,
// or a custom value that is the same for every customer.

export default function CampaignVariableInputs({
  content,
  numbers,
  configs,
  onChange,
  disabled = false,
}) {
  if (!numbers || numbers.length === 0) return null;

  return (
    <div>
      <label className="mb-2 block font-medium text-gray-700">
        Template Variables
      </label>

      <p className="mb-3 text-xs text-gray-500">
        Choose what goes into each variable. Name and company are filled
        separately for every customer.
      </p>

      {numbers.map((number) => {
        const config = configs[number] || { source: "custom", value: "" };

        return (
          <div key={number} className="mb-3 flex items-center gap-2">
            <span className="w-12 text-sm font-medium text-gray-600">
              {`{{${number}}}`}
            </span>

            <select
              value={config.source}
              disabled={disabled}
              onChange={(e) => onChange(number, { source: e.target.value })}
              className="rounded-lg border border-gray-300 bg-white p-2 text-sm outline-none focus:border-[#25D366] disabled:bg-gray-100"
            >
              <option value="name">Customer name</option>
              <option value="company">Customer company</option>
              <option value="custom">Custom value</option>
            </select>

            {config.source === "custom" ? (
              <input
                type="text"
                value={config.value}
                disabled={disabled}
                onChange={(e) => onChange(number, { value: e.target.value })}
                placeholder="Enter value"
                className="flex-1 rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-[#25D366] disabled:bg-gray-100"
              />
            ) : (
              <span className="flex-1 text-sm text-gray-500">
                Filled for each customer
              </span>
            )}
          </div>
        );
      })}

      <div className="mt-3 rounded-xl border bg-gray-50 p-3">
        <p className="mb-1 text-xs text-gray-500">Preview</p>

        <p className="whitespace-pre-wrap text-sm">
          {fillTemplatePreview(content, configs)}
        </p>
      </div>
    </div>
  );
}
