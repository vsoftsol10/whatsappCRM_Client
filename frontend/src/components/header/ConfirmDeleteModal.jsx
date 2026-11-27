import { useEffect } from "react";
import { createPortal } from "react-dom";
import { FaTrash } from "react-icons/fa";

// Responsive confirmation popup used by the "Delete all" notifications
// action. Rendered through a portal into <body> so it always sits above
// the sidebar / header (their stacking contexts can't hide it).
function ConfirmDeleteModal({
  isOpen,
  title = "Delete all notifications?",
  message = "All your notifications will be permanently removed. This cannot be undone.",
  confirmLabel = "Delete all",
  loading = false,
  error = "",
  onConfirm,
  onCancel,
}) {
  // Esc closes the popup (unless a delete is in progress)
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !loading) {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        // click on the dark backdrop (not the card) cancels
        if (event.target === event.currentTarget && !loading) {
          onCancel();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl sm:max-w-md sm:p-6"
      >
        <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:gap-4 sm:text-left">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
            <FaTrash className="text-red-500" size={18} />
          </div>

          <div className="mt-3 min-w-0 sm:mt-0">
            <h3
              id="confirm-delete-title"
              className="text-base font-semibold text-gray-900 sm:text-lg"
            >
              {title}
            </h3>

            <p className="mt-1.5 text-sm text-gray-600">{message}</p>

            {error && (
              <p className="mt-2 text-sm font-medium text-red-600">{error}</p>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:mt-6 sm:flex-row sm:justify-end sm:gap-3">
          <button
            type="button"
            autoFocus
            onClick={onCancel}
            disabled={loading}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="w-full rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {loading ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ConfirmDeleteModal;