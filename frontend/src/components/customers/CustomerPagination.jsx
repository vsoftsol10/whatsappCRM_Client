import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

const PAGE_SIZES = [5, 10, 20, 50];

// 1 … 4 5 6 … 12
function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, "...", totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
}

function CustomerPagination({
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) {
  const sizes = [...new Set([...PAGE_SIZES, pageSize])].sort((a, b) => a - b);

  const navButton =
    "flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";

  return (
    <div className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
      {/* Left: page x of y + rows per page */}
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span>
          Page {currentPage} of {totalPages}
        </span>

        <div className="relative">
          <select
            aria-label="Rows per page"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-10 appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-sm font-medium text-slate-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
          >
            {sizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>

          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500"
          />
        </div>
      </div>

      {/* Right: previous / page numbers / next */}
      <nav
        aria-label="Pagination"
        className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1"
      >
        <button
          type="button"
          aria-label="Previous page"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={navButton}
        >
          <ChevronLeft size={18} />
        </button>

        {getPageNumbers(currentPage, totalPages).map((page, index) =>
          page === "..." ? (
            <span key={`gap-${index}`} className="px-1 text-slate-400">
              …
            </span>
          ) : (
            <button
              key={page}
              type="button"
              aria-label={`Page ${page}`}
              aria-current={page === currentPage ? "page" : undefined}
              onClick={() => onPageChange(page)}
              className={`flex h-9 min-w-9 items-center justify-center rounded-full border px-2 text-sm font-semibold transition ${
                page === currentPage
                  ? "border-green-500 bg-green-50 text-green-600"
                  : "border-transparent text-slate-600 hover:bg-slate-100"
              }`}
            >
              {page}
            </button>
          )
        )}

        <button
          type="button"
          aria-label="Next page"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={navButton}
        >
          <ChevronRight size={18} />
        </button>
      </nav>
    </div>
  );
}

export default CustomerPagination;