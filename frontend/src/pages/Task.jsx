import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";

import { useAuthStore } from "../store/authStore";
import useTaskStore from "../store/taskStore";

import TaskStats from "../components/tasks/TaskStats";
import TaskFilters from "../components/tasks/TaskFilters";
import TaskTable from "../components/tasks/TaskTable";
import CreateTaskModal from "../components/tasks/CreateTaskModal";
import EditTaskModal from "../components/tasks/EditTaskModal";
import ViewTaskModal from "../components/tasks/ViewTaskModal";
import KanbanBoard from "../components/tasks/KanbanBoard";
import ConfirmModal from "../components/common/ConfirmModal";
import {
  TaskPagination,
} from "../components/tasks/taskUi";
import {
  STATUS_OPTIONS,
} from "../components/tasks/taskHelpers";

const STATUS_CHIPS = [
  { value: "ALL", label: "All" },
  ...STATUS_OPTIONS,
];

export default function Tasks() {
  const { user } = useAuthStore();

  const {
    tasks,
    fetchTasks,
    removeTask,
    changeTaskStatus,
    editTask,
    isLoading,
  } = useTaskStore();

  const isAdmin = user?.role === "ADMIN";

  const [viewMode, setViewMode] = useState("LIST");

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("ALL");

  const [currentPage, setCurrentPage] = useState(1);

  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);

  const [showViewModal, setShowViewModal] = useState(false);

  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // ============================
  // FILTER + PAGINATE
  // ============================

  const filteredTasks = useMemo(() => {
    const term = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesSearch = task.title
        ?.toLowerCase()
        .includes(term);

      const matchesStatus =
        statusFilter === "ALL"
          ? true
          : task.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tasks, search, statusFilter]);

  const totalPages = Math.ceil(
    filteredTasks.length / itemsPerPage
  );

  const startIndex = (currentPage - 1) * itemsPerPage;

  const paginatedTasks = filteredTasks.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Changing a filter always returns to the first page
  const updateSearch = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const updateStatusFilter = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  // ============================
  // ACTIONS
  // ============================

  const handleEdit = (task) => {
    setSelectedTask(task);
    setShowEditModal(true);
  };

  const handleView = (task) => {
    setSelectedTask(task);
    setShowViewModal(true);
  };

  // "Edit" button inside the View modal
  const handleEditFromView = (task) => {
    setShowViewModal(false);
    setSelectedTask(task);
    setShowEditModal(true);
  };

  const handleDelete = (id) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = async () => {
    const id = deleteTargetId;
    setDeleteTargetId(null);

    try {
      await removeTask(id);

      toast.success("Task deleted successfully!");
    } catch (error) {
      console.error(error);

      toast.error("Failed to delete task.");
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await changeTaskStatus(id, status);

      toast.success("Task status updated successfully!");
    } catch (error) {
      console.error(error);

      toast.error("Failed to update task status.");
    }
  };

  const handlePriorityChange = async (id, priority) => {
    try {
      const task = tasks.find((t) => t.id === id);

      await editTask(id, {
        ...task,
        priority,
      });

      toast.success("Task priority updated successfully!");
    } catch (error) {
      console.error(error);

      toast.error("Failed to update task priority.");
    }
  };

  return (
    <div className="crm-page">
      {/* ========================= */}
      {/* PAGE HEADER */}
      {/* ========================= */}

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Tasks
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage and monitor your tasks
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-green-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-600"
          >
            <Plus size={16} />
            Add Task
          </button>
        )}
      </div>

      {/* ========================= */}
      {/* STATS */}
      {/* ========================= */}

      <TaskStats tasks={tasks} />

      {/* ========================= */}
      {/* TOOLBAR */}
      {/* ========================= */}

      <TaskFilters
        search={search}
        setSearch={updateSearch}
        statusFilter={statusFilter}
        setStatusFilter={updateStatusFilter}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {/* ========================= */}
      {/* STATUS CHIPS */}
      {/* ========================= */}

      <div className="mt-6 flex flex-wrap gap-2 sm:gap-3">
        {STATUS_CHIPS.map((chip) => (
          <button
            key={chip.value}
            type="button"
            onClick={() => updateStatusFilter(chip.value)}
            className={`rounded-full px-5 py-2 text-sm font-medium transition ${
              statusFilter === chip.value
                ? "bg-green-500 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* ========================= */}
      {/* LOADING */}
      {/* ========================= */}

      {isLoading && tasks.length === 0 && (
        <div className="mt-10 text-center text-slate-500">
          Loading tasks...
        </div>
      )}

      {/* ========================= */}
      {/* EMPTY */}
      {/* ========================= */}

      {!isLoading && filteredTasks.length === 0 && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
          <h3 className="text-xl font-semibold text-slate-800">
            No Tasks Found
          </h3>

          <p className="mt-2 text-slate-500">
            {isAdmin
              ? "Create your first task."
              : "No tasks have been assigned to you."}
          </p>
        </div>
      )}

      {/* ========================= */}
      {/* CONTENT */}
      {/* ========================= */}

      {filteredTasks.length > 0 &&
        (viewMode === "LIST" ? (
          <TaskTable
            tasks={paginatedTasks}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            onPriorityChange={handlePriorityChange}
          />
        ) : (
          <KanbanBoard
            tasks={paginatedTasks}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            onPriorityChange={handlePriorityChange}
          />
        ))}

      {filteredTasks.length > 0 && (
        <TaskPagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setItemsPerPage(size);
            setCurrentPage(1);
          }}
        />
      )}

      {/* ========================= */}
      {/* MODALS */}
      {/* ========================= */}

      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          fetchTasks();
        }}
      />

      <EditTaskModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
      />

      <ViewTaskModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        canEdit={isAdmin}
        onEdit={handleEditFromView}
      />

      <ConfirmModal
        isOpen={!!deleteTargetId}
        title="Delete Task"
        message="Are you sure you want to delete this task? This cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}