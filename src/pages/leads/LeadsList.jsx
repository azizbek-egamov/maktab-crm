import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { leadService } from '../../services/leads';
import { toast } from 'sonner';
import ConvertLeadModal from './ConvertLeadModal';
import EnrollStudentModal from './EnrollStudentModal';
import Modal from '../../components/ui/Modal';
import { formatDateInput, isValidDateStr, parseUIDateToApi } from '../../utils/dateFormatter';
import {
    SearchIcon,
    EditIcon,
    TrashIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    EmptyIcon,
    PlusIcon
} from '../clients/ClientIcons';

const RefreshIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="23 4 23 10 17 10"></polyline>
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
    </svg>
);

const ConvertIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 3h5v5"></path>
        <path d="M8 21H3v-5"></path>
        <path d="M21 3l-7 7"></path>
        <path d="M3 21l7-7"></path>
    </svg>
);

const AcademicCapIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
);

const SourceBadge = ({ source }) => {
    if (!source || source === 'Xech qayerda') {
        return (
            <span style={{
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'rgba(100, 116, 139, 0.12)',
                color: '#64748b',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
            }}>
                ❓ Boshqa
            </span>
        );
    }

    const configs = {
        'Instagramda': { label: '📸 Instagram', bg: 'rgba(225, 48, 108, 0.12)', color: '#e1306c' },
        'Telegramda': { label: '✈️ Telegram', bg: 'rgba(0, 136, 204, 0.12)', color: '#0088cc' },
        'Facebookda': { label: '📘 Facebook', bg: 'rgba(24, 119, 242, 0.12)', color: '#1877f2' },
        'Influencer': { label: '⭐ Influencer', bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' },
        'Referral': { label: '👥 Referral', bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981' },
        'YouTubeda': { label: '▶️ YouTube', bg: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' },
        'Odamlar orasida': { label: '🗣️ Odamlar orasida', bg: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' },
    };

    const cfg = configs[source] || { label: source, bg: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' };

    return (
        <span style={{
            fontSize: '11px',
            padding: '3px 8px',
            borderRadius: '6px',
            background: cfg.bg,
            color: cfg.color,
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
        }}>
            {cfg.label}
        </span>
    );
};

const LeadsList = () => {
    // Context from LeadsPage
    const { openEditModal, refreshTrigger, openCreateModal, updateTotalLeads } = useOutletContext();

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun',
            'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };

    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        heard_source: '',
    });
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const [deleteModal, setDeleteModal] = useState({ open: false, lead: null });
    const [convertModal, setConvertModal] = useState({ isOpen: false, lead: null });
    const [enrollModal, setEnrollModal] = useState({ isOpen: false, lead: null });

    // Debounce search
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(filters.search);
        }, 400);
        return () => clearTimeout(handler);
    }, [filters.search]);

    useEffect(() => {
        fetchLeads();
    }, [page, debouncedSearch, filters.status, filters.heard_source, dateFrom, dateTo, refreshTrigger]);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                search: debouncedSearch,
                status: filters.status,
            };
            if (filters.heard_source) params.heard_source = filters.heard_source;
            if (dateFrom && isValidDateStr(dateFrom)) params.date_from = parseUIDateToApi(dateFrom);
            if (dateTo && isValidDateStr(dateTo)) params.date_to = parseUIDateToApi(dateTo);

            const res = await leadService.getAll(params);
            const data = res.data;
            const results = Array.isArray(data) ? data : (data.results || []);
            setLeads(results);

            const count = data.count || results.length;
            setTotalCount(count);
            setTotalPages(Math.ceil(count / 20) || 1);
            if (updateTotalLeads) updateTotalLeads(count);
        } catch (error) {
            console.error("Leads fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteModal.lead) return;
        try {
            await leadService.delete(deleteModal.lead.id);
            toast.success("Lead o'chirildi");
            setDeleteModal({ open: false, lead: null });
            fetchLeads();
        } catch (error) {
            toast.error("O'chirishda xatolik");
        }
    };

    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setPage(1);
    };

    const getStatusBadge = (status) => {
        const map = {
            'answered': { label: 'Javob berildi', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
            'not_answered': { label: 'Javob berilmadi', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
            'client_answered': { label: 'Mijoz javob berdi', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
            'client_not_answered': { label: "Mijoz ko'tarmadi", color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
            'busy': { label: 'Band', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' },
            'incorrect': { label: "Noto'g'ri raqam", color: '#1f2937', bg: 'rgba(31, 41, 55, 0.1)' },
        };
        const s = map[status] || { label: status || "Kutilmoqda", color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' };

        return (
            <span style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                color: s.color,
                backgroundColor: s.bg
            }}>
                {s.label}
            </span>
        );
    };

    return (
        <div className="leads-list-container animate-fadeIn">
            {/* Toolbar */}
            <div className="leads-toolbar">
                <div className="toolbar-left">
                    <div className="leads-search-box">
                        <SearchIcon />
                        <input
                            type="text"
                            placeholder="Qidirish (Ism, Telefon)..."
                            name="search"
                            value={filters.search}
                            onChange={handleFilterChange}
                        />
                    </div>

                    <div className="leads-source-filter-box">
                        <select
                            name="heard_source"
                            value={filters.heard_source}
                            onChange={handleFilterChange}
                            className="source-select-input"
                        >
                            <option value="">Barcha manbalar</option>
                            <option value="Instagramda">📸 Instagram</option>
                            <option value="Telegramda">✈️ Telegram</option>
                            <option value="Facebookda">📘 Facebook</option>
                            <option value="Influencer">⭐ Influencer</option>
                            <option value="Referral">👥 Referral</option>
                            <option value="YouTubeda">▶️ YouTube</option>
                            <option value="Odamlar orasida">🗣️ Odamlar orasida</option>
                            <option value="Xech qayerda">❓ Boshqa</option>
                        </select>
                    </div>

                    <div className="date-filter-group">
                        <div className="date-filter">
                            <label>Dan</label>
                            <input
                                type="text"
                                placeholder="KK.OO.YYYY"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(formatDateInput(e.target.value))}
                            />
                        </div>
                        <span className="date-filter-divider"></span>
                        <div className="date-filter">
                            <label>Gacha</label>
                            <input
                                type="text"
                                placeholder="KK.OO.YYYY"
                                value={dateTo}
                                onChange={(e) => setDateTo(formatDateInput(e.target.value))}
                            />
                        </div>
                        {(dateFrom || dateTo) && (
                            <button className="clear-filter-btn" onClick={() => { setDateFrom(''); setDateTo(''); }}>✕</button>
                        )}
                    </div>

                    <button className="btn-v2 btn-v2-dark" onClick={fetchLeads}>
                        <RefreshIcon />
                        <span>Yangilash</span>
                    </button>
                </div>

                <div className="toolbar-right">
                    <button className="btn-v2 btn-v2-primary" onClick={() => openCreateModal()}>
                        <PlusIcon />
                        <span>Lead qo'shish</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading-state" style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                    <div className="spinner mx-auto"></div>
                </div>
            ) : leads.length === 0 ? (
                <div className="empty-state" style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
                    <EmptyIcon style={{ width: 64, height: 64, marginBottom: '16px', opacity: 0.5 }} />
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>Leadlar topilmadi</h3>
                    <p>Qidiruv shartlarini o'zgartirib ko'ring yoki yangi lead qo'shing</p>
                </div>
            ) : (
                <div className="card-body p-0">
                    <div className="responsive-table">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th># ID</th>
                                    <th>Mijoz</th>
                                    <th>Telefon</th>
                                    <th>Manba (Marketing)</th>
                                    <th>Bosqich</th>
                                    <th>Status</th>
                                    <th>Operator</th>
                                    <th>Sana</th>
                                    <th style={{ textAlign: 'right' }}>Amallar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leads.map(lead => (
                                    <tr key={lead.id}>
                                        <td className="cell-number">#{lead.id}</td>
                                        <td>
                                            <div className="cell-name font-semibold">{lead.client_name || "Noma'lum"}</div>
                                            {lead.lead_turi && <span className="lead-type-badge">{lead.lead_turi}</span>}
                                        </td>
                                        <td>{lead.phone_number}</td>
                                        <td>
                                            <SourceBadge source={lead.heard_source} />
                                        </td>
                                        <td>
                                            <span style={{
                                                fontSize: '12px',
                                                border: '1px solid var(--border-color)',
                                                padding: '3px 8px',
                                                borderRadius: '6px',
                                                background: 'var(--bg-tertiary)',
                                                color: 'var(--text-secondary)',
                                                fontWeight: 500
                                            }}>
                                                {lead.stage_name || lead.stage?.name || 'Bosqichsiz'}
                                            </span>
                                        </td>
                                        <td>{getStatusBadge(lead.call_status)}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{
                                                    width: 26, height: 26,
                                                    borderRadius: '50%',
                                                    background: 'rgba(99, 102, 241, 0.15)',
                                                    color: '#6366f1',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '11px',
                                                    fontWeight: 'bold',
                                                }}>
                                                    {lead.operator_name ? lead.operator_name[0] : '?'}
                                                </div>
                                                <span style={{ fontSize: '13px' }}>{lead.operator_name || "Belgilanmagan"}</span>
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                                            {formatDate(lead.created_at)}
                                        </td>
                                        <td className="cell-actions" style={{ justifyContent: 'flex-end' }}>
                                            <div className="table-actions flex items-center justify-end gap-1.5">
                                                {!lead.is_converted && (
                                                    <>
                                                        <button
                                                            className="btn-icon"
                                                            onClick={() => setEnrollModal({ isOpen: true, lead })}
                                                            title="O'quvchi sifatida qabul qilish"
                                                            style={{
                                                                background: 'rgba(59, 130, 246, 0.1)',
                                                                color: '#3b82f6',
                                                                width: 32, height: 32,
                                                                border: 'none', borderRadius: '8px',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            <AcademicCapIcon />
                                                        </button>
                                                        <button
                                                            className="btn-icon"
                                                            onClick={() => setConvertModal({ isOpen: true, lead })}
                                                            title="Mijozga aylantirish"
                                                            style={{
                                                                background: 'rgba(16, 185, 129, 0.1)',
                                                                color: '#10b981',
                                                                width: 32, height: 32,
                                                                border: 'none', borderRadius: '8px',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            <ConvertIcon />
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    className="btn-icon btn-edit"
                                                    onClick={() => openEditModal(lead)}
                                                    title="Tahrirlash"
                                                    style={{
                                                        background: 'rgba(99, 102, 241, 0.1)',
                                                        color: '#6366f1',
                                                        width: 32, height: 32,
                                                        border: 'none', borderRadius: '8px',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <EditIcon style={{ width: 15, height: 15 }} />
                                                </button>
                                                <button
                                                    className="btn-icon btn-delete"
                                                    onClick={() => setDeleteModal({ open: true, lead })}
                                                    title="O'chirish"
                                                    style={{
                                                        background: 'rgba(239, 68, 68, 0.1)',
                                                        color: '#ef4444',
                                                        width: 32, height: 32,
                                                        border: 'none', borderRadius: '8px',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <TrashIcon style={{ width: 15, height: 15 }} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="pagination-container">
                            <div className="pagination-info">
                                Jami {totalCount} ta lead (Sahifa {page} / {totalPages})
                            </div>
                            <div className="pagination-controls">
                                <button
                                    className="pagination-btn"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    <ChevronLeftIcon />
                                </button>
                                {[...Array(Math.min(5, totalPages))].map((_, i) => (
                                    <button
                                        key={i + 1}
                                        className={`pagination-btn ${page === i + 1 ? 'active' : ''}`}
                                        onClick={() => setPage(i + 1)}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    className="pagination-btn"
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                >
                                    <ChevronRightIcon />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Delete Modal */}
            <Modal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, lead: null })}
                title="Leadni o'chirish"
                size="sm"
                footer={
                    <>
                        <button
                            type="button"
                            className="btn-v2 btn-v2-secondary"
                            onClick={() => setDeleteModal({ open: false, lead: null })}
                        >
                            Bekor qilish
                        </button>
                        <button
                            type="button"
                            className="btn-v2 btn-v2-danger"
                            onClick={handleDelete}
                        >
                            O'chirish
                        </button>
                    </>
                }
            >
                <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Haqiqatan ham ushbu leadni butunlay o'chirib tashlamoqchimisiz?
                    <br />
                    <strong style={{ color: 'var(--text-primary)' }}>
                        {deleteModal.lead?.client_name || deleteModal.lead?.phone_number}
                    </strong>
                </p>
            </Modal>

            {/* Convert Lead Modal */}
            <ConvertLeadModal
                isOpen={convertModal.isOpen}
                lead={convertModal.lead}
                onClose={() => setConvertModal({ isOpen: false, lead: null })}
                onSuccess={fetchLeads}
            />

            {/* Enroll Student Modal */}
            <EnrollStudentModal
                isOpen={enrollModal.isOpen}
                lead={enrollModal.lead}
                onClose={() => setEnrollModal({ isOpen: false, lead: null })}
                onSuccess={fetchLeads}
            />
        </div>
    );
};

export default LeadsList;
