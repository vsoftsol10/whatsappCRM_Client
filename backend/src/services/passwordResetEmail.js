// const axios = require("axios");

// const sendPasswordResetEmail = async (
//   email,
//   resetLink
// ) => {
//   await axios.post(
//     "https://api.brevo.com/v3/smtp/email",
//     {
//       sender: {
//         name: "WhatsApp CRM",
//         email: process.env.EMAIL_USER, // must be a verified sender in Brevo
//       },
//       to: [{ email }],
//       subject: "Reset Your Password",
//       textContent: `
// Click the link below to reset your password:

// ${resetLink}

// This link expires in 1 hour.

// Regards,
// WhatsApp CRM Team
//       `,
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
const axios = require("axios");

const sendPasswordResetEmail = async (email, resetLink) => {
  // Safety net: never send a broken link
  if (!resetLink || !/^https?:\/\//i.test(resetLink)) {
    throw new Error(
      `Invalid reset link "${resetLink}". Check FRONTEND_URL on the server.`
    );
  }

  await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: {
        name: "WhatsApp CRM",
        email: process.env.EMAIL_USER, // must be a verified sender in Brevo
      },
      to: [{ email }],
      subject: "Reset Your Password",
      htmlContent: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto">
          <h2>Reset your password</h2>
          <p>Click the button below to reset your password:</p>
          <p>
            <a href="${resetLink}"
               style="background:#25D366;color:#fff;padding:12px 24px;
                      text-decoration:none;border-radius:6px;display:inline-block">
              Reset Password
            </a>
          </p>
          <p>Or copy this link into your browser:<br/>
             <a href="${resetLink}">${resetLink}</a></p>
          <p>This link expires in 1 hour.</p>
          <p>Regards,<br/>WhatsApp CRM Team</p>
        </div>
      `,
      textContent: `Click the link below to reset your password:

${resetLink}

This link expires in 1 hour.

Regards,
WhatsApp CRM Team`,
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