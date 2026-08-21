import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";

import { useAuthStore } from "../../store/authStore";

function statusBadge(status) {
  switch ((status || "").toUpperCase()) {
    case "OPEN":
      return "bg-red-100 text-red-700 border-red-300";

    case "IN_PROGRESS":
      return "bg-[#DCF8C6] text-[#128C7E] border-[#25D366]";

    case "RESOLVED":
      return "bg-green-100 text-green-700 border-green-300";

    case "CLOSED":
      return "bg-slate-100 text-slate-700 border-slate-300";

    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
}

function priorityBadge(priority) {
  switch ((priority || "").toUpperCase()) {
    case "HIGH":
      return "bg-red-100 text-red-700";

    case "MEDIUM":
      return "bg-[#DCF8C6] text-[#128C7E]";

    case "LOW":
      return "bg-green-100 text-green-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

function TicketTable({
  tickets,
  setOpenMenu,
  handleView,
  handleEdit,
  handleDelete,
  onStatusChange,
}) {
  const user = useAuthStore(
    (state) => state.user
  );

  const isAdmin = user?.role === "ADMIN";

  /*
   * Which ticket menu is currently open
   */
  const [openTicketId, setOpenTicketId] =
    useState(null);

  /*
   * Position of the dropdown
   */
  const [menuPosition, setMenuPosition] =
    useState({
      top: 0,
      left: 0,
      openUp: false,
    });

  /*
   * Reference to the dropdown itself
   */
  const menuRef = useRef(null);

  /*
   * References to all 3-dot buttons
   */
  const buttonRefs = useRef({});

  /*
   * Height of our dropdown.
   *
   * View
   * Edit
   * Delete
   *
   * Approximately 132px.
   */
  const MENU_HEIGHT = 140;

  /*
   * Width of dropdown
   */
  const MENU_WIDTH = 160;

  /*
   * Open menu
   */
  const handleMenuToggle = (id) => {
    if (openTicketId === id) {
      setOpenTicketId(null);

      if (setOpenMenu) {
        setOpenMenu(null);
      }

      return;
    }

    const button =
      buttonRefs.current[id];

    if (!button) return;

    const rect =
      button.getBoundingClientRect();

    /*
     * Check available space below
     */
    const spaceBelow =
      window.innerHeight - rect.bottom;

    /*
     * Check whether menu should open upward
     */
    const openUp =
      spaceBelow < MENU_HEIGHT;

    /*
     * Calculate TOP position
     */
    let top;

    if (openUp) {
      /*
       * Menu opens above the button
       */
      top =
        rect.top -
        MENU_HEIGHT -
        8;
    } else {
      /*
       * Menu opens below the button
       */
      top =
        rect.bottom + 8;
    }

    /*
     * Calculate LEFT position
     *
     * Align right side of menu with
     * right side of button.
     */
    let left =
      rect.right -
      MENU_WIDTH;

    /*
     * Prevent menu from going outside
     * the left side of the screen.
     */
    if (left < 8) {
      left = 8;
    }

    /*
     * Prevent menu from going outside
     * the right side of the screen.
     */
    if (
      left + MENU_WIDTH >
      window.innerWidth - 8
    ) {
      left =
        window.innerWidth -
        MENU_WIDTH -
        8;
    }

    setMenuPosition({
      top,
      left,
      openUp,
    });

    setOpenTicketId(id);

    if (setOpenMenu) {
      setOpenMenu(id);
    }
  };

  /*
   * Close menu when clicking outside.
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      /*
       * If click is inside dropdown,
       * don't close it here.
       */
      if (
        menuRef.current &&
        menuRef.current.contains(event.target)
      ) {
        return;
      }

      /*
       * Check if click was on a 3-dot button.
       */
      const clickedButton =
        Object.values(
          buttonRefs.current
        ).some(
          (button) =>
            button &&
            button.contains(event.target)
        );

      /*
       * If click was not on a button,
       * close the menu.
       */
      if (!clickedButton) {
        setOpenTicketId(null);

        if (setOpenMenu) {
          setOpenMenu(null);
        }
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
  }, [setOpenMenu]);

  /*
   * Recalculate menu position when window
   * is resized.
   */
  useEffect(() => {
    const handleResize = () => {
      if (!openTicketId) return;

      const button =
        buttonRefs.current[
          openTicketId
        ];

      if (!button) return;

      const rect =
        button.getBoundingClientRect();

      const spaceBelow =
        window.innerHeight -
        rect.bottom;

      const openUp =
        spaceBelow < MENU_HEIGHT;

      let top;

      if (openUp) {
        top =
          rect.top -
          MENU_HEIGHT -
          8;
      } else {
        top =
          rect.bottom + 8;
      }

      let left =
        rect.right -
        MENU_WIDTH;

      if (left < 8) {
        left = 8;
      }

      if (
        left + MENU_WIDTH >
        window.innerWidth - 8
      ) {
        left =
          window.innerWidth -
          MENU_WIDTH -
          8;
      }

      setMenuPosition({
        top,
        left,
        openUp,
      });
    };

    window.addEventListener(
      "resize",
      handleResize
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleResize
      );
    };
  }, [openTicketId]);

  /*
   * Close menu when scrolling.
   *
   * This prevents the menu from staying
   * in the wrong position while the table
   * is being scrolled.
   */
  useEffect(() => {
    const handleScroll = () => {
      if (openTicketId) {
        setOpenTicketId(null);

        if (setOpenMenu) {
          setOpenMenu(null);
        }
      }
    };

    window.addEventListener(
      "scroll",
      handleScroll,
      true
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll,
        true
      );
    };
  }, [openTicketId, setOpenMenu]);

  /*
   * No tickets
   */
  if (
    !tickets ||
    tickets.length === 0
  ) {
    return (
      <div className="crm-page-surface p-8 text-center text-gray-500 sm:p-10">
        No tickets found
      </div>
    );
  }

  return (
    <div className="crm-table-shell overflow-visible">
      <div className="crm-table-scroll">
        <table className="w-full min-w-[920px]">

          {/* ================= HEADER ================= */}

          <thead className="bg-[#25D366] text-black">
            <tr>
              <th className="crm-th">
                Customer
              </th>

              <th className="crm-th min-w-[220px]">
                Title
              </th>

              <th className="crm-th min-w-[210px]">
                Assigned To
              </th>

              <th className="crm-th">
                Priority
              </th>

              <th className="crm-th">
                Status
              </th>

              <th className="crm-th">
                Created
              </th>

              {isAdmin && (
                <th className="crm-th text-center">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          {/* ================= BODY ================= */}

          <tbody>
            {tickets.map((ticket) => {
              const id = ticket.id;

              const isMenuOpen =
                openTicketId === id;

              return (
                <tr
                  key={id}
                  className="border-b border-gray-100 transition hover:bg-[#DCF8C6] last:border-b-0"
                >

                  {/* ================= CUSTOMER ================= */}

                  <td className="crm-td font-medium">
                    {ticket.customer?.name ||
                      "-"}
                  </td>

                  {/* ================= TITLE ================= */}

                  <td className="crm-td">
                    <div className="break-words text-base font-semibold text-slate-800">
                      {ticket.title}
                    </div>

                    <div className="mt-1 line-clamp-2 text-sm text-gray-500">
                      {ticket.description ||
                        "-"}
                    </div>
                  </td>

                  {/* ================= ASSIGNED TO ================= */}

                  <td className="crm-td">
                    {ticket.assignedTo ? (
                      <div>
                        <div className="font-semibold text-slate-800">
                          {
                            ticket
                              .assignedTo
                              .name
                          }
                        </div>

                        <div className="break-all text-xs text-gray-500">
                          {
                            ticket
                              .assignedTo
                              .email
                          }
                        </div>
                      </div>
                    ) : (
                      <span className="italic text-gray-400">
                        Unassigned
                      </span>
                    )}
                  </td>

                  {/* ================= PRIORITY ================= */}

                  <td className="crm-td">
                    <span
                      className={`crm-badge ${priorityBadge(
                        ticket.priority
                      )}`}
                    >
                      {ticket.priority}
                    </span>
                  </td>

                  {/* ================= STATUS ================= */}

                  <td className="crm-td">
                    <select
                      value={
                        ticket.status
                      }
                      onChange={(e) =>
                        onStatusChange(
                          ticket.id,
                          e.target.value
                        )
                      }
                      className={`w-full max-w-[150px] cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium outline-none ${statusBadge(
                        ticket.status
                      )}`}
                    >
                      <option value="OPEN">
                        OPEN
                      </option>

                      <option value="IN_PROGRESS">
                        IN PROGRESS
                      </option>

                      <option value="RESOLVED">
                        RESOLVED
                      </option>

                      <option value="CLOSED">
                        CLOSED
                      </option>
                    </select>
                  </td>

                  {/* ================= CREATED ================= */}

                  <td className="crm-td whitespace-nowrap text-slate-600">
                    {ticket.createdAt
                      ? new Date(
                          ticket.createdAt
                        ).toLocaleDateString()
                      : "-"}
                  </td>

                  {/* ================= ACTIONS ================= */}

                  {isAdmin && (
                    <td className="crm-td">
                      <div className="flex justify-center">

                        {/* 3 DOT BUTTON */}

                        <button
                          type="button"
                          ref={(el) => {
                            if (el) {
                              buttonRefs.current[
                                id
                              ] = el;
                            }
                          }}
                          onClick={() =>
                            handleMenuToggle(
                              id
                            )
                          }
                          className="rounded-lg p-2 transition hover:bg-gray-100"
                        >
                          <MoreVertical
                            size={18}
                            className="text-gray-600"
                          />
                        </button>

                      </div>
                    </td>
                  )}

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ================================================= */}
      {/* ACTION MENU */}
      {/* ================================================= */}

      {openTicketId && (
        <div
          ref={menuRef}
          className="fixed z-[99999] w-40 rounded-xl border border-gray-200 bg-white shadow-xl"
          style={{
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
          }}
        >

          {/* VIEW */}

          <button
            type="button"
            onClick={() => {
              const ticket =
                tickets.find(
                  (item) =>
                    item.id ===
                    openTicketId
                );

              if (ticket) {
                handleView(ticket);
              }

              setOpenTicketId(null);

              if (setOpenMenu) {
                setOpenMenu(null);
              }
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-gray-100"
          >
            <Eye size={16} />

            View
          </button>

          {/* EDIT */}

          <button
            type="button"
            onClick={() => {
              const ticket =
                tickets.find(
                  (item) =>
                    item.id ===
                    openTicketId
                );

              if (ticket) {
                handleEdit(ticket);
              }

              setOpenTicketId(null);

              if (setOpenMenu) {
                setOpenMenu(null);
              }
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-gray-100"
          >
            <Pencil size={16} />

            Edit
          </button>

          {/* DELETE */}

          <button
            type="button"
            onClick={() => {
              handleDelete(
                openTicketId
              );

              setOpenTicketId(null);

              if (setOpenMenu) {
                setOpenMenu(null);
              }
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <Trash2 size={16} />

            Delete
          </button>

        </div>
      )}
    </div>
  );
}

export default TicketTable;