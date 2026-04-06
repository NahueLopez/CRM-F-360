import React from "react";

export interface PaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  onChangePage: (page: number) => void;
  onChangePageSize?: (size: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  pageSize,
  totalCount,
  onChangePage,
  onChangePageSize,
}) => {
  const totalPages = Math.ceil(totalCount / pageSize);

  if (totalCount === 0) return null;

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-3 border-t border-slate-700/50 mt-4 opacity-100 transition-opacity">
      {/* Left: Size Selector and Results */}
      <div className="flex items-center gap-3 text-sm text-slate-400">
        {onChangePageSize && (
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400">Mostrar</span>
            <select
              value={pageSize}
              onChange={(e) => onChangePageSize(Number(e.target.value))}
              className="bg-transparent text-slate-700 dark:text-slate-300 font-semibold cursor-pointer outline-none hover:text-indigo-600 dark:hover:text-white border-b border-dashed border-slate-400/50 hover:border-indigo-500/50 dark:border-slate-600 dark:hover:border-slate-400 transition-colors"
            >
              <option
                className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200"
                value={5}
              >
                5
              </option>
              <option
                className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200"
                value={10}
              >
                10
              </option>
              <option
                className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200"
                value={20}
              >
                20
              </option>
              <option
                className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200"
                value={50}
              >
                50
              </option>
              <option
                className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200"
                value={100}
              >
                100
              </option>
            </select>
            <span className="text-slate-500 dark:text-slate-400">filas</span>
          </div>
        )}
        <div className="hidden sm:block">
          Mostrando <span className="font-medium text-slate-200">{(page - 1) * pageSize + 1}</span>{" "}
          a{" "}
          <span className="font-medium text-slate-200">
            {Math.min(page * pageSize, totalCount)}
          </span>{" "}
          de <span className="font-medium text-slate-200">{totalCount}</span>
        </div>
      </div>

      {/* Middle/Right: Controls (pushed left using margin) */}
      <div className="flex items-center justify-center gap-2 md:mr-20">
        <button
          onClick={() => onChangePage(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 rounded-lg border border-slate-700/50 text-sm text-slate-300 hover:text-white hover:bg-slate-700/60 disabled:opacity-30 disabled:pointer-events-none transition-all"
        >
          Anterior
        </button>
        <span className="text-sm text-slate-400 px-2 select-none">
          {page} / {totalPages > 0 ? totalPages : 1}
        </span>
        <button
          onClick={() => onChangePage(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 rounded-lg border border-slate-700/50 text-sm text-slate-300 hover:text-white hover:bg-slate-700/60 disabled:opacity-30 disabled:pointer-events-none transition-all"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default Pagination;
