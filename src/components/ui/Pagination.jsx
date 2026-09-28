import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import './Pagination.css';

const Pagination = ({
    currentPage = 1,
    totalPages = 1,
    totalItems = 0,
    pageSize = 20,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [10, 20, 50, 100],
    itemName = "o'quvchi"
}) => {
    if (totalItems === 0 && totalPages <= 1) return null;

    const startItem = Math.min((currentPage - 1) * pageSize + 1, totalItems);
    const endItem = Math.min(currentPage * pageSize, totalItems);

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible + 2) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            let start = Math.max(2, currentPage - 1);
            let end = Math.min(totalPages - 1, currentPage + 1);

            if (currentPage <= 3) {
                start = 2;
                end = 4;
            } else if (currentPage >= totalPages - 2) {
                start = totalPages - 3;
                end = totalPages - 1;
            }

            if (start > 2) pages.push('...');
            for (let i = start; i <= end; i++) pages.push(i);
            if (end < totalPages - 1) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    return (
        <div className="unified-pagination-wrapper">
            <div className="pagination-summary">
                {totalItems > 0 ? (
                    <span>
                        Jami <strong>{totalItems}</strong> ta {itemName}dan <strong>{startItem}-{endItem}</strong> ko'rsatilmoqda
                    </span>
                ) : (
                    <span>Sahifa <strong>{currentPage}</strong> / <strong>{totalPages || 1}</strong></span>
                )}
            </div>

            <div className="pagination-right-controls">
                {onPageSizeChange && (
                    <div className="page-size-selector">
                        <span>Har sahifada:</span>
                        <select
                            value={pageSize}
                            onChange={(e) => onPageSizeChange(Number(e.target.value))}
                            className="page-size-select"
                        >
                            {pageSizeOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt} ta
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="pagination-nav-buttons">
                    <button
                        className="pagination-btn-arrow"
                        onClick={() => onPageChange(1)}
                        disabled={currentPage === 1}
                        title="Birinchi sahifa"
                    >
                        <ChevronsLeft size={16} />
                    </button>

                    <button
                        className="pagination-btn-arrow"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        title="Oldingi sahifa"
                    >
                        <ChevronLeft size={16} />
                    </button>

                    <div className="pagination-number-list">
                        {getPageNumbers().map((p, idx) => {
                            if (p === '...') {
                                return (
                                    <span key={`dots-${idx}`} className="pagination-ellipsis">
                                        ...
                                    </span>
                                );
                            }
                            return (
                                <button
                                    key={`page-${p}`}
                                    className={`pagination-number-btn ${currentPage === p ? 'active' : ''}`}
                                    onClick={() => onPageChange(p)}
                                >
                                    {p}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        className="pagination-btn-arrow"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        title="Keyingi sahifa"
                    >
                        <ChevronRight size={16} />
                    </button>

                    <button
                        className="pagination-btn-arrow"
                        onClick={() => onPageChange(totalPages)}
                        disabled={currentPage >= totalPages}
                        title="Oxirgi sahifa"
                    >
                        <ChevronsRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Pagination;
