// src/data/userGuide.js
//
// Content for Settings -> User Guide.
//
// HOW TO ADD A VIDEO
// Paste the YouTube link or the full <iframe ...></iframe> code your team gave
// you into VIDEO_LINKS below. All of these work:
//   "<iframe width=\"560\" ... src=\"https://www.youtube.com/embed/86HGKRiR654?si=...\" ...></iframe>"
//   "https://youtu.be/86HGKRiR654"
//   "https://www.youtube.com/watch?v=86HGKRiR654"
//   "86HGKRiR654"
// Leave "" to show "Video coming soon".
import { FaInstagram } from "react-icons/fa";
import {
  Users,
  UserPlus,
  Megaphone,
  FileText,
  UserCog,
  ClipboardList,
  Ticket,
  Plug,
  Briefcase,
  Bot,
  Database,
  LifeBuoy,
  History,
} from "lucide-react";

/* =====================================================================
   PASTE YOUR 12 VIDEOS HERE (one place, nothing else to edit)
   ===================================================================== */
const VIDEO_LINKS = {
  customers: '<iframe width="560" height="315" src="https://www.youtube.com/embed/5Q55yq49ID0?si=If9obQvjLhgB_M-h" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
  leads: '<iframe width="560" height="315" src="https://www.youtube.com/embed/PFH9Ip3Tngk?si=e7CinTxgIC36oFjJ" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
  campaigns: '<iframe width="560" height="315" src="https://www.youtube.com/embed/uX3tCF-4a6I?si=K3KMpr7K0GhPbXjg" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
  templates: '<iframe width="560" height="315" src="https://www.youtube.com/embed/86HGKRiR654?si=Q8IY2vdQatAaM26J" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
  tasks: '<iframe width="560" height="315" src="https://www.youtube.com/embed/gFz3WG1Pfr8?si=njl6Leo_bAI8UukG" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
  tickets: '<iframe width="560" height="315" src="https://www.youtube.com/embed/_iR0p4Jk594?si=1JgJR7nqBT69U7Jo" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
  services: '<iframe width="560" height="315" src="https://www.youtube.com/embed/RGK5B_scQts?si=ZT9yyz-Hqvhsjvz3" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
  employees: '<iframe width="560" height="315" src="https://www.youtube.com/embed/cLpArxUTruc?si=D5a1grTialylapbM" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
  integrations: '<iframe width="560" height="315" src="https://www.youtube.com/embed/CxLohciLRWU?si=HgUmXYidFx_0YJ6L" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
  instagram: '<iframe width="560" height="315" src="https://www.youtube.com/embed/s4UZAWF1faE?si=-XQTuAYxZnE5QGg4" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
  aiAutoReply: '<iframe width="560" height="315" src="https://www.youtube.com/embed/JbwTeidEmF0?si=oqBYBumZS1YItr9h" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
  // One video covers Backup & Restore, Support and Audit Logs.
  // Set the start time (in seconds) of each part in `start` below.
  adminSettings: '<iframe width="560" height="315" src="https://www.youtube.com/embed/wWphwYtQuHk?si=0zzVFCQndymPlubp" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
};

/* =====================================================================
   MODULES
   start     : second where this module's part begins in the video (optional)
   adminOnly : hidden for USER (employee) role
   path      : page the "Open" button goes to
   ===================================================================== */
export const userGuideModules = [
  {
    id: "customers",
    name: "Customers",
    icon: Users,
    path: "/customers",
    summary: "Add and manage your customers and see everything about them in one place.",
    points: [
      "Add a customer with name, phone, email, company and source",
      "Search and filter customers by status or service",
      "Open a profile to see the activity timeline",
      "Import, export or delete customers in bulk",
    ],
    keywords: "contact add import export excel profile timeline delete bulk filter",
    video: VIDEO_LINKS.customers,
    start: 0,
  },
  {
    id: "leads",
    name: "Leads",
    icon: UserPlus,
    path: "/leads",
    summary: "Track new enquiries and follow them until they become customers.",
    points: [
      "Add a lead and choose where it came from",
      "Move leads through the stages on the board",
      "Assign a lead to an employee and add notes",
      "Convert a lead to a customer",
    ],
    keywords: "enquiry deal pipeline kanban follow up status convert assign note import",
    video: VIDEO_LINKS.leads,
    start: 0,
  },
  {
    id: "campaigns",
    name: "Campaigns",
    icon: Megaphone,
    path: "/campaigns",
    summary: "Send a WhatsApp message to many customers at once.",
    points: [
      "Pick an approved template and fill its variables",
      "Choose the customers to send to",
      "Schedule the date and time",
      "Open a campaign to see each recipient's status",
    ],
    keywords: "bulk broadcast send schedule message whatsapp marketing recipient",
    video: VIDEO_LINKS.campaigns,
    start: 0,
  },
  {
    id: "templates",
    name: "Templates",
    icon: FileText,
    path: "/templates",
    summary: "Create WhatsApp message templates and use them after approval.",
    points: [
      "Create a template with category, header and variables",
      "Add buttons and quick replies",
      "Check if it is Pending, Approved or Rejected",
      "Use approved templates in chats and campaigns",
    ],
    keywords: "meta approval utility marketing message format header variable button",
    video: VIDEO_LINKS.templates,
    start: 0,
  },
  {
    id: "tasks",
    name: "Tasks",
    icon: ClipboardList,
    path: "/tasks",
    summary: "Keep track of work that needs to be done and who is doing it.",
    points: [
      "Create a task with a priority and due date",
      "Assign it to an employee",
      "Move it across the board as work progresses",
      "Add notes and filter your tasks",
    ],
    keywords: "todo reminder assign due date priority kanban board work notes",
    video: VIDEO_LINKS.tasks,
    start: 0,
  },
  {
    id: "tickets",
    name: "Tickets",
    icon: Ticket,
    path: "/tickets",
    summary: "Record and resolve customer issues in one place.",
    points: [
      "Raise a ticket and set its priority",
      "Assign it to an employee and add notes",
      "Update the status until it is Resolved",
      "Filter and export tickets",
    ],
    keywords: "support issue complaint problem resolve priority status",
    video: VIDEO_LINKS.tickets,
    start: 0,
  },
  {
    id: "services",
    name: "Services",
    icon: Briefcase,
    path: "/services",
    summary: "Manage the services your business offers.",
    points: [
      "Add a new service",
      "Edit or delete a service",
      "Search and filter your services",
      "Export the list",
    ],
    keywords: "product offer catalog service add edit delete export",
    video: VIDEO_LINKS.services,
    start: 0,
  },
  {
    id: "employees",
    name: "Employees",
    icon: UserCog,
    path: "/employees",
    adminOnly: true,
    summary: "Add your team members and manage their roles.",
    points: [
      "Add an employee and choose their role",
      "View or edit employee details",
      "Change an employee's status",
      "Search, filter and export employees",
    ],
    keywords: "staff team user role access add edit status",
    video: VIDEO_LINKS.employees,
    start: 0,
  },
  {
    id: "integrations",
    name: "Integrations",
    icon: Plug,
    path: "/settings/integrations",
    summary: "Connect your other tools so purchases and enquiries arrive in the CRM.",
    points: [
      "Choose a type: Payment, E-commerce, Billing, POS, ERP or Custom",
      "Connect Razorpay, Stripe, Square, Shopify or WooCommerce",
      "Add the website form code (HTML, WordPress, Shopify, Webflow)",
      "Check events: Processed, Skipped, Duplicate or Failed",
    ],
    keywords: "razorpay stripe square shopify woocommerce webhook website widget connect payment store",
    video: VIDEO_LINKS.integrations,
    start: 0,
  },
  {
    id: "instagram",
    name: "Instagram Integration",
    icon: FaInstagram,
    path: "/settings/integrations",
    summary: "Connect your Instagram account and reply to messages from the CRM.",
    points: [
      "Connect your Instagram account",
      "See Instagram messages in Conversations",
      "Reply to customers without leaving the CRM",
      "Disconnect the account when needed",
    ],
    keywords: "instagram dm connect social inbox disconnect",
    video: VIDEO_LINKS.instagram,
    start: 0,
  },
  {
    id: "ai-auto-reply",
    name: "AI Auto-Reply",
    icon: Bot,
    path: "/settings/ai-auto-reply",
    adminOnly: true,
    summary: "Let AI answer common customer messages automatically.",
    points: [
      "Turn it on and tell the AI about your business",
      "Set the tone, languages and working hours",
      "Add your policies and instructions",
      "Create leads automatically and test a sample reply",
    ],
    keywords: "ai bot automatic reply chatbot tone language working hours lead whatsapp facebook instagram",
    video: VIDEO_LINKS.aiAutoReply,
    start: 0,
  },
  {
    id: "backup",
    name: "Backup & Restore",
    icon: Database,
    path: "/settings/backup",
    adminOnly: true,
    summary: "Keep a safe copy of your CRM data and restore it when needed.",
    points: [
      "Create a backup",
      "Check if it is Pending, In Progress, Completed or Failed",
      "Download or restore a backup",
    ],
    keywords: "export download restore data safe copy",
    video: VIDEO_LINKS.adminSettings,
    start: 0, // <- second where the Backup part starts
  },
  {
    id: "support",
    name: "Support",
    icon: LifeBuoy,
    path: "/settings/support",
    adminOnly: true,
    summary: "Contact our team when you need help with the CRM.",
    points: [
      "Raise a support ticket with a subject and description",
      "Choose the priority",
      "Track the reply from our team",
    ],
    keywords: "help contact problem raise ticket priority",
    video: VIDEO_LINKS.adminSettings,
    start: 0, // <- second where the Support part starts
  },
  {
    id: "audit-logs",
    name: "Audit Logs",
    icon: History,
    path: "/settings/audit-logs",
    adminOnly: true,
    summary: "See who did what in your CRM and when.",
    points: [
      "Filter by action, module and date",
      "See which record was changed",
      "See exactly what changed",
    ],
    keywords: "history activity log track changes who action module",
    video: VIDEO_LINKS.adminSettings,
    start: 0, // <- second where the Audit Logs part starts
  },
];
