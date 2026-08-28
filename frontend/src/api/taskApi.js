
import apiClient from "./apiClient";

// ================= GET ALL TASKS =================
export const getTasks = async () => {
  const response = await apiClient.get("/api/tasks");

  return response.data;
};

// ================= GET SINGLE TASK =================
export const getTaskById = async (id) => {
  const response = await apiClient.get(
    `/api/tasks/${id}`
  );

  return response.data;
};

// ================= CREATE TASK =================
export const createTask = async (
  taskData
) => {
  const response = await apiClient.post(
    "/api/tasks",
    taskData
  );

  return response.data;
};

// ================= UPDATE TASK =================
export const updateTask = async (
  id,
  taskData
) => {
  const response = await apiClient.put(
    `/api/tasks/${id}`,
    taskData
  );

  return response.data;
};

// ================= UPDATE TASK STATUS =================
export const updateTaskStatus = async (
  id,
  status
) => {
  const response = await apiClient.patch(
    `/api/tasks/${id}/status`,
    {
      status,
    }
  );

  return response.data;
};

// ================= DELETE TASK =================
export const deleteTask = async (id) => {
  const response = await apiClient.delete(
    `/api/tasks/${id}`
  );

  return response.data;
};

// ================= WORK NOTES =================

export const getTaskWorkNotes = async (taskId) => {
  const response = await apiClient.get(
    `/api/tasks/${taskId}/work-notes`
  );

  return response.data;
};

export const addTaskWorkNote = async (taskId, note) => {
  const response = await apiClient.post(
    `/api/tasks/${taskId}/work-notes`,
    { note }
  );

  return response.data;
};

export const updateTaskWorkNote = async (noteId, note) => {
  const response = await apiClient.put(
    `/api/tasks/work-notes/${noteId}`,
    { note }
  );

  return response.data;
};

export const deleteTaskWorkNote = async (noteId) => {
  const response = await apiClient.delete(
    `/api/tasks/work-notes/${noteId}`
  );

  return response.data;
};