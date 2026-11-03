// backend/src/services/emailTemplates.js   (NEW FILE)
//
// Shared layout for every email the CRM sends (employee credentials,
// password reset). Only the DESIGN lives here - sending logic stays in
// emailService.js and passwordResetEmail.js.
//
// Simple, professional layout: centered logo, heading, text, optional
// details box, one button, small note, fallback link, sign-off.
// Built with tables + inline CSS so it looks right in Gmail, Outlook,
// Apple Mail and on phones.
//
// LOGO: loaded from your frontend's public folder
//   <FRONTEND_URL>/email-logo.png
// (put frontend/public/email-logo.png on the server). To use a different
// image, set EMAIL_LOGO_URL in backend/.env to its full https:// address.

const { buildFrontendUrl } = require("../utils/frontendUrl");

const BRAND_NAME = "Vatup CRM";
const BRAND_COLOR = "#16a34a";

const getLogoUrl = () => {
  const custom = (process.env.EMAIL_LOGO_URL || "").trim();

  if (/^https?:\/\//i.test(custom)) return custom;

  return buildFrontendUrl("/email-logo.png");
};

// Escape anything coming from a user / the database before it goes into
// the HTML, so a name like  <b>John</b>  can never break the email.
const esc = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const FONT = "Arial,Helvetica,sans-serif";

// Normal paragraph
const paragraph = (html) =>
  `<p style="margin:0 0 14px 0;font-family:${FONT};font-size:15px;line-height:1.65;color:#222222;">${html}</p>`;

// Small grey paragraph (notes, fallback link text)
const smallText = (html) =>
  `<p style="margin:0 0 14px 0;font-family:${FONT};font-size:13px;line-height:1.65;color:#666666;">${html}</p>`;

// Light grey box with "label   value" rows (used for login details)
const detailsBox = (rows) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;margin:18px 0;">
    <tr>
      <td style="padding:14px 18px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          ${rows
            .map(
              (row) => `
          <tr>
            <td width="170" style="width:170px;padding:5px 12px 5px 0;font-family:${FONT};font-size:15px;color:#555555;white-space:nowrap;vertical-align:top;">${esc(
                row.label
              )}</td>
            <td style="padding:5px 0;font-family:${
              row.mono ? "'Courier New',Courier,monospace" : FONT
            };font-size:15px;color:#111111;${
                row.mono ? "font-weight:bold;" : ""
              }word-break:break-all;vertical-align:top;">${esc(row.value)}</td>
          </tr>`
            )
            .join("")}
        </table>
      </td>
    </tr>
  </table>`;

// Green button
const button = (label, url) => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px 0;">
    <tr>
      <td align="center" bgcolor="${BRAND_COLOR}" style="border-radius:6px;">
        <a href="${esc(url)}" target="_blank"
           style="display:inline-block;padding:12px 28px;font-family:${FONT};font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:6px;">${esc(
    label
  )}</a>
      </td>
    </tr>
  </table>`;

// "Button not working? Copy this link ..." block
const fallbackLink = (url) =>
  smallText(
    `Button not working? Copy this link into your browser:<br />
     <a href="${esc(url)}" style="color:${BRAND_COLOR};word-break:break-all;">${esc(
      url
    )}</a>`
  );

// Wraps the content in the page layout (logo, heading, sign-off, footer)
//   preheader : short text shown in the inbox list next to the subject
//   title     : heading inside the email
//   bodyHtml  : the main content (already safe / escaped HTML)
const layout = ({ preheader = "", title, bodyHtml }) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(
    preheader
  )}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f4f4f5">
    <tr>
      <td align="center" style="padding:28px 12px;">

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
               style="max-width:560px;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;">
          <tr>
            <td style="padding:32px 36px;">

              <!-- Logo -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom:20px;border-bottom:1px solid #e5e7eb;">
                    <img src="${esc(getLogoUrl())}" alt="${esc(
  BRAND_NAME
)}" width="260"
                         style="display:block;width:260px;max-width:100%;height:auto;border:0;margin:0 auto;" />
                  </td>
                </tr>
              </table>

              <!-- Heading -->
              <h1 style="margin:24px 0 16px 0;font-family:${FONT};font-size:20px;line-height:1.3;color:#111111;">${esc(
  title
)}</h1>

              ${bodyHtml}

              <!-- Sign-off -->
              <hr style="border:0;border-top:1px solid #e5e7eb;margin:10px 0 18px 0;" />
              <p style="margin:0 0 14px 0;font-family:${FONT};font-size:15px;line-height:1.65;color:#222222;">
                Regards,<br />${esc(BRAND_NAME)} Team
              </p>
              <p style="margin:0;font-family:${FONT};font-size:12px;line-height:1.6;color:#999999;">
                This is an automated email. Please do not reply.
              </p>

            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;

module.exports = {
  BRAND_NAME,
  esc,
  layout,
  paragraph,
  smallText,
  detailsBox,
  button,
  fallbackLink,
};