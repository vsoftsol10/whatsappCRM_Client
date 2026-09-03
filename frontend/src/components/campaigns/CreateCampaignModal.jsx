
import { useEffect, useMemo, useRef, useState } from "react";
import { X, Search, ImagePlus, CalendarClock, Users, FileText } from "lucide-react";
import toast from "react-hot-toast";

import { getCustomers } from "../../api/customerApi";
import useCampaignStore from "../../store/campaignStore";

// Change this import path if your template API is located elsewhere
import { getTemplates } from "../../api/templateApi";

export default function CreateCampaignModal({
  isOpen,
  onClose,
  aiCampaign,
}) {
  const { addCampaign } = useCampaignStore();

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

  const [submitting, setSubmitting] = useState(false);
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

    fetchCustomers();
    fetchApprovedTemplates();

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
  }, [aiCampaign]);

  // ============================================================
  // FETCH CUSTOMERS
  // ============================================================

  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true);

      const response = await getCustomers();

      console.log("Customers Response:", response);

      let customerList = [];

      if (Array.isArray(response)) {
        customerList = response;
      } else if (Array.isArray(response?.data)) {
        customerList = response.data;
      } else if (Array.isArray(response?.customers)) {
        customerList = response.customers;
      } else if (
        Array.isArray(response?.data?.customers)
      ) {
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

    return customers.filter((customer) => {
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
    });
  }, [customers, customerSearch]);

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
    // CUSTOMERS
    // ==========================================================

    if (selectedCustomers.length === 0) {
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
        messageContent:
          formData.messageContent.trim(),

        scheduledAt:
          formData.scheduledAt || "",

        customerIds:
          selectedCustomers,

        image,
      });

      console.log(
        "Created Campaign:",
        campaign
      );

      toast.success(
        formData.scheduledAt
          ? "Campaign scheduled successfully."
          : "Campaign created successfully."
      );

      resetForm();

      onClose();
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
  // UI
  // ============================================================

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">

      <div className="flex min-h-screen items-center justify-center p-4">

        <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">

          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="flex items-center justify-between bg-[#25D366] px-6 py-5">

            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Create Campaign
              </h2>

              <p className="mt-1 text-sm text-gray-700">
                Send an approved WhatsApp template to your audience
              </p>
            </div>

            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className={`rounded-full p-2 transition ${
                submitting
                  ? "cursor-not-allowed opacity-50"
                  : "hover:bg-[#128C7E]"
              }`}
            >
              <X size={22} />
            </button>

          </div>

          {/* ==================================================
              FORM
          ================================================== */}

          <form
            onSubmit={handleSubmit}
            className="max-h-[78vh] space-y-6 overflow-y-auto p-6"
          >

            {/* ==================================================
                BASIC INFORMATION
            ================================================== */}

            <div>

              <div className="mb-4 flex items-center gap-2">

                <div className="rounded-lg bg-green-100 p-2">
                  <FileText
                    size={18}
                    className="text-[#128C7E]"
                  />
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800">
                    Campaign Details
                  </h3>

                  <p className="text-xs text-gray-500">
                    Configure your campaign
                  </p>
                </div>

              </div>

              <div className="grid gap-5 md:grid-cols-2">

                {/* Campaign Name */}

                <div>

                  <label className="mb-2 block font-medium text-gray-700">
                    Campaign Name
                    <span className="text-red-500">
                      {" "}*
                    </span>
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Diwali Promotion 2026"
                    disabled={submitting}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#25D366] disabled:bg-gray-100"
                  />

                </div>

                {/* Campaign Type */}

                <div>

                  <label className="mb-2 block font-medium text-gray-700">
                    Campaign Type
                  </label>

                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    disabled={submitting}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#25D366] disabled:bg-gray-100"
                  >

                    <option value="PROMOTIONAL">
                      Promotional
                    </option>

                    <option value="BROADCAST">
                      Broadcast
                    </option>

                    <option value="FOLLOW_UP">
                      Follow Up
                    </option>

                    <option value="ANNOUNCEMENT">
                      Announcement
                    </option>

                  </select>

                </div>

              </div>

            </div>

            {/* ==================================================
                TEMPLATE
            ================================================== */}

            <div>

              <div className="mb-3 flex items-center justify-between">

                <div>

                  <label className="block font-medium text-gray-700">
                    WhatsApp Template
                    <span className="text-red-500">
                      {" "}*
                    </span>
                  </label>

                  <p className="mt-1 text-xs text-gray-500">
                    Only Meta-approved templates can be used.
                  </p>

                </div>

                {templates.length > 0 && (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    {templates.length} Approved
                  </span>
                )}

              </div>

              {loadingTemplates ? (

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center text-gray-500">
                  Loading approved templates...
                </div>

              ) : templates.length === 0 ? (

                <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5">

                  <p className="font-semibold text-yellow-800">
                    No approved templates available
                  </p>

                  <p className="mt-1 text-sm text-yellow-700">
                    Create a WhatsApp template and submit it for Meta approval before creating a campaign.
                  </p>

                </div>

              ) : (

                <select
                  value={selectedTemplateId}
                  onChange={handleTemplateChange}
                  disabled={submitting}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#25D366] disabled:bg-gray-100"
                >

                  <option value="">
                    Select an approved template
                  </option>

                  {templates.map(
                    (template) => (
                      <option
                        key={template.id}
                        value={template.id}
                      >
                        {template.name}
                        {" — "}
                        {template.language}
                        {" — "}
                        {template.category}
                      </option>
                    )
                  )}

                </select>

              )}

              {/* Template Preview */}

              {selectedTemplate && (

                <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">

                  <div className="border-b bg-gray-50 px-4 py-3">

                    <div className="flex items-center justify-between">

                      <div>

                        <p className="font-semibold text-gray-800">
                          {selectedTemplate.name}
                        </p>

                        <p className="text-xs text-gray-500">
                          {selectedTemplate.language}
                          {" • "}
                          {selectedTemplate.category}
                        </p>

                      </div>

                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        APPROVED
                      </span>

                    </div>

                  </div>

                  <div className="bg-[#efeae2] p-5">

                    <div className="max-w-xl rounded-lg bg-white p-4 shadow-sm">

                      {selectedTemplate.headerContent && (
                        <p className="mb-3 font-semibold text-gray-800">
                          {selectedTemplate.headerContent}
                        </p>
                      )}

                      <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                        {selectedTemplate.content}
                      </p>

                      {selectedTemplate.footerContent && (
                        <p className="mt-3 text-xs text-gray-500">
                          {selectedTemplate.footerContent}
                        </p>
                      )}

                    </div>

                  </div>

                </div>

              )}

            </div>

            {/* ==================================================
                TEMPLATE VARIABLES
            ================================================== */}

            {selectedTemplate &&
              templateVariables.length > 0 && (

                <div>

                  <label className="mb-2 block font-medium text-gray-700">
                    Campaign Variable Content
                  </label>

                  <p className="mb-3 text-xs text-gray-500">
                    This field is currently stored as campaign content. We will move to structured template variables when the Meta integration is connected.
                  </p>

                  <textarea
                    rows={4}
                    name="messageContent"
                    value={formData.messageContent}
                    onChange={handleChange}
                    placeholder={`Example: {{1}} = customer name, {{2}} = special offer`}
                    disabled={submitting}
                    className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#25D366] disabled:bg-gray-100"
                  />

                  <div className="mt-3 flex flex-wrap gap-2">

                    {templateVariables.map(
                      (variable) => (
                        <span
                          key={variable}
                          className="rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                        >
                          {"{{"}
                          {variable}
                          {"}}"}
                        </span>
                      )
                    )}

                  </div>

                </div>
              )}

            {/* ==================================================
                SCHEDULE
            ================================================== */}

            <div>

              <div className="mb-3 flex items-center gap-2">

                <CalendarClock
                  size={18}
                  className="text-[#128C7E]"
                />

                <label className="font-medium text-gray-700">
                  Schedule Campaign
                </label>

              </div>

              <input
                type="datetime-local"
                name="scheduledAt"
                value={formData.scheduledAt}
                onChange={handleChange}
                disabled={submitting}
                min={new Date(
                  Date.now() -
                    new Date().getTimezoneOffset() *
                      60000
                )
                  .toISOString()
                  .slice(0, 16)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#25D366] disabled:bg-gray-100"
              />

              <p className="mt-1 text-xs text-gray-500">
                Leave empty to create the campaign as a draft.
              </p>

            </div>

            {/* ==================================================
                IMAGE
            ================================================== */}

            <div>

              <div className="mb-3 flex items-center gap-2">

                <ImagePlus
                  size={18}
                  className="text-[#128C7E]"
                />

                <label className="font-medium text-gray-700">
                  Campaign Media
                </label>

              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                disabled={submitting}
                className="hidden"
              />

              {!imagePreview ? (

                <button
                  type="button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  disabled={submitting}
                  className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#25D366] bg-green-50 p-8 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  <div className="rounded-full bg-white p-4 shadow-sm">
                    <ImagePlus
                      size={30}
                      className="text-[#25D366]"
                    />
                  </div>

                  <h3 className="mt-4 font-semibold text-gray-800">
                    Upload Campaign Image
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    JPG, PNG or WEBP
                  </p>

                  <p className="text-xs text-gray-400">
                    Maximum size: 15 MB
                  </p>

                </button>

              ) : (

                <div className="rounded-xl border border-gray-200 p-4">

                  <img
                    src={imagePreview}
                    alt="Campaign preview"
                    className="max-h-72 w-full rounded-lg object-contain"
                  />

                  <div className="mt-4 flex gap-3">

                    <button
                      type="button"
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                      disabled={submitting}
                      className="rounded-lg bg-[#25D366] px-5 py-2 font-semibold text-white hover:bg-[#128C7E] disabled:opacity-50"
                    >
                      Change Image
                    </button>

                    <button
                      type="button"
                      onClick={removeImage}
                      disabled={submitting}
                      className="rounded-lg bg-red-500 px-5 py-2 font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                    >
                      Remove
                    </button>

                  </div>

                </div>

              )}

            </div>

            {/* ==================================================
                AUDIENCE
            ================================================== */}

            <div>

              <div className="mb-3 flex items-center justify-between">

                <div>

                  <div className="flex items-center gap-2">

                    <Users
                      size={18}
                      className="text-[#128C7E]"
                    />

                    <label className="font-medium text-gray-700">
                      Campaign Audience
                      <span className="text-red-500">
                        {" "}*
                      </span>
                    </label>

                  </div>

                  <p className="mt-1 text-xs text-gray-500">
                    Select customers who should receive this campaign.
                  </p>

                </div>

                <span className="rounded-full bg-[#DCF8C6] px-3 py-1 text-sm font-semibold text-[#128C7E]">
                  {selectedCustomers.length} selected
                </span>

              </div>

              {/* Search */}

              <div className="relative mb-3">

                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) =>
                    setCustomerSearch(
                      e.target.value
                    )
                  }
                  placeholder="Search customers by name, phone or email..."
                  disabled={submitting}
                  className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 outline-none focus:border-[#25D366] disabled:bg-gray-100"
                />

              </div>

              {/* Audience actions */}

              <div className="mb-3 flex gap-2">

                <button
                  type="button"
                  onClick={handleSelectAll}
                  disabled={
                    submitting ||
                    filteredCustomers.length === 0
                  }
                  className="rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Select All
                </button>

                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={
                    submitting ||
                    selectedCustomers.length === 0
                  }
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Clear All
                </button>

              </div>

              {/* Customer list */}

              <div className="rounded-xl border border-gray-300 bg-gray-50 p-4">

                {loadingCustomers ? (

                  <div className="py-10 text-center text-gray-500">
                    Loading customers...
                  </div>

                ) : filteredCustomers.length === 0 ? (

                  <div className="py-10 text-center text-gray-500">

                    <Users
                      size={30}
                      className="mx-auto mb-2 text-gray-400"
                    />

                    <p>
                      No customers found.
                    </p>

                  </div>

                ) : (

                  <div className="max-h-64 space-y-1 overflow-y-auto">

                    {filteredCustomers.map(
                      (customer) => {

                        const isSelected =
                          selectedCustomers.includes(
                            customer.id
                          );

                        return (
                          <label
                            key={customer.id}
                            className={`flex items-center gap-3 rounded-lg p-3 transition ${
                              submitting
                                ? "cursor-not-allowed opacity-60"
                                : "cursor-pointer hover:bg-white"
                            } ${
                              isSelected
                                ? "bg-green-50"
                                : ""
                            }`}
                          >

                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() =>
                                toggleCustomer(
                                  customer.id
                                )
                              }
                              disabled={submitting}
                              className="h-4 w-4 accent-[#25D366]"
                            />

                            <div className="min-w-0 flex-1">

                              <p className="truncate font-medium text-gray-800">
                                {customer.name ||
                                  "Unnamed Customer"}
                              </p>

                              <p className="text-sm text-gray-500">
                                {customer.phone ||
                                  "No phone number"}
                              </p>

                            </div>

                            {isSelected && (
                              <span className="text-xs font-semibold text-[#128C7E]">
                                Selected
                              </span>
                            )}

                          </label>
                        );
                      }
                    )}

                  </div>

                )}

              </div>

            </div>

            {/* ==================================================
                CAMPAIGN SUMMARY
            ================================================== */}

            <div className="rounded-xl border border-green-200 bg-green-50 p-4">

              <h4 className="font-semibold text-gray-800">
                Campaign Summary
              </h4>

              <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">

                <div>
                  <p className="text-gray-500">
                    Template
                  </p>

                  <p className="font-medium text-gray-800">
                    {selectedTemplate?.name ||
                      "Not selected"}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">
                    Audience
                  </p>

                  <p className="font-medium text-gray-800">
                    {selectedCustomers.length} customers
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">
                    Schedule
                  </p>

                  <p className="font-medium text-gray-800">
                    {formData.scheduledAt
                      ? "Scheduled"
                      : "Draft"}
                  </p>
                </div>

              </div>

            </div>

            {/* ==================================================
                FOOTER
            ================================================== */}

            <div className="flex items-center justify-between border-t pt-5">

              <div>

                {image && (
                  <div className="rounded-lg bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
                    ✓ Campaign image selected
                  </div>
                )}

              </div>

              <div className="flex gap-3">

                <button
                  type="button"
                  onClick={handleClose}
                  disabled={submitting}
                  className="rounded-lg border border-gray-300 px-6 py-3 text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    templates.length === 0
                  }
                  className={`rounded-lg px-6 py-3 font-semibold text-white transition ${
                    submitting ||
                    templates.length === 0
                      ? "cursor-not-allowed bg-gray-400"
                      : "bg-[#25D366] hover:bg-[#128C7E]"
                  }`}
                >

                  {submitting ? (

                    <span className="flex items-center gap-2">

                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />

                      Creating...

                    </span>

                  ) : formData.scheduledAt ? (
                    "Schedule Campaign"
                  ) : (
                    "Create Campaign"
                  )}

                </button>

              </div>

            </div>

          </form>

        </div>

      </div>

    </div>
  );
}

