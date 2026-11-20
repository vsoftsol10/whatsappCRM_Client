import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import {
  resendCampaign,
  getCampaignRecipients,
} from "../../api/campaignApi";
import { getCampaignMessageText } from "../../utils/campaignMessage";
import CampaignFormDrawer from "./CampaignFormDrawer";
import { canEditCampaign } from "./campaignHelpers";

// ISO date -> value for <input type="datetime-local">
const toLocalInput = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

export default function ViewCampaignModal({
  isOpen,
  onClose,
  campaign,
  onRequestEdit, // opens the Edit drawer for this campaign
  onResendSuccess, // optional callback so the parent list/page can refresh
}) {
  const [resending, setResending] = useState(false);

  // The people this campaign was created for
  const [audience, setAudience] = useState([]);
  const [loadingAudience, setLoadingAudience] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");

  // ==================================================
  // LOAD THE CAMPAIGN AUDIENCE
  // ==================================================

  useEffect(() => {
    if (!isOpen || !campaign?.id) return undefined;

    let cancelled = false;

    const loadAudience = async () => {
      try {
        setLoadingAudience(true);
        setCustomerSearch("");

        const response = await getCampaignRecipients(campaign.id);

        if (cancelled) return;

        const recipients = Array.isArray(response?.data) ? response.data : [];

        setAudience(
          recipients.map((recipient) => ({
            id: recipient.customerId,
            name: recipient.customer?.name,
            phone: recipient.customer?.phone,
            email: recipient.customer?.email,
          }))
        );
      } catch (error) {
        console.error("Failed to load campaign audience:", error);

        if (!cancelled) setAudience([]);
      } finally {
        if (!cancelled) setLoadingAudience(false);
      }
    };

    loadAudience();

    return () => {
      cancelled = true;
    };
  }, [isOpen, campaign?.id]);

  const visibleAudience = useMemo(() => {
    const keyword = customerSearch.trim().toLowerCase();

    if (!keyword) return audience;

    return audience.filter(
      (customer) =>
        customer.name?.toLowerCase().includes(keyword) ||
        customer.phone?.toLowerCase().includes(keyword) ||
        customer.email?.toLowerCase().includes(keyword)
    );
  }, [audience, customerSearch]);

  const selectedIds = useMemo(
    () => audience.map((customer) => customer.id),
    [audience]
  );

  if (!isOpen || !campaign) return null;

  // ==================================================
  // RESEND CAMPAIGN
  // ==================================================
  // Only meaningful for a campaign that already finished — the
  // backend itself blocks resending anything still SENDING, or
  // anything that was never sent at all (DRAFT/SCHEDULED should
  // use the normal "Send" flow instead).

  const canResend =
    campaign.status === "COMPLETED" || campaign.status === "FAILED";

  const handleResend = async () => {
    if (resending) return;

    try {
      setResending(true);

      const response = await resendCampaign(campaign.id);

      if (onResendSuccess) {
        onResendSuccess(response?.data);
      }

      onClose();

      // Success message (shown AFTER the drawer is closed)
      toast.success("Campaign resent successfully!");
    } catch (error) {
      console.error("Failed to resend campaign:", error);

      toast.error(
        error?.response?.data?.message || "Failed to resend campaign."
      );
    } finally {
      setResending(false);
    }
  };

  // ==================================================
  // READ-ONLY FORM VALUES
  // ==================================================

  const template = campaign.template || null;

  return (
    <CampaignFormDrawer
      mode="view"
      onClose={onClose}
      onRequestEdit={() => onRequestEdit?.(campaign)}
      canEdit={!!onRequestEdit && canEditCampaign(campaign)}
      // details
      formData={{
        name: campaign.name || "",
        type: campaign.type || "PROMOTIONAL",
        scheduledAt: toLocalInput(campaign.scheduledAt),
      }}
      templates={template ? [template] : []}
      selectedTemplateId={template ? String(template.id) : ""}
      selectedTemplate={template}
      previewText={getCampaignMessageText(campaign)}
      // audience
      customers={visibleAudience}
      loadingCustomers={loadingAudience}
      customerSearch={customerSearch}
      onCustomerSearch={setCustomerSearch}
      selectedCustomers={selectedIds}
      // media
      imagePreview={campaign.imageUrl || ""}
      // resend
      canResend={canResend}
      onResend={handleResend}
      resending={resending}
    />
  );
}
