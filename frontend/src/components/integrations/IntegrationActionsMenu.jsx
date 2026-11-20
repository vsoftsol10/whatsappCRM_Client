import { useEffect, useRef, useState } from "react";
import { Eye, MoreVertical, Power, Trash2 } from "lucide-react";

const MENU_WIDTH = 176;
const MENU_HEIGHT = 150;

// Three-dot menu used by both the card view and the table view.
// The menu is `fixed` so it is never clipped by a scrolling table.
const IntegrationActionsMenu = ({
  integration,
  onView,
  onToggleStatus,
  onDelete,
}) => {
  const [position, setPosition] = useState(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const isActive = integration.status === "ACTIVE";
  const open = Boolean(position);

  useEffect(() => {
    if (!open) return undefined;

    const close = () => setPosition(null);

    const onMouseDown = (e) => {
      if (
        menuRef.current?.contains(e.target) ||
        buttonRef.current?.contains(e.target)
      ) {
        return;
      }
      close();
    };

    const onKey = (e) => {
      if (e.key === "Escape") close();
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);

    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  const handleToggleOpen = (e) => {
    e.stopPropagation();

    if (open) {
      setPosition(null);
      return;
    }

    const rect = buttonRef.current.getBoundingClientRect();
    const fitsBelow = rect.bottom + MENU_HEIGHT + 8 < window.innerHeight;

    setPosition({
      top: fitsBelow ? rect.bottom + 6 : rect.top - MENU_HEIGHT - 6,
      left: Math.max(8, rect.right - MENU_WIDTH),
    });
  };

  const run = (e, action) => {
    e.stopPropagation();
    setPosition(null);
    action();
  };

  const itemClass =
    "flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition hover:bg-slate-50";

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label="Integration actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={handleToggleOpen}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          style={{ top: position.top, left: position.left, width: MENU_WIDTH }}
          className="fixed z-[60] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            role="menuitem"
            onClick={(e) => run(e, () => onView(integration.id))}
            className={`${itemClass} text-slate-700`}
          >
            <Eye className="h-4 w-4" />
            View details
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={(e) => run(e, () => onToggleStatus(integration))}
            className={`${itemClass} text-slate-700`}
          >
            <Power className="h-4 w-4" />
            {isActive ? "Deactivate" : "Activate"}
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={(e) => run(e, () => onDelete(integration))}
            className={`${itemClass} text-red-600 hover:bg-red-50`}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      )}
    </>
  );
};

export default IntegrationActionsMenu;
