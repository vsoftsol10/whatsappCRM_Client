import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import ConfirmModal from "./common/ConfirmModal";

import {
  FaTachometerAlt,
  FaComments,
  FaUsers,
  FaTasks,
  FaUserTie,
  FaCog,
  FaSignOutAlt,
  FaUserPlus,
  FaTicketAlt,
  FaBullhorn,
  FaFileAlt,
  FaChevronRight,
  FaUser,
  FaLock,
  FaCreditCard,
  FaBox,
} from "react-icons/fa";


const sections = [

  {
    id: "main",
    title: "Main",
    items: [
      {
        name: "Dashboard",
        icon: FaTachometerAlt,
        path: "/dashboard",
      },
      {
        name: "Conversations",
        icon: FaComments,
        path: "/conversations",
      },
    ],
  },


  {
    id: "crm",
    title: "CRM",
    items: [
      {
        name: "Customers",
        icon: FaUsers,
        path: "/customers",
      },
      {
        name: "Leads",
        icon: FaUserPlus,
        path: "/leads",
      },
      {
        name: "Campaigns",
        icon: FaBullhorn,
        path: "/campaigns",
      },
      {
        name: "Templates",
        icon: FaFileAlt,
        path: "/templates",
      },
    ],
  },


  {
    id: "management",
    title: "Management",
    items: [
      {
        name: "Employees",
        icon: FaUserTie,
        path: "/employees",
      },
      {
        name: "Tickets",
        icon: FaTicketAlt,
        path: "/tickets",
      },
    ],
  },


  {
    id: "productivity",
    title: "Productivity",
    items: [
      {
        name: "Tasks",
        icon: FaTasks,
        path: "/tasks",
      },
    ],
  },


  {
    id: "settings",
    title: "Settings",
    items: [
      {
        name: "Profile",
        icon: FaUser,
        path: "/settings/profile",
      },
      {
        name: "Security",
        icon: FaLock,
        path: "/settings/security",
      },
      {
        name: "Billing & Subscription",
        icon: FaCreditCard,
        path: "/settings/billing",
      },
      {
        name: "Plans",
        icon: FaBox,
        path: "/settings/plans",
      },
      {
        name: "SaaS Support",
        icon: FaTicketAlt,
        path: "/settings/support",
      },
    ],
  },

];



export default function Sidebar({
  isOpen = false,
  onClose = () => { },
}) {


  const logout = useAuthStore(
    (state) => state.logout
  );

  const user = useAuthStore(
    (state) => state.user
  );


  const location = useLocation();


  const [openSection, setOpenSection] = useState("main");


  const [showLogoutConfirm, setShowLogoutConfirm] =
    useState(false);



  useEffect(() => {

    const activeSection =
      sections.find(section =>
        section.items.some(
          item =>
            location.pathname.startsWith(item.path)
        )
      );


    if (activeSection) {
      setOpenSection(activeSection.id);
    }

  }, [location.pathname]);



  const toggleSection = (id) => {

    setOpenSection(prev =>
      prev === id ? "" : id
    );

  };



  const handleLogout = () => {

    setShowLogoutConfirm(true);

  };



  const confirmLogout = () => {

    setShowLogoutConfirm(false);

    logout();

  };



  const linkClass = ({ isActive }) =>

    `group flex h-11 items-center gap-3 rounded-lg px-3 text-[15px] transition-all duration-200 ease-out hover:scale-[1.02]
    
    ${isActive
      ?
      "scale-[1.01] bg-[#00C86B] text-white font-semibold shadow-md shadow-[#00C86B]/20"
      :
      "bg-transparent text-slate-100 hover:bg-[#0A6E63] hover:text-white"
    }`;




  return (

    <>

      {isOpen && (

        <button

          type="button"

          onClick={onClose}

          className="fixed inset-0 z-40 bg-black/50 lg:hidden"

        />

      )}



      <aside

        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-72 max-w-[85vw] flex-col border-r border-white/10 bg-gradient-to-b from-[#061113] via-[#071114] to-[#02090B] p-5 text-white shadow-xl shadow-black/20 transition-transform duration-300 lg:translate-x-0

${isOpen ? "translate-x-0" : "-translate-x-full"}

`}

      >


        {/* BRAND */}

        <div className="border-b border-white/10 pb-5">


          <h1 className="flex items-center gap-2 text-2xl font-bold">

            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366] text-sm">

              <FaComments />

            </span>


            <span>
              WhatsApp
            </span>


            <span className="text-[#25D366]">
              CRM
            </span>


          </h1>


          <p className="mt-1.5 text-sm text-slate-400">

            Business Messaging Platform

          </p>


        </div>




        {/* MENU */}


        <div className="mt-6 flex-1">


          <div className="space-y-5">


            {
              sections.map(section => (


                <div
                  key={section.id}
                  className="border-b border-white/10 pb-4"
                >


                  <button

                    onClick={() => toggleSection(section.id)}

                    className="mb-2 flex w-full items-center justify-between px-1 py-1"

                  >


                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#25D366]">

                      {section.title}

                    </span>



                    <FaChevronRight

                      className={`text-xs text-slate-600 transition-transform

${openSection === section.id
                          ?
                          "rotate-90"
                          :
                          ""
                        }

`}

                    />


                  </button>




                  <div

                    className={`grid transition-all duration-300

${openSection === section.id

                        ?
                        "grid-rows-[1fr] opacity-100"

                        :

                        "grid-rows-[0fr] opacity-0"

                      }

`}

                  >


                    <div className="overflow-hidden">


                      <div className="flex flex-col gap-2">


                        {

                          section.items

                            .filter(item => {

                              if (
                                (item.path === "/employees" ||
                                  item.path === "/settings/support") &&
                                user?.role !== "ADMIN"
                              ) {
                                return false;
                              }

                              return true;
                            })


                            .map(item => {


                              const Icon = item.icon;


                              return (

                                <NavLink

                                  key={item.path}

                                  to={item.path}

                                  className={linkClass}

                                  onClick={onClose}

                                >


                                  <Icon className="text-sm" />


                                  {item.name}


                                </NavLink>

                              );


                            })


                        }



                      </div>


                    </div>


                  </div>




                </div>


              ))


            }


          </div>


        </div>





        {/* LOGOUT */}


        <div className="border-t border-white/10 pt-7">


          <button

            onClick={handleLogout}

            className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 py-3 text-[15px] font-semibold text-[#25D366] hover:bg-[#B91C1C] hover:text-white"

          >


            <FaSignOutAlt />

            Logout


          </button>


        </div>



      </aside>




      <ConfirmModal

        isOpen={showLogoutConfirm}

        title="Logout"

        message="Are you sure you want to logout?"

        confirmText="Logout"

        cancelText="Cancel"

        variant="danger"

        onConfirm={confirmLogout}

        onCancel={() => setShowLogoutConfirm(false)}

      />



    </>

  );

}