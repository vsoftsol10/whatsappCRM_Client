// src/layouts/SettingsLayout.jsx
//
// One "Settings" page that holds every settings area as a tab:
// Security · Integrations · Backup & Restore · Support · Audit Logs · AI Auto-Reply
//
// Each tab is still its own page/route (same components, same logic) and is
// rendered inside this shell through <Outlet />.
import { useEffect, useMemo, useRef } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { settingsTabs, filterTabsByRole } from "../config/navigation";

export default function SettingsLayout() {
  const user = useAuthStore((state) => state.user);
  const { pathname } = useLocation();
  const tabsRef = useRef(null);

  // Only show the tabs this role is allowed to open (Backup, Support,
  // Audit Logs and AI Auto-Reply are ADMIN only)
  const tabs = useMemo(
    () => filterTabsByRole(settingsTabs, user?.role),
    [user?.role]
  );

  // On small screens the tab bar scrolls sideways — keep the active tab in view
  useEffect(() => {
    const bar = tabsRef.current;
    const active = bar?.querySelector('[aria-current="page"]');
    if (!bar || !active) return;
    bar.scrollLeft = active.offsetLeft - (bar.clientWidth - active.clientWidth) / 2;
  }, [pathname]);

  return (
    <div className="mx-auto w-full max-w-[1340px] pb-10">
      {/* ================= HEADER ================= */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Settings
        </h1>
        <p className="mt-2 text-base text-slate-500">
          Manage your security, integrations, backups and workspace preferences.
        </p>
      </div>

      {/* ================= TABS ================= */}
      <div
        ref={tabsRef}
        className="mt-6 max-w-full overflow-x-auto rounded-full border border-slate-200 bg-white p-2 shadow-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:inline-block"
      >
        <nav aria-label="Settings sections" className="flex w-max items-center gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.key}
                to={tab.path}
                data-tour={tab.key}
                className={({ isActive }) =>
                  `inline-flex h-11 shrink-0 items-center gap-2.5 rounded-full px-5 text-[15px] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/60 ${
                    isActive
                      ? "bg-green-600 text-white shadow-md shadow-green-600/25"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`
                }
              >
                <Icon size={18} strokeWidth={1.9} className="shrink-0" />
                <span>{tab.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* ================= TAB CONTENT =================
          The existing pages bring their own outer padding / background.
          Inside this shell the layout already provides that, so we neutralise
          it here instead of editing every page. */}
      <div className="mt-8 [&>div]:min-h-0! [&>div]:bg-transparent! [&>div]:p-0!">
        <Outlet />
      </div>
    </div>
  );
}
