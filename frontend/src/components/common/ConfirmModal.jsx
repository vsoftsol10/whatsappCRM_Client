import { FiAlertTriangle } from "react-icons/fi";


function ConfirmModal({
  isOpen,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  const confirmButtonClass =
    variant === "danger"
      ? "bg-red-500 hover:bg-red-600"
      : "bg-[#25D366] hover:bg-[#128C7E]";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex flex-col items-center gap-4 px-6 py-7 text-center">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-full ${
              variant === "danger" ? "bg-red-100" : "bg-green-100"
            }`}
          >
            <FiAlertTriangle
              size={26}
              className={
                variant === "danger" ? "text-red-500" : "text-[#25D366]"
              }
            />
          </div>

          <h2 className="text-lg font-bold text-gray-900">{title}</h2>

          <p className="text-sm text-gray-600">{message}</p>
        </div>

        <div className="flex gap-3 border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 rounded-lg px-4 py-2.5 font-semibold text-white transition ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;