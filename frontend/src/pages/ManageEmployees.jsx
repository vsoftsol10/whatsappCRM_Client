

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  FiUserPlus,
  FiSearch,
} from "react-icons/fi";

import apiClient from "../api/apiClient";
import useEmployeeStore from "../store/employeeStore";

import EmployeeTable from "../components/employee/EmployeeTable";
import EmployeeStats from "../components/employee/EmployeeStats";
import EmployeeFilters from "../components/employee/EmployeeFilters";

import toast from "react-hot-toast";
import Pagination from "../components/common/Pagination";
import ConfirmModal from "../components/common/ConfirmModal";
import EditEmployee from "../pages/EditEmployee";

const ManageEmployees = () => {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [deleteTargetId, setDeleteTargetId] =
    useState(null);

  const [editingEmployeeId, setEditingEmployeeId] =
    useState(null);

  const itemsPerPage = 10;

  const {
    employees,
    loading,
    fetchEmployees,
  } = useEmployeeStore();

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // =========================
  // SEARCH + FILTER
  // =========================

  const filteredEmployees =
    useMemo(() => {
      return employees.filter((emp) => {
        const matchesSearch =
          emp.name
            ?.toLowerCase()
            .includes(
              searchTerm.toLowerCase()
            ) ||
          emp.email
            ?.toLowerCase()
            .includes(
              searchTerm.toLowerCase()
            );

        const matchesStatus =
          statusFilter === "ALL"
            ? true
            : statusFilter === "ACTIVE"
              ? emp.status === "ACTIVE"
              : statusFilter === "INACTIVE"
                ? emp.status === "INACTIVE"
                : emp.role === "ADMIN";

        return (
          matchesSearch &&
          matchesStatus
        );
      });
    }, [
      employees,
      searchTerm,
      statusFilter,
    ]);

  // =========================
  // PAGINATION
  // =========================

  const totalPages = Math.ceil(
    filteredEmployees.length / itemsPerPage
  );

  const startIndex =
    (currentPage - 1) * itemsPerPage;

  const paginatedEmployees =
    filteredEmployees.slice(
      startIndex,
      startIndex + itemsPerPage
    );

  // =========================
  // STATISTICS
  // =========================

  const totalEmployees =
    employees.length;

  const activeEmployees =
    employees.filter(
      (emp) =>
        emp.status === "ACTIVE"
    ).length;

  const inactiveEmployees =
    employees.filter(
      (emp) =>
        emp.status === "INACTIVE"
    ).length;

  const adminEmployees =
    employees.filter(
      (emp) =>
        emp.role === "ADMIN"
    ).length;

  // =========================
  // DELETE
  // =========================


  const handleDelete = (id) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = async () => {
    const id = deleteTargetId;
    setDeleteTargetId(null);

    try {
      await apiClient.delete(`/api/employees/${id}`);

      fetchEmployees();

      toast.success("Employee deleted successfully!");
    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.message ||
        "Failed to delete employee"
      );
    }
  };

  return (
    <div className="crm-page space-y-6">

      {/* ================= HEADER ================= */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div className="min-w-0">
          <h1 className="crm-title">
            Manage Employees
          </h1>

          <p className="crm-subtitle">
            Manage your employees, roles and department information.
          </p>
        </div>

        <button
          onClick={() => navigate("/employees/add")}
          className="crm-primary-button w-full sm:w-auto"
        >
          <FiUserPlus />
          Add Employee
        </button>

      </div>

      {/* ================= STATS ================= */}

      <EmployeeStats
        totalEmployees={totalEmployees}
        activeEmployees={activeEmployees}
        inactiveEmployees={inactiveEmployees}
        adminEmployees={adminEmployees}
      />


      {/* ================= SEARCH + FILTERS ================= */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Search */}
        <div className="relative w-full lg:max-w-md">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />

          <input
            type="text"
            placeholder="Search employee by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="crm-input pl-11"
          />
        </div>

        {/* Filter Chips */}
        <EmployeeFilters
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
      </div>

      {/* ================= CONTENT ================= */}

      {loading ? (
        <div className="crm-page-surface p-8 text-center sm:p-16">
          <p className="text-gray-500 text-lg">
            Loading employees...
          </p>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="crm-page-surface p-8 text-center sm:p-16">
          <h3 className="text-xl font-semibold text-gray-700">
            No Employees Found
          </h3>

          <p className="text-gray-500 mt-2">
            Try changing your search or filter.
          </p>
        </div>
      ) : (
        <>
          <EmployeeTable
            employees={paginatedEmployees}
            handleDelete={handleDelete}
            handleEdit={(id) => setEditingEmployeeId(id)}
          />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredEmployees.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      <ConfirmModal
        isOpen={!!deleteTargetId}
        title="Delete Employee"
        message="Are you sure you want to delete this employee? This cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />

      {editingEmployeeId && (
        <EditEmployee
          employeeId={editingEmployeeId}
          onClose={() => setEditingEmployeeId(null)}
          onSuccess={fetchEmployees}
        />
      )}

    </div>
  );
};

export default ManageEmployees;