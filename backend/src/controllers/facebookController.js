// // ============================================================
// // FACEBOOK PAGES CONTROLLER
// // A company's admin connects their own Facebook Pages here.
// // Page access tokens are stored ENCRYPTED and never sent to the browser.
// // ============================================================
// const prisma = require("../config/prisma");
// const { encryptSecret, decryptSecret } = require("../utils/secretCrypto");
// const fb = require("../services/facebookService");

// // What the browser is allowed to see about a Page (never the token).
// const toPublicPage = (page) => ({
//   id: page.id,
//   pageId: page.pageId,
//   pageName: page.pageName,
//   status: page.status,
//   connectedAt: page.connectedAt,
//   disconnectedAt: page.disconnectedAt,
// });

// // ------------------------------------------------------------
// // GET /api/facebook/pages   (admin + employee, read-only)
// // ------------------------------------------------------------
// const getFacebookPages = async (req, res) => {
//   try {
//     const pages = await prisma.facebookPage.findMany({
//       where: {
//         companyId: req.user.companyId,
//         status: { in: ["CONNECTED", "RECONNECT_NEEDED"] },
//       },
//       orderBy: { connectedAt: "desc" },
//     });

//     return res.status(200).json({
//       success: true,
//       pages: pages.map(toPublicPage),
//     });
//   } catch (error) {
//     console.error("Get Facebook pages error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch Facebook pages",
//     });
//   }
// };

// // ------------------------------------------------------------
// // POST /api/facebook/connect   (admin only)
// // Body: { code }  <- the code returned by FB.login()
// // Connects EVERY Page the person selected in the Meta popup.
// // ------------------------------------------------------------
// const connectFacebookPages = async (req, res) => {
//   try {
//     const companyId = req.user.companyId;
//     const { code, accessToken } = req.body;

//     if (!companyId) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Company ID is required" });
//     }

//     if (!accessToken && !code) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing login result from Facebook",
//       });
//     }

//     // 1. Facebook token -> long-lived user token.
//     //    Normal case: the browser already received an access token from the
//     //    login popup. (A code is still supported as a fallback.)
//     //    Meta checks the token itself when we extend it / read the Pages.
//     const shortToken = accessToken || (await fb.exchangeCodeForToken(code));
//     const userToken = await fb.extendUserToken(shortToken);

//     // 2. Pages this person shared with us (each has its own Page token)
//     const metaPages = await fb.getManagedPages(userToken);

//     if (!metaPages.length) {
//       return res.status(422).json({
//         success: false,
//         message:
//           "No Facebook Page was shared. Please try again and select at least one Page.",
//       });
//     }

//     const connected = [];
//     const skipped = [];

//     // 3. Save + subscribe each Page
//     for (const metaPage of metaPages) {
//       const pageId = String(metaPage.id);
//       const pageName = metaPage.name || null;
//       const pageToken = metaPage.access_token;

//       try {
//         const existing = await prisma.facebookPage.findUnique({
//           where: { pageId },
//         });

//         // A Page can only belong to one CRM account. We never move a
//         // Page between companies (that could expose old conversations).
//         if (existing && existing.companyId !== companyId) {
//           skipped.push({
//             pageId,
//             pageName,
//             reason:
//               "This Page is already connected to another CRM account. Contact support if this is a mistake.",
//           });
//           continue;
//         }

//         // Subscribe the Page to our app so Meta sends its messages to us.
//         await fb.subscribePageToApp(pageId, pageToken);

//         const data = {
//           companyId,
//           pageName,
//           pageAccessToken: encryptSecret(pageToken),
//           status: "CONNECTED",
//           connectedByUserId: req.user.userId || null,
//           connectedAt: new Date(),
//           disconnectedAt: null,
//         };

//         const saved = existing
//           ? await prisma.facebookPage.update({ where: { pageId }, data })
//           : await prisma.facebookPage.create({ data: { ...data, pageId } });

//         connected.push(toPublicPage(saved));
//       } catch (pageError) {
//         const detail = fb.extractError(pageError);
//         console.error(
//           "Facebook page connect failed:",
//           pageId,
//           detail.code,
//           detail.message
//         );
//         skipped.push({
//           pageId,
//           pageName,
//           reason: detail.message || "Could not connect this Page",
//         });
//       }
//     }

//     if (!connected.length) {
//       return res.status(422).json({
//         success: false,
//         message: skipped[0]?.reason || "Could not connect any Page",
//         skipped,
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message:
//         connected.length === 1
//           ? "Facebook Page connected successfully"
//           : `${connected.length} Facebook Pages connected successfully`,
//       pages: connected,
//       skipped,
//     });
//   } catch (error) {
//     const detail = fb.extractError(error);
//     console.error("FACEBOOK CONNECT ERROR:", detail);
//     return res.status(500).json({
//       success: false,
//       // Meta's own reason (safe to show to the admin) makes problems easy to diagnose.
//       message: `Failed to connect Facebook: ${detail.message}`,
//       metaErrorCode: detail.code,
//     });
//   }
// };

// // ------------------------------------------------------------
// // PUT /api/facebook/pages/:id/disconnect   (admin only)
// // ------------------------------------------------------------
// const disconnectFacebookPage = async (req, res) => {
//   try {
//     const id = Number(req.params.id);

//     if (!Number.isInteger(id)) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid page id" });
//     }

//     const page = await prisma.facebookPage.findFirst({
//       where: { id, companyId: req.user.companyId },
//     });

//     if (!page) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Facebook Page not found" });
//     }

//     // Best effort: tell Meta to stop sending this Page's events to us.
//     const token = decryptSecret(page.pageAccessToken);
//     if (token) {
//       try {
//         await fb.unsubscribePageFromApp(page.pageId, token);
//       } catch (err) {
//         console.warn(
//           "Facebook unsubscribe failed (continuing):",
//           fb.extractError(err).message
//         );
//       }
//     }

//     await prisma.facebookPage.update({
//       where: { id: page.id },
//       data: {
//         status: "DISCONNECTED",
//         pageAccessToken: null,
//         disconnectedAt: new Date(),
//       },
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Facebook Page disconnected",
//     });
//   } catch (error) {
//     console.error("Disconnect Facebook page error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to disconnect Facebook Page",
//     });
//   }
// };

// module.exports = {
//   getFacebookPages,
//   connectFacebookPages,
//   disconnectFacebookPage,
// };


// ============================================================
// FACEBOOK PAGES CONTROLLER
// A company's admin connects their own Facebook Pages here.
// Page access tokens are stored ENCRYPTED and never sent to the browser.
// ============================================================
const prisma = require("../config/prisma");
const { encryptSecret, decryptSecret } = require("../utils/secretCrypto");
const fb = require("../services/facebookService");

// What the browser is allowed to see about a Page (never the token).
const toPublicPage = (page) => ({
  id: page.id,
  pageId: page.pageId,
  pageName: page.pageName,
  status: page.status,
  connectedAt: page.connectedAt,
  disconnectedAt: page.disconnectedAt,
  // Instagram professional account linked to this Page (if any)
  hasInstagram: !!page.instagramAccountId,
  instagramUsername: page.instagramUsername || null,
});

// ------------------------------------------------------------
// GET /api/facebook/pages   (admin + employee, read-only)
// ------------------------------------------------------------
const getFacebookPages = async (req, res) => {
  try {
    const pages = await prisma.facebookPage.findMany({
      where: {
        companyId: req.user.companyId,
        status: { in: ["CONNECTED", "RECONNECT_NEEDED"] },
      },
      orderBy: { connectedAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      pages: pages.map(toPublicPage),
    });
  } catch (error) {
    console.error("Get Facebook pages error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch Facebook pages",
    });
  }
};

// ------------------------------------------------------------
// POST /api/facebook/connect   (admin only)
// Body: { code }  <- the code returned by FB.login()
// Connects EVERY Page the person selected in the Meta popup.
// ------------------------------------------------------------
const connectFacebookPages = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { code, accessToken } = req.body;

    if (!companyId) {
      return res
        .status(400)
        .json({ success: false, message: "Company ID is required" });
    }

    if (!accessToken && !code) {
      return res.status(400).json({
        success: false,
        message: "Missing login result from Facebook",
      });
    }

    // 1. Facebook token -> long-lived user token.
    //    Normal case: the browser already received an access token from the
    //    login popup. (A code is still supported as a fallback.)
    //    Meta checks the token itself when we extend it / read the Pages.
    const shortToken = accessToken || (await fb.exchangeCodeForToken(code));
    const userToken = await fb.extendUserToken(shortToken);

    // 2. Pages this person shared with us (each has its own Page token)
    const metaPages = await fb.getManagedPages(userToken);

    if (!metaPages.length) {
      return res.status(422).json({
        success: false,
        message:
          "No Facebook Page was shared. Please try again and select at least one Page.",
      });
    }

    const connected = [];
    const skipped = [];

    // 3. Save + subscribe each Page
    for (const metaPage of metaPages) {
      const pageId = String(metaPage.id);
      const pageName = metaPage.name || null;
      const pageToken = metaPage.access_token;

      try {
        const existing = await prisma.facebookPage.findUnique({
          where: { pageId },
        });

        // A Page can only belong to one CRM account. We never move a
        // Page between companies (that could expose old conversations).
        if (existing && existing.companyId !== companyId) {
          skipped.push({
            pageId,
            pageName,
            reason:
              "This Page is already connected to another CRM account. Contact support if this is a mistake.",
          });
          continue;
        }

        // Subscribe the Page to our app so Meta sends its messages to us.
        await fb.subscribePageToApp(pageId, pageToken);

        // Instagram: find the professional account linked to this Page.
        // A missing link is fine - Messenger still works.
        let instagramData = { instagramAccountId: null, instagramUsername: null };
        let instagramNote = null;

        const { account: igAccount, error: igError } =
          await fb.getLinkedInstagramAccount(pageId, pageToken);

        if (igAccount) {
          // One Instagram account can only belong to one connected Page.
          const clash = await prisma.facebookPage.findFirst({
            where: { instagramAccountId: igAccount.id, NOT: { pageId } },
            select: { id: true },
          });

          if (clash) {
            instagramNote =
              "This Instagram account is already connected to another Page or CRM account, so Instagram was not enabled for this Page.";
          } else {
            instagramData = {
              instagramAccountId: igAccount.id,
              instagramUsername: igAccount.username,
            };
          }
        } else if (igError) {
          instagramNote = `Instagram could not be checked: ${igError.message}`;
        }

        const data = {
          companyId,
          ...instagramData,
          pageName,
          pageAccessToken: encryptSecret(pageToken),
          status: "CONNECTED",
          connectedByUserId: req.user.userId || null,
          connectedAt: new Date(),
          disconnectedAt: null,
        };

        const saved = existing
          ? await prisma.facebookPage.update({ where: { pageId }, data })
          : await prisma.facebookPage.create({ data: { ...data, pageId } });

        connected.push({ ...toPublicPage(saved), instagramNote });
      } catch (pageError) {
        const detail = fb.extractError(pageError);
        console.error(
          "Facebook page connect failed:",
          pageId,
          detail.code,
          detail.message
        );
        skipped.push({
          pageId,
          pageName,
          reason: detail.message || "Could not connect this Page",
        });
      }
    }

    if (!connected.length) {
      return res.status(422).json({
        success: false,
        message: skipped[0]?.reason || "Could not connect any Page",
        skipped,
      });
    }

    return res.status(200).json({
      success: true,
      message:
        connected.length === 1
          ? "Facebook Page connected successfully"
          : `${connected.length} Facebook Pages connected successfully`,
      pages: connected,
      skipped,
    });
  } catch (error) {
    const detail = fb.extractError(error);
    console.error("FACEBOOK CONNECT ERROR:", detail);
    return res.status(500).json({
      success: false,
      // Meta's own reason (safe to show to the admin) makes problems easy to diagnose.
      message: `Failed to connect Facebook: ${detail.message}`,
      metaErrorCode: detail.code,
    });
  }
};

// ------------------------------------------------------------
// PUT /api/facebook/pages/:id/disconnect   (admin only)
// ------------------------------------------------------------
const disconnectFacebookPage = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid page id" });
    }

    const page = await prisma.facebookPage.findFirst({
      where: { id, companyId: req.user.companyId },
    });

    if (!page) {
      return res
        .status(404)
        .json({ success: false, message: "Facebook Page not found" });
    }

    // Best effort: tell Meta to stop sending this Page's events to us.
    const token = decryptSecret(page.pageAccessToken);
    if (token) {
      try {
        await fb.unsubscribePageFromApp(page.pageId, token);
      } catch (err) {
        console.warn(
          "Facebook unsubscribe failed (continuing):",
          fb.extractError(err).message
        );
      }
    }

    await prisma.facebookPage.update({
      where: { id: page.id },
      data: {
        status: "DISCONNECTED",
        pageAccessToken: null,
        disconnectedAt: new Date(),
        // Free the Instagram link too (another account may connect it later)
        instagramAccountId: null,
        instagramUsername: null,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Facebook Page disconnected",
    });
  } catch (error) {
    console.error("Disconnect Facebook page error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to disconnect Facebook Page",
    });
  }
};

module.exports = {
  getFacebookPages,
  connectFacebookPages,
  disconnectFacebookPage,
};
