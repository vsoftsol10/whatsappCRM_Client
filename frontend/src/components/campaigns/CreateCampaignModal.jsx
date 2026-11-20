import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import useCampaignStore from "../../store/campaignStore";

// Change this import path if your template API is located elsewhere
import { getTemplates } from "../../api/templateApi";

// Used to load the customer list for the audience picker
import { getCustomers } from "../../api/customerApi";
import CampaignFormDrawer from "./CampaignFormDrawer";
import {
  mergeVariableConfigs,
  configsToPayload,
  hasMissingVariable,
} from "../../utils/templateVariables";

export default function CreateCampaignModal({
  isOpen,
  onClose,
  aiCampaign,
  onCreated, // called with the new campaign after successful creation
}) {
  const { addCampaign } = useCampaignStore();

  // ============================================================
  // DATA
  // ============================================================

  const [templates, setTemplates] = useState([]);

  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // ============================================================
  // SELECTION
  // ============================================================

  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  // ============================================================
  // CUSTOMERS (NEW) - who will receive this campaign
  // ============================================================

  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState("");

  // ============================================================
  // UI STATE
  // ============================================================

  const [submitting, setSubmitting] = useState(false);

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

    setSelectedTemplateId("");

    setSelectedCustomers([]);
    setCustomerSearch("");

    setImage(null);
    setImagePreview("");

    setSubmitting(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ============================================================
  // LOAD DATA WHEN MODAL OPENS
  // ============================================================

  useEffect(() => {
    if (!isOpen) return;

    fetchApprovedTemplates();
    fetchCustomers();

    if (!aiCampaign) {
      resetForm();
    }
  }, [isOpen]);

  // ============================================================
  // AI CAMPAIGN
  // ============================================================

  useEffect(() => {
    if (!aiCampaign) return;

    setFormData((prev) => ({
      ...prev,

      name: aiCampaign.name || "",
      type: aiCampaign.type || "PROMOTIONAL",

      /*
       * AI-generated campaign text is kept here.
       *
       * IMPORTANT:
       * The actual WhatsApp message will still be sent
       * through the selected approved template.
       */
      messageContent:
        aiCampaign.messageContent || "",
    }));

    // 👈 NEW: the AI text fills {{2}} (same as before)
    setVariableConfigs((prev) => ({
      ...prev,
      2: { source: "custom", value: aiCampaign.messageContent || "" },
    }));
  }, [aiCampaign]);

  // ============================================================
  // FETCH APPROVED TEMPLATES
  // ============================================================

  const fetchApprovedTemplates = async () => {
    try {
      setLoadingTemplates(true);

      /*
       * Your template controller already supports:
       *
       * GET /templates?status=APPROVED
       *
       * So ideally your API function should accept params.
       */

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
      } else if (Array.isArray(response?.data)) {
        templateList = response.data;
      } else if (
        Array.isArray(response?.templates)
      ) {
        templateList = response.templates;
      } else if (
        Array.isArray(response?.data?.templates)
      ) {
        templateList = response.data.templates;
      }

      /*
       * Extra safety:
       *
       * Even if API returns all templates,
       * only approved templates should appear.
       */
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
  // HANDLE INPUT
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
    const templateId = e.target.value;

    setSelectedTemplateId(templateId);

    /*
     * When changing template, keep campaign message.
     *
     * messageContent is treated as campaign-specific
     * variable/custom content for now.
     */

    // 👈 NEW: if the newly selected template doesn't have an IMAGE
    // header, drop any image that was attached for the previous
    // template — otherwise it silently rides along and gets rejected
    // by Meta at send time because the new template has no header
    // component to put it in.
    const newTemplate = templates.find(
      (template) => String(template.id) === String(templateId)
    );

    if (newTemplate && newTemplate.headerType !== "IMAGE" && image) {
      removeImage();
      toast(
        "This template doesn't use an image header — the attached image was removed.",
        { icon: "ℹ️" }
      );
    }
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
  }, [templates, selectedTemplateId]);

  // ============================================================
  // EXTRACT TEMPLATE VARIABLES
  // ============================================================

  const templateVariables = useMemo(() => {
    if (!selectedTemplate?.content) {
      return [];
    }

    /*
     * Finds:
     *
     * {{1}}
     * {{2}}
     * {{3}}
     *
     * etc.
     */

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
  // IMAGE UPLOAD
  // ============================================================

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image.");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error(
        "Maximum image size is 15MB."
      );
      return;
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
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImage(null);
    setImagePreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ============================================================
  // FETCH CUSTOMERS (NEW)
  // ============================================================

  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true);

      const response = await getCustomers();

      let customerList = [];

      if (Array.isArray(response)) {
        customerList = response;
      } else if (Array.isArray(response?.data)) {
        customerList = response.data;
      } else if (Array.isArray(response?.customers)) {
        customerList = response.customers;
      } else if (Array.isArray(response?.data?.customers)) {
        customerList = response.data.customers;
      }

      setCustomers(customerList);
    } catch (error) {
      console.error("Fetch customers error:", error);

      toast.error("Failed to load customers.");

      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  };

  // ============================================================
  // TOGGLE ONE CUSTOMER (NEW)
  // ============================================================

  const toggleCustomer = (id) => {
    setSelectedCustomers((prev) =>
      prev.includes(id)
        ? prev.filter((customerId) => customerId !== id)
        : [...prev, id]
    );
  };

  // ============================================================
  // FILTER CUSTOMERS BY SEARCH (NEW)
  // ============================================================

  const filteredCustomers = useMemo(() => {
    const search = customerSearch.trim().toLowerCase();

    if (!search) {
      return customers;
    }

    return customers.filter((customer) => {
      const name = customer.name?.toLowerCase() || "";
      const phone = customer.phone?.toLowerCase() || "";
      const email = customer.email?.toLowerCase() || "";

      return (
        name.includes(search) ||
        phone.includes(search) ||
        email.includes(search)
      );
    });
  }, [customers, customerSearch]);

  // ============================================================
  // SELECT ALL / CLEAR ALL (NEW)
  // ============================================================

  const handleSelectAll = () => {
    const allCustomerIds = filteredCustomers.map((customer) => customer.id);

    setSelectedCustomers((prev) => [
      ...new Set([...prev, ...allCustomerIds]),
    ]);
  };

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

    const scheduleDate =
      new Date(
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

    if (
      scheduleDate <= new Date()
    ) {
      toast.error(
        "Scheduled time must be in the future."
      );

      return false;
    }

    return true;
  };

  // ============================================================
  // SUBMIT CAMPAIGN
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) {
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
    // TEMPLATE <-> IMAGE CONSISTENCY
    // ==========================================================
    // 👈 NEW: the template's approved header format and the campaign
    // image must match, or Meta rejects the send outright. Catch this
    // in the UI before it ever reaches the backend.

    if (image && selectedTemplate.headerType !== "IMAGE") {
      toast.error(
        "This template doesn't have an approved IMAGE header, so it can't be sent with an image. Remove the image or choose an IMAGE-header template."
      );

      return;
    }

    if (!image && selectedTemplate.headerType === "IMAGE") {
      toast.error(
        "This template requires an IMAGE header — please upload a campaign image."
      );

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
    // SCHEDULE
    // ==========================================================

    if (!validateSchedule()) {
      return;
    }

    // NEW: a scheduled campaign is sent automatically, so it must
    // know WHO to send to. (A draft can still be created without
    // customers, exactly as before.)
    if (formData.scheduledAt && selectedCustomers.length === 0) {
      toast.error(
        "Please select at least one customer for the scheduled campaign."
      );

      return;
    }

    // ==========================================================
    // START
    // ==========================================================

    setSubmitting(true);

    try {
      const campaign = await addCampaign({
        name: formData.name.trim(),

        type: formData.type,

        /*
         * IMPORTANT
         *
         * This is the approved Meta template.
         */
        templateId:
          selectedTemplateId,

        /*
         * Keep this field because your
         * current Campaign model has it.
         *
         * Later we can replace this with
         * structured template variables.
         */
        // 👈 CHANGED: messageContent keeps the {{2}} custom value (old field),
        // the full list of variable settings goes in variableValues.
        messageContent:
          templateVariables.includes(2) &&
          variableConfigs[2]?.source === "custom"
            ? (variableConfigs[2].value || "").trim()
            : formData.messageContent.trim(),

        variableValues: configsToPayload(templateVariables, variableConfigs), // 👈 NEW

        // NEW: send a real UTC time so the server schedules the
        // exact moment you picked (not shifted by timezone).
        scheduledAt: formData.scheduledAt
          ? new Date(formData.scheduledAt).toISOString()
          : "",

        // NEW: the customers who will receive the campaign
        customerIds: selectedCustomers,

        image,
      });

      console.log(
        "Created Campaign:",
        campaign
      );

      resetForm();

      onClose();

      // Success message (shown AFTER the popup is closed)
      toast.success(
        formData.scheduledAt
          ? "Campaign scheduled successfully."
          : "Campaign created successfully."
      );

      // Open the Send Campaign flow for the campaign we just created.
      // NEW: skipped for scheduled campaigns - they send automatically
      // at the chosen time, so there is nothing to send manually now.
      if (onCreated && !formData.scheduledAt) {
        onCreated(campaign);
      }
    } catch (error) {
      console.error(
        "Create campaign failed:",
        error
      );

      // ========================================================
      // PLAN LIMIT
      // ========================================================

      if (
        error?.response?.status === 403
      ) {
        setSubmitting(false);

        onClose();

        return;
      }

      toast.error(
        error?.response?.data?.message ||
          "Unable to create campaign."
      );

      setSubmitting(false);
    }
  };

  // ============================================================
  // CLOSE
  // ============================================================

  const handleClose = () => {
    if (submitting) {
      return;
    }

    onClose();
  };


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
      mode="create"
      onClose={handleClose}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitLabel={
        formData.scheduledAt ? "Schedule Campaign" : "Create Campaign"
      }
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
      // audience (a draft can be created without customers,
      // a scheduled campaign needs them)
      customers={filteredCustomers}
      loadingCustomers={loadingCustomers}
      customerSearch={customerSearch}
      onCustomerSearch={setCustomerSearch}
      selectedCustomers={selectedCustomers}
      onToggleCustomer={toggleCustomer}
      onSelectAll={handleSelectAll}
      onClearAll={handleClearAll}
      audienceRequired={!!formData.scheduledAt}
      // media
      image={image}
      imagePreview={imagePreview}
      fileInputRef={fileInputRef}
      onImageChange={handleImageChange}
      onRemoveImage={removeImage}
      restrictImageToTemplate
    />
  );
}
