import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { X, Send, Loader2 } from "lucide-react";

import { getCustomers } from "../../api/customerApi";
import ServiceFilterChips, {
  matchesServiceFilter,
} from "../services/ServiceFilterChips";
import { getCampaignRecipients } from "../../api/campaignApi";
import useCampaignStore from "../../store/campaignStore";

export default function SendCampaignModal({
  isOpen,
  onClose,
  campaign,
}) {
  const { sendCampaign } = useCampaignStore();

  const [customers, setCustomers] = useState([]);
  const [selectedCustomers, setSelectedCustomers] = useState([]);

  // Customers who received this campaign before.
  // This is ONLY used to display "Already Sent".
  // It does NOT block selection.
  const [sentCustomers, setSentCustomers] = useState([]);

  const [search, setSearch] = useState("");

  // Service filter (empty = all customers)
  const [serviceFilter, setServiceFilter] = useState([]);

  const [loading, setLoading] = useState(false);

  // Always the latest onClose, so timers/listeners below don't restart
  // every time the page re-renders (it passes a new function each time).
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // ===========================
  // LOAD DATA
  // ===========================
  useEffect(() => {
    if (isOpen && campaign) {
      fetchCustomers();
      fetchSentCustomers();

      setSelectedCustomers([]);
      setSearch("");
      setServiceFilter([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, campaign]);

  // Escape closes, the page behind doesn't scroll
  useEffect(() => {
    if (!isOpen || !campaign) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape" && !loading) onCloseRef.current();
    };

    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, campaign, loading]);

  // ===========================
  // GET CUSTOMERS
  // ===========================
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
      console.log("Customers Error:", error);
      setCustomers([]);
    }
  };

  // ===========================
  // GET ALREADY SENT CUSTOMERS
  // ===========================
  const fetchSentCustomers = async () => {
    try {
      const response = await getCampaignRecipients(campaign.id);

      if (Array.isArray(response.data)) {
        const sentCustomerIds = response.data
          .filter((recipient) => recipient.status === "SENT")
          .map((recipient) => recipient.customerId);

        setSentCustomers(sentCustomerIds);
      } else {
        setSentCustomers([]);
      }
    } catch (error) {
      console.log("Recipients Error:", error);
      setSentCustomers([]);
    }
  };

  if (!isOpen || !campaign) return null;

  // ===========================
  // FILTER CUSTOMERS
  // ===========================
  const searchedCustomers = customers.filter((customer) => {
    const keyword = search.toLowerCase();

    return (
      customer.name?.toLowerCase().includes(keyword) ||
      customer.phone?.toLowerCase().includes(keyword)
    );
  });

  // Search result + service filter
  const filteredCustomers = searchedCustomers.filter((customer) =>
    matchesServiceFilter(customer, serviceFilter)
  );

  // ===========================
  // SELECT CUSTOMER
  // ===========================
  const toggleCustomer = (id) => {
    // IMPORTANT:
    // Do NOT block already-sent customers.
    // They can be selected and sent again.
    setSelectedCustomers((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  // Select ALL customers shown, including
  // customers who were already sent this campaign.
  const handleSelectAll = () => {
    setSelectedCustomers(filteredCustomers.map((customer) => customer.id));
  };

  const handleClearAll = () => {
    setSelectedCustomers([]);
  };

  // ===========================
  // SEND CAMPAIGN
  // ===========================
  const handleSend = async () => {
    if (selectedCustomers.length === 0) {
      return toast.error("Please select at least one customer.");
    }

    try {
      setLoading(true);

      await sendCampaign(campaign.id, selectedCustomers);

      // Refresh "Already Sent" status after sending.
      await fetchSentCustomers();

      // Clear selection.
      setSelectedCustomers([]);

      // Show a toast (same as the other modules) and close the drawer
      toast.success("Campaign sent successfully!");
      onClose();
    } catch (error) {
      console.log("Campaign Send Error:", error);

      toast.error(
        error?.response?.data?.message || "Unable to send campaign."
      );
    } finally {
      setLoading(false);
    }
  };

  // ===========================
  // UI (right-side drawer)
  // ===========================
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* BACKDROP */}
      <div
        aria-hidden="true"
        onClick={() => !loading && onClose()}
        className="crm-fade-in absolute inset-0 bg-slate-900/40"
      />

      {/* PANEL */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-campaign-title"
        className="crm-drawer-in relative flex h-full w-full flex-col bg-white shadow-2xl sm:w-[520px]"
      >
        {/* HEADER */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h2
              id="send-campaign-title"
              className="text-lg font-semibold text-slate-900"
            >
              Send Campaign
            </h2>

            <p className="mt-0.5 truncate text-xs text-slate-500">
              {campaign.name}
            </p>
          </div>

          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            disabled={loading}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        {/* SEARCH + FILTER */}
        <div className="px-5 pt-5">
          {/* Filter customers by service (dropdown, hidden when the company has no services) */}
          <ServiceFilterChips
            customers={customers}
            value={serviceFilter}
            onChange={setServiceFilter}
            disabled={false}
            variant="dropdown"
          />

          <input
            type="text"
            aria-label="Search customer"
            placeholder="Search Customer"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-2 focus:ring-green-100"
          />

          {/* selection helpers */}
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-600">
              Selected: {selectedCustomers.length}
            </span>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleSelectAll}
                disabled={filteredCustomers.length === 0}
                className="font-medium text-green-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
              >
                Select All
              </button>

              <button
                type="button"
                onClick={handleClearAll}
                disabled={selectedCustomers.length === 0}
                className="font-medium text-slate-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* CUSTOMER LIST */}
        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {filteredCustomers.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">
              No Customers Found
            </div>
          ) : (
            filteredCustomers.map((customer) => {
              // ONLY for displaying the "Already Sent" label.
              const alreadySent = sentCustomers.includes(customer.id);

              const selected = selectedCustomers.includes(customer.id);

              return (
                <div
                  key={customer.id}
                  onClick={() => toggleCustomer(customer.id)}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-4 transition ${
                    selected
                      ? "border-green-500 bg-green-50/50 ring-1 ring-green-500"
                      : "border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {/* CUSTOMER INFORMATION */}
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-medium text-slate-900">
                      {customer.name}
                    </h3>

                    <p className="mt-0.5 text-sm text-slate-600">
                      {customer.phone}
                    </p>

                    {alreadySent && (
                      <span className="mt-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                        ✓ Already Sent
                      </span>
                    )}
                  </div>

                  {/* CHECKBOX (never disabled: sent customers can be re-sent) */}
                  <input
                    type="checkbox"
                    aria-label={`Select ${customer.name}`}
                    checked={selected}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => toggleCustomer(customer.id)}
                    className="h-5 w-5 shrink-0 cursor-pointer accent-green-600"
                  />
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-10 rounded-xl border border-slate-300 bg-white px-5 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSend}
            disabled={loading || selectedCustomers.length === 0}
            className="inline-flex h-10 min-w-[150px] items-center justify-center gap-2 rounded-xl bg-green-600 px-5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send size={16} />
                Send templates
              </>
            )}
          </button>
        </div>
      </aside>
    </div>
  );
}