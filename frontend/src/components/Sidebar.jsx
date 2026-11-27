
// src/components/Sidebar.jsx
import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, X } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import {
  navGroups,
  filterByRole,
  filterByFeatures,
  BRAND_LOGO,
} from "../config/navigation";
import usePlanFeatures from "../hooks/usePlanFeatures";

// Every row uses the same height, padding and icon column, so icons and
// labels line up in a straight vertical line (parents and nested rows too).
const itemBase =
  "group relative flex h-11 w-full items-center gap-3 rounded-full px-4 text-[15px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#159A4B]/50";

const itemState = (isActive) =>
  isActive
    ? "bg-[#159A4B] text-white shadow-md shadow-green-900/20"
    : "text-slate-700 hover:bg-[#159A4B]/10 hover:text-slate-900";

function LinkItem({ item, onClose, nested = false }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.path}
      data-tour={item.key}
      onClick={onClose}
      className={({ isActive }) =>
        `${itemBase} ${nested ? "h-10 text-sm" : ""} ${itemState(isActive)}`
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={nested ? 17 : 20}
            strokeWidth={1.8}
            className={`shrink-0 ${
              isActive ? "text-white" : "text-slate-500 group-hover:text-[#159A4B]"
            }`}
          />
          <span className="truncate">{item.name}</span>
        </>
      )}
    </NavLink>
  );
}

function ParentItem({ item, isOpen, hasActiveChild, onToggle, onClose }) {
  const Icon = item.icon;
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        data-tour={item.key}
        aria-expanded={isOpen}
        className={`${itemBase} justify-between ${
          hasActiveChild
            ? "bg-[#159A4B]/10 text-slate-900"
            : "text-slate-700 hover:bg-[#159A4B]/10 hover:text-slate-900"
        }`}
      >
        <span className="flex min-w-0 items-center gap-3">
          <Icon
            size={20}
            strokeWidth={1.8}
            className={`shrink-0 ${
              hasActiveChild ? "text-[#159A4B]" : "text-slate-500 group-hover:text-[#159A4B]"
            }`}
          />
          <span className="truncate">{item.name}</span>
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-slate-500 transition-transform duration-200 motion-reduce:transition-none ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="ml-6 mt-1 flex flex-col gap-1 border-l border-[#159A4B]/20 pl-2">
            {item.children.map((child) => (
              <LinkItem key={child.key} item={child} onClose={onClose} nested />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({ isOpen = false, onClose = () => {} }) {
  const user = useAuthStore((state) => state.user);
  const { pathname } = useLocation();

  const [openParents, setOpenParents] = useState({});

  const { can } = usePlanFeatures();
  const groups = useMemo(
    () => filterByFeatures(filterByRole(navGroups, user?.role), can),
    [user?.role, can]
  );

  // One flat list so every item gets exactly the same spacing
  const items = useMemo(() => groups.flatMap((group) => group.items), [groups]);

  const isChildActive = (item) =>
    item.children?.some((c) => pathname.startsWith(c.path)) ?? false;

  // Auto-open the parent that contains the current route
  useEffect(() => {
    items.forEach((item) => {
      if (item.children && isChildActive(item)) {
        setOpenParents((prev) => (prev[item.key] ? prev : { ...prev, [item.key]: true }));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, items]);

  const toggleParent = (key) =>
    setOpenParents((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}

      {/* fixed + inset-y-0 = always exactly the viewport height, on any screen */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-56 max-w-[85vw] lg:w-64 xl:w-72 flex-col border-r border-emerald-100 bg-gradient-to-b from-[#E6F7EC] via-[#F0FAF4] to-white text-slate-800 transition-transform duration-300 motion-reduce:transition-none md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* LOGO — same height as the top header so the two line up */}
        <div className="flex h-20 shrink-0 items-center justify-between px-4 lg:px-6">
          <img
            src={BRAND_LOGO}
            alt="Vatup CRM"
            className="h-10 w-auto max-w-[170px] lg:h-12 lg:max-w-[200px] object-contain"
          />

          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-md p-1.5 text-slate-500 hover:bg-black/5 hover:text-slate-900 md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* NAV — one evenly spaced list; scrolls if the screen is short */}
        <nav
          aria-label="Main navigation"
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 [scrollbar-width:thin] [scrollbar-color:rgba(21,154,75,0.3)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#159A4B]/30 [&::-webkit-scrollbar-track]:bg-transparent"
        >
          <div className="flex flex-col gap-1">
            {items.map((item) =>
              item.children ? (
                <ParentItem
                  key={item.key}
                  item={item}
                  isOpen={!!openParents[item.key]}
                  hasActiveChild={isChildActive(item)}
                  onToggle={() => toggleParent(item.key)}
                  onClose={onClose}
                />
              ) : (
                <LinkItem key={item.key} item={item} onClose={onClose} />
              )
            )}
          </div>
        </nav>

        {/* PLATFORM BRAND — pinned to the bottom */}
        <div className="shrink-0 px-6 pb-5 pt-4">
          <p className="text-base text-slate-700">
            Powered by{" "}
            <span className="font-semibold text-[#159A4B]">thevsoft</span>
          </p>
        </div>
      </aside>
    </>
  );
}