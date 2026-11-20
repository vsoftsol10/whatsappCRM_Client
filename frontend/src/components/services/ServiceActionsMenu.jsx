import { useEffect, useRef, useState } from "react";
import { MoreVertical, Users, Eye, Pencil, Trash2 } from "lucide-react";

const MENU_WIDTH = 224;
const ITEM_HEIGHT = 48;
const MENU_PADDING = 16;
const GAP = 8;

// 3-dot menu for a service (used in the table and in the cards).
// The menu is position: fixed, so the table's rounded/overflow edges never clip it.
function ServiceActionsMenu({
  service,
  canManage,
  onManageCustomers,
  onView,
  onEdit,
  onDelete,
}) {
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const [position, setPosition] = useState(null);

  const open = position !== null;

  const items = [
    { key: "customers", label: "Manage Customers", icon: Users, onClick: onManageCustomers },
    { key: "view", label: "View", icon: Eye, onClick: onView },
    ...(canManage
      ? [
          { key: "edit", label: "Edit", icon: Pencil, onClick: onEdit },
          { key: "delete", label: "Delete", icon: Trash2, onClick: onDelete, danger: true },
        ]
      : []),
  ];

  const close = () => setPosition(null);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (
        menuRef.current?.contains(event.target) ||
        buttonRef.current?.contains(event.target)
      ) {
        return;
      }

      setPosition(null);
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setPosition(null);
        buttonRef.current?.focus();
      }
    };

    const handleDismiss = () => setPosition(null);

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("scroll", handleDismiss, true);
    window.addEventListener("resize", handleDismiss);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("scroll", handleDismiss, true);
      window.removeEventListener("resize", handleDismiss);
    };
  }, [open]);

  const toggle = () => {
    if (open) {
      close();
      return;
    }

    const rect = buttonRef.current.getBoundingClientRect();
    const menuHeight = items.length * ITEM_HEIGHT + MENU_PADDING;

    let left = rect.right - MENU_WIDTH;
    left = Math.max(8, Math.min(left, window.innerWidth - MENU_WIDTH - 8));

    // Open downward when there is room, otherwise upward
    let top = rect.bottom + GAP;

    if (top + menuHeight > window.innerHeight - 8) {
      top = Math.max(8, rect.top - menuHeight - GAP);
    }

    setPosition({ top, left });
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Actions for ${service.name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
        className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
      >
        <MoreVertical size={20} />
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          style={{ top: position.top, left: position.left, width: MENU_WIDTH }}
          className="fixed z-[99999] rounded-2xl border border-slate-200 bg-white py-2 shadow-xl"
        >
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                onClick={() => {
                  close();
                  item.onClick();
                }}
                className={`flex h-12 w-full items-center gap-3 px-5 text-left text-[15px] transition ${
                  item.danger
                    ? "text-red-500 hover:bg-red-50"
                    : "text-slate-800 hover:bg-slate-50"
                }`}
              >
                <Icon
                  size={20}
                  className={item.danger ? "text-red-500" : "text-slate-500"}
                />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

export default ServiceActionsMenu;