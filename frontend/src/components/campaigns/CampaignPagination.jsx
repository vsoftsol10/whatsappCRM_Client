import { ChevronLeft, ChevronRight } from "lucide-react";

const getPages = (current, total) => {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push("…");

  for (let page = start; page <= end; page++) pages.push(page);

  if (end < total - 1) pages.push("…");

  pages.push(total);

  return pages;
};

export default function CampaignPagination({
  currentPage,
  totalPages,
  itemsPerPage,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
}) {
  const lastPage = Math.max(1, totalPages);

  const navClass =
    "flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
      <div className="flex items-center gap-3">
        <span>
          Page {currentPage} of {lastPage}
        </span>

        <select
          aria-label="Campaigns per page"
          value={itemsPerPage}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 outline-none transition focus:border-green-500"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      <nav
        aria-label="Pagination"
        className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1"
      >
        <button
          type="button"
          aria-label="Previous page"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={navClass}
        >
          <ChevronLeft size={16} />
        </button>

        {getPages(currentPage, lastPage).map((page, index) =>
          page === "…" ? (
            <span key={`gap-${index}`} className="px-1 text-slate-400">
              …
            </span>
          ) : (
            <button
              key={page}
              type="button"
              aria-current={page === currentPage ? "page" : undefined}
              onClick={() => onPageChange(page)}
              className={`flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm font-medium transition ${
                page === currentPage
                  ? "border border-green-500 bg-green-50 text-green-700"
                  : "text-slate-600 hover:bg-slate-100"
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
          disabled={currentPage >= lastPage}
          className={navClass}
        >
          <ChevronRight size={16} />
        </button>
      </nav>
    </div>
  );
}
