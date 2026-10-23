import { X, FileText } from "lucide-react";
// 👈 NEW
import { TemplateButtonsPreview } from "./TemplateButtonsEditor";

export default function TemplatePreviewModal({
  isOpen,
  onClose,
  template,
}) {
  if (!isOpen || !template) return null;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b bg-[#25D366] p-5 sm:p-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-xl bg-white p-3">
              <FileText
                className="text-[#25D366]"
                size={24}
              />
            </div>

            <div className="min-w-0">
              <h2 className="break-words text-xl font-bold sm:text-2xl">
                {template.name}
              </h2>

              <p className="text-sm text-gray-800">
                Template Preview
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-[#128C7E]"
          >
            <X size={22} />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[65vh] space-y-6 overflow-y-auto p-5 sm:p-6">

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <div>
              <p className="text-sm text-gray-500">
                Category
              </p>

              <p className="font-semibold">
                {template.category}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Message Type
              </p>

              <p className="font-semibold">
                {template.messageType}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Status
              </p>

              <span
                className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold ${
                  template.status === "ACTIVE"
                    ? "bg-green-100 text-green-700"
                    : template.status === "INACTIVE"
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {template.status}
              </span>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Created By
              </p>

              <p className="font-semibold">
                {template.createdBy?.name || "Admin"}
              </p>
            </div>

          </div>

          <div>
            <p className="text-sm text-gray-500 mb-2">
              Template Content
            </p>

            <div className="min-h-[180px] whitespace-pre-wrap break-words rounded-xl bg-[#DCF8C6] p-5 text-gray-700">
              {template.content}
 </div>

 {/* 👈 NEW: buttons */}
 <TemplateButtonsPreview buttons={template.buttons} />
 </div>

          <div className="border-t pt-4 text-sm text-gray-500">
            Created :
            {" "}
            {formatDate(template.createdAt)}
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end border-t p-5">
          <button
            onClick={onClose}
            className="crm-primary-button"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
