import React from "react";

export default function Pagination({ page, totalPages, total, perPage, onPageChange }) {
  const start = (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  if (total === 0) return null;

  return (
    <div className="pagination">
      <span className="pagination-info">
        Showing {start}–{end} of {total} results
      </span>
      <div className="pagination-controls">
        <button
          className="pagination-btn"
          disabled={page <= 1}
          onClick={() => onPageChange(1)}
        >
          «
        </button>
        <button
          className="pagination-btn"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          ‹
        </button>
        {getPageNumbers().map(p => (
          <button
            key={p}
            className={`pagination-btn ${p === page ? "active" : ""}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}
        <button
          className="pagination-btn"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          ›
        </button>
        <button
          className="pagination-btn"
          disabled={page >= totalPages}
          onClick={() => onPageChange(totalPages)}
        >
          »
        </button>
      </div>
    </div>
  );
}
