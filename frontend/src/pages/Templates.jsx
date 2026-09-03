import { useEffect, useMemo, useState } from "react";

import useTemplateStore from "../store/templateStore";

import TemplateStats from "../components/templates/TemplateStats";
import TemplateFilters from "../components/templates/TemplateFilters";
import TemplateCard from "../components/templates/TemplateCard";
import CreateTemplateModal from "../components/templates/CreateTemplateModal";
import EditTemplateModal from "../components/templates/EditTemplateModal";
import TemplatePreviewModal from "../components/templates/TemplatePreviewModal";
import SendTemplateModal from "../components/templates/SendTemplateModal";
import toast from "react-hot-toast";
import Pagination from "../components/common/Pagination";
import ConfirmModal from "../components/common/ConfirmModal";

export default function Templates() {
  const {
    templates,
    fetchTemplates,
    removeTemplate,
    editTemplate,
    submitTemplateForApproval,
    isLoading,
  } = useTemplateStore();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);

  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const [showSendModal, setShowSendModal] = useState(false);

  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const itemsPerPage = 9; // 3 x 3 grid

  useEffect(() => {
    fetchTemplates();
  }, []);

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesSearch =
        template.name
          ?.toLowerCase()
          .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL"
          ? true
          : template.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [
    templates,
    search,
    statusFilter,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const totalPages = Math.ceil(
    filteredTemplates.length / itemsPerPage
  );

  const startIndex =
    (currentPage - 1) * itemsPerPage;

  const paginatedTemplates =
    filteredTemplates.slice(
      startIndex,
      startIndex + itemsPerPage
    );

  const handleEdit = (template) => {
    setSelectedTemplate(template);
    setShowEditModal(true);
  };

  const handleDelete = (id) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = async () => {
    const id = deleteTargetId;
    setDeleteTargetId(null);

    try {
      await removeTemplate(id);
      toast.success("Template deleted successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete template. Please try again.");
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await editTemplate(id, {
        status,
      });

      toast.success(`Template status updated to ${status}.`);
    } catch (error) {
      console.error("STATUS UPDATE ERROR", error);

      toast.error(
        "Failed to update template status. Please try again."
      );
    }
  };


  const handleSubmitForApproval = async (id) => {
    try {
      await submitTemplateForApproval(id);

      toast.success(
        "Template submitted for approval successfully!"
      );
    } catch (error) {
      console.error(
        "SUBMIT FOR APPROVAL ERROR",
        error
      );

      toast.error(
        error?.response?.data?.message ||
        "Failed to submit template for approval."
      );
    }
  };


  const handlePreview = (template) => {
    setSelectedTemplate(template);
    setShowPreviewModal(true);
  };

  const handleSend = (template) => {
    setSelectedTemplate(template);
    setShowSendModal(true);
  };

  return (
    <div className="p-6">
      {/* HEADER */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            Templates
          </h1>

          <p className="text-gray-500">
            Manage and monitor your templates
          </p>
        </div>

        <button
          onClick={() =>
            setShowCreateModal(true)
          }
          className="bg-green-400 text-black px-5 py-3 rounded-xl font-medium"
        >
          Create Template
        </button>
      </div>

      {/* STATS */}

      <TemplateStats templates={templates} />

      {/* FILTERS */}

      <TemplateFilters
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* LOADING */}

      {isLoading && (
        <div className="mt-8 text-center">
          Loading templates...
        </div>
      )}

      {/* EMPTY */}

      {!isLoading &&
        filteredTemplates.length === 0 && (
          <div className="bg-white rounded-xl p-10 text-center mt-6">
            <h3 className="font-semibold text-lg">
              No Templates Found
            </h3>

            <p className="text-gray-500 mt-2">
              Create your first template.
            </p>
          </div>
        )}

      {/* GRID */}

      {!isLoading &&
        filteredTemplates.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
            {paginatedTemplates.map(
              (template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onPreview={handlePreview}
                  onSend={handleSend}
                  onSubmitForApproval={handleSubmitForApproval}
                />
              )
            )}
          </div>
        )}

      {filteredTemplates.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredTemplates.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      )}

      {/* MODAL */}

      <CreateTemplateModal
        isOpen={showCreateModal}
        onClose={() =>
          setShowCreateModal(false)
        }
      />

      <EditTemplateModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTemplate(null);
        }}
        template={selectedTemplate}
      />

      <TemplatePreviewModal
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setSelectedTemplate(null);
        }}
        template={selectedTemplate}
      />

      <SendTemplateModal
        isOpen={showSendModal}
        onClose={() => {
          setShowSendModal(false);
          setSelectedTemplate(null);
        }}
        template={selectedTemplate}
      />

      <ConfirmModal
        isOpen={!!deleteTargetId}
        title="Delete Template"
        message="Are you sure you want to delete this template? This cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}