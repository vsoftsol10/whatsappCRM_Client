// const axios = require("axios");

// const sendEmployeeCredentials = async (
//   name,
//   email,
//   tempPassword,
//   companyId
// ) => {
//   const loginUrl =
//   `${process.env.FRONTEND_URL || "https://watsupcl.thevsoft.com"}/login?company=${companyId}`;
//   await axios.post(
//     "https://api.brevo.com/v3/smtp/email",
//     {
//       sender: {
//         name: "WhatsApp CRM",
//         email: process.env.EMAIL_USER,
//       },

//       to: [
//         {
//           email,
//           name,
//         },
//       ],

//       subject: "Welcome to WhatsApp CRM",

//       textContent: `
// Hello ${name},

// Your WhatsApp CRM account has been created successfully.

// Login Details
// -------------

// Email: ${email}
// Temporary Password: ${tempPassword}

// Login URL:
// ${loginUrl}

// Please change your password after your first login.

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

// module.exports = sendEmployeeCredentials;




const axios = require("axios");
const { buildFrontendUrl } = require("../utils/frontendUrl");

// Change the brand name here and it updates every employee-credentials email
const BRAND_NAME = "Vatup CRM";

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
