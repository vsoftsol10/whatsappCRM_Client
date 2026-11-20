import { useEffect, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { toast } from "react-hot-toast";

import { createSupportTicket } from "../../api/supportTicketApi";

const EMPTY_FORM = {
  title: "",
  description: "",
  priority: "",
};

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-2 focus:ring-green-100 disabled:bg-slate-100";

export default function RaiseSupportTicketModal({ open, onClose, onSuccess }) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);

  // Close with the Escape key
  useEffect(() => {
    if (!open) return undefined;

    const onKey = (e) => {
      if (e.key === "Escape" && !loading) onClose();
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, loading, onClose]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Please enter a ticket title.");
      return;
    }

    if (!formData.priority) {
      toast.error("Please select a priority.");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Please describe your issue.");
      return;
    }

    try {
      setLoading(true);

      const response = await createSupportTicket({
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
      });

      setFormData(EMPTY_FORM);
      onClose();

      toast.success(response.message || "Support ticket created successfully.");

      if (onSuccess) {
        onSuccess(response.ticket);
      }
    } catch (error) {
      console.error("Create support ticket error:", error);

      toast.error(
        error.response?.data?.message || "Failed to create support ticket."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={() => !loading && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="raise-ticket-title"
        className="max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h2
              id="raise-ticket-title"
              className="text-2xl font-bold text-slate-900"
            >
              Raise Support Ticket
            </h2>
            <p className="mt-1 text-base text-slate-500">
              Tell our support team about your issue
            </p>
          </div>

          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            disabled={loading}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Title */}
            <div>
              <label
                htmlFor="ticket-title"
                className="mb-2 block text-base font-medium text-slate-800"
              >
                Issue Title
              </label>
              <input
                id="ticket-title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Example: WhatsApp not connecting"
                disabled={loading}
                className={fieldClass}
              />
            </div>

            {/* Priority */}
            <div>
              <label
                htmlFor="ticket-priority"
                className="mb-2 block text-base font-medium text-slate-800"
              >
                Priority
              </label>
              <div className="relative">
                <select
                  id="ticket-priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  disabled={loading}
                  className={`${fieldClass} cursor-pointer appearance-none pr-11 ${
                    formData.priority ? "" : "text-slate-400"
                  }`}
                >
                  <option value="" disabled>
                    Select priority
                  </option>
                  {PRIORITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value} className="text-slate-800">
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={18}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="ticket-description"
              className="mb-2 block text-base font-medium text-slate-800"
            >
              Describe Your Issue
            </label>
            <textarea
              id="ticket-description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Please explain the problem you are facing..."
              rows={5}
              disabled={loading}
              className={`${fieldClass} resize-y`}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-200 bg-white px-8 py-3 text-base font-medium text-slate-800 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#1DC55E] px-8 py-3 text-base font-semibold text-white transition hover:bg-[#17a94f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Submitting..." : "Submit Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}