
import { useState } from "react";
import { X, Ticket, Send } from "lucide-react";
import { toast } from "react-hot-toast";
import { createSupportTicket } from "../../api/supportTicketApi";

export default function RaiseSupportTicketModal({
  open,
  onClose,
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
  });

  const [loading, setLoading] = useState(false);

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

      toast.success(
        response.message || "Support ticket created successfully."
      );

      setFormData({
        title: "",
        description: "",
        priority: "MEDIUM",
      });

      onClose();

      if (onSuccess) {
        onSuccess(response.ticket);
      }
    } catch (error) {
      console.error("Create support ticket error:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to create support ticket."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-600">
              <Ticket size={22} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Raise Support Ticket
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Tell our support team about your issue.
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>

        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>

          <div className="space-y-5 p-6">

            {/* Title */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Issue Title
              </label>

              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Example: WhatsApp not connecting"
                disabled={loading}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 disabled:bg-slate-100"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Priority
              </label>

              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                disabled={loading}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 disabled:bg-slate-100"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Describe Your Issue
              </label>

              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Please explain the problem you are facing..."
                rows={5}
                disabled={loading}
                className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 disabled:bg-slate-100"
              />
            </div>

          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1ebe5d] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send size={17} />

              {loading ? "Submitting..." : "Submit Ticket"}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}

