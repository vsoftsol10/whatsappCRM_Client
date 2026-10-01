// frontend/src/utils/campaignMessage.js
//
// Builds the message text to DISPLAY for a campaign.
//
// Why this exists:
//   For template campaigns, `campaign.messageContent` is NOT the message.
//   It is only the "Campaign Variable Content" - the value that gets
//   filled into {{2}}. The real message is `campaign.template.content`.
//
// This mirrors how the backend fills the variables when sending
// (campaignController.js -> sendToRecipients):
//     {{1}} = customer's name   (different for every recipient)
//     {{2}} = campaign.messageContent

export const getCampaignMessageText = (campaign) => {
  if (!campaign) return "";

  const templateContent = campaign.template?.content;

  // No template selected -> keep the old behaviour
  if (!templateContent) {
    return campaign.messageContent || "";
  }

  return templateContent
    .replace(/\{\{\s*1\s*\}\}/g, "[Customer Name]")
    .replace(/\{\{\s*2\s*\}\}/g, campaign.messageContent || "{{2}}");
};