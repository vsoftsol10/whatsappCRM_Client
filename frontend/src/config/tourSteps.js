// src/config/tourSteps.js
// ---------------------------------------------------------------------------
// Product-tour steps. Edit this file to change the tour text, order or targets.
//
//  target : value of the data-tour="..." attribute on the element to highlight
//           (leave out for a centered welcome / finish card)
//  route  : page to open before showing the step
//  roles  : only show for these roles (omit = everyone)
//  sidebar: true when the target lives in the sidebar (opens it on mobile)
//  chips  : small badges shown under the text
//  cta    : (last step) button that jumps to a page when the tour ends
// ---------------------------------------------------------------------------
import { FaWhatsapp, FaFacebook, FaInstagram } from "react-icons/fa";
import {
  Rocket,
  MessageCircle,
  Users,
  UserPlus,
  Plug,
  PartyPopper,
  Share2,
} from "lucide-react";

export const TOUR_VERSION = "v1"; // bump to show the tour again to everyone

export const tourSteps = [
  {
    id: "welcome",
    title: "Welcome to Vatup CRM 🎉",
    body: "Let us show you the 5 things that matter most. It takes less than a minute, and you can skip any time.",
    icon: Rocket,
    color: "#25D366",
    welcome: true,
  },
  {
    id: "connect-whatsapp",
    target: "whatsapp-card",
    route: "/settings/security",
    roles: ["ADMIN"],
    title: "1. Connect your WhatsApp",
    body: "Start here. Link your WhatsApp Business account so you can send and receive customer messages inside the CRM.",
    icon: FaWhatsapp,
    color: "#25D366",
  },
  {
    id: "connect-social",
    target: "facebook-instagram-card",
    route: "/settings/security",
    roles: ["ADMIN"],
    title: "2. Facebook & Instagram",
    body: "Connect your Facebook Page (and the Instagram account linked to it) to reply to Messenger and Instagram DMs from one inbox.",
    icon: Share2,
    color: "#1877F2",
    chips: [
      { label: "Messenger", icon: FaFacebook, color: "#1877F2" },
      { label: "Instagram DMs", icon: FaInstagram, color: "#E1306C" },
    ],
  },
  {
    id: "conversations",
    target: "conversations",
    sidebar: true,
    title: "3. All your chats in one place",
    body: "WhatsApp, Facebook and Instagram conversations live here. Open a channel to chat with customers in real time.",
    icon: MessageCircle,
    color: "#128C7E",
  },
  {
    id: "customers",
    target: "customers",
    sidebar: true,
    title: "4. Customers",
    body: "Everyone you talk to is saved here. Add customers, import them in bulk, and see their full history.",
    icon: Users,
    color: "#2563EB",
  },
  {
    id: "leads",
    target: "leads",
    sidebar: true,
    title: "5. Leads",
    body: "Track new enquiries from first contact to won deal. Assign leads to your team and never miss a follow-up.",
    icon: UserPlus,
    color: "#F59E0B",
  },
  {
    id: "integrations",
    target: "integrations",
    route: "/settings/integrations",
    sidebar: true,
    title: "6. Integrations",
    body: "Connect your website, Shopify, WooCommerce, Stripe, Razorpay and more so new orders and leads flow in automatically.",
    icon: Plug,
    color: "#8B5CF6",
  },
  {
    id: "finish",
    title: "You're all set! 🚀",
    body: "That's the tour. You can replay it anytime from the “Take a tour” button.",
    icon: PartyPopper,
    color: "#25D366",
    finish: true,
    cta: { label: "Connect WhatsApp now", route: "/settings/security", roles: ["ADMIN"] },
  },
];
