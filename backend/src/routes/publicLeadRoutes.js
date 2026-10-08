// // ======================================================
// // backend/src/routes/publicLeadRoutes.js
// //
// // PUBLIC endpoints used by customers' websites. No login.
// //
// //   GET  /api/public/widget.js?key=<webhookKey>
// //        -> the ONE script a customer pastes on their site.
// //           It finds their forms and sends every submission to the CRM.
// //
// //   POST /api/public/leads/<webhookKey>
// //        -> creates a Lead (called by the script above, or by anyone's code).
// //
// // The <webhookKey> is the key of an Integration with provider WEBSITE.
// // It is PUBLIC (visible in page source) - that is fine, it can only
// // CREATE leads, never read anything.
// // ======================================================
// const express = require("express");
// const cors = require("cors");
// const prisma = require("../config/prisma");
// const { normalizeIndianPhone } = require("../utils/phoneUtils");

// const router = express.Router();

// // ------------------------------------------------------
// // CORS + body parsing for THIS router only.
// //
// // Customers' websites are on other domains, so the browser asks
// // permission first ("preflight"). The app's global CORS setting is
// // usually limited to the CRM's own frontend, so these routes must
// // answer for themselves. That is why server.js mounts this router
// // BEFORE the global cors() - and why it parses JSON here too.
// //
// // Which websites may really send leads is decided per integration
// // ("Your website address" in the dashboard), not here.
// // ------------------------------------------------------
// router.use(
//   cors({
//     origin: true, // reflect the caller's origin
//     methods: ["GET", "POST", "OPTIONS"],
//     allowedHeaders: ["Content-Type"],
//     credentials: false, // public endpoint: no cookies
//     maxAge: 86400,
//   })
// );
// router.use(express.json({ limit: "100kb" }));

// // ------------------------------------------------------
// // helpers
// // ------------------------------------------------------
// const clean = (v, max = 500) =>
//   typeof v === "string" ? v.trim().slice(0, max) : "";

// // Behind a proxy (Render, Nginx...) req.ip is the proxy, so read the header.
// const getIp = (req) =>
//   String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
//   req.ip ||
//   "unknown";

// // Indian numbers -> 91XXXXXXXXXX (same format WhatsApp uses).
// // Other countries: keep digits only (8-15 digits).
// const toPhone = (value) => {
//   if (!value) return null;
//   const indian = normalizeIndianPhone(String(value));
//   if (indian) return indian;
//   const digits = String(value).replace(/\D/g, "");
//   return digits.length >= 8 && digits.length <= 15 ? digits : null;
// };

// const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

// // "https://www.Shop.com/page" or "shop.com" -> "shop.com"
// const hostOf = (value) => {
//   try {
//     const v = String(value || "").trim();
//     if (!v) return "";
//     const url = new URL(v.includes("://") ? v : `https://${v}`);
//     return url.hostname.toLowerCase().replace(/^www\./, "");
//   } catch (e) {
//     return "";
//   }
// };

// // Empty list = any website may send leads.
// // Subdomains of an allowed domain are allowed too.
// // NOTE: this stops casual misuse from OTHER websites. It is not a hard
// // security wall (a script on a server can fake the Origin header).
// const isOriginAllowed = (origin, allowed) => {
//   if (!Array.isArray(allowed) || allowed.length === 0) return true;
//   if (!origin) return true;
//   const host = hostOf(origin);
//   return allowed.some((a) => {
//     const h = hostOf(a);
//     return h && (host === h || host.endsWith(`.${h}`));
//   });
// };

// // tiny in-memory rate limiter
// const hits = new Map();
// const rateLimit = (max, windowMs) => (req, res, next) => {
//   const id = `${getIp(req)}:${req.params.publicKey || req.query.key || ""}`;
//   const now = Date.now();
//   const recent = (hits.get(id) || []).filter((t) => now - t < windowMs);
//   if (recent.length >= max) {
//     return res
//       .status(429)
//       .json({ success: false, message: "Too many requests. Try again later." });
//   }
//   recent.push(now);
//   hits.set(id, recent);
//   next();
// };
// setInterval(() => hits.clear(), 10 * 60 * 1000).unref();

// const findWebsiteIntegration = (key) =>
//   prisma.integration.findUnique({ where: { webhookKey: String(key || "") } });

// // ------------------------------------------------------
// // POST /api/public/leads/:publicKey
// // ------------------------------------------------------
// router.post("/leads/:publicKey", rateLimit(10, 60 * 1000), async (req, res) => {
//   try {
//     const integration = await findWebsiteIntegration(req.params.publicKey);

//     if (
//       !integration ||
//       integration.status !== "ACTIVE" ||
//       integration.provider !== "WEBSITE"
//     ) {
//       return res.status(404).json({ success: false, message: "Invalid key" });
//     }

//     const allowed = integration.settings?.allowedOrigins;
//     if (!isOriginAllowed(req.headers.origin, allowed)) {
//       return res
//         .status(403)
//         .json({ success: false, message: "This website is not allowed" });
//     }

//     const body = req.body || {};

//     // Honeypot: bots fill hidden fields, people don't. Pretend success.
//     if (body.website_url) return res.json({ success: true });

//     const name = clean(body.name, 120);
//     const emailRaw = clean(body.email, 200);
//     const email = isEmail(emailRaw) ? emailRaw : "";
//     const phoneRaw = clean(body.phone, 40);
//     const phone = toPhone(phoneRaw);
//     const companyName = clean(body.companyName, 200);
//     const message = clean(body.message, 1800);
//     const pageUrl = clean(body.pageUrl, 300);

//     if (!phone && !email) {
//       return res.status(400).json({
//         success: false,
//         message: phoneRaw
//           ? "Phone number is not valid"
//           : "Phone or email is required",
//       });
//     }

//     // Same person sending twice in 24h = one lead
//     const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
//     const duplicate = await prisma.lead.findFirst({
//       where: {
//         companyId: integration.companyId,
//         createdAt: { gte: since },
//         OR: [...(phone ? [{ phone }] : []), ...(email ? [{ email }] : [])],
//       },
//       select: { id: true },
//     });
//     if (duplicate) {
//       return res.json({ success: true, duplicate: true, leadId: duplicate.id });
//     }

//     // Only the visitor's own message goes in Requirements (no page link)
//     const requirements = message ? message.slice(0, 2000) : null;

//     const lead = await prisma.lead.create({
//       data: {
//         companyId: integration.companyId,
//         name: name || "Website Visitor",
//         phone,
//         email: email || null,
//         companyName: companyName || null,
//         source: `Website - ${integration.name}`.slice(0, 100),
//         requirements,
//         status: "NEW",
//       },
//     });

//     // powers "Last lead received" in the dashboard
//     await prisma.integration.update({
//       where: { id: integration.id },
//       data: { lastEventAt: new Date() },
//     });

//     return res.status(201).json({ success: true, leadId: lead.id });
//   } catch (err) {
//     console.error("Public lead error:", err);
//     return res.status(500).json({ success: false, message: "Server error" });
//   }
// });

// // ------------------------------------------------------
// // The browser script. Written as a normal function so it is easy to read
// // and edit; it is sent to browsers as text (see the route below).
// // KEEP IT SELF-CONTAINED: it must not use any variable from this file.
// // ------------------------------------------------------
// function widgetMain(CFG) {
//   if (window.__crmLeadWidget) return;
//   window.__crmLeadWidget = true;

//   var script = document.currentScript;
//   var attr = function (n) {
//     return script && script.getAttribute ? script.getAttribute(n) : null;
//   };
//   var formSelector = attr("data-form");
//   var showButton = attr("data-widget") === "true";
//   var title = attr("data-title") || "Contact us";
//   var color = attr("data-color") || "#16a34a";
//   var last = { sig: "", at: 0 };

//   // ---------- send one lead to the CRM ----------
//   function send(d) {
//     d = d || {};
//     var payload = {
//       name: d.name || "",
//       phone: d.phone || "",
//       email: d.email || "",
//       message: d.message || "",
//       companyName: d.companyName || "",
//       pageUrl: location.href,
//     };
//     var sig = payload.phone + "|" + payload.email + "|" + payload.message;
//     var now = Date.now();
//     if (sig === last.sig && now - last.at < 5000) {
//       return Promise.resolve({ success: true, skipped: true });
//     }
//     last = { sig: sig, at: now };
//     return fetch(CFG.endpoint, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(payload),
//       keepalive: true,
//     })
//       .then(function (r) {
//         return r.json();
//       })
//       .catch(function () {
//         return { success: false };
//       });
//   }

//   // ---------- understand a form, whatever its field names ----------
//   function hintOf(el) {
//     var label = "";
//     try {
//       if (el.labels && el.labels[0]) label = el.labels[0].textContent || "";
//     } catch (e) {}
//     var text = (
//       (el.name || "") + " " + (el.id || "") + " " +
//       (el.placeholder || "") + " " +
//       (el.getAttribute("aria-label") || "") + " " + label
//     ).toLowerCase();
//     // "contact_no_1" / "first-name" / "e.mail" are also matched as words
//     return text + " " + text.replace(/[_\-.]+/g, " ");
//   }

//   function collect(form) {
//     var d = { name: "", first: "", last: "", phone: "", email: "", message: "", companyName: "" };
//     var extras = [];
//     var skipTypes = ["hidden", "password", "submit", "button", "reset", "file", "image"];

//     for (var i = 0; i < form.elements.length; i++) {
//       var el = form.elements[i];
//       var tag = (el.tagName || "").toLowerCase();
//       var type = (el.type || "").toLowerCase();
//       if (tag !== "input" && tag !== "textarea" && tag !== "select") continue;
//       if (skipTypes.indexOf(type) > -1) continue;
//       if ((type === "checkbox" || type === "radio") && !el.checked) continue;
//       var value = (el.value || "").trim();
//       if (!value) continue;
//       var h = hintOf(el);
//       if (/honeypot|captcha|nonce|csrf|token|website_url/.test(h)) continue;

//       if (type === "email" || /e-?mail/.test(h)) { if (!d.email) d.email = value; }
//       else if (type === "tel" || /phone|mobile|whats ?app|contact ?(no|num)|\btel\b|\bcell\b/.test(h)) { if (!d.phone) d.phone = value; }
//       else if (/first.?name|fname|given/.test(h)) d.first = value;
//       else if (/last.?name|lname|surname|family/.test(h)) d.last = value;
//       else if (/company|organi[sz]ation|business/.test(h)) { if (!d.companyName) d.companyName = value; }
//       else if (tag === "textarea" || /message|comment|enquir|inquir|requirement|query|details|description|note/.test(h)) {
//         d.message = d.message ? d.message + "\n" + value : value;
//       }
//       else if (/name/.test(h)) { if (!d.name) d.name = value; }
//       else extras.push((el.placeholder || el.name || el.id || "Field") + ": " + value);
//     }

//     d.name = d.name || (d.first + " " + d.last).trim();
//     // fields we could not classify are kept in the message, so nothing is lost
//     if (extras.length) d.message = (d.message ? d.message + "\n" : "") + extras.join(" | ");
//     return d;
//   }

//   function shouldSkip(form) {
//     if (form.hasAttribute("data-crm-ignore")) return true;
//     if (formSelector && !(form.matches && form.matches(formSelector))) return true;
//     if (form.querySelector('input[type="password"]')) return true; // login / signup
//     if (form.getAttribute("role") === "search") return true;
//     var inputs = form.querySelectorAll("input:not([type=hidden]), textarea, select");
//     if (inputs.length === 1 && (inputs[0].type || "").toLowerCase() === "search") return true;
//     return false;
//   }

//   // ---------- 1. watch every form on the page ----------
//   // Listens on the document, so forms added later (popups, React) work too.
//   // We never block or change the form - it submits exactly as before.
//   document.addEventListener(
//     "submit",
//     function (e) {
//       var form = e.target;
//       if (!form || form.tagName !== "FORM" || shouldSkip(form)) return;
//       var d = collect(form);
//       if (!d.phone && !d.email) return;
//       send(d);
//     },
//     true
//   );

//   // ---------- 2. optional floating "Contact us" button ----------
//   function mountButton() {
//     var wrap = document.createElement("div");
//     wrap.setAttribute("data-crm-ignore", "1");
//     wrap.style.cssText = "position:fixed;right:20px;bottom:20px;z-index:2147483000;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;";

//     var box = document.createElement("div");
//     box.style.cssText = "display:none;width:300px;max-width:calc(100vw - 40px);margin-bottom:12px;padding:16px;background:#fff;color:#111;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,.18);";

//     var h = document.createElement("div");
//     h.textContent = title;
//     h.style.cssText = "font-weight:600;font-size:16px;margin-bottom:10px;";

//     var form = document.createElement("form");
//     form.setAttribute("data-crm-ignore", "1");
//     form.noValidate = true;
//     var fieldStyle = "width:100%;box-sizing:border-box;margin:0 0 8px;padding:9px 10px;border:1px solid #d1d5db;border-radius:8px;font:inherit;font-size:14px;color:#111;background:#fff;";
//     form.innerHTML =
//       '<input name="name" placeholder="Your name" style="' + fieldStyle + '">' +
//       '<input name="phone" type="tel" placeholder="Mobile number" style="' + fieldStyle + '">' +
//       '<input name="email" type="email" placeholder="Email" style="' + fieldStyle + '">' +
//       '<textarea name="message" rows="3" placeholder="How can we help?" style="' + fieldStyle + 'resize:vertical;"></textarea>' +
//       '<button type="submit" style="width:100%;padding:10px;border:0;border-radius:8px;background:' + color + ';color:#fff;font:inherit;font-size:14px;font-weight:600;cursor:pointer;">Send</button>' +
//       '<div data-status style="font-size:13px;margin-top:8px;min-height:16px;"></div>';

//     var status = form.querySelector("[data-status]");
//     form.addEventListener("submit", function (e) {
//       e.preventDefault();
//       var d = collect(form);
//       if (!d.phone && !d.email) {
//         status.style.color = "#b91c1c";
//         status.textContent = "Please enter your mobile number or email.";
//         return;
//       }
//       status.style.color = "#374151";
//       status.textContent = "Sending...";
//       send(d).then(function (res) {
//         if (res && res.success) {
//           status.style.color = "#15803d";
//           status.textContent = "Thank you! We will contact you soon.";
//           form.reset();
//         } else {
//           status.style.color = "#b91c1c";
//           status.textContent = (res && res.message) || "Could not send. Please try again.";
//         }
//       });
//     });

//     var btn = document.createElement("button");
//     btn.type = "button";
//     btn.textContent = title;
//     btn.style.cssText = "display:block;margin-left:auto;padding:12px 18px;border:0;border-radius:999px;background:" + color + ";color:#fff;font:inherit;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25);";
//     btn.addEventListener("click", function () {
//       box.style.display = box.style.display === "none" ? "block" : "none";
//     });

//     box.appendChild(h);
//     box.appendChild(form);
//     wrap.appendChild(box);
//     wrap.appendChild(btn);
//     document.body.appendChild(wrap);
//   }

//   if (showButton) {
//     if (document.body) mountButton();
//     else document.addEventListener("DOMContentLoaded", mountButton);
//   }

//   // ---------- 3. for developers: CRMLeads.send({...}) ----------
//   window.CRMLeads = { send: send };
// }

// // ------------------------------------------------------
// // GET /api/public/widget.js?key=<webhookKey>
// // ------------------------------------------------------
// router.get("/widget.js", async (req, res) => {
//   res.type("application/javascript; charset=utf-8");
//   try {
//     const key = String(req.query.key || "");
//     const integration = key ? await findWebsiteIntegration(key) : null;

//     if (
//       !integration ||
//       integration.status !== "ACTIVE" ||
//       integration.provider !== "WEBSITE"
//     ) {
//       return res
//         .status(404)
//         .send('console.warn("CRM lead script: this key is invalid or inactive.");');
//     }

//     // Where should the browser send leads? Prefer an env value (safest).
//     let base = (process.env.PUBLIC_API_URL || "").replace(/\/+$/, "");
//     if (!base) {
//       const proto = String(req.headers["x-forwarded-proto"] || req.protocol)
//         .split(",")[0]
//         .trim();
//       const host = String(req.get("host") || "");
//       if (!/^[a-z0-9.\-:]+$/i.test(host)) {
//         return res.status(400).send('console.warn("CRM lead script: bad host.");');
//       }
//       base = `${proto}://${host}`;
//     }

//     const config = { endpoint: `${base}/api/public/leads/${key}` };

//     res.set("Cache-Control", "public, max-age=300");
//     return res.send(
//       `(${widgetMain.toString()})(${JSON.stringify(config)});`
//     );
//   } catch (err) {
//     console.error("Widget script error:", err);
//     return res.status(500).send('console.warn("CRM lead script: server error.");');
//   }
// });

// module.exports = router;



// ======================================================
// backend/src/routes/publicLeadRoutes.js
//
// PUBLIC endpoints used by customers' websites. No login.
//
//   GET  /api/public/widget.js?key=<webhookKey>
//        -> the ONE script a customer pastes on their site.
//           It finds their forms and sends every submission to the CRM.
//
//   POST /api/public/leads/<webhookKey>
//        -> creates a Lead (called by the script above, or by anyone's code).
//
// The <webhookKey> is the key of an Integration with provider WEBSITE.
// It is PUBLIC (visible in page source) - that is fine, it can only
// CREATE leads, never read anything.
// ======================================================
const express = require("express");
const cors = require("cors");
const prisma = require("../config/prisma");
const { normalizeIndianPhone } = require("../utils/phoneUtils");

const router = express.Router();

// ------------------------------------------------------
// CORS + body parsing for THIS router only.
//
// Customers' websites are on other domains, so the browser asks
// permission first ("preflight"). The app's global CORS setting is
// usually limited to the CRM's own frontend, so these routes must
// answer for themselves. That is why server.js mounts this router
// BEFORE the global cors() - and why it parses JSON here too.
//
// Which websites may really send leads is decided per integration
// ("Your website address" in the dashboard), not here.
// ------------------------------------------------------
router.use(
  cors({
    origin: true, // reflect the caller's origin
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    credentials: false, // public endpoint: no cookies
    maxAge: 86400,
  })
);
router.use(express.json({ limit: "100kb" }));

// ------------------------------------------------------
// helpers
// ------------------------------------------------------
const clean = (v, max = 500) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

// Behind a proxy (Render, Nginx...) req.ip is the proxy, so read the header.
const getIp = (req) =>
  String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
  req.ip ||
  "unknown";

// Indian numbers -> 91XXXXXXXXXX (same format WhatsApp uses).
// Other countries: keep digits only (8-15 digits).
const toPhone = (value) => {
  if (!value) return null;
  const indian = normalizeIndianPhone(String(value));
  if (indian) return indian;
  const digits = String(value).replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15 ? digits : null;
};

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

// "https://www.Shop.com/page" or "shop.com" -> "shop.com"
const hostOf = (value) => {
  try {
    const v = String(value || "").trim();
    if (!v) return "";
    const url = new URL(v.includes("://") ? v : `https://${v}`);
    return url.hostname.toLowerCase().replace(/^www\./, "");
  } catch (e) {
    return "";
  }
};

// Empty list = any website may send leads.
// Subdomains of an allowed domain are allowed too.
// NOTE: this stops casual misuse from OTHER websites. It is not a hard
// security wall (a script on a server can fake the Origin header).
const isOriginAllowed = (origin, allowed) => {
  if (!Array.isArray(allowed) || allowed.length === 0) return true;
  if (!origin) return true;
  const host = hostOf(origin);
  return allowed.some((a) => {
    const h = hostOf(a);
    return h && (host === h || host.endsWith(`.${h}`));
  });
};

// tiny in-memory rate limiter
const hits = new Map();
const rateLimit = (max, windowMs) => (req, res, next) => {
  const id = `${getIp(req)}:${req.params.publicKey || req.query.key || ""}`;
  const now = Date.now();
  const recent = (hits.get(id) || []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    return res
      .status(429)
      .json({ success: false, message: "Too many requests. Try again later." });
  }
  recent.push(now);
  hits.set(id, recent);
  next();
};
setInterval(() => hits.clear(), 10 * 60 * 1000).unref();

const findWebsiteIntegration = (key) =>
  prisma.integration.findUnique({ where: { webhookKey: String(key || "") } });

// ------------------------------------------------------
// POST /api/public/leads/:publicKey
// ------------------------------------------------------
router.post("/leads/:publicKey", rateLimit(10, 60 * 1000), async (req, res) => {
  try {
    const integration = await findWebsiteIntegration(req.params.publicKey);

    if (
      !integration ||
      integration.status !== "ACTIVE" ||
      integration.provider !== "WEBSITE"
    ) {
      return res.status(404).json({ success: false, message: "Invalid key" });
    }

    const allowed = integration.settings?.allowedOrigins;
    if (!isOriginAllowed(req.headers.origin, allowed)) {
      return res
        .status(403)
        .json({ success: false, message: "This website is not allowed" });
    }

    const body = req.body || {};

    // Honeypot: bots fill hidden fields, people don't. Pretend success.
    if (body.website_url) return res.json({ success: true });

    const name = clean(body.name, 120);
    const emailRaw = clean(body.email, 200);
    const email = isEmail(emailRaw) ? emailRaw : "";
    const phoneRaw = clean(body.phone, 40);
    const phone = toPhone(phoneRaw);
    const companyName = clean(body.companyName, 200);
    const message = clean(body.message, 1800);
    const pageUrl = clean(body.pageUrl, 300);

    if (!phone && !email) {
      return res.status(400).json({
        success: false,
        message: phoneRaw
          ? "Phone number is not valid"
          : "Phone or email is required",
      });
    }

    // Same person sending twice in 24h = one lead
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const duplicate = await prisma.lead.findFirst({
      where: {
        companyId: integration.companyId,
        createdAt: { gte: since },
        OR: [...(phone ? [{ phone }] : []), ...(email ? [{ email }] : [])],
      },
      select: { id: true },
    });
    if (duplicate) {
      return res.json({ success: true, duplicate: true, leadId: duplicate.id });
    }

    const requirements =
      [message, pageUrl ? `Page: ${pageUrl}` : ""]
        .filter(Boolean)
        .join("\n\n")
        .slice(0, 2000) || null;

    const lead = await prisma.lead.create({
      data: {
        companyId: integration.companyId,
        name: name || "Website Visitor",
        phone,
        email: email || null,
        companyName: companyName || null,
        source: `Website - ${integration.name}`.slice(0, 100),
        requirements,
        status: "NEW",
      },
    });

    // powers "Last lead received" in the dashboard
    await prisma.integration.update({
      where: { id: integration.id },
      data: { lastEventAt: new Date() },
    });

    return res.status(201).json({ success: true, leadId: lead.id });
  } catch (err) {
    console.error("Public lead error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ------------------------------------------------------
// The browser script. Written as a normal function so it is easy to read
// and edit; it is sent to browsers as text (see the route below).
// KEEP IT SELF-CONTAINED: it must not use any variable from this file.
// ------------------------------------------------------
function widgetMain(CFG) {
  if (window.__crmLeadWidget) return;
  window.__crmLeadWidget = true;

  var script = document.currentScript;
  var attr = function (n) {
    return script && script.getAttribute ? script.getAttribute(n) : null;
  };
  var formSelector = attr("data-form");
  var showButton = attr("data-widget") === "true";
  var title = attr("data-title") || "Contact us";
  var color = attr("data-color") || "#16a34a";
  var last = { sig: "", at: 0 };

  // ---------- send one lead to the CRM ----------
  function send(d) {
    d = d || {};
    var payload = {
      name: d.name || "",
      phone: d.phone || "",
      email: d.email || "",
      message: d.message || "",
      companyName: d.companyName || "",
      pageUrl: location.href,
    };
    var sig = payload.phone + "|" + payload.email + "|" + payload.message;
    var now = Date.now();
    if (sig === last.sig && now - last.at < 5000) {
      return Promise.resolve({ success: true, skipped: true });
    }
    last = { sig: sig, at: now };
    return fetch(CFG.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    })
      .then(function (r) {
        return r.json();
      })
      .catch(function () {
        return { success: false };
      });
  }

  // ---------- understand a form, whatever its field names ----------
  function hintOf(el) {
    var label = "";
    try {
      if (el.labels && el.labels[0]) label = el.labels[0].textContent || "";
    } catch (e) {}
    var text = (
      (el.name || "") + " " + (el.id || "") + " " +
      (el.placeholder || "") + " " +
      (el.getAttribute("aria-label") || "") + " " + label
    ).toLowerCase();
    // "contact_no_1" / "first-name" / "e.mail" are also matched as words
    return text + " " + text.replace(/[_\-.]+/g, " ");
  }

  // "companyName" / "contact_no" -> "Company name" / "Contact no"
  function humanize(s) {
    s = String(s || "").replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_\-.]+/g, " ").trim();
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
  }

  // The best human name for a field: its <label>, then aria-label, then its
  // name/id, and only last the placeholder (which is usually an example).
  function labelOf(el) {
    var t = "";
    try {
      if (el.labels && el.labels[0]) t = (el.labels[0].textContent || "").trim();
    } catch (e) {}
    if (!t) t = (el.getAttribute("aria-label") || "").trim();
    if (!t) t = humanize(el.name || el.id);
    if (!t) t = (el.placeholder || "").trim();
    return t || "Field";
  }

  function collect(form) {
    var d = { name: "", first: "", last: "", phone: "", email: "", message: "", companyName: "" };
    var extras = [];
    var skipTypes = ["hidden", "password", "submit", "button", "reset", "file", "image"];

    for (var i = 0; i < form.elements.length; i++) {
      var el = form.elements[i];
      var tag = (el.tagName || "").toLowerCase();
      var type = (el.type || "").toLowerCase();
      if (tag !== "input" && tag !== "textarea" && tag !== "select") continue;
      if (skipTypes.indexOf(type) > -1) continue;
      if ((type === "checkbox" || type === "radio") && !el.checked) continue;
      var value = (el.value || "").trim();
      if (!value) continue;
      var h = hintOf(el);
      if (/honeypot|captcha|nonce|csrf|token|website_url/.test(h)) continue;

      if (type === "email" || /e-?mail/.test(h)) { if (!d.email) d.email = value; }
      else if (type === "tel" || /phone|mobile|whats ?app|contact ?(no|num)|\btel\b|\bcell\b/.test(h)) { if (!d.phone) d.phone = value; }
      else if (/first.?name|fname|given/.test(h)) d.first = value;
      else if (/last.?name|lname|surname|family/.test(h)) d.last = value;
      else if (/company|organi[sz]ation|business/.test(h)) { if (!d.companyName) d.companyName = value; }
      else if (tag === "textarea" || /message|comment|enquir|inquir|requirement|query|details|description|note/.test(h)) {
        d.message = d.message ? d.message + "\n" + value : value;
      }
      else if (/name/.test(h)) { if (!d.name) d.name = value; }
      else extras.push(labelOf(el) + ": " + value);
    }

    d.name = d.name || (d.first + " " + d.last).trim();
    // fields we could not classify are kept in the message, so nothing is lost
    if (extras.length) d.message = (d.message ? d.message + "\n" : "") + extras.join(" | ");
    return d;
  }

  function shouldSkip(form) {
    if (form.hasAttribute("data-crm-ignore")) return true;
    if (formSelector && !(form.matches && form.matches(formSelector))) return true;
    if (form.querySelector('input[type="password"]')) return true; // login / signup
    if (form.getAttribute("role") === "search") return true;
    var inputs = form.querySelectorAll("input:not([type=hidden]), textarea, select");
    if (inputs.length === 1 && (inputs[0].type || "").toLowerCase() === "search") return true;
    return false;
  }

  // ---------- 1. watch every form on the page ----------
  // Listens on the document, so forms added later (popups, React) work too.
  // We never block or change the form - it submits exactly as before.
  document.addEventListener(
    "submit",
    function (e) {
      var form = e.target;
      if (!form || form.tagName !== "FORM" || shouldSkip(form)) return;
      var d = collect(form);
      if (!d.phone && !d.email) return;
      send(d);
    },
    true
  );

  // ---------- 2. optional floating "Contact us" button ----------
  function mountButton() {
    var wrap = document.createElement("div");
    wrap.setAttribute("data-crm-ignore", "1");
    wrap.style.cssText = "position:fixed;right:20px;bottom:20px;z-index:2147483000;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;";

    var box = document.createElement("div");
    box.style.cssText = "display:none;width:300px;max-width:calc(100vw - 40px);margin-bottom:12px;padding:16px;background:#fff;color:#111;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,.18);";

    var h = document.createElement("div");
    h.textContent = title;
    h.style.cssText = "font-weight:600;font-size:16px;margin-bottom:10px;";

    var form = document.createElement("form");
    form.setAttribute("data-crm-ignore", "1");
    form.noValidate = true;
    var fieldStyle = "width:100%;box-sizing:border-box;margin:0 0 8px;padding:9px 10px;border:1px solid #d1d5db;border-radius:8px;font:inherit;font-size:14px;color:#111;background:#fff;";
    form.innerHTML =
      '<input name="name" placeholder="Your name" style="' + fieldStyle + '">' +
      '<input name="phone" type="tel" placeholder="Mobile number" style="' + fieldStyle + '">' +
      '<input name="email" type="email" placeholder="Email" style="' + fieldStyle + '">' +
      '<textarea name="message" rows="3" placeholder="How can we help?" style="' + fieldStyle + 'resize:vertical;"></textarea>' +
      '<button type="submit" style="width:100%;padding:10px;border:0;border-radius:8px;background:' + color + ';color:#fff;font:inherit;font-size:14px;font-weight:600;cursor:pointer;">Send</button>' +
      '<div data-status style="font-size:13px;margin-top:8px;min-height:16px;"></div>';

    var status = form.querySelector("[data-status]");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var d = collect(form);
      if (!d.phone && !d.email) {
        status.style.color = "#b91c1c";
        status.textContent = "Please enter your mobile number or email.";
        return;
      }
      status.style.color = "#374151";
      status.textContent = "Sending...";
      send(d).then(function (res) {
        if (res && res.success) {
          status.style.color = "#15803d";
          status.textContent = "Thank you! We will contact you soon.";
          form.reset();
        } else {
          status.style.color = "#b91c1c";
          status.textContent = (res && res.message) || "Could not send. Please try again.";
        }
      });
    });

    var btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = title;
    btn.style.cssText = "display:block;margin-left:auto;padding:12px 18px;border:0;border-radius:999px;background:" + color + ";color:#fff;font:inherit;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25);";
    btn.addEventListener("click", function () {
      box.style.display = box.style.display === "none" ? "block" : "none";
    });

    box.appendChild(h);
    box.appendChild(form);
    wrap.appendChild(box);
    wrap.appendChild(btn);
    document.body.appendChild(wrap);
  }

  if (showButton) {
    if (document.body) mountButton();
    else document.addEventListener("DOMContentLoaded", mountButton);
  }

  // ---------- 3. for developers: CRMLeads.send({...}) ----------
  window.CRMLeads = { send: send };
}

// ------------------------------------------------------
// GET /api/public/widget.js?key=<webhookKey>
// ------------------------------------------------------
router.get("/widget.js", async (req, res) => {
  res.type("application/javascript; charset=utf-8");
  try {
    const key = String(req.query.key || "");
    const integration = key ? await findWebsiteIntegration(key) : null;

    if (
      !integration ||
      integration.status !== "ACTIVE" ||
      integration.provider !== "WEBSITE"
    ) {
      return res
        .status(404)
        .send('console.warn("CRM lead script: this key is invalid or inactive.");');
    }

    // Where should the browser send leads? Prefer an env value (safest).
    let base = (process.env.PUBLIC_API_URL || "").replace(/\/+$/, "");
    if (!base) {
      const proto = String(req.headers["x-forwarded-proto"] || req.protocol)
        .split(",")[0]
        .trim();
      const host = String(req.get("host") || "");
      if (!/^[a-z0-9.\-:]+$/i.test(host)) {
        return res.status(400).send('console.warn("CRM lead script: bad host.");');
      }
      base = `${proto}://${host}`;
    }

    const config = { endpoint: `${base}/api/public/leads/${key}` };

    res.set("Cache-Control", "public, max-age=300");
    return res.send(
      `(${widgetMain.toString()})(${JSON.stringify(config)});`
    );
  } catch (err) {
    console.error("Widget script error:", err);
    return res.status(500).send('console.warn("CRM lead script: server error.");');
  }
});

module.exports = router;