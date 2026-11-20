import { Menu } from "lucide-react";
import GlobalSearch from "./GlobalSearch";
import NotificationButton from "./NotificationButton";
import ModuleGuideButton from "../guide/ModuleGuideButton";
import ProfileMenu from "./ProfileMenu";
import { useAuthStore } from "../../store/authStore";

// The left side of the header is now FIXED on every page and module
// (Dashboard, WhatsApp, Instagram, Facebook, Settings ...):
//
//   Welcome, <logged-in user / admin name>
//
// It no longer changes to the page name or the customer's chat name.
function TopHeader({ onMenuClick }) {
  const user = useAuthStore((state) => state.user);

  const displayName = user?.name?.trim() || "User";

  return (
    <header className="sticky top-0 z-30 flex h-20 shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8">
      {/* Left: menu button (mobile) + fixed welcome message */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-700 transition hover:bg-[#159A4B]/10 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>

        <h1
          className="hidden max-w-[260px] truncate text-xl font-bold text-slate-900 sm:block lg:max-w-[340px] lg:text-2xl"
          title={`Welcome, ${displayName}`}
        >
          Welcome, <span className="text-[#159A4B]">{displayName}</span>
        </h1>
      </div>

      {/* Middle: search */}
      <div className="flex min-w-0 flex-1 justify-center lg:px-6">
        <GlobalSearch />
      </div>

      {/* Right: guide + bell + profile */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-3">
        <ModuleGuideButton />

        <NotificationButton />

        <div className="hidden h-9 w-px bg-gray-200 sm:block" />

        <ProfileMenu />
      </div>
    </header>
  );
}

export default TopHeader;