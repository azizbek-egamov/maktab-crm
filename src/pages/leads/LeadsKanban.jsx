import React, { useState, useEffect, useRef } from 'react';
import { leadService } from '../../services/leads';
import { useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import StatusManagement from './StatusManagement';
import ConvertLeadModal from './ConvertLeadModal';
import EnrollStudentModal from './EnrollStudentModal';
import QuickLeadForm from './QuickLeadForm';
import { formatDateInput, isValidDateStr, parseUIDateToApi } from '../../utils/dateFormatter';
import './StatusManagement.css';
import './LeadsKanban.css';

// Icons
const SearchIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

const SettingsIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1-2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
);

const PhoneIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
    </svg>
);

const CalendarIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);

const UserIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);

const RefreshIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="23 4 23 10 17 10"></polyline>
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
    </svg>
);

const FormSourceIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" title="Formadan kelgan">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
);

const SourceIcon = ({ source }) => {
    const icons = {
        'Telegramda': <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" title="Telegram"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"></path></svg>,
        'Instagramda': <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" title="Instagram"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>,
        'Facebookda': <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" title="Facebook"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>,
        'Influencer': <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" title="Influencer"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>,
        'Referral': <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" title="Referral"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>,
        'YouTubeda': <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" title="YouTube"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>,
        'Odamlar orasida': <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" title="Odamlar orasida"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
        'Xech qayerda': <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" title="Noma'lum"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
    };
    return icons[source] || null;
};

const UrgencyIcon = ({ color }) => (
    <div className={`urgency-indicator ${color === '#ef4444' ? 'pulse' : ''}`} style={{ color }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
            <circle cx="12" cy="12" r="10"></circle>
        </svg>
    </div>
);


const StatCard = ({ title, value, icon, gradient }) => (
    <div className="stat-card" style={{ background: gradient }}>
        <div className="stat-info">
            <span className="stat-title">{title}</span>
            <span className="stat-value">{value}</span>
        </div>
        <div className="stat-icon">{icon}</div>
    </div>
);

// Lead Card Component
const LeadCard = React.memo(({ lead, onClick, onConvert, onEnroll, onDragStart, onDragEnd, isTrackingStage }) => {
    const [minutesElapsed, setMinutesElapsed] = useState(0);

    useEffect(() => {
        if (!isTrackingStage || !lead.created_at) return;

        const calculateElapsed = () => {
            const created = new Date(lead.created_at);
            const now = new Date();
            const diffMs = now - created;
            setMinutesElapsed(Math.floor(diffMs / 60000));
        };

        calculateElapsed();
        const interval = setInterval(calculateElapsed, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [lead.created_at, isTrackingStage]);

    const getUrgencyColor = () => {
        if (!isTrackingStage) return null;
        if (minutesElapsed >= 15) return '#ef4444'; // Red
        if (minutesElapsed >= 10) return '#f97316'; // Orange
        if (minutesElapsed >= 5) return '#fbbf24';  // Yellow
        return null;
    };

    const urgencyColor = getUrgencyColor();

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
            'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}-${month} ${year} ${hours}:${minutes}`;
    };

    const formatPhone = (phone) => {
        if (!phone) return '';
        if (phone.startsWith('p+')) return phone;
        const digits = phone.replace(/\D/g, '');
        if (digits.length === 12 && digits.startsWith('998')) {
            return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10, 12)}`;
        }
        return phone.startsWith('+') ? phone : (phone ? `+${digits}` : '');
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const getStatusInfo = (status) => {
        const statusMap = {
            'answered': { label: 'Javob berdi', class: 'status-answered' },
            'not_answered': { label: 'Javob bermadi', class: 'status-not-answered' },
            'client_answered': { label: 'Mijoz javob berdi', class: 'status-client-answered' },
            'client_not_answered': { label: "Mijoz ko'tarmadi", class: 'status-client-not-answered' }
        };
        return statusMap[status] || null;
    };

    const statusInfo = getStatusInfo(lead.call_status);

    return (
        <div
            className="lead-card"
            draggable={!lead.is_converted}
            onDragStart={(e) => onDragStart(e, lead)}
            onDragEnd={onDragEnd}
            onClick={onClick}
        >
            {urgencyColor && <UrgencyIcon color={urgencyColor} />}
            <div className="lead-card-top">
                <div className="lead-avatar">
                    {getInitials(lead.client_name)}
                </div>
                <div className="lead-info">
                    <div className="lead-name-row">
                        <span className="lead-name">
                            {lead.client_name || "Noma'lum"}
                        </span>
                        {lead.heard_source && lead.heard_source !== 'Xech qayerda' && (
                            <span className="lead-source-badge" title={`Marketing manbasi: ${lead.heard_source}`}>
                                <SourceIcon source={lead.heard_source} />
                                <span>{lead.heard_source}</span>
                            </span>
                        )}
                        {lead.notes && lead.notes.startsWith('Formadan kelgan') && (
                            <span className="lead-source-badge form-badge" title="Sayt formasidan kelgan">
                                <FormSourceIcon />
                                <span>Forma</span>
                            </span>
                        )}
                    </div>
                    <span className="lead-date">
                        <CalendarIcon /> {formatDateTime(lead.created_at)}
                    </span>
                </div>
            </div>

            <div className="lead-card-row">
                <PhoneIcon />
                <span>
                    {formatPhone(lead.phone_number)}
                    {lead.lead_turi && <span className="lead-type-badge">{lead.lead_turi}</span>}
                </span>
            </div>

            {statusInfo && (
                <div className="lead-card-row">
                    <span className={`lead-status-badge ${statusInfo.class}`}>
                        {statusInfo.label}
                    </span>
                </div>
            )}

            {(lead.operator_name || lead.last_moved_by) && (
                <div className="lead-operator-info">
                    {lead.operator_name && (
                        <span className="operator-badge operator-assigned" title="Tayinlangan operator">
                            <UserIcon /> {lead.operator_name}
                        </span>
                    )}
                    {lead.last_moved_by && (
                        <span className="operator-badge operator-moved" title="Kim ko'chirdi">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="15 10 20 15 15 20"></polyline>
                                <path d="M4 4v7a4 4 0 0 0 4 4h12"></path>
                            </svg>
                            {lead.last_moved_by}
                        </span>
                    )}
                </div>
            )}

            <div className="lead-card-actions">
                <span className="action-link" onClick={(e) => { e.stopPropagation(); onClick(); }}>
                    Tahrirlash
                </span>
                {!lead.is_converted && (
                    <>
                        <span className="action-link" onClick={(e) => { e.stopPropagation(); onEnroll(lead); }}>
                            Qabul
                        </span>
                        <span className="action-link delete" onClick={(e) => { e.stopPropagation(); onConvert(lead); }}>
                            Mijoz
                        </span>
                    </>
                )}
            </div>
        </div>
    );
}, (prev, next) => {
    return prev.lead.id === next.lead.id && 
           prev.lead.stage === next.lead.stage && 
           prev.lead.updated_at === next.lead.updated_at &&
           prev.lead.call_status === next.lead.call_status;
});

const LeadsKanban = () => {
    const { openEditModal, refreshTrigger } = useOutletContext();

    const [columns, setColumns] = useState([]);
    const [stats, setStats] = useState({ total: 0, today: 0, converted: 0, answered: 0 });
    const [loading, setLoading] = useState(true);
    const [globalSearch, setGlobalSearch] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [convertModal, setConvertModal] = useState({ isOpen: false, lead: null });
    const [enrollModal, setEnrollModal] = useState({ isOpen: false, lead: null });
    const [draggedLead, setDraggedLead] = useState(null);
    const [quickAddColumn, setQuickAddColumn] = useState(null);
    const [selectedSource, setSelectedSource] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [columnPages, setColumnPages] = useState({});
    const [columnHasMore, setColumnHasMore] = useState({});
    const [columnLoadingMore, setColumnLoadingMore] = useState({});
    const scrollContainerRef = useRef(null);
    const scrollDirectionRef = useRef(null);
    const rafIdRef = useRef(null);
    const isDraggingRef = useRef(false);
    const containerRectRef = useRef(null);



    // ========== AUTO-SCROLL ENGINE ==========
    // Runs entirely outside React via native document listener + refs.
    // No React state changes = no re-renders = no jitter.
    const EDGE_ZONE = 80;
    const SCROLL_SPEED = 20;

    const runAutoScroll = () => {
        const container = scrollContainerRef.current;
        if (!container || !scrollDirectionRef.current) {
            rafIdRef.current = null;
            return;
        }
        container.scrollLeft += scrollDirectionRef.current === 'left' ? -SCROLL_SPEED : SCROLL_SPEED;
        rafIdRef.current = requestAnimationFrame(runAutoScroll);
    };

    const setDirection = (dir) => {
        if (scrollDirectionRef.current === dir) return; // already going this way
        scrollDirectionRef.current = dir;
        if (dir) {
            // Clear all column highlights when auto-scroll starts
            document.querySelectorAll('.kanban-column.drag-over').forEach(el => {
                el.classList.remove('drag-over');
            });
            if (!rafIdRef.current) {
                rafIdRef.current = requestAnimationFrame(runAutoScroll);
            }
        }
    };

    const stopAutoScroll = () => {
        scrollDirectionRef.current = null;
        if (rafIdRef.current) {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
        }
    };

    // Native document-level handler — completely bypasses React event system
    const nativeDragOverHandler = useRef(null);

    const attachAutoScrollListener = () => {
        const container = scrollContainerRef.current;
        if (!container) return;
        containerRectRef.current = container.getBoundingClientRect();

        nativeDragOverHandler.current = (e) => {
            const rect = containerRectRef.current;
            if (!rect) return;
            const x = e.clientX;

            if (x >= rect.left && x <= rect.left + EDGE_ZONE) {
                setDirection('left');
            } else if (x >= rect.right - EDGE_ZONE && x <= rect.right) {
                setDirection('right');
            } else {
                setDirection(null);
            }
        };

        document.addEventListener('dragover', nativeDragOverHandler.current);
    };

    const detachAutoScrollListener = () => {
        if (nativeDragOverHandler.current) {
            document.removeEventListener('dragover', nativeDragOverHandler.current);
            nativeDragOverHandler.current = null;
        }
        stopAutoScroll();
        containerRectRef.current = null;
    };

    useEffect(() => {
        return () => detachAutoScrollListener();
    }, []);

    const loadData = async (ignore = false) => {
        if (columns.length === 0) setLoading(true);
        try {
            const params = {};
            if (globalSearch) params.search = globalSearch;
            if (dateFrom && isValidDateStr(dateFrom)) params.date_from = parseUIDateToApi(dateFrom);
            if (dateTo && isValidDateStr(dateTo)) params.date_to = parseUIDateToApi(dateTo);
            if (selectedSource) {
                params.heard_source = selectedSource;
            }

            const [kanbanRes, statsRes] = await Promise.all([
                leadService.getKanban(params),
                leadService.getStatistics(params).catch(() => ({ data: {} })),
            ]);

            if (ignore) return;

            setColumns(kanbanRes.data);

            const initialPages = {};
            const initialHasMore = {};
            kanbanRes.data.forEach(col => {
                initialPages[col.id] = 1;
                initialHasMore[col.id] = col.has_more;
            });
            setColumnPages(initialPages);
            setColumnHasMore(initialHasMore);
            setColumnLoadingMore({});

            if (statsRes.data) {
                setStats({
                    total: statsRes.data.total || 0,
                    today: statsRes.data.today || 0,
                    converted: statsRes.data.converted || 0,
                    answered: statsRes.data.answered || 0
                });
            }
        } catch (error) {
            console.error("Load error:", error);
        } finally {
            if (!ignore) setLoading(false);
        }
    };

    useEffect(() => {
        let ignore = false;
        loadData(ignore);
        return () => { ignore = true; };
    }, [refreshTrigger, globalSearch, dateFrom, dateTo, selectedSource]);

    // Auto-refresh when a lead in "Qayta bog'lanish" becomes overdue
    useEffect(() => {
        if (!columns || columns.length === 0) return;

        const checkOverdueLeads = () => {
            const now = new Date();
            let hasOverdue = false;

            columns.forEach(col => {
                // Identify re-contact stage by key
                const isRecontactStage = col.key?.toLowerCase().includes('qayta');
                if (isRecontactStage) {
                    col.items.forEach(lead => {
                        if (lead.date_at) {
                            const scheduledDate = new Date(lead.date_at);
                            if (scheduledDate <= now) {
                                hasOverdue = true;
                            }
                        }
                    });
                }
            });

            if (hasOverdue) {
                console.log("Detecting overdue leads in Re-contact stage, refreshing board...");
                loadData();
            }
        };

        // Initial check and then every minute
        const interval = setInterval(checkOverdueLeads, 60000);
        return () => clearInterval(interval);
    }, [columns]);



    const handleDragStart = (e, lead) => {
        if (lead.is_converted) return;
        setDraggedLead(lead);
        isDraggingRef.current = true;
        e.dataTransfer.effectAllowed = 'move';
        e.target.classList.add('dragging');

        // Attach the native document-level auto-scroll listener
        attachAutoScrollListener();
    };

    const handleDragEnd = (e) => {
        e.target.classList.remove('dragging');
        setDraggedLead(null);
        isDraggingRef.current = false;
        detachAutoScrollListener();
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDragEnter = (e, stageId) => {
        e.preventDefault();
        // Don't highlight columns during auto-scroll — prevents jitter
        if (!scrollDirectionRef.current) {
            e.currentTarget.classList.add('drag-over');
        }
    };

    const handleDragLeave = (e) => {
        if (e.currentTarget.contains(e.relatedTarget)) return;
        e.currentTarget.classList.remove('drag-over');
    };

    const handleDrop = async (e, targetStageId) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        detachAutoScrollListener();
        if (!draggedLead || draggedLead.stage === targetStageId) return;
        try {
            await leadService.patch(draggedLead.id, { stage: targetStageId });
            toast.success("Lead bosqichi o'zgartirildi");
            loadData();
        } catch (error) {
            console.error(error);
            toast.error("Xatolik yuz berdi");
        }
    };

    const getDefaultColor = (index) => {
        const colors = ['#eab308', '#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'];
        return colors[index % colors.length];
    };

    const loadMoreLeads = async (stageId) => {
        if (columnLoadingMore[stageId] || !columnHasMore[stageId]) return;
        setColumnLoadingMore(prev => ({ ...prev, [stageId]: true }));
        try {
            const nextPage = (columnPages[stageId] || 1) + 1;
            const params = { stage_id: stageId, page: nextPage };
            if (globalSearch) params.search = globalSearch;
            if (dateFrom && isValidDateStr(dateFrom)) params.date_from = parseUIDateToApi(dateFrom);
            if (dateTo && isValidDateStr(dateTo)) params.date_to = parseUIDateToApi(dateTo);
            if (selectedSource) {
                params.heard_source = selectedSource;
            }

            const res = await leadService.getStageLeads(params);
            const newLeads = res.data.results || [];

            setColumns(prev => prev.map(col => {
                if (col.id === stageId) {
                    return { ...col, items: [...col.items, ...newLeads] };
                }
                return col;
            }));

            setColumnPages(prev => ({ ...prev, [stageId]: nextPage }));
            setColumnHasMore(prev => ({ ...prev, [stageId]: !!res.data.next }));
        } catch (error) {
            console.error("Load more error:", error);
        } finally {
            setColumnLoadingMore(prev => ({ ...prev, [stageId]: false }));
        }
    };

    const handleColumnScroll = (e, stageId) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 100) {
            loadMoreLeads(stageId);
        }
    };

    return (
        <div className="leads-kanban-container animate-fadeIn">
            <div className="stats-row">
                <StatCard title="Jami Leadlar" value={stats.total} gradient="linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" icon={<PhoneIcon />} />
                <StatCard title="Bugungi" value={stats.today} gradient="linear-gradient(135deg, #10b981 0%, #34d399 100%)" icon={<CalendarIcon />} />
                <StatCard title="Mijozga Aylangan" value={stats.converted} gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" icon={<UserIcon />} />
                <StatCard title="Javob Bergan" value={stats.answered} gradient="linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)" icon={<PhoneIcon />} />
            </div>

            {isFilterOpen && <div className="fixed inset-0 z-[999]" onClick={() => setIsFilterOpen(false)} />}

            <div className="leads-toolbar">
                <div className="toolbar-left">
                    <div className="leads-search-box">
                        <SearchIcon />
                        <input type="text" placeholder="Qidirish (Ism, Telefon)..." value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} />
                    </div>
                    <div className="leads-source-filter-box">
                        <select
                            value={selectedSource}
                            onChange={(e) => setSelectedSource(e.target.value)}
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
                        <div className="date-filter"><label>Dan</label><input type="text" placeholder="KK.OO.YYYY" value={dateFrom} onChange={(e) => setDateFrom(formatDateInput(e.target.value))} /></div>
                        <span className="date-filter-divider"></span>
                        <div className="date-filter"><label>Gacha</label><input type="text" placeholder="KK.OO.YYYY" value={dateTo} onChange={(e) => setDateTo(formatDateInput(e.target.value))} /></div>
                        {(dateFrom || dateTo) && <button className="clear-filter-btn" onClick={() => { setDateFrom(''); setDateTo(''); }}>✕</button>}
                    </div>
                    <button className="btn-v2 btn-v2-dark" onClick={loadData}><RefreshIcon /><span>Yangilash</span></button>
                </div>
                <div className="toolbar-right">
                    <button className="btn-v2 btn-v2-dark" onClick={() => setShowStatusModal(true)}><SettingsIcon /><span>Bosqichlarni boshqarish</span></button>
                </div>
            </div>

            {loading ? (
                <div className="kanban-loading text-center py-20"><div className="spinner mx-auto"></div></div>
            ) : (
                <div className="kanban-scroll-wrapper">
                    <div className="kanban-scroll-container" ref={scrollContainerRef}>
                        <div className="kanban-board">
                            {columns.map((col, index) => (
                                <div key={col.id} className="kanban-column" style={{ '--column-color': col.color || getDefaultColor(index) }} onDragOver={handleDragOver} onDragEnter={(e) => handleDragEnter(e, col.id)} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, col.id)}>
                                    <div className="column-header">
                                        <div className="column-title">
                                            <span className="title-text">{col.name}</span>
                                            <span className="item-count">{col.total_count || 0}</span>
                                        </div>
                                    </div>

                                    {quickAddColumn === col.id ? (
                                        <div className="quick-add-wrapper slide-down">
                                            <QuickLeadForm stageId={col.id} onCancel={() => setQuickAddColumn(null)} onSuccess={() => { setQuickAddColumn(null); loadData(); }} />
                                        </div>
                                    ) : (
                                        <button className="add-lead-button" onClick={() => setQuickAddColumn(col.id)}>+ Lead qo'shish</button>
                                    )}

                                    <div className="column-items" onScroll={(e) => handleColumnScroll(e, col.id)}>
                                        {col.items?.map(lead => (
                                            <LeadCard
                                                key={lead.id}
                                                lead={lead}
                                                onClick={() => openEditModal(lead)}
                                                onConvert={(l) => setConvertModal({ isOpen: true, lead: l })}
                                                onEnroll={(l) => setEnrollModal({ isOpen: true, lead: l })}
                                                onDragStart={handleDragStart}
                                                onDragEnd={handleDragEnd}
                                                isTrackingStage={col.key === 'forms' || col.key?.includes('yangi_leadlar')}
                                            />
                                        ))}
                                        {columnLoadingMore[col.id] && <div className="column-loading-more"><div className="mini-spinner mx-auto"></div></div>}
                                        {(!col.items || col.items.length === 0) && <div className="empty-column"><span>Lead yo'q</span></div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <StatusManagement isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} onSuccess={loadData} />
            <ConvertLeadModal isOpen={convertModal.isOpen} lead={convertModal.lead} onClose={() => setConvertModal({ isOpen: false, lead: null })} onSuccess={loadData} />
            <EnrollStudentModal isOpen={enrollModal.isOpen} lead={enrollModal.lead} onClose={() => setEnrollModal({ isOpen: false, lead: null })} onSuccess={loadData} />
        </div>
    );
};

export default LeadsKanban;
