import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MoreVertical } from "lucide-react";
import toast from "react-hot-toast";

import AddCustomer from "./AddCustomer";
import EditCustomer from "./EditCustomer";
import useCustomerStore from "../store/customerStore";
import { getCustomers, deleteCustomer } from "../api/customerApi";
import CustomerStatCard from "../components/customers/CustomerStatCard";
import ConfirmModal from "../components/common/ConfirmModal";
import ViewCustomerModal from "../components/customers/ViewCustomerModal";

function Customers() {
  const customers =
    useCustomerStore((state) => state.customers) || [];

  const setCustomers = useCustomerStore(
    (state) => state.setCustomers
  );

  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Currently opened customer menu
  const [openMenu, setOpenMenu] = useState(null);

  // Menu position
  const [menuPosition, setMenuPosition] = useState(null);

  const [viewCustomerId, setViewCustomerId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [editCustomerId, setEditCustomerId] = useState(null);

  // Unfiltered customers used for KPI cards
  const [allCustomers, setAllCustomers] = useState([]);

  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const ROWS_PER_PAGE = 10;

  // Ref for currently opened menu
  const menuRef = useRef(null);

  // =========================
  // CLOSE MENU WHEN CLICKING OUTSIDE
  // =========================

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setOpenMenu(null);
        setMenuPosition(null);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  // =========================
  // CLOSE MENU ON SCROLL
  // =========================

  useEffect(() => {
    const handleScroll = () => {
      if (openMenu) {
        setOpenMenu(null);
        setMenuPosition(null);
      }
    };

    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll,
        true
      );
    };
  }, [openMenu]);

  // =========================
  // FETCH ALL CUSTOMERS
  // =========================

  useEffect(() => {
    const fetchAllCustomers = async () => {
      try {
        const data = await getCustomers("", "");

        setAllCustomers(
          data.customers ||
          data.data ||
          []
        );
      } catch (error) {
        console.error(
          "Failed to fetch customer stats:",
          error
        );
      }
    };

    fetchAllCustomers();
  }, []);

  // =========================
  // FETCH CUSTOMERS
  // =========================

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await getCustomers(
          statusFilter === "ALL"
            ? ""
            : statusFilter,
          searchTerm
        );

        setCustomers(
          data.customers ||
          data.data ||
          []
        );
      } catch (error) {
        console.error(
          "Failed to fetch customers:",
          error
        );

        setCustomers([]);
      }
    };

    fetchCustomers();
  }, [
    setCustomers,
    statusFilter,
    searchTerm,
  ]);

  // =========================
  // RESET PAGE
  // =========================

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // =========================
  // CUSTOMER STATS
  // =========================

  const totalCustomers = allCustomers.length;

  const activeCustomers =
    allCustomers.filter(
      (customer) =>
        customer.status === "ACTIVE"
    ).length;

  const inactiveCustomers =
    allCustomers.filter(
      (customer) =>
        customer.status === "INACTIVE"
    ).length;

  // =========================
  // PAGINATION
  // =========================

  const totalPages = Math.max(
    1,
    Math.ceil(
      customers.length / ROWS_PER_PAGE
    )
  );

  const paginatedCustomers =
    useMemo(() => {
      const start =
        (currentPage - 1) *
        ROWS_PER_PAGE;

      return customers.slice(
        start,
        start + ROWS_PER_PAGE
      );
    }, [customers, currentPage]);

  // =========================
  // OPEN ACTION MENU
  // =========================

  const handleMenuClick = (event, customerId) => {
    event.stopPropagation();

    // If clicking the same menu again,
    // close it.
    if (openMenu === customerId) {
      setOpenMenu(null);
      setMenuPosition(null);
      return;
    }

    const button =
      event.currentTarget;

    const rect =
      button.getBoundingClientRect();

    const menuWidth = 144;
    const menuHeight = 132;

    const spacing = 8;

    // -------------------------
    // HORIZONTAL POSITION
    // -------------------------

    let left =
      rect.right - menuWidth;

    // Prevent menu from going outside
    // the left side of the screen.
    if (left < 8) {
      left = 8;
    }

    // Prevent menu from going outside
    // the right side of the screen.
    if (
      left + menuWidth >
      window.innerWidth - 8
    ) {
      left =
        window.innerWidth -
        menuWidth -
        8;
    }

    // -------------------------
    // VERTICAL POSITION
    // -------------------------

    const spaceBelow =
      window.innerHeight -
      rect.bottom;

    const spaceAbove =
      rect.top;

    let top;

    // If there is enough space below,
    // open downward.
    if (
      spaceBelow >=
      menuHeight + spacing
    ) {
      top =
        rect.bottom + spacing;
    }

    // Otherwise if there is enough
    // space above, open upward.
    else if (
      spaceAbove >=
      menuHeight + spacing
    ) {
      top =
        rect.top -
        menuHeight -
        spacing;
    }

    // If neither side has enough space,
    // choose the side with more space.
    else if (
      spaceBelow >= spaceAbove
    ) {
      top =
        rect.bottom + spacing;
    } else {
      top =
        rect.top -
        menuHeight -
        spacing;
    }

    // Prevent menu from going above
    // the viewport.
    if (top < 8) {
      top = 8;
    }

    // Prevent menu from going below
    // the viewport.
    if (
      top + menuHeight >
      window.innerHeight - 8
    ) {
      top =
        window.innerHeight -
        menuHeight -
        8;
    }

    setOpenMenu(customerId);

    setMenuPosition({
      top,
      left,
    });
  };

  // =========================
  // DELETE CUSTOMER
  // =========================

  const handleDelete = (id) => {
    setOpenMenu(null);
    setMenuPosition(null);

    setDeleteTargetId(id);
  };

  // =========================
  // CONFIRM DELETE
  // =========================

  const confirmDelete = async () => {
    const id = deleteTargetId;

    setDeleteTargetId(null);

    try {
      await deleteCustomer(id);

      setCustomers(
        customers.filter(
          (customer) =>
            customer.id !== id
        )
      );

      setAllCustomers((prev) =>
        prev.filter(
          (customer) =>
            customer.id !== id
        )
      );

      toast.success(
        "Customer deleted successfully!"
      );
    } catch (error) {
      console.error(error);

      // 403 is already handled by apiClient interceptor
      if (error?.response?.status === 403) {
        return;
      }

      // Other errors
      toast.error(
        error?.response?.data?.message ||
        "Failed to delete customer"
      );
    }
  };

  // =========================
  // VIEW CUSTOMER
  // =========================

  const handleView = (id) => {
    setOpenMenu(null);
    setMenuPosition(null);

    setViewCustomerId(id);
  };

  // =========================
  // EDIT CUSTOMER
  // =========================

  const handleEdit = (id) => {
    setOpenMenu(null);
    setMenuPosition(null);

    setEditCustomerId(id);
  };

  return (
    <div className="crm-page">

      {/* ================= HEADER ================= */}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div className="min-w-0">

          <h1 className="crm-title">
            Customers
          </h1>

          <p className="crm-subtitle">
            Manage your customer records
          </p>

        </div>

        <button
          onClick={() =>
            setShowAddCustomer(true)
          }
          className="crm-primary-button w-full sm:w-auto"
        >
          + Add Customer
        </button>

      </div>

      {/* ================= STATS ================= */}

      <CustomerStatCard
        totalCustomers={totalCustomers}
        activeCustomers={activeCustomers}
        inactiveCustomers={inactiveCustomers}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* ================= SEARCH + FILTER ================= */}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        {/* Search */}

        <div className="w-full lg:max-w-md">

          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
            className="crm-input"
          />

        </div>

        {/* Filter Chips */}

        <div className="flex flex-wrap gap-2 sm:gap-3">

          {[
            {
              key: "ALL",
              label: "All",
            },
            {
              key: "ACTIVE",
              label: "Active",
            },
            {
              key: "INACTIVE",
              label: "Inactive",
            },
          ].map((item) => {

            const isActive =
              statusFilter === item.key;

            return (
              <button
                key={item.key}
                onClick={() =>
                  setStatusFilter(
                    item.key
                  )
                }
                className={`rounded-xl border px-5 py-2.5 text-sm font-semibold transition ${isActive
                    ? "border-[#25D366] bg-[#25D366] text-black shadow-md"
                    : "border-gray-300 bg-white text-slate-700 hover:border-[#25D366] hover:bg-[#DCF8C6]"
                  }`}
              >
                {item.label}
              </button>
            );
          })}

        </div>

      </div>

      {/* ================= TABLE ================= */}

      <div className="crm-table-shell overflow-visible">

        <div className="crm-table-scroll overflow-visible">

          <table className="w-full min-w-[900px]">

            <thead className="bg-[#25D366] text-black">

              <tr>

                <th className="crm-th">
                  Name
                </th>

                <th className="crm-th">
                  Phone
                </th>

                <th className="crm-th">
                  Company
                </th>

                <th className="crm-th">
                  Status
                </th>

                <th className="crm-th text-center">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {paginatedCustomers.length > 0 ? (

                paginatedCustomers.map(
                  (customer) => (

                    <tr
                      key={customer.id}
                      onClick={() =>
                        navigate(
                          "/conversations",
                          {
                            state: {
                              customerId:
                                customer.id,
                            },
                          }
                        )
                      }
                      className="cursor-pointer border-b border-gray-100 transition hover:bg-gray-50"
                    >

                      <td className="crm-td font-medium">
                        {customer.name}
                      </td>

                      <td className="crm-td">
                        {customer.phone}
                      </td>

                      <td className="crm-td">
                        {customer.companyName ||
                          "-"}
                      </td>

                      <td className="crm-td">

                        <span
                          className={`crm-badge ${customer.status ===
                              "ACTIVE"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                            }`}
                        >
                          {customer.status}
                        </span>

                      </td>

                      {/* ================= ACTION MENU ================= */}

                      <td className="crm-td">

                        <div className="relative flex justify-center">

                          <button
                            type="button"
                            onClick={(e) =>
                              handleMenuClick(
                                e,
                                customer.id
                              )
                            }
                            className="rounded-full p-2 hover:bg-gray-100"
                          >
                            <MoreVertical
                              size={20}
                            />
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )

              ) : (

                <tr>

                  <td
                    colSpan="5"
                    className="p-8 text-center text-gray-500"
                  >
                    No customers found
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* ================= FIXED ACTION MENU ================= */}

      {openMenu &&
        menuPosition && (

          <div
            ref={menuRef}
            onClick={(e) =>
              e.stopPropagation()
            }
            className="fixed z-[99999] w-36 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl"
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
            }}
          >

            <button
              type="button"
              onClick={() =>
                handleView(openMenu)
              }
              className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-100"
            >
              View
            </button>

            <button
              type="button"
              onClick={() =>
                handleEdit(openMenu)
              }
              className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-100"
            >
              Edit
            </button>

            <button
              type="button"
              onClick={() =>
                handleDelete(openMenu)
              }
              className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
            >
              Delete
            </button>

          </div>

        )}

      {/* ================= PAGINATION ================= */}

      <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:px-6">

        <p className="text-center text-sm text-gray-600 sm:text-left">
          Page {currentPage} of{" "}
          {totalPages}
        </p>

        <div className="flex max-w-full flex-wrap justify-center gap-2">

          <button
            onClick={() =>
              setCurrentPage((prev) =>
                Math.max(
                  prev - 1,
                  1
                )
              )
            }
            disabled={
              currentPage === 1
            }
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-100"
          >
            Previous
          </button>

          {Array.from(
            { length: totalPages },
            (_, index) => (

              <button
                key={index}
                onClick={() =>
                  setCurrentPage(
                    index + 1
                  )
                }
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${currentPage ===
                    index + 1
                    ? "bg-[#25D366] text-black"
                    : "border border-gray-300 bg-white hover:bg-gray-100"
                  }`}
              >
                {index + 1}
              </button>

            )
          )}

          <button
            onClick={() =>
              setCurrentPage((prev) =>
                Math.min(
                  prev + 1,
                  totalPages
                )
              )
            }
            disabled={
              currentPage === totalPages
            }
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-100"
          >
            Next
          </button>

        </div>

      </div>

      {/* ================= DELETE MODAL ================= */}

      <ConfirmModal
        isOpen={!!deleteTargetId}
        title="Delete Customer"
        message="Are you sure you want to delete this customer? This cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() =>
          setDeleteTargetId(null)
        }
      />

      {/* ================= VIEW ================= */}

      {viewCustomerId && (
        <ViewCustomerModal
          customerId={viewCustomerId}
          onClose={() =>
            setViewCustomerId(null)
          }
        />
      )}

      {/* ================= EDIT ================= */}

      {editCustomerId && (
        <EditCustomer
          customerId={editCustomerId}
          onClose={() =>
            setEditCustomerId(null)
          }
          onSuccess={async () => {

            const data =
              await getCustomers(
                statusFilter === "ALL"
                  ? ""
                  : statusFilter,
                searchTerm
              );

            setCustomers(
              data.customers ||
              data.data ||
              []
            );

            const allData =
              await getCustomers(
                "",
                ""
              );

            setAllCustomers(
              allData.customers ||
              allData.data ||
              []
            );
          }}
        />
      )}

      {/* ================= ADD CUSTOMER ================= */}

      {showAddCustomer && (
        <AddCustomer
          onClose={() =>
            setShowAddCustomer(false)
          }
          onSuccess={async () => {

            const data =
              await getCustomers(
                statusFilter === "ALL"
                  ? ""
                  : statusFilter,
                searchTerm
              );

            setCustomers(
              data.customers ||
              data.data ||
              []
            );

            const allData =
              await getCustomers(
                "",
                ""
              );

            setAllCustomers(
              allData.customers ||
              allData.data ||
              []
            );
          }}
        />
      )}

    </div>
  );
}

export default Customers;