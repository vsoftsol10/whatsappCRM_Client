
// // backend/src/services/passwordResetEmail.js
// const axios = require("axios");

// const sendPasswordResetEmail = async (email, resetLink) => {
//   // Safety net: never send a broken link
//   if (!resetLink || !/^https?:\/\//i.test(resetLink)) {
//     throw new Error(
//       `Invalid reset link "${resetLink}". Check FRONTEND_URL on the server.`
//     );
//   }

//   await axios.post(
//     "https://api.brevo.com/v3/smtp/email",
//     {
//       sender: {
//         name: "Vatup CRM",
//         email: process.env.EMAIL_USER, // must be a verified sender in Brevo
//       },
//       to: [{ email }],
//       subject: "Reset Your Password",
//       htmlContent: `
//         <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto">
//           <h2>Reset your password</h2>
//           <p>Click the button below to reset your password:</p>
//           <p>
//             <a href="${resetLink}"
//                style="background:#25D366;color:#fff;padding:12px 24px;
//                       text-decoration:none;border-radius:6px;display:inline-block">
//               Reset Password
//             </a>
//           </p>
//           <p>Or copy this link into your browser:<br/>
//              <a href="${resetLink}">${resetLink}</a></p>
//           <p>This link expires in 1 hour.</p>
//           <p>Regards,<br/>Vatup CRM Team</p>
//         </div>
//       `,
//       textContent: `Click the link below to reset your password:

// ${resetLink}

// This link expires in 1 hour.

// Regards,
// Vatup CRM Team`,
//     },
//     {
//       headers: {
//         "api-key": process.env.BREVO_API_KEY,
//         "Content-Type": "application/json",
//       },
//       timeout: 15000,
//     }
//   );
// };

// module.exports = sendPasswordResetEmail;


// backend/src/services/passwordResetEmail.js
//
// Sends the "Reset your password" email. Same function name, same
// arguments, same safety check and same Brevo call as before; only the
// email DESIGN changed (see emailTemplates.js).

const axios = require("axios");
const {
  BRAND_NAME,
  layout,
  paragraph,
  smallText,
  button,
  fallbackLink,
} = require("./emailTemplates");

const sendPasswordResetEmail = async (email, resetLink) => {
  // Safety net: never send a broken link
  if (!resetLink || !/^https?:\/\//i.test(resetLink)) {
    throw new Error(
      `Invalid reset link "${resetLink}". Check FRONTEND_URL on the server.`
    );
  }

  const htmlContent = layout({
    preheader: "Use the link inside to choose a new password. It expires in 1 hour.",
    title: "Reset your password",
    bodyHtml: `
      ${paragraph("Hello,")}
      ${paragraph(
        "We received a request to reset your password. Click the button below to choose a new one."
      )}

      ${button("Reset Password", resetLink)}

      ${smallText(
        "This link expires in 1 hour. If you didn't request this, you can ignore this email and your password will stay the same."
      )}
      ${fallbackLink(resetLink)}
    `,
  });

  await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: {
        name: BRAND_NAME,
        email: process.env.EMAIL_USER, // must be a verified sender in Brevo
      },
      to: [{ email }],
      subject: "Reset Your Password",
      htmlContent,
      textContent: `Click the link below to reset your password:

${resetLink}

This link expires in 1 hour.

Regards,
${BRAND_NAME} Team`,
    },
    {
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      timeout: 15000,
    }
  );
};

module.exports = sendPasswordResetEmail;