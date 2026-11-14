
// src/config/navigation.js
import { FaWhatsapp, FaFacebook, FaInstagram } from "react-icons/fa";
import {
  LayoutDashboard,
  MessageCircle,
  Users,
  UserPlus,
  Megaphone,
  FileText,
  UserCog,
  Ticket,
  ClipboardList,
  Settings,
  Lock,
  Plug,
  Database,
  LifeBuoy,
  History,
  Bot,
  Briefcase,
  BookOpen,
  Library,
  FileSignature,
  CreditCard,
} from "lucide-react";

// Platform logo, imported so the bundler resolves the file path for you.
// Put your PNG at: src/assets/vatup-logo.png (no spaces in the name)
import platformLogo from "../assets/vatup-logo.png";

// YOUR SaaS platform's branding (shown at the bottom of the sidebar: "Powered by ...").
export const PLATFORM = {
  name: "Vatup CRM", // used only as the image alt text
  logo: platformLogo,
};

export const navGroups = [
  {
    id: "main",
    items: [
      { key: "dashboard", name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      {
        key: "conversations",
        name: "Conversations",
        icon: MessageCircle,
        children: [
          { key: "conversations-whatsapp", name: "WhatsApp", path: "/conversations", icon: FaWhatsapp },
          { key: "conversations-facebook", feature: "facebook", name: "Facebook", path: "/facebook-conversations", icon: FaFacebook },
          { key: "conversations-instagram", feature: "instagram", name: "Instagram", path: "/instagram-conversations", icon: FaInstagram },
        ],
      },
    ],
  },
  {
    id: "crm",
    items: [
      { key: "customers", name: "Customers", path: "/customers", icon: Users },
      { key: "services", feature: "services", name: "Services", path: "/services", icon: Briefcase },
      { key: "leads", feature: "leads", name: "Leads", path: "/leads", icon: UserPlus },
      { key: "campaigns", feature: "campaigns", name: "Campaigns", path: "/campaigns", icon: Megaphone },
      { key: "templates", feature: "templates", name: "Templates", path: "/templates", icon: FileText },
      { key: "proposals", feature: "proposals", name: "Proposals", path: "/proposals", icon: FileSignature },
    ],
  },
  {
    id: "work",
    items: [
      { key: "tasks", feature: "tasks", name: "Tasks", path: "/tasks", icon: ClipboardList },
      { key: "tickets", feature: "tickets", name: "Tickets", path: "/tickets", icon: Ticket },
      { key: "employees", name: "Employees", path: "/employees", icon: UserCog, roles: ["ADMIN"] },
    ],
  },
  {
    id: "system",
    items: [
      // Sidebar shows ONE "Settings" link. Its sections live as tabs inside the page (see settingsTabs).
      { key: "plans", name: "Plans", path: "/plans", icon: CreditCard, roles: ["ADMIN"] },
      { key: "settings", name: "Settings", path: "/settings", icon: Settings },
    ],
  },
];

const canSee = (item, role) => !item.roles || item.roles.includes(role);

// Removes items the role can't see, and drops groups/parents that end up empty.
export function filterByRole(groups, role) {
  return groups
    .map((group) => ({
      ...group,
      items: group.items
        .filter((item) => canSee(item, role))
        .map((item) =>
          item.children
            ? { ...item, children: item.children.filter((c) => canSee(c, role)) }
            : item
        )
        .filter((item) => !item.children || item.children.length > 0),
    }))
    .filter((group) => group.items.length > 0);
}

// Tabs shown at the top of the Settings page (src/layouts/SettingsLayout.jsx).
// Also used by the header "Search pages..." box so every section stays searchable.
export const settingsTabs = [
  { key: "security", name: "Security", path: "/settings/security", icon: Lock },
  { key: "integrations", name: "Integrations", path: "/settings/integrations", icon: Plug },
  { key: "backup", name: "Backup", path: "/settings/backup", icon: Database, roles: ["ADMIN"] },
  { key: "support", name: "Support", path: "/settings/support", icon: LifeBuoy, roles: ["ADMIN"] },
  { key: "audit-logs", feature: "auditLog", name: "Audit Logs", path: "/settings/audit-logs", icon: History, roles: ["ADMIN"] },
  { key: "ai-auto-reply", feature: "aiAutoReply", name: "AI Auto-Reply", path: "/settings/ai-auto-reply", icon: Bot, roles: ["ADMIN"] },
  { key: "knowledge-base", feature: "knowledgeBase", name: "Knowledge Base", path: "/settings/knowledge-base", icon: Library, roles: ["ADMIN"] },
  { key: "user-guide", name: "User Guide", path: "/settings/user-guide", icon: BookOpen },
];

export const filterTabsByRole = (tabs, role) => tabs.filter((tab) => canSee(tab, role));

// ---------------------------------------------------------------
// PLAN FEATURES (Super Admin)
// `can(key)` comes from usePlanFeatures(). Items without a `feature`
// key are always shown. Parents left without children are dropped.
// ---------------------------------------------------------------
export function filterByFeatures(groups, can) {
  return groups
    .map((group) => ({
      ...group,
      items: group.items
        .filter((item) => !item.feature || can(item.feature))
        .map((item) =>
          item.children
            ? { ...item, children: item.children.filter((c) => !c.feature || can(c.feature)) }
            : item
        )
        .filter((item) => !item.children || item.children.length > 0),
    }))
    .filter((group) => group.items.length > 0);
}

export const filterTabsByFeatures = (tabs, can) =>
  tabs.filter((tab) => !tab.feature || can(tab.feature));
