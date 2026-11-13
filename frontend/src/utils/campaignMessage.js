// // frontend/src/utils/campaignMessage.js
// //
// // Builds the message text to DISPLAY for a campaign.
// //
// // Why this exists:
// //   For template campaigns, `campaign.messageContent` is NOT the message.
// //   It is only the "Campaign Variable Content" - the value that gets
// //   filled into {{2}}. The real message is `campaign.template.content`.
// //
// // This mirrors how the backend fills the variables when sending
// // (campaignController.js -> sendToRecipients):
// //     {{1}} = customer's name   (different for every recipient)
// //     {{2}} = campaign.messageContent

// export const getCampaignMessageText = (campaign) => {
//   if (!campaign) return "";

//   const templateContent = campaign.template?.content;

//   // No template selected -> keep the old behaviour
//   if (!templateContent) {
//     return campaign.messageContent || "";
//   }

//   return templateContent
//     .replace(/\{\{\s*1\s*\}\}/g, "[Customer Name]")
//     .replace(/\{\{\s*2\s*\}\}/g, campaign.messageContent || "{{2}}");
// };


// frontend/src/utils/campaignMessage.js
//
// Builds the message text to DISPLAY for a campaign.
//
// For template campaigns the real message is `campaign.template.content`.
// The template variables are filled like the backend does when sending:
//
//   NEW campaigns (campaign.variableValues saved):
//     every {{n}} is filled from its setting
//       name    -> "[Customer Name]"   (different for every recipient)
//       company -> "[Customer Company]"
//       custom  -> the value typed for that variable
//
//   OLD campaigns (nothing saved):
//     {{1}} = customer's name
//     {{2}} = campaign.messageContent

export const getCampaignMessageText = (campaign) => {
  if (!campaign) return "";

  const templateContent = campaign.template?.content;

  // No template selected -> keep the old behaviour
  if (!templateContent) {
    return campaign.messageContent || "";
  }

  // NEW: structured variable values
  if (
    Array.isArray(campaign.variableValues) &&
    campaign.variableValues.length > 0
  ) {
    return templateContent.replace(
      /\{\{\s*(\d+)\s*\}\}/g,
      (full, number) => {
        const item = campaign.variableValues.find(
          (v) => Number(v.index) === Number(number)
        );

        if (!item) return full;

        if (item.source === "name") return "[Customer Name]";
        if (item.source === "company") return "[Customer Company]";

        return item.value || full;
      }
    );
  }

  // OLD campaigns
  return templateContent
    .replace(/\{\{\s*1\s*\}\}/g, "[Customer Name]")
    .replace(/\{\{\s*2\s*\}\}/g, campaign.messageContent || "{{2}}");
};