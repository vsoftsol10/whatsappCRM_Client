// import React, {
//   useEffect,
//   useMemo,
//   useState,
// } from "react";

// import { useNavigate } from "react-router-dom";

// import {
//   FiUserPlus,
//   FiSearch,
// } from "react-icons/fi";

// import apiClient from "../api/apiClient";
// import useEmployeeStore from "../store/employeeStore";

// import EmployeeTable from "../components/employee/EmployeeTable";
// import EmployeeStats from "../components/employee/EmployeeStats";
// import EmployeeFilters from "../components/employee/EmployeeFilters";

// import toast from "react-hot-toast";
// import Pagination from "../components/common/Pagination";
// import ConfirmModal from "../components/common/ConfirmModal";
// import EditEmployee from "../pages/EditEmployee";
// import AddEmployeeModal from "../components/employee/AddEmployeeModal";

// const ManageEmployees = () => {
//   const navigate = useNavigate();

//   const [searchTerm, setSearchTerm] =
//     useState("");

//   const [statusFilter, setStatusFilter] =
//     useState("ALL");

//   const [currentPage, setCurrentPage] =
//     useState(1);

//   const [deleteTargetId, setDeleteTargetId] =
//     useState(null);

//   const [editingEmployeeId, setEditingEmployeeId] =
//     useState(null);

//   const [showAddEmployeeModal, setShowAddEmployeeModal] =
//     useState(false);

//   const itemsPerPage = 10;

//   const {
//     employees,
//     loading,
//     fetchEmployees: fetchEmployeesBase,
//   } = useEmployeeStore();

//   // Manage Employees also lists admins that were created as employees
//   const fetchEmployees = () =>
//     fetchEmployeesBase({ includeAdmins: true });

//   useEffect(() => {
//     fetchEmployees();
//   }, []);

//   useEffect(() => {
//     setCurrentPage(1);
//   }, [searchTerm, statusFilter]);

//   // =========================
//   // SEARCH + FILTER
//   // =========================

//   const filteredEmployees =
//     useMemo(() => {
//       return employees.filter((emp) => {
//         const matchesSearch =
//           emp.name
//             ?.toLowerCase()
//             .includes(
//               searchTerm.toLowerCase()
//             ) ||
//           emp.email
//             ?.toLowerCase()
//             .includes(
//               searchTerm.toLowerCase()
//             );

//         const matchesStatus =
//           statusFilter === "ALL"
//             ? true
//             : statusFilter === "ACTIVE"
//               ? emp.status === "ACTIVE"
//               : statusFilter === "INACTIVE"
//                 ? emp.status === "INACTIVE"
//                 : emp.role === "ADMIN";

//         return (
//           matchesSearch &&
//           matchesStatus
//         );
//       });
//     }, [
//       employees,
//       searchTerm,
//       statusFilter,
//     ]);

//   // =========================
//   // PAGINATION
//   // =========================

//   const totalPages = Math.ceil(
//     filteredEmployees.length / itemsPerPage
//   );

//   const startIndex =
//     (currentPage - 1) * itemsPerPage;

//   const paginatedEmployees =
//     filteredEmployees.slice(
//       startIndex,
//       startIndex + itemsPerPage
//     );

//   // =========================
//   // STATISTICS
//   // =========================

//   const totalEmployees =
//     employees.length;

//   const activeEmployees =
//     employees.filter(
//       (emp) =>
//         emp.status === "ACTIVE"
//     ).length;

//   const inactiveEmployees =
//     employees.filter(
//       (emp) =>
//         emp.status === "INACTIVE"
//     ).length;

//   const adminEmployees =
//     employees.filter(
//       (emp) =>
//         emp.role === "ADMIN"
//     ).length;

//   // =========================
//   // DELETE
//   // =========================


//   const handleDelete = (id) => {
//     setDeleteTargetId(id);
//   };

//   const confirmDelete = async () => {
//     const id = deleteTargetId;
//     setDeleteTargetId(null);

//     try {
//       await apiClient.delete(`/api/employees/${id}`);

//       fetchEmployees();

//       toast.success("Employee deleted successfully!");
//     } catch (error) {
//       console.error(error);

//       toast.error(
//         error.response?.data?.message ||
//         "Failed to delete employee"
//       );
//     }
//   };

//   return (
//     <div className="crm-page space-y-6">

//       {/* ================= HEADER ================= */}

//       <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

//         <div className="min-w-0">
//           <h1 className="crm-title">
//             Manage Employees
//           </h1>

//           <p className="crm-subtitle">
//             Manage your employees, roles and department information.
//           </p>
//         </div>

//         <button
//           onClick={() => setShowAddEmployeeModal(true)}
//           className="crm-primary-button w-full sm:w-auto"
//         >
//           <FiUserPlus />
//           Add Employee
//         </button>

//       </div>

//       {/* ================= STATS ================= */}

//       <EmployeeStats
//         totalEmployees={totalEmployees}
//         activeEmployees={activeEmployees}
//         inactiveEmployees={inactiveEmployees}
//         adminEmployees={adminEmployees}
//       />


//       {/* ================= SEARCH + FILTERS ================= */}

//       <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
//         {/* Search */}
//         <div className="relative w-full lg:max-w-md">
//           <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />

//           <input
//             type="text"
//             placeholder="Search employee by name or email..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="crm-input pl-11"
//           />
//         </div>

//         {/* Filter Chips */}
//         <EmployeeFilters
//           statusFilter={statusFilter}
//           setStatusFilter={setStatusFilter}
//         />
//       </div>

//       {/* ================= CONTENT ================= */}

//       {loading ? (
//         <div className="crm-page-surface p-8 text-center sm:p-16">
//           <p className="text-gray-500 text-lg">
//             Loading employees...
//           </p>
//         </div>
//       ) : filteredEmployees.length === 0 ? (
//         <div className="crm-page-surface p-8 text-center sm:p-16">
//           <h3 className="text-xl font-semibold text-gray-700">
//             No Employees Found
//           </h3>

//           <p className="text-gray-500 mt-2">
//             Try changing your search or filter.
//           </p>
//         </div>
//       ) : (
//         <>
//           <EmployeeTable
//             employees={paginatedEmployees}
//             handleDelete={handleDelete}
//             handleEdit={(id) => setEditingEmployeeId(id)}
//           />

//           <Pagination
//             currentPage={currentPage}
//             totalPages={totalPages}
//             totalItems={filteredEmployees.length}
//             itemsPerPage={itemsPerPage}
//             onPageChange={setCurrentPage}
//           />
//         </>
//       )}

//       <ConfirmModal
//         isOpen={!!deleteTargetId}
//         title="Delete Employee"
//         message="Are you sure you want to delete this employee? This cannot be undone."
//         confirmText="Delete"
//         cancelText="Cancel"
//         variant="danger"
//         onConfirm={confirmDelete}
//         onCancel={() => setDeleteTargetId(null)}
//       />

//       {editingEmployeeId && (
//         <EditEmployee
//           employeeId={editingEmployeeId}
//           onClose={() => setEditingEmployeeId(null)}
//           onSuccess={fetchEmployees}
//         />
//       )}
//       {showAddEmployeeModal && (
//         <AddEmployeeModal
//           onClose={() => setShowAddEmployeeModal(false)}
//           onSuccess={fetchEmployees}
//         />
//       )}

//     </div>
//   );
// };

// export default ManageEmployees;




import { useCallback, useEffect, useMemo, useState } from "react";

import { Plus } from "lucide-react";

import apiClient from "../api/apiClient";
import { updateEmployee } from "../api/employeeApi";
import useEmployeeStore from "../store/employeeStore";
import { useAuthStore } from "../store/authStore";

import EmployeeTable from "../components/employee/EmployeeTable";
import EmployeeStats from "../components/employee/EmployeeStats";
import EmployeeFilters from "../components/employee/EmployeeFilters";

import toast from "react-hot-toast";
import CustomerPagination from "../components/customers/CustomerPagination";
import ConfirmModal from "../components/common/ConfirmModal";
import EditEmployee from "../pages/EditEmployee";
import AddEmployeeModal from "../components/employee/AddEmployeeModal";
import ViewEmployeeModal from "../components/employee/ViewEmployeeModal";

const ManageEmployees = () => {
  const currentUser = useAuthStore((state) => state.user);
  const currentUserId = currentUser?.id || currentUser?.userId;

  const [searchTerm, setSearchTerm] =
    useState("");

  // Status dropdown: ALL / ACTIVE / INACTIVE
  const [statusFilter, setStatusFilter] =
    useState("ALL");

  // Role chips: ALL / USER / ADMIN
  const [roleFilter, setRoleFilter] =
    useState("ALL");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [deleteTargetId, setDeleteTargetId] =
    useState(null);

  const [viewingEmployeeId, setViewingEmployeeId] =
    useState(null);

  const [editingEmployeeId, setEditingEmployeeId] =
    useState(null);

  const [showAddEmployeeModal, setShowAddEmployeeModal] =
    useState(false);

  // Employee whose status switch is being saved
  const [togglingId, setTogglingId] =
    useState(null);

  const [itemsPerPage, setItemsPerPage] = useState(5);

  const {
    employees,
    loading,
    fetchEmployees: fetchEmployeesBase,
    setEmployees,
  } = useEmployeeStore();

  // Manage Employees also lists admins that were created as employees
  const fetchEmployees = () =>
    fetchEmployeesBase({ includeAdmins: true });

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, roleFilter]);

  // =========================
  // SEARCH + FILTER
  // =========================

  const filteredEmployees =
    useMemo(() => {
      const term = searchTerm.toLowerCase();

      return employees.filter((emp) => {
        const matchesSearch =
          emp.name
            ?.toLowerCase()
            .includes(term) ||
          emp.email
            ?.toLowerCase()
            .includes(term);

        const matchesStatus =
          statusFilter === "ALL" ||
          emp.status === statusFilter;

        const matchesRole =
          roleFilter === "ALL" ||
          emp.role === roleFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesRole
        );
      });
    }, [
      employees,
      searchTerm,
      statusFilter,
      roleFilter,
    ]);

  // =========================
  // PAGINATION
  // =========================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredEmployees.length / itemsPerPage
    )
  );

  const safePage = Math.min(
    currentPage,
    totalPages
  );

  const startIndex =
    (safePage - 1) * itemsPerPage;

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
  // STATUS SWITCH
  // =========================

  // The update API needs the whole employee (it checks the e-mail for
  // duplicates), so send everything and only change the status.
  const handleToggleStatus = async (employee, makeActive) => {
    if (togglingId) return;

    const nextStatus = makeActive ? "ACTIVE" : "INACTIVE";
    const previousEmployees = employees;

    setTogglingId(employee.id);

    // show the new position of the switch straight away
    setEmployees(
      employees.map((emp) =>
        emp.id === employee.id
          ? { ...emp, status: nextStatus }
          : emp
      )
    );

    try {
      await updateEmployee(employee.id, {
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        department: employee.department,
        designation: employee.designation,
        address: employee.address,
        role: employee.role,
        status: nextStatus,
      });

      toast.success(
        makeActive
          ? "Employee activated"
          : "Employee deactivated"
      );
    } catch (error) {
      console.error(error);

      // put the switch back
      setEmployees(previousEmployees);

      toast.error(
        error?.response?.data?.message ||
        "Failed to update status"
      );
    } finally {
      setTogglingId(null);
    }
  };

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

  const closeView = useCallback(
    () => setViewingEmployeeId(null),
    []
  );

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
          type="button"
          onClick={() => setShowAddEmployeeModal(true)}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-500 px-6 text-sm font-semibold text-white transition hover:bg-green-600 sm:w-auto"
        >
          <Plus size={16} />
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

      <EmployeeFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
      />

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
            handleView={(id) => setViewingEmployeeId(id)}
            handleEdit={(id) => setEditingEmployeeId(id)}
            handleDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
            togglingId={togglingId}
            currentUserId={currentUserId}
          />

          <CustomerPagination
            currentPage={safePage}
            totalPages={totalPages}
            pageSize={itemsPerPage}
            onPageChange={(page) =>
              setCurrentPage(
                Math.min(Math.max(1, page), totalPages)
              )
            }
            onPageSizeChange={(size) => {
              setItemsPerPage(size);
              setCurrentPage(1);
            }}
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

      {viewingEmployeeId && (
        <ViewEmployeeModal
          employeeId={viewingEmployeeId}
          onClose={closeView}
          onEdit={(id) => {
            setViewingEmployeeId(null);
            setEditingEmployeeId(id);
          }}
        />
      )}

      {editingEmployeeId && (
        <EditEmployee
          employeeId={editingEmployeeId}
          onClose={() => setEditingEmployeeId(null)}
          onSuccess={fetchEmployees}
        />
      )}
      {showAddEmployeeModal && (
        <AddEmployeeModal
          onClose={() => setShowAddEmployeeModal(false)}
          onSuccess={fetchEmployees}
        />
      )}

    </div>
  );
};

export default ManageEmployees;
