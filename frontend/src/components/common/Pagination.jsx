// import React from "react";
// import {
//   FiChevronLeft,
//   FiChevronRight,
// } from "react-icons/fi";

// function Pagination({
//   currentPage,
//   totalPages,
//   totalItems,
//   itemsPerPage,
//   onPageChange,
// }) {
//   if (totalPages <= 1) return null;

//   const startItem =
//     (currentPage - 1) * itemsPerPage + 1;

//   const endItem = Math.min(
//     currentPage * itemsPerPage,
//     totalItems
//   );

//   const getPageNumbers = () => {
//     const pages = [];

//     if (totalPages <= 5) {
//       for (let i = 1; i <= totalPages; i++) {
//         pages.push(i);
//       }
//     } else {
//       if (currentPage <= 3) {
//         pages.push(1, 2, 3, 4, "...", totalPages);
//       } else if (currentPage >= totalPages - 2) {
//         pages.push(
//           1,
//           "...",
//           totalPages - 3,
//           totalPages - 2,
//           totalPages - 1,
//           totalPages
//         );
//       } else {
//         pages.push(
//           1,
//           "...",
//           currentPage - 1,
//           currentPage,
//           currentPage + 1,
//           "...",
//           totalPages
//         );
//       }
//     }

//     return pages;
//   };

//   return (
//     <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm md:flex-row">
//       <p className="text-center text-sm text-gray-600 md:text-left">
//         Showing{" "}
//         <span className="font-semibold">
//           {startItem}
//         </span>{" "}
//         -{" "}
//         <span className="font-semibold">
//           {endItem}
//         </span>{" "}
//         of{" "}
//         <span className="font-semibold">
//           {totalItems}
//         </span>{" "}
//         entries
//       </p>

//       <div className="flex max-w-full flex-wrap items-center justify-center gap-2">

//         <button
//           onClick={() =>
//             onPageChange(currentPage - 1)
//           }
//           disabled={currentPage === 1}
//           className="flex h-10 w-10 items-center justify-center rounded-lg border bg-white hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
//         >
//           <FiChevronLeft />
//         </button>

//         {getPageNumbers().map((page, index) =>
//           page === "..." ? (
//             <span
//               key={index}
//               className="px-1 text-gray-500 sm:px-2"
//             >
//               ...
//             </span>
//           ) : (
//             <button
//               key={index}
//               onClick={() =>
//                 onPageChange(page)
//               }
//               className={`h-10 w-10 rounded-lg font-medium transition ${
//                 currentPage === page
//                   ? "bg-[#25D366] text-black"
//                   : "bg-white border hover:bg-gray-100"
//               }`}
//             >
//               {page}
//             </button>
//           )
//         )}

//         <button
//           onClick={() =>
//             onPageChange(currentPage + 1)
//           }
//           disabled={currentPage === totalPages}
//           className="flex h-10 w-10 items-center justify-center rounded-lg border bg-white hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
//         >
//           <FiChevronRight />
//         </button>

//       </div>
//     </div>
//   );
// }

// export default Pagination;



import React from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
} from "react-icons/fi";

const DEFAULT_PAGE_SIZES = [10, 20, 50, 100];

/**
 * Shared pagination bar used by every list in the CRM.
 *
 *   Page size: [10 v]  1 to 10 of 35            «  ‹  Page 1 of 4  ›  »
 *
 * Required props : currentPage, totalPages, totalItems, itemsPerPage, onPageChange
 * Optional props : onPageSizeChange(size)  -> shows the "Page size" dropdown
 *                  pageSizeOptions         -> sizes in the dropdown
 *                  variant="inline"        -> no outer card (for use inside a card)
 */
function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  variant = "card",
}) {
  const canChangeSize =
    typeof onPageSizeChange === "function";

  // Always include the size that is currently in use
  const sizeOptions = [
    ...new Set([...pageSizeOptions, itemsPerPage]),
  ].sort((a, b) => a - b);

  // Nothing to paginate -> hide (same behaviour as before).
  // With a page-size dropdown we keep the bar visible until the
  // list is smaller than the smallest page size.
  if (canChangeSize) {
    if (!totalItems || totalItems <= sizeOptions[0]) {
      return null;
    }
  } else if (totalPages <= 1) {
    return null;
  }

  const lastPage = Math.max(1, totalPages);

  const startItem =
    totalItems === 0
      ? 0
      : (currentPage - 1) * itemsPerPage + 1;

  const endItem = Math.min(
    currentPage * itemsPerPage,
    totalItems
  );

  const navButtonClass =
    "flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";

  const wrapperClass =
    variant === "inline"
      ? "flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row"
      : "mt-6 flex flex-col items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:px-6";

  return (
    <div className={wrapperClass}>

      {/* LEFT : page size + range */}

      <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-gray-600">

        {canChangeSize && (
          <label className="flex items-center gap-2">
            <span>Page size:</span>

            <select
              value={itemsPerPage}
              onChange={(e) =>
                onPageSizeChange(Number(e.target.value))
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 outline-none transition focus:border-[#25D366]"
            >
              {sizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        )}

        <span>
          {startItem} to{" "}
          <span className="font-semibold text-slate-800">
            {endItem}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-slate-800">
            {totalItems}
          </span>
        </span>

      </div>

      {/* RIGHT : first / previous / page x of y / next / last */}

      <div className="flex items-center justify-center gap-1 text-sm text-gray-600">

        <button
          type="button"
          aria-label="First page"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          className={navButtonClass}
        >
          <FiChevronsLeft size={16} />
        </button>

        <button
          type="button"
          aria-label="Previous page"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={navButtonClass}
        >
          <FiChevronLeft size={16} />
        </button>

        <span className="px-3">
          Page{" "}
          <span className="font-semibold text-slate-800">
            {currentPage}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-slate-800">
            {lastPage}
          </span>
        </span>

        <button
          type="button"
          aria-label="Next page"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= lastPage}
          className={navButtonClass}
        >
          <FiChevronRight size={16} />
        </button>

        <button
          type="button"
          aria-label="Last page"
          onClick={() => onPageChange(lastPage)}
          disabled={currentPage >= lastPage}
          className={navButtonClass}
        >
          <FiChevronsRight size={16} />
        </button>

      </div>
    </div>
  );
}

export default Pagination;
