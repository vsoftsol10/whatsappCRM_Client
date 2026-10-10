
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
} from "lucide-react";

// YOUR SaaS platform's branding (shown at the bottom of the sidebar: "Powered by ...").
// Put your logo file in /public and set logo: "/platform-logo.png"
export const PLATFORM = {
  name: "Vatup CRM",
  logo: null, // e.g. ""/Updated.png""
};

export const navGroups = [
  {
    id: "main",
    items: [
      { key: "dashboard", name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { key: "conversations", name: "Conversations", path: "/conversations", icon: MessageCircle },
    ],
  },
  {
    id: "crm",
    items: [
      { key: "customers", name: "Customers", path: "/customers", icon: Users },
      { key: "leads", name: "Leads", path: "/leads", icon: UserPlus },
      { key: "campaigns", name: "Campaigns", path: "/campaigns", icon: Megaphone },
      { key: "templates", name: "Templates", path: "/templates", icon: FileText },
    ],
  },
  {
    id: "work",
    items: [
      { key: "tasks", name: "Tasks", path: "/tasks", icon: ClipboardList },
      { key: "tickets", name: "Tickets", path: "/tickets", icon: Ticket },
      { key: "employees", name: "Employees", path: "/employees", icon: UserCog, roles: ["ADMIN"] },
    ],
  },
  {
    id: "system",
    items: [
      {
        key: "settings",
        name: "Settings",
        icon: Settings,
        children: [
          { key: "security", name: "Security", path: "/settings/security", icon: Lock },
          { key: "integrations", name: "Integrations", path: "/settings/integrations", icon: Plug },
          { key: "backup", name: "Backup & Restore", path: "/backup", icon: Database, roles: ["ADMIN"] },
          { key: "support", name: "Support", path: "/settings/support", icon: LifeBuoy, roles: ["ADMIN"] },
          { key: "audit-logs", name: "Audit Logs", path: "/settings/audit-logs", icon: History, roles: ["ADMIN"] },
          { key: "ai-auto-reply", name: "AI Auto-Reply", path: "/settings/ai-auto-reply", icon: Bot, roles: ["ADMIN"] },
        ],
      },
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