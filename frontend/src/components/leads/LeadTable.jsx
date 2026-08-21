import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
} from "react";

import {
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  PhoneCall,
  BadgeCheck,
  Trophy,
  UserPlus,
  CheckCircle2,
} from "lucide-react";

// ======================================================
// STATUS BADGE
// ======================================================

function statusBadge(status) {
  switch ((status || "").toUpperCase()) {
    case "NEW":
      return "bg-[#DCF8C6] text-[#128C7E]";

    case "CONTACTED":
      return "bg-blue-100 text-blue-700";

    case "QUALIFIED":
      return "bg-purple-100 text-purple-700";

    case "WON":
      return "bg-green-100 text-green-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

// ======================================================
// SOURCE BADGE
// ======================================================

function sourceBadge(source) {
  switch ((source || "").toUpperCase()) {
    case "WHATSAPP":
      return "bg-green-100 text-green-700";

    case "FACEBOOK":
      return "bg-blue-100 text-blue-700";

    case "INSTAGRAM":
      return "bg-pink-100 text-pink-700";

    case "WEBSITE":
      return "bg-indigo-100 text-indigo-700";

    case "REFERRAL":
      return "bg-orange-100 text-orange-700";

    case "CALL":
      return "bg-cyan-100 text-cyan-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

// ======================================================
// LEAD TABLE
// ======================================================

export default function LeadTable({
  leads,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  onConvert,
}) {
  const [openMenu, setOpenMenu] = useState(null);

  // "up" or "down"
  const [menuPosition, setMenuPosition] = useState("down");

  // Store every button reference
  const buttonRefs = useRef({});

  // Store the currently opened dropdown
  const dropdownRef = useRef(null);

  // ======================================================
  // CLOSE MENU WHEN CLICKING OUTSIDE
  // ======================================================

  useEffect(() => {
    const handleClickOutside = (event) => {
      // If no menu is open, nothing to do
      if (!openMenu) return;

      const clickedInsideDropdown =
        dropdownRef.current?.contains(event.target);

      const clickedButton =
        buttonRefs.current[openMenu]?.contains(event.target);

      // Close only when click is outside BOTH
      // the dropdown and the three-dot button
      if (!clickedInsideDropdown && !clickedButton) {
        setOpenMenu(null);
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
  }, [openMenu]);

  // ======================================================
  // CALCULATE DROPDOWN POSITION
  // ======================================================

  useLayoutEffect(() => {
    if (!openMenu) return;

    const button = buttonRefs.current[openMenu];
    const dropdown = dropdownRef.current;

    if (!button || !dropdown) return;

    const buttonRect =
      button.getBoundingClientRect();

    const dropdownRect =
      dropdown.getBoundingClientRect();

    const spaceBelow =
      window.innerHeight - buttonRect.bottom;

    const spaceAbove =
      buttonRect.top;

    // Small safety margin
    const margin = 20;

    // If there isn't enough space below
    // and there is more space above,
    // open upward.
    if (
      spaceBelow < dropdownRect.height + margin &&
      spaceAbove > dropdownRect.height
    ) {
      setMenuPosition("up");
    } else {
      setMenuPosition("down");
    }
  }, [openMenu]);

  // ======================================================
  // CLOSE MENU ON SCROLL
  // ======================================================

  useEffect(() => {
    if (!openMenu) return;

    const handleScroll = () => {
      setOpenMenu(null);
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
  }, [openMenu]);

  // ======================================================
  // CLOSE MENU ON RESIZE
  // ======================================================

  useEffect(() => {
    if (!openMenu) return;

    const handleResize = () => {
      setOpenMenu(null);
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
  }, [openMenu]);

  // ======================================================
  // EMPTY STATE
  // ======================================================

  if (!leads || leads.length === 0) {
    return (
      <div className="crm-page-surface p-8 text-center text-gray-500 sm:p-10">
        No leads found
      </div>
    );
  }

  // ======================================================
  // MENU TOGGLE
  // ======================================================

  const toggleMenu = (leadId) => {
    setOpenMenu((current) =>
      current === leadId
        ? null
        : leadId
    );
  };

  // ======================================================
  // CLOSE MENU
  // ======================================================

  const closeMenu = () => {
    setOpenMenu(null);
  };

  // ======================================================
  // VIEW
  // ======================================================

  const handleView = (lead) => {
    closeMenu();
    onView(lead);
  };

  // ======================================================
  // EDIT
  // ======================================================

  const handleEdit = (lead) => {
    closeMenu();
    onEdit(lead);
  };

  // ======================================================
  // DELETE
  // ======================================================

  const handleDelete = (leadId) => {
    closeMenu();
    onDelete(leadId);
  };

  // ======================================================
  // STATUS
  // ======================================================

  const handleStatus = (leadId, status) => {
    closeMenu();
    onStatusChange(leadId, status);
  };

  // ======================================================
  // CONVERT
  // ======================================================

  const handleConvert = (leadId) => {
    closeMenu();
    onConvert(leadId);
  };

  // ======================================================
  // UI
  // ======================================================

  return (
    <div className="crm-table-shell overflow-visible">
      <div className="crm-table-scroll overflow-visible">
        <table className="w-full min-w-[820px]">
          {/* ======================================================
              HEADER
          ====================================================== */}

          <thead className="bg-[#25D366] text-black">
            <tr>
              <th className="crm-th min-w-[220px]">
                Lead
              </th>

              <th className="crm-th">
                Phone
              </th>

              <th className="crm-th">
                Source
              </th>

              <th className="crm-th">
                Status
              </th>

              <th className="crm-th">
                Assigned To
              </th>

              <th className="crm-th">
                Created
              </th>

              <th className="crm-th text-center">
                Actions
              </th>
            </tr>
          </thead>

          {/* ======================================================
              BODY
          ====================================================== */}

          <tbody>
            {leads.map((lead) => (
              <tr
                key={lead.id}
                className="border-b border-gray-100 last:border-b-0 hover:bg-[#DCF8C6] transition"
              >
                {/* ======================================================
                    LEAD
                ====================================================== */}

                <td className="crm-td">
                  <div className="break-words font-semibold text-slate-800">
                    {lead.name}
                  </div>

                  <div className="break-all text-xs text-gray-500">
                    {lead.email || "-"}
                  </div>
                </td>

                {/* ======================================================
                    PHONE
                ====================================================== */}

                <td className="crm-td">
                  {lead.phone || "-"}
                </td>

                {/* ======================================================
                    SOURCE
                ====================================================== */}

                <td className="crm-td">
                  <span
                    className={`crm-badge ${sourceBadge(
                      lead.source
                    )}`}
                  >
                    {lead.source || "OTHER"}
                  </span>
                </td>

                {/* ======================================================
                    STATUS
                ====================================================== */}

                <td className="crm-td">
                  <select
                    value={lead.status}
                    disabled={lead.isConverted}
                    onChange={(e) =>
                      onStatusChange(
                        lead.id,
                        e.target.value
                      )
                    }
                    className={`w-full max-w-[150px] rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#DCF8C6] ${
                      lead.isConverted
                        ? "cursor-not-allowed bg-gray-100 text-gray-500"
                        : "border-gray-300"
                    }`}
                  >
                    <option value="NEW">
                      NEW
                    </option>

                    <option value="CONTACTED">
                      CONTACTED
                    </option>

                    <option value="QUALIFIED">
                      QUALIFIED
                    </option>

                    <option value="WON">
                      WON
                    </option>
                  </select>
                </td>

                {/* ======================================================
                    ASSIGNED TO
                ====================================================== */}

                <td className="crm-td">
                  {lead.assignedTo ? (
                    <span className="text-sm font-medium text-slate-700">
                      {lead.assignedTo.name}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">
                      Unassigned
                    </span>
                  )}
                </td>

                {/* ======================================================
                    CREATED
                ====================================================== */}

                <td className="crm-td whitespace-nowrap text-slate-600">
                  {lead.createdAt
                    ? new Date(
                        lead.createdAt
                      ).toLocaleDateString()
                    : "-"}
                </td>

                {/* ======================================================
                    ACTIONS
                ====================================================== */}

                <td className="crm-td">
                  <div className="relative flex justify-center">
                    {/* Three dots */}
                    <button
                      type="button"
                      ref={(element) => {
                        if (element) {
                          buttonRefs.current[
                            lead.id
                          ] = element;
                        }
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleMenu(lead.id);
                      }}
                      className="rounded-lg p-2 transition hover:bg-gray-100"
                    >
                      <MoreVertical size={18} />
                    </button>

                    {/* ======================================================
                        DROPDOWN
                    ====================================================== */}

                    {openMenu === lead.id && (
                      <div
                        ref={dropdownRef}
                        onClick={(e) =>
                          e.stopPropagation()
                        }
                        className={`
                          absolute
                          right-0
                          z-[9999]
                          w-56
                          overflow-hidden
                          rounded-xl
                          border
                          border-gray-200
                          bg-white
                          shadow-xl
                          ${
                            menuPosition === "up"
                              ? "bottom-full mb-2"
                              : "top-full mt-2"
                          }
                        `}
                      >
                        {/* ======================================================
                            VIEW
                        ====================================================== */}

                        <button
                          type="button"
                          onClick={() =>
                            handleView(lead)
                          }
                          className="flex w-full items-center gap-3 px-4 py-3 text-sm transition hover:bg-gray-100"
                        >
                          <Eye size={16} />

                          <span>
                            View Details
                          </span>
                        </button>

                        {/* ======================================================
                            EDIT
                        ====================================================== */}

                        <button
                          type="button"
                          onClick={() =>
                            handleEdit(lead)
                          }
                          className="flex w-full items-center gap-3 px-4 py-3 text-sm transition hover:bg-gray-100"
                        >
                          <Pencil size={16} />

                          <span>
                            Edit Lead
                          </span>
                        </button>

                        {/* ======================================================
                            DELETE
                        ====================================================== */}

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(
                              lead.id
                            )
                          }
                          className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-600 transition hover:bg-red-50"
                        >
                          <Trash2 size={16} />

                          <span>
                            Delete Lead
                          </span>
                        </button>

                        <div className="border-t" />

                        {/* ======================================================
                            MARK CONTACTED
                        ====================================================== */}

                        {!lead.isConverted &&
                          lead.status ===
                            "NEW" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleStatus(
                                  lead.id,
                                  "CONTACTED"
                                )
                              }
                              className="flex w-full items-center gap-3 px-4 py-3 text-sm transition hover:bg-gray-100"
                            >
                              <PhoneCall
                                size={16}
                              />

                              <span>
                                Mark Contacted
                              </span>
                            </button>
                          )}

                        {/* ======================================================
                            MARK QUALIFIED
                        ====================================================== */}

                        {!lead.isConverted &&
                          lead.status ===
                            "CONTACTED" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleStatus(
                                  lead.id,
                                  "QUALIFIED"
                                )
                              }
                              className="flex w-full items-center gap-3 px-4 py-3 text-sm transition hover:bg-gray-100"
                            >
                              <BadgeCheck
                                size={16}
                              />

                              <span>
                                Mark Qualified
                              </span>
                            </button>
                          )}

                        {/* ======================================================
                            MARK WON
                        ====================================================== */}

                        {!lead.isConverted &&
                          lead.status ===
                            "QUALIFIED" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleStatus(
                                  lead.id,
                                  "WON"
                                )
                              }
                              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-[#128C7E] transition hover:bg-[#DCF8C6]"
                            >
                              <Trophy
                                size={16}
                              />

                              <span>
                                Mark Won
                              </span>
                            </button>
                          )}

                        {/* ======================================================
                            CONVERT TO CUSTOMER
                        ====================================================== */}

                        {lead.status ===
                          "WON" &&
                          !lead.isConverted && (
                            <button
                              type="button"
                              onClick={() =>
                                handleConvert(
                                  lead.id
                                )
                              }
                              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-[#128C7E] transition hover:bg-[#DCF8C6]"
                            >
                              <UserPlus
                                size={16}
                              />

                              <span>
                                Convert to Customer
                              </span>
                            </button>
                          )}

                        {/* ======================================================
                            CONVERTED
                        ====================================================== */}

                        {lead.isConverted && (
                          <div className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#128C7E]">
                            <CheckCircle2
                              size={16}
                            />

                            <span>
                              Converted
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}