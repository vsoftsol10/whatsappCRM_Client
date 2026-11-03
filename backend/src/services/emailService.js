
// const axios = require("axios");
// const { buildFrontendUrl } = require("../utils/frontendUrl");

// // Change the brand name here and it updates every employee-credentials email
// const BRAND_NAME = "Vatup CRM";

// const sendEmployeeCredentials = async (
//   name,
//   email,
//   tempPassword,
//   companyId
// ) => {
//   const loginPath = companyId
//     ? `/login?company=${encodeURIComponent(companyId)}`
//     : "/login";
//   const loginUrl = buildFrontendUrl(loginPath);

//   await axios.post(
//     "https://api.brevo.com/v3/smtp/email",
//     {
//       sender: {
//         name: BRAND_NAME,
//         email: process.env.EMAIL_USER, // must be a verified sender in Brevo
//       },

//       to: [
//         {
//           email,
//           name,
//         },
//       ],

//       subject: `Welcome to ${BRAND_NAME}`,

//       textContent: `
// Hello ${name},

// Your ${BRAND_NAME} account has been created successfully.

// Login Details
// -------------

// Email: ${email}
// Temporary Password: ${tempPassword}

// Login URL:
// ${loginUrl}

// Please change your password after your first login.

// Regards,
// ${BRAND_NAME} Team
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

// module.exports = sendEmployeeCredentials;


// backend/src/services/emailService.js
//
// Sends the "Welcome - here are your login details" email to a new
// employee. Same function name, same arguments and same Brevo call as
// before; only the email DESIGN changed (see emailTemplates.js).

const axios = require("axios");
const { buildFrontendUrl } = require("../utils/frontendUrl");
const {
  BRAND_NAME,
  esc,
  layout,
  paragraph,
  smallText,
  detailsBox,
  button,
  fallbackLink,
} = require("./emailTemplates");

const sendEmployeeCredentials = async (
  name,
  email,
  tempPassword,
  companyId
) => {
  const loginPath = companyId
    ? `/login?company=${encodeURIComponent(companyId)}`
    : "/login";
  const loginUrl = buildFrontendUrl(loginPath);

  const htmlContent = layout({
    preheader: `Your ${BRAND_NAME} account is ready. Here are your login details.`,
    title: `Welcome to ${BRAND_NAME}`,
    bodyHtml: `
      ${paragraph(`Hello ${esc(name)},`)}
      ${paragraph(
        "Your account has been created. You can sign in with the details below."
      )}

      ${detailsBox([
        { label: "Email", value: email },
        { label: "Temporary password", value: tempPassword, mono: true },
      ])}

      ${button("Log in", loginUrl)}

      ${smallText("Please change your password after your first login.")}
      ${fallbackLink(loginUrl)}
    `,
  });

  await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: {
        name: BRAND_NAME,
        email: process.env.EMAIL_USER, // must be a verified sender in Brevo
      },

      to: [
        {
          email,
          name,
        },
      ],

      subject: `Welcome to ${BRAND_NAME}`,

      htmlContent,

      // Plain-text version for email apps that don't show HTML
      textContent: `
Hello ${name},

Your ${BRAND_NAME} account has been created successfully.

Login Details
-------------

Email: ${email}
Temporary Password: ${tempPassword}

Login URL:
${loginUrl}

Please change your password after your first login.

Regards,
${BRAND_NAME} Team
      `,
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

module.exports = sendEmployeeCredentials;