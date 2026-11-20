import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import { getCustomers } from "../../api/customerApi";
import { getTemplates } from "../../api/templateApi";
import { getCampaignRecipients } from "../../api/campaignApi";
import CampaignFormDrawer from "./CampaignFormDrawer";
import {
  mergeVariableConfigs,
  configsToPayload,
  hasMissingVariable,
  configsFromSaved,
} from "../../utils/templateVariables";

import useCampaignStore from "../../store/campaignStore";

export default function EditCampaignModal({
  isOpen,
  onClose,
  campaign,
}) {
  const { editCampaign } = useCampaignStore();

  // ============================================================
  // DATA
  // ============================================================

  const [customers, setCustomers] = useState([]);
  const [templates, setTemplates] = useState([]);

  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // ============================================================
  // SELECTION
  // ============================================================

  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  // ============================================================
  // UI STATE
  // ============================================================

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");

  // ============================================================
  // IMAGE
  // ============================================================

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const fileInputRef = useRef(null);

  // ============================================================
  // FORM
  // ============================================================

  // 👈 NEW: how each template variable is filled
  const [variableConfigs, setVariableConfigs] = useState({});

  const [formData, setFormData] = useState({
    name: "",
    type: "PROMOTIONAL",
    messageContent: "",
    scheduledAt: "",
  });

  // ============================================================
  // RESET FORM
  // ============================================================

  const resetForm = () => {
    setVariableConfigs({}); // 👈 NEW

    setFormData({
      name: "",
      type: "PROMOTIONAL",
      messageContent: "",
      scheduledAt: "",
    });

    setSelectedCustomers([]);
    setSelectedTemplateId("");

    setCustomerSearch("");

    setImage(null);
    setImagePreview("");

    setIsSubmitting(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ============================================================
  // LOAD DATA WHEN MODAL OPENS
  // ============================================================

  useEffect(() => {
    if (!isOpen || !campaign) {
      return;
    }

    loadCampaignData();
  }, [isOpen, campaign]);

  // ============================================================
  // LOAD CAMPAIGN + CUSTOMERS + APPROVED TEMPLATES
  // ============================================================

  const loadCampaignData = async () => {
    try {
      setIsSubmitting(false);

      // ----------------------------------------------------------
      // CAMPAIGN FORM DATA
      // ----------------------------------------------------------

      setFormData({
        name: campaign.name || "",
        type: campaign.type || "PROMOTIONAL",
        messageContent: campaign.messageContent || "",
        scheduledAt: campaign.scheduledAt
          ? formatDateTimeLocal(campaign.scheduledAt)
          : "",
      });

      // 👈 NEW: saved variable settings (old campaigns: {{1}} name, {{2}} campaign content)
      setVariableConfigs(
        configsFromSaved(campaign.variableValues, campaign.messageContent)
      );

      // ----------------------------------------------------------
      // EXISTING CUSTOMERS
      // ----------------------------------------------------------

      let existingCustomerIds =
        campaign.customerIds ||
        campaign.customers?.map((customer) => customer.id) ||
        campaign.recipients?.map(
          (recipient) => recipient.customerId
        ) ||
        [];

      // The campaigns list only carries a recipient COUNT, so load the
      // real audience to show who is already selected.
      if (existingCustomerIds.length === 0) {
        try {
          const response = await getCampaignRecipients(campaign.id);

          if (Array.isArray(response?.data)) {
            existingCustomerIds = response.data.map(
              (recipient) => recipient.customerId
            );
          }
        } catch (recipientError) {
          console.error(
            "Failed to load campaign audience:",
            recipientError
          );
        }
      }

      setSelectedCustomers(existingCustomerIds);

      // ----------------------------------------------------------
      // EXISTING TEMPLATE
      // ----------------------------------------------------------

      if (campaign.templateId) {
        setSelectedTemplateId(
          String(campaign.templateId)
        );
      } else {
        setSelectedTemplateId("");
      }

      // ----------------------------------------------------------
      // EXISTING IMAGE
      // ----------------------------------------------------------

      setImage(null);

      setImagePreview(
        campaign.imageUrl ||
          campaign.image ||
          ""
      );

      // ----------------------------------------------------------
      // FETCH CUSTOMERS + TEMPLATES
      // ----------------------------------------------------------

      await Promise.all([
        fetchCustomers(),
        fetchApprovedTemplates(),
      ]);
    } catch (error) {
      console.error(
        "Failed to load campaign data:",
        error
      );

      toast.error(
        "Failed to load campaign information."
      );
    }
  };

  // ============================================================
  // FORMAT DATETIME FOR INPUT
  // ============================================================

  const formatDateTimeLocal = (dateValue) => {
    if (!dateValue) {
      return "";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const localDate = new Date(
      date.getTime() -
        date.getTimezoneOffset() * 60000
    );

    return localDate
      .toISOString()
      .slice(0, 16);
  };

  // ============================================================
  // FETCH CUSTOMERS
  // ============================================================

  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true);

      const response = await getCustomers();

      console.log(
        "Customers Response:",
        response
      );

      let customerList = [];

      if (Array.isArray(response)) {
        customerList = response;
      } else if (
        Array.isArray(response?.data)
      ) {
        customerList = response.data;
      } else if (
        Array.isArray(response?.customers)
      ) {
        customerList = response.customers;
      } else if (
        Array.isArray(
          response?.data?.customers
        )
      ) {
        customerList =
          response.data.customers;
      }

      setCustomers(customerList);
    } catch (error) {
      console.error(
        "Fetch customers error:",
        error
      );

      toast.error(
        "Failed to load customers."
      );

      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  };

  // ============================================================
  // FETCH APPROVED TEMPLATES
  // ============================================================

  const fetchApprovedTemplates = async () => {
    try {
      setLoadingTemplates(true);

      const response = await getTemplates({
        status: "APPROVED",
      });

      console.log(
        "Approved Templates Response:",
        response
      );

      let templateList = [];

      if (Array.isArray(response)) {
        templateList = response;
      } else if (
        Array.isArray(response?.data)
      ) {
        templateList = response.data;
      } else if (
        Array.isArray(response?.templates)
      ) {
        templateList = response.templates;
      } else if (
        Array.isArray(
          response?.data?.templates
        )
      ) {
        templateList =
          response.data.templates;
      }

      // ----------------------------------------------------------
      // SAFETY FILTER
      // ----------------------------------------------------------

      templateList = templateList.filter(
        (template) =>
          template.status === "APPROVED"
      );

      setTemplates(templateList);
    } catch (error) {
      console.error(
        "Fetch approved templates error:",
        error
      );

      toast.error(
        "Failed to load approved templates."
      );

      setTemplates([]);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // ============================================================
  // HANDLE INPUT CHANGE
  // ============================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ============================================================
  // SELECT TEMPLATE
  // ============================================================

  const handleTemplateChange = (e) => {
    setSelectedTemplateId(e.target.value);
  };

  // ============================================================
  // SELECTED TEMPLATE
  // ============================================================

  const selectedTemplate = useMemo(() => {
    return templates.find(
      (template) =>
        String(template.id) ===
        String(selectedTemplateId)
    );
  }, [
    templates,
    selectedTemplateId,
  ]);

  // ============================================================
  // TEMPLATE VARIABLES
  // ============================================================

  const templateVariables = useMemo(() => {
    if (!selectedTemplate?.content) {
      return [];
    }

    const matches =
      selectedTemplate.content.match(
        /\{\{\s*(\d+)\s*\}\}/g
      ) || [];

    const numbers = matches
      .map((match) => {
        const number =
          match.match(/\d+/)?.[0];

        return number
          ? Number(number)
          : null;
      })
      .filter(Boolean);

    return [...new Set(numbers)].sort(
      (a, b) => a - b
    );
  }, [selectedTemplate]);

  // 👈 NEW: give every variable of the selected template a default setting
  useEffect(() => {
    setVariableConfigs((prev) =>
      mergeVariableConfigs(
        templateVariables,
        prev,
        formData.messageContent
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateVariables]);

  // ============================================================
  // IMAGE CHANGE
  // ============================================================

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // ----------------------------------------------------------
    // IMAGE TYPE
    // ----------------------------------------------------------

    if (!file.type.startsWith("image/")) {
      toast.error(
        "Please select an image."
      );

      return;
    }

    // ----------------------------------------------------------
    // IMAGE SIZE
    // ----------------------------------------------------------

    if (file.size > 15 * 1024 * 1024) {
      toast.error(
        "Maximum image size is 15MB."
      );

      return;
    }

    // ----------------------------------------------------------
    // REVOKE PREVIOUS LOCAL PREVIEW
    // ----------------------------------------------------------

    if (
      imagePreview &&
      imagePreview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(imagePreview);
    }

    setImage(file);

    setImagePreview(
      URL.createObjectURL(file)
    );
  };

  // ============================================================
  // REMOVE IMAGE
  // ============================================================

  const removeImage = () => {
    if (
      imagePreview &&
      imagePreview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(imagePreview);
    }

    setImage(null);
    setImagePreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ============================================================
  // TOGGLE CUSTOMER
  // ============================================================

  const toggleCustomer = (id) => {
    setSelectedCustomers((prev) =>
      prev.includes(id)
        ? prev.filter(
            (customerId) =>
              customerId !== id
          )
        : [...prev, id]
    );
  };

  // ============================================================
  // FILTER CUSTOMERS
  // ============================================================

  const filteredCustomers = useMemo(() => {
    const search =
      customerSearch
        .trim()
        .toLowerCase();

    if (!search) {
      return customers;
    }

    return customers.filter(
      (customer) => {
        const name =
          customer.name
            ?.toLowerCase() || "";

        const phone =
          customer.phone
            ?.toLowerCase() || "";

        const email =
          customer.email
            ?.toLowerCase() || "";

        return (
          name.includes(search) ||
          phone.includes(search) ||
          email.includes(search)
        );
      }
    );
  }, [
    customers,
    customerSearch,
  ]);

  // ============================================================
  // SELECT ALL
  // ============================================================

  const handleSelectAll = () => {
    const allCustomerIds =
      filteredCustomers.map(
        (customer) => customer.id
      );

    setSelectedCustomers((prev) => [
      ...new Set([
        ...prev,
        ...allCustomerIds,
      ]),
    ]);
  };

  // ============================================================
  // CLEAR ALL
  // ============================================================

  const handleClearAll = () => {
    setSelectedCustomers([]);
  };

  // ============================================================
  // VALIDATE SCHEDULE
  // ============================================================

  const validateSchedule = () => {
    if (!formData.scheduledAt) {
      return true;
    }

    const scheduleDate = new Date(
      formData.scheduledAt
    );

    if (
      Number.isNaN(
        scheduleDate.getTime()
      )
    ) {
      toast.error(
        "Please select a valid schedule date."
      );

      return false;
    }

    if (scheduleDate <= new Date()) {
      toast.error(
        "Scheduled time must be in the future."
      );

      return false;
    }

    return true;
  };

  // ============================================================
  // HANDLE SUBMIT
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    // ==========================================================
    // CAMPAIGN ID
    // ==========================================================

    if (!campaign?.id) {
      toast.error(
        "Campaign ID is missing."
      );

      return;
    }

    // ==========================================================
    // CAMPAIGN NAME
    // ==========================================================

    if (!formData.name.trim()) {
      toast.error(
        "Campaign name is required."
      );

      return;
    }

    // ==========================================================
    // TEMPLATE
    // ==========================================================

    if (!selectedTemplateId) {
      toast.error(
        "Please select an approved WhatsApp template."
      );

      return;
    }

    if (!selectedTemplate) {
      toast.error(
        "Selected template could not be found."
      );

      return;
    }

    if (
      selectedTemplate.status !==
      "APPROVED"
    ) {
      toast.error(
        "Only approved templates can be used for campaigns."
      );

      return;
    }

    // ==========================================================
    // CUSTOMERS
    // ==========================================================

    if (
      selectedCustomers.length === 0
    ) {
      toast.error(
        "Please select at least one customer."
      );

      return;
    }

    // ==========================================================
    // SCHEDULE
    // ==========================================================

    if (!validateSchedule()) {
      return;
    }

    // 👈 NEW: every template variable needs a value
    if (hasMissingVariable(templateVariables, variableConfigs)) {
      toast.error(
        "Please fill all template variable values."
      );

      return;
    }

    // ==========================================================
    // SUBMIT
    // ==========================================================

    try {
      setIsSubmitting(true);

      const updateData = {
        name: formData.name.trim(),

        type: formData.type,

        templateId:
          selectedTemplateId,

        // 👈 CHANGED: messageContent keeps the {{2}} custom value (old field),
        // the full list of variable settings goes in variableValues.
        messageContent:
          templateVariables.includes(2) &&
          variableConfigs[2]?.source === "custom"
            ? (variableConfigs[2].value || "").trim()
            : formData.messageContent.trim(),

        variableValues: configsToPayload(templateVariables, variableConfigs), // 👈 NEW

        scheduledAt:
          formData.scheduledAt
            ? new Date(formData.scheduledAt).toISOString()
            : "",

        customerIds:
          selectedCustomers,

        image,
      };

      console.log(
        "Updating Campaign:",
        updateData
      );

      await editCampaign(
        campaign.id,
        updateData
      );

      resetForm();

      onClose();

      // Success message (shown AFTER the popup is closed)
      toast.success(
        "Campaign updated successfully!"
      );
    } catch (error) {
      console.error(
        "Failed to update campaign:",
        error
      );

      // --------------------------------------------------------
      // 403
      // --------------------------------------------------------

      if (
        error?.response?.status === 403
      ) {
        setIsSubmitting(false);

        onClose();

        return;
      }

      toast.error(
        error?.response?.data?.message ||
          "Unable to update campaign."
      );

      setIsSubmitting(false);
    }
  };

  // ============================================================
  // CLOSE MODAL
  // ============================================================

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    onClose();
  };

  // ============================================================
  // CLEANUP PREVIEW URL
  // ============================================================

  useEffect(() => {
    return () => {
      if (
        imagePreview &&
        imagePreview.startsWith("blob:")
      ) {
        URL.revokeObjectURL(
          imagePreview
        );
      }
    };
  }, [imagePreview]);

  // ============================================================
  // DON'T RENDER
  // ============================================================

  if (!isOpen) {
    return null;
  }

  // ============================================================
  // UI (right-side drawer)
  // ============================================================

  return (
    <CampaignFormDrawer
      mode="edit"
      onClose={handleClose}
      onSubmit={handleSubmit}
      submitting={isSubmitting}
      submitLabel="Save Changes"
      submitDisabled={templates.length === 0}
      // details
      formData={formData}
      onFieldChange={handleChange}
      templates={templates}
      loadingTemplates={loadingTemplates}
      selectedTemplateId={selectedTemplateId}
      selectedTemplate={selectedTemplate}
      onTemplateChange={handleTemplateChange}
      templateVariables={templateVariables}
      variableConfigs={variableConfigs}
      onVariableChange={(number, changes) =>
        setVariableConfigs((prev) => ({
          ...prev,
          [number]: { ...prev[number], ...changes },
        }))
      }
      // audience
      customers={filteredCustomers}
      loadingCustomers={loadingCustomers}
      customerSearch={customerSearch}
      onCustomerSearch={setCustomerSearch}
      selectedCustomers={selectedCustomers}
      onToggleCustomer={toggleCustomer}
      onSelectAll={handleSelectAll}
      onClearAll={handleClearAll}
      audienceRequired
      // media
      image={image}
      imagePreview={imagePreview}
      fileInputRef={fileInputRef}
      onImageChange={handleImageChange}
      onRemoveImage={removeImage}
    />
  );
}
