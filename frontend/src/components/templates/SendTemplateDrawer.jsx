import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  X,
  Send,
  Loader2,
  ChevronDown,
} from "lucide-react";

import { getCustomers } from "../../api/customerApi";
import ServiceFilterChips, {
  matchesServiceFilter,
} from "../services/ServiceFilterChips";
import { getTemplateRecipients } from "../../api/templateApi";
import useTemplateStore from "../../store/templateStore";

/**
 * Send Template - right-side drawer (same look as the Create / Edit / View
 * template drawer).
 *
 * It is ONE page now (no "Next" step):
 *   1. Template variables   (only when the template has {{1}}, {{2}} ...)
 *   2. Message preview
 *   3. Select customers
 * and a footer with  Selected : N  +  Cancel / Send Template.
 *
 * After sending, the drawer closes by itself and a toast shows the result
 * (no separate confirmation screen).
 *
 * Same props as the old SendTemplateModal:
 *   isOpen, onClose, template
 */

// ------------------------------------------------------------
// Helpers (unchanged logic)
// ------------------------------------------------------------

const getVariableNumbers = (content) => {
  const numbers = [
    ...String(content || "").matchAll(/\{\{\s*(\d+)\s*\}\}/g),
  ].map((match) => Number(match[1]));

  return [...new Set(numbers)].sort((a, b) => a - b);
};

const buildDefaultVariableConfigs = (content) => {
  const configs = {};

  getVariableNumbers(content).forEach((number) => {
    configs[number] = {
      source: number === 1 ? "name" : number === 2 ? "company" : "custom",
      value: "",
    };
  });

  return configs;
};

const resolvePreviewValue = (config, customer) => {
  if (!config) return "";

  if (config.source === "name") return customer?.name || "[Customer Name]";

  if (config.source === "company")
    return customer ? customer.companyName?.trim() || "-" : "[Customer Company]";

  return config.value?.trim() || "";
};

// ------------------------------------------------------------
// Styles (same as the template drawer)
// ------------------------------------------------------------

const inputBase =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-2 focus:ring-green-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-600";

const sectionTitle = "text-base font-semibold text-slate-900";

const outlineButton =
  "h-10 rounded-xl border border-slate-300 bg-white px-5 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

const primaryButton =
  "inline-flex h-10 min-w-[132px] items-center justify-center gap-2 rounded-xl bg-green-600 px-5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60";

export default function SendTemplateDrawer({ isOpen, onClose, template }) {
  const { sendTemplate } = useTemplateStore();

  const [variableConfigs, setVariableConfigs] = useState({});

  const [customers, setCustomers] = useState([]);
  const [selectedCustomers, setSelectedCustomers] = useState([]);

  // customers who already received this template
  const [sentCustomers, setSentCustomers] = useState([]);

  const [search, setSearch] = useState("");

  const [serviceFilter, setServiceFilter] = useState([]);
  const [loading, setLoading] = useState(false);

  // ------------------------------------------------------------
  // Load data each time the drawer opens for a template
  // ------------------------------------------------------------
  useEffect(() => {
    if (!isOpen || !template) return;

    const loadData = () => {
      fetchCustomers();
      fetchTemplateHistory();

      setSelectedCustomers([]);
      setSearch("");
      setVariableConfigs(buildDefaultVariableConfigs(template.content));
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, template]);

  // Esc closes the drawer, and the page behind it does not scroll
  useEffect(() => {
    if (!isOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape" && !loading) onClose();
    };

    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, loading, onClose]);

  const fetchTemplateHistory = async () => {
    try {
      const response = await getTemplateRecipients(template.id);

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

  // ------------------------------------------------------------
  // Derived values (unchanged logic)
  // ------------------------------------------------------------
  const variableNumbers = getVariableNumbers(template.content);

  const missingVariable = variableNumbers.some((number) => {
    const config = variableConfigs[number];

    return (
      !config || (config.source === "custom" && !config.value?.trim())
    );
  });

  const updateVariableConfig = (number, changes) => {
    setVariableConfigs((prev) => ({
      ...prev,
      [number]: { ...prev[number], ...changes },
    }));
  };

  const searchedCustomers = customers.filter((customer) => {
    const keyword = search.toLowerCase();

    return (
      customer.name?.toLowerCase().includes(keyword) ||
      customer.phone?.toLowerCase().includes(keyword)
    );
  });

  const filteredCustomers = searchedCustomers.filter((customer) =>
    matchesServiceFilter(customer, serviceFilter)
  );

  // The preview uses the first selected customer (if any)
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
      setSelectedCustomers((prev) => prev.filter((item) => item !== id));
    } else {
      setSelectedCustomers((prev) => [...prev, id]);
    }
  };

  const handleSelectAll = () => {
    // Customers who already received this template are skipped
    const availableCustomers = filteredCustomers
      .filter((customer) => !sentCustomers.includes(customer.id))
      .map((customer) => customer.id);

    setSelectedCustomers(availableCustomers);
  };

  const handleClearAll = () => {
    setSelectedCustomers([]);
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  const handleSend = async () => {
    if (selectedCustomers.length === 0) {
      return toast.error("Please select at least one customer.");
    }

    if (missingVariable) {
      return toast.error("Please fill all template variable values.");
    }

    try {
      setLoading(true);

      const variableValues = variableNumbers.map((number) => ({
        index: number,
        source: variableConfigs[number].source,
        value: variableConfigs[number].value,
      }));

      const response = await sendTemplate(
        template.id,
        selectedCustomers,
        variableValues
      );

      setSentCustomers((prev) => [
        ...new Set([...prev, ...selectedCustomers]),
      ]);

      setSelectedCustomers([]);

      const summary = response?.summary;

      const total = summary?.total ?? selectedCustomers.length;
      const successful = summary?.successful ?? selectedCustomers.length;
      const failed = summary?.failed ?? 0;

      // Close the drawer first, then tell the user what happened
      onClose();

      if (failed === 0) {
        toast.success("Template sent successfully!");
      } else if (successful === 0) {
        toast.error(
          "Template could not be sent. Check the customers' WhatsApp numbers and try again."
        );
      } else {
        toast(
          `Sent to ${successful} of ${total} customers. ${failed} customer${
            failed === 1 ? "" : "s"
          } did not receive the message.`,
          { icon: "⚠️" }
        );
      }
    } catch (error) {
      console.log(error);

      toast.error(
        error?.response?.data?.message || "Failed to send template."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* BACKDROP */}
      <div
        aria-hidden="true"
        onClick={handleClose}
        className="crm-fade-in absolute inset-0 bg-slate-900/40"
      />

      {/* PANEL */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-template-drawer-title"
        className="crm-drawer-in relative flex h-full w-full flex-col bg-white shadow-2xl sm:w-[480px]"
      >
        {/* HEADER */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h2
              id="send-template-drawer-title"
              className="text-base font-semibold text-slate-900"
            >
              Send Template
            </h2>

            <p className="mt-0.5 truncate text-xs text-slate-500">
              {template.name}
            </p>
          </div>

          <button
            type="button"
            aria-label="Close"
            onClick={handleClose}
            disabled={loading}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        <>
            {/* SCROLLING BODY - everything on one page */}
            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
              {/* TEMPLATE VARIABLES (only if the template has any) */}
              {variableNumbers.length > 0 && (
                <section>
                  <h3 className={`${sectionTitle} mb-3`}>
                    Fill Template Variables
                  </h3>

                  <div className="space-y-3">
                    {variableNumbers.map((number) => {
                      const config = variableConfigs[number] || {
                        source: "custom",
                        value: "",
                      };

                      return (
                        <div key={number} className="flex items-center gap-2">
                          <span className="w-11 shrink-0 text-sm font-medium text-slate-600">
                            {`{{${number}}}`}
                          </span>

                          <div className="relative w-40 shrink-0">
                            <select
                              value={config.source}
                              disabled={loading}
                              onChange={(e) =>
                                updateVariableConfig(number, {
                                  source: e.target.value,
                                })
                              }
                              className={`${inputBase} h-11 appearance-none pr-9`}
                            >
                              <option value="name">Customer name</option>
                              <option value="company">
                                Customer company
                              </option>
                              <option value="custom">Custom value</option>
                            </select>

                            <ChevronDown
                              size={16}
                              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                            />
                          </div>

                          {config.source === "custom" ? (
                            <input
                              type="text"
                              placeholder="Enter value"
                              value={config.value}
                              disabled={loading}
                              onChange={(e) =>
                                updateVariableConfig(number, {
                                  value: e.target.value,
                                })
                              }
                              className={`${inputBase} h-11 min-w-0 flex-1`}
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

                  {missingVariable && (
                    <p className="mt-2 text-xs text-amber-600">
                      Fill all custom variable values to send the template.
                    </p>
                  )}
                </section>
              )}

              {/* PREVIEW */}
              <section>
                <h3 className={`${sectionTitle} mb-3`}>Preview</h3>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <p className="whitespace-pre-wrap break-words text-sm text-slate-800">
                    {previewText}
                  </p>
                </div>
              </section>

              {/* SELECT CUSTOMERS */}
              <section>
                <h3 className={`${sectionTitle} mb-3`}>Select Customers</h3>

                {/* Filter customers by service (hidden when the company has no services) */}
                <ServiceFilterChips
                  customers={customers}
                  value={serviceFilter}
                  onChange={setServiceFilter}
                  disabled={false}
                  variant="dropdown"
                />

                <input
                  type="text"
                  placeholder="Search customer..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`${inputBase} h-11`}
                />

                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="h-9 rounded-lg bg-green-600 px-3.5 text-sm font-medium text-white transition hover:bg-green-700"
                  >
                    Select All
                  </button>

                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="h-9 rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Clear All
                  </button>
                </div>

                {/* CUSTOMER LIST */}
                <div className="mt-3 max-h-[360px] space-y-2.5 overflow-y-auto pr-1">
                  {filteredCustomers.length === 0 ? (
                    <div className="py-10 text-center text-sm text-slate-500">
                      No Customers Found
                    </div>
                  ) : (
                    filteredCustomers.map((customer) => {
                      const alreadySent = sentCustomers.includes(customer.id);

                      return (
                        <label
                          key={customer.id}
                          className={`flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3.5 transition ${
                            alreadySent
                              ? "cursor-not-allowed bg-slate-50/60"
                              : "cursor-pointer hover:bg-slate-50"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <h4 className="truncate text-sm font-semibold text-slate-900">
                              {customer.name}
                            </h4>

                            <p className="text-xs text-slate-500">
                              {customer.phone}
                            </p>

                            {alreadySent && (
                              <span className="mt-1.5 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                                ✓ Already Sent
                              </span>
                            )}
                          </div>

                          <input
                            type="checkbox"
                            disabled={alreadySent}
                            checked={selectedCustomers.includes(customer.id)}
                            onChange={() => toggleCustomer(customer.id)}
                            className="h-5 w-5 shrink-0 cursor-pointer accent-green-600 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </label>
                      );
                    })
                  )}
                </div>
              </section>
            </div>

            {/* FOOTER ACTIONS */}
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
              <span className="text-sm font-medium text-slate-600">
                Selected : {selectedCustomers.length}
              </span>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className={outlineButton}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSend}
                  disabled={
                    loading ||
                    selectedCustomers.length === 0 ||
                    missingVariable
                  }
                  className={primaryButton}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Send Template
                    </>
                  )}
                </button>
              </div>
            </div>
        </>
      </aside>
    </div>
  );
}