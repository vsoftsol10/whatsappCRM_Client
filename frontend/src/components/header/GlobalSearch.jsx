// import { useEffect, useMemo, useRef, useState } from "react";
// import { FaSearch } from "react-icons/fa";
// import { useNavigate } from "react-router-dom";
// import { menuItems } from "../../data/menu";

// function GlobalSearch() {
//   const navigate = useNavigate();
//   const searchRef = useRef(null);

//   const [search, setSearch] = useState("");
//   const [showResults, setShowResults] = useState(false);

//   // Get logged in role
//   const role = localStorage.getItem("role") || "ADMIN";

//   // Filter menu items
//   const filteredItems = useMemo(() => {
//     if (!search.trim()) return [];

//     const keyword = search.toLowerCase();

//     return menuItems.filter(
//       (item) =>
//         item.roles.includes(role) &&
//         (item.name.toLowerCase().includes(keyword) ||
//           item.section.toLowerCase().includes(keyword))
//     );
//   }, [search, role]);

//   // Close dropdown when clicking outside
//   useEffect(() => {
//     function handleClickOutside(e) {
//       if (
//         searchRef.current &&
//         !searchRef.current.contains(e.target)
//       ) {
//         setShowResults(false);
//       }
//     }

//     document.addEventListener("mousedown", handleClickOutside);

//     return () => {
//       document.removeEventListener(
//         "mousedown",
//         handleClickOutside
//       );
//     };
//   }, []);

//   const handleNavigate = (path) => {
//     navigate(path);
//     setSearch("");
//     setShowResults(false);
//   };

//   return (
//     <div
//       ref={searchRef}
//       className="relative w-full max-w-2xl"
//     >
//       {/* Search Icon */}
//       <FaSearch
//         className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
//       />

//       {/* Search Input */}
//       <input
//         type="text"
//         placeholder="Search pages..."
//         value={search}
//         onChange={(e) => {
//           setSearch(e.target.value);
//           setShowResults(true);
//         }}
//         onFocus={() => setShowResults(true)}
//         className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-4 shadow-sm outline-none transition focus:border-[#25D366]"
//       />

//       {/* Search Results */}
//       {showResults && search.trim() && (
//         <div className="absolute mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl z-50">
//           {filteredItems.length > 0 ? (
//             filteredItems.map((item) => {
//               const Icon = item.icon;

//               return (
//                 <button
//                   key={item.key}
//                   type="button"
//                   onClick={() => handleNavigate(item.path)}
//                   className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-[#DCF8C6] transition"
//                 >
//                   <Icon
//                     size={18}
//                     className="text-[#25D366]"
//                   />

//                   <div>
//                     <p className="font-medium text-gray-800">
//                       {item.name}
//                     </p>

//                     <p className="text-xs text-gray-500 capitalize">
//                       {item.section}
//                     </p>
//                   </div>
//                 </button>
//               );
//             })
//           ) : (
//             <div className="px-4 py-4 text-sm text-gray-500">
//               No pages found.
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

// export default GlobalSearch;

// // import { FaSearch } from "react-icons/fa";

// // function GlobalSearch() {
// //   return (
// //     <div className="relative w-full max-w-2xl">
// //       <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

// //       <input
// //         type="text"
// //         placeholder="Search pages..."
// //         className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-4 shadow-sm outline-none focus:border-[#25D366]"
// //       />
// //     </div>
// //   );
// // }

// // export default GlobalSearch;


import { useEffect, useMemo, useRef, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import { useAuthStore } from "../../store/authStore";
import { navGroups, filterByRole } from "../../config/navigation";

// Turns the sidebar config into one flat list of searchable pages.
// Settings children become e.g. "Security" with parent "Settings".
function flattenNav(groups) {
  const list = [];

  groups.forEach((group) => {
    group.items.forEach((item) => {
      if (item.children) {
        item.children.forEach((child) => {
          list.push({
            key: child.key,
            name: child.name,
            parent: item.name,
            path: child.path,
            icon: child.icon,
          });
        });
      } else {
        list.push({
          key: item.key,
          name: item.name,
          parent: null,
          path: item.path,
          icon: item.icon,
        });
      }
    });
  });

  return list;
}

// Lowercase and drop symbols/spaces so "ai auto reply" matches "AI Auto-Reply"
const normalize = (text = "") =>
  text.toLowerCase().replace(/[^a-z0-9]/g, "");

function GlobalSearch() {
  const navigate = useNavigate();
  const searchRef = useRef(null);

  const user = useAuthStore((state) => state.user);

  const [search, setSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // Same role filtering the sidebar uses, so users only find pages they can open
  const pages = useMemo(
    () => flattenNav(filterByRole(navGroups, user?.role)),
    [user?.role]
  );

  const filteredItems = useMemo(() => {
    const keyword = normalize(search.trim());

    if (!keyword) return [];

    return pages.filter(
      (page) =>
        normalize(page.name).includes(keyword) ||
        normalize(page.parent || "").includes(keyword) ||
        normalize(page.key).includes(keyword)
    );
  }, [search, pages]);

  // Start from the first result whenever the results change
  useEffect(() => {
    setActiveIndex(0);
  }, [search]);

  // Close the dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNavigate = (path) => {
    navigate(path);
    setSearch("");
    setShowResults(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setShowResults(false);
      return;
    }

    if (filteredItems.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setShowResults(true);
      setActiveIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(
        (prev) => (prev - 1 + filteredItems.length) % filteredItems.length
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = filteredItems[activeIndex] || filteredItems[0];
      if (selected) handleNavigate(selected.path);
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      {/* Search Icon */}
      <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

      {/* Search Input */}
      <input
        type="text"
        placeholder="Search pages..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setShowResults(true);
        }}
        onFocus={() => setShowResults(true)}
        onKeyDown={handleKeyDown}
        className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-4 shadow-sm outline-none transition focus:border-[#25D366]"
      />

      {/* Search Results */}
      {showResults && search.trim() && (
        <div className="absolute z-50 mt-2 max-h-80 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleNavigate(item.path)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`flex w-full items-center gap-4 px-4 py-3 text-left transition ${
                    index === activeIndex ? "bg-[#DCF8C6]" : "hover:bg-[#DCF8C6]"
                  }`}
                >
                  <Icon size={18} className="shrink-0 text-[#25D366]" />

                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-800">
                      {item.name}
                    </p>

                    {item.parent && (
                      <p className="text-xs text-gray-500">{item.parent}</p>
                    )}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="px-4 py-4 text-sm text-gray-500">
              No pages found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GlobalSearch;
