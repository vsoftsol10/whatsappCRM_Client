

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { X, Send, Loader2 } from "lucide-react";

import { getCustomers } from "../../api/customerApi";
import ServiceFilterChips, {
  matchesServiceFilter,
} from "../services/ServiceFilterChips";
import { getTemplateRecipients } from "../../api/templateApi";
import useTemplateStore from "../../store/templateStore";

// ============================================================
// 👈 NEW: TEMPLATE VARIABLE HELPERS
// ============================================================

// Distinct variable numbers in the template body, e.g. [1, 2]
const getVariableNumbers = (content) => {
  const numbers = [
    ...String(content || "").matchAll(/\{\{\s*(\d+)\s*\}\}/g),
  ].map((match) => Number(match[1]));

  return [...new Set(numbers)].sort((a, b) => a - b);
};

// Default for each variable: {{1}} = customer name,
// {{2}} = customer company, anything else = custom value.
const buildDefaultVariableConfigs = (content) => {
  const configs = {};

  getVariableNumbers(content).forEach((number) => {
    configs[number] = {
      source:
        number === 1 ? "name" : number === 2 ? "company" : "custom",
      value: "",
    };
  });

  return configs;
};

// Resolve one variable for one customer (used for the live preview)
const resolvePreviewValue = (config, customer) => {
  if (!config) return "";

  if (config.source === "name") return customer?.name || "[Customer Name]";

  if (config.source === "company")
    return customer ? customer.companyName?.trim() || "-" : "[Customer Company]";

  return config.value?.trim() || "";
};

export default function SendTemplateModal({
  isOpen,
  onClose,
  template,
}) {
  const { sendTemplate } = useTemplateStore();

  // 👈 NEW: how each {{n}} is filled, e.g. { 1: { source: "name", value: "" } }
  const [variableConfigs, setVariableConfigs] = useState({});

  // 👈 NEW: "variables" (step 1) -> "customers" (step 2)
  const [step, setStep] = useState("customers");

  const [customers, setCustomers] = useState([]);
  const [selectedCustomers, setSelectedCustomers] =
    useState([]);

  const [sentCustomers, setSentCustomers] = useState([]);

  const [search, setSearch] = useState("");

  // Service filter (empty = all customers)
  const [serviceFilter, setServiceFilter] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("sentCustomers Updated:", sentCustomers);
  }, [sentCustomers]);

  useEffect(() => {
    if (!isOpen || !template) return;

    const loadData = () => {
      fetchCustomers();
      fetchTemplateHistory();

      setSelectedCustomers([]);
      setSearch("");
      setVariableConfigs(buildDefaultVariableConfigs(template.content)); // 👈 NEW
      // Templates with variables start on the variables step
      setStep(
        getVariableNumbers(template.content).length > 0
          ? "variables"
          : "customers"
      ); // 👈 NEW
    };

    loadData();
  }, [isOpen, template]);

  // const fetchTemplateHistory = async () => {
  //   try {
  //     const response = await getTemplateById(template.id);

  //     console.log("Template API Response:", response.data);

  //     const recipients = response.data.recipients || [];

  //     //console.log("Recipients:", recipients);

  //     const ids = recipients.map(
  //       (item) => item.customerId
  //     );

  //     //console.log("Sent Customer IDs:", ids);

  //     setSentCustomers(ids);
  //   } catch (err) {
  //     console.error(err);
  //     setSentCustomers([]);
  //   }
  // };

  const fetchTemplateHistory = async () => {
    try {

      const response =
        await getTemplateRecipients(template.id);

      setSentCustomers(response.data);

    } catch (err) {

      console.error(err);

      setSentCustomers([]);

    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await getCustomers();

      if (Array.isArray(response)) {
        setCustomers(response);
      } else if (Array.isArray(response.customers)) {
        setCustomers(response.customers);
      } else if (Array.isArray(response.data)) {
        setCustomers(response.data);
      } else {
        setCustomers([]);
      }
    } catch (error) {
      console.log(error);
      setCustomers([]);
    }
  };

  if (!isOpen || !template) return null;

  // 👈 NEW: variables of this template + whether all are filled
  const variableNumbers = getVariableNumbers(template.content);

  const missingVariable = variableNumbers.some((number) => {
    const config = variableConfigs[number];

    return (
      !config ||
      (config.source === "custom" && !config.value?.trim())
    );
  });

  const updateVariableConfig = (number, changes) => {
    setVariableConfigs((prev) => ({
      ...prev,
      [number]: { ...prev[number], ...changes },
    }));
  };

  const searchedCustomers = customers.filter(
    (customer) => {
      const keyword = search.toLowerCase();

      return (
        customer.name
          ?.toLowerCase()
          .includes(keyword) ||
        customer.phone
          ?.toLowerCase()
          .includes(keyword)
      );
    }
  );

  // Search result + service filter
  const filteredCustomers = searchedCustomers.filter((customer) =>
    matchesServiceFilter(customer, serviceFilter)
  );

  // 👈 NEW: live preview using the first selected customer
  const previewCustomer = customers.find(
    (c) => c.id === selectedCustomers[0]
  );

  const previewText = String(template.content || "").replace(
    /\{\{\s*(\d+)\s*\}\}/g,
    (full, number) =>
      resolvePreviewValue(variableConfigs[Number(number)], previewCustomer) ||
      full
  );

  const toggleCustomer = (id) => {
    if (selectedCustomers.includes(id)) {
      setSelectedCustomers((prev) =>
        prev.filter((item) => item !== id)
      );
    } else {
      setSelectedCustomers((prev) => [
        ...prev,
        id,
      ]);
    }
  };

  const handleSelectAll = () => {

    // console.log("Filtered Customers:", filteredCustomers);
    // console.log("Sent Customers:", sentCustomers);

    const availableCustomers = filteredCustomers
      .filter(
        (customer) =>
          !sentCustomers.includes(customer.id)
      )
      .map((customer) => customer.id);

    setSelectedCustomers(availableCustomers);
  };

  const handleClearAll = () => {
    setSelectedCustomers([]);
  };

 const handleSend = async () => {
  if (selectedCustomers.length === 0) {
    return toast.error(
      "Please select at least one customer."
    );
  }

  // 👈 NEW: every {{n}} needs a value
  if (missingVariable) {
    return toast.error(
      "Please fill all template variable values."
    );
  }

  try {
    setLoading(true);

    const variableValues = variableNumbers.map((number) => ({
      index: number,
      source: variableConfigs[number].source,
      value: variableConfigs[number].value,
    }));

    const response =
      await sendTemplate(
        template.id,
        selectedCustomers,
        variableValues // 👈 NEW
      );

    // ✅ Update the sent customers list immediately
    setSentCustomers((prev) => [
      ...new Set([...prev, ...selectedCustomers]),
    ]);

    setSelectedCustomers([]);

    onClose();

    // Success message (shown AFTER the popup is closed)
    toast.success(
      response.message ||
        "Template sent successfully."
    );
  } catch (error) {
    console.log(error);

    toast.error(
      error?.response?.data?.message ||
        "Failed to send template."
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col">

        {/* HEADER */}

        <div className="border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">
              Send Template
            </h2>

            <p className="text-gray-500 text-sm mt-1">
              {template.name}
              {variableNumbers.length > 0 &&
                ` · Step ${step === "variables" ? 1 : 2} of 2`}
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
          >
            <X />
          </button>
        </div>

        {step === "variables" ? (
          <>
            {/* STEP 1: TEMPLATE VARIABLES 👈 NEW */}

            <div className="flex-1 overflow-y-auto p-5">
              <h3 className="font-semibold mb-3">
                Fill Template Variables
              </h3>

              {variableNumbers.map((number) => {
                const config = variableConfigs[number] || {
                  source: "custom",
                  value: "",
                };

                return (
                  <div
                    key={number}
                    className="flex items-center gap-2 mb-3"
                  >
                    <span className="w-12 text-sm font-medium text-gray-600">
                      {`{{${number}}}`}
                    </span>

                    <select
                      value={config.source}
                      onChange={(e) =>
                        updateVariableConfig(number, {
                          source: e.target.value,
                        })
                      }
                      className="border rounded-lg p-2 text-sm bg-white"
                    >
                      <option value="name">Customer name</option>
                      <option value="company">Customer company</option>
                      <option value="custom">Custom value</option>
                    </select>

                    {config.source === "custom" ? (
                      <input
                        type="text"
                        placeholder="Enter value"
                        value={config.value}
                        onChange={(e) =>
                          updateVariableConfig(number, {
                            value: e.target.value,
                          })
                        }
                        className="flex-1 border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
                      />
                    ) : (
                      <span className="flex-1 text-sm text-gray-500">
                        Filled for each customer
                      </span>
                    )}
                  </div>
                );
              })}

              <div className="mt-4 rounded-xl bg-gray-50 border p-3">
                <p className="text-xs text-gray-500 mb-1">
                  Preview
                </p>

                <p className="text-sm whitespace-pre-wrap">
                  {previewText}
                </p>
              </div>
            </div>

            <div className="border-t p-5 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="border rounded-xl px-5 py-2"
              >
                Cancel
              </button>

              <button
                onClick={() => setStep("customers")}
                disabled={missingVariable}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-xl px-6 py-2"
              >
                Next: Select Customers
              </button>
            </div>
          </>
        ) : (
          <>
            {/* STEP 2: SELECT CUSTOMERS */}

            {/* SEARCH */}

            <div className="p-5">
              {/* Filter customers by service (hidden when the company has no services) */}
              <ServiceFilterChips
                customers={customers}
                value={serviceFilter}
                onChange={setServiceFilter}
                disabled={false}
              />

              <input
                type="text"
                placeholder="Search customer..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-green-500"
              />

              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700"
                >
                  Select All
                </button>

                <button
                  onClick={handleClearAll}
                  className="px-3 py-2 text-sm rounded-lg border"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* CUSTOMER LIST */}

            <div className="flex-1 overflow-y-auto px-5">

              {filteredCustomers.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  No Customers Found
                </div>
              ) : (
                filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="flex justify-between items-center border rounded-xl p-4 mb-3 hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold">
                        {customer.name}
                      </h3>

                      <p className="text-sm text-gray-500">
                        {customer.phone}
                      </p>

                      {sentCustomers.includes(customer.id) && (
                        <span className="inline-block mt-2 bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                          ✓ Already Sent
                        </span>
                      )}
                    </div>

                    <input
                      type="checkbox"
                      disabled={sentCustomers.includes(customer.id)}
                      checked={selectedCustomers.includes(customer.id)}
                      onChange={() => toggleCustomer(customer.id)}
                      className="w-5 h-5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                ))
              )}

            </div>

            {/* FOOTER */}

            <div className="border-t p-5 flex justify-between items-center">

              <span className="text-gray-600 font-medium">
                Selected : {selectedCustomers.length}
              </span>

              <div className="flex gap-3">

                {/* 👈 NEW: go back and change the variable values */}
                {variableNumbers.length > 0 && (
                  <button
                    onClick={() => setStep("variables")}
                    disabled={loading}
                    className="border rounded-xl px-5 py-2"
                  >
                    Back
                  </button>
                )}

                <button
                  onClick={onClose}
                  disabled={loading}
                  className="border rounded-xl px-5 py-2"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSend}
                  disabled={
                    loading ||
                    selectedCustomers.length === 0 ||
                    missingVariable
                  }
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-xl px-6 py-2 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Send Template
                    </>
                  )}
                </button>

              </div>

            </div>
          </>
        )}

      </div>
    </div>
  );
}