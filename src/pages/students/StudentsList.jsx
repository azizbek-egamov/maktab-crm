import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { 
    Search, Plus, Users, AlertCircle, Edit, Trash2, GraduationCap, 
    UserCheck, DollarSign, Calendar, Phone, Copy, Check, Filter, 
    CreditCard, ArrowUpRight, X, ChevronRight, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { studentService, schoolClassService, studentContractService } from '../../services/students';
import { formatDateInput, isValidDateStr, parseUIDateToApi } from '../../utils/dateFormatter';
import { formatPhoneInput, parsePhoneToApi, formatApiPhoneToUI } from '../../utils/phoneFormatter';
import { formatPrice, parsePrice } from '../../utils/priceFormatter';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';
import './Students.css';

import ExcelModal from '../../components/ExcelModal';
import excelService from '../../services/excel';
import Pagination from '../../components/ui/Pagination';

const STATUS_OPTIONS = [
    { value: '', label: 'Barcha holatlar' },
    { value: 'active', label: 'Faol' },
    { value: 'inactive', label: 'Nofaol' },
    { value: 'expelled', label: 'Chetlatilgan' },
    { value: 'graduated', label: 'Bitirgan' },
    { value: 'on_leave', label: 'Vaqtincha ketgan' },
];

const STATUS_LABELS = {
    active: 'Faol',
    inactive: 'Nofaol',
    expelled: 'Chetlatilgan',
    graduated: 'Bitirgan',
    on_leave: 'Vaqtincha ketgan',
};

const GENDER_OPTIONS = [
    { value: '', label: 'Barcha jinslar' },
    { value: 'male', label: "O'g'il bola (Erkak)" },
    { value: 'female', label: 'Qiz bola (Ayol)' },
];

const formatMoney = (n) => {
    if (!n && n !== 0) return '—';
    return new Intl.NumberFormat('uz-UZ').format(n) + " so'm";
};

// Colors for avatar backgrounds
const AVATAR_COLORS = [
    'linear-gradient(135deg, #6366f1, #8b5cf6)',
    'linear-gradient(135deg, #3b82f6, #06b6d4)',
    'linear-gradient(135deg, #10b981, #059669)',
    'linear-gradient(135deg, #f59e0b, #d97706)',
    'linear-gradient(135deg, #ec4899, #f43f5e)',
    'linear-gradient(135deg, #8b5cf6, #d946ef)',
];

const getAvatarBg = (name = '') => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
};

const StudentsList = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Pagination
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Filters
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [schoolClass, setSchoolClass] = useState('');
    const [gender, setGender] = useState('');
    const [debtorsOnly, setDebtorsOnly] = useState(false);
    
    // Modals
    const [showForm, setShowForm] = useState(false);
    const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ open: false, student: null });
    const [copiedPhoneId, setCopiedPhoneId] = useState(null);
    
    // Quick Payment Modal
    const [quickPayModal, setQuickPayModal] = useState({ open: false, student: null });
    const [quickPayForm, setQuickPayForm] = useState({
        amount: '',
        method: 'cash',
        note: "O'quvchi to'lovi",
    });
    const [quickPaySaving, setQuickPaySaving] = useState(false);

    // New Student Form state
    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        middle_name: '',
        birth_date: '',
        gender: '',
        phone: '',
        address: '',
        school_class: '',
        status: 'active',
        // Parent info
        parent_name: '',
        parent_phone: '',
        parent_relationship: 'father',
    });

    // Lock body scroll when any modal is open
    useBodyScrollLock(showForm || quickPayModal.open || deleteModal.open || isExcelModalOpen);

    useEffect(() => {
        loadClasses();
        loadStatistics();
    }, []);

    // Reset page to 1 when filters change
    useEffect(() => {
        setPage(1);
    }, [search, status, schoolClass, gender, debtorsOnly]);

    useEffect(() => {
        const t = setTimeout(loadStudents, 300);
        return () => clearTimeout(t);
    }, [search, status, schoolClass, gender, debtorsOnly, page, pageSize]);

    const loadClasses = async () => {
        try {
            const res = await schoolClassService.getAll({ active: 'true' });
            setClasses(res.data.results || res.data || []);
        } catch {
            // handle silently
        }
    };

    const loadStatistics = async () => {
        try {
            const res = await studentService.getStatistics();
            setStats(res.data);
        } catch {
            // fallback
        }
    };

    const loadStudents = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                page_size: pageSize,
            };
            if (search) params.search = search;
            if (status) params.status = status;
            if (schoolClass) params.school_class = schoolClass;
            if (gender) params.gender = gender;
            if (debtorsOnly) params.debtors = 'true';
            
            const res = await studentService.getAll(params);
            if (res.data && res.data.results) {
                setStudents(res.data.results);
                const count = res.data.count || 0;
                setTotalItems(count);
                setTotalPages(Math.max(1, Math.ceil(count / pageSize)));
            } else {
                const list = Array.isArray(res.data) ? res.data : [];
                setStudents(list);
                setTotalItems(list.length);
                setTotalPages(1);
            }
        } catch {
            toast.error("O'quvchilarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    const resetFilters = () => {
        setSearch('');
        setStatus('');
        setSchoolClass('');
        setGender('');
        setDebtorsOnly(false);
        setPage(1);
    };

    const hasActiveFilters = search || status || schoolClass || gender || debtorsOnly;

    const handleCopyPhone = (phone, id) => {
        if (!phone) return;
        navigator.clipboard.writeText(phone);
        setCopiedPhoneId(id);
        toast.success("Telefon raqami nusxalandi");
        setTimeout(() => setCopiedPhoneId(null), 2000);
    };

    const handleDeleteClick = (student) => {
        setDeleteModal({ open: true, student });
    };

    const confirmDelete = async (studentId) => {
        try {
            await studentService.delete(studentId);
            toast.success("O'quvchi o'chirildi");
            setDeleteModal({ open: false, student: null });
            loadStudents();
            loadStatistics();
        } catch (err) {
            toast.error(err.response?.data?.detail || "O'chirishda xatolik yuz berdi. Bog'liq ma'lumotlar mavjud bo'lishi mumkin.");
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.first_name.trim() || !form.last_name.trim()) {
            toast.error('Ism va familiya kiritilishi shart');
            return;
        }
        if (form.birth_date && !isValidDateStr(form.birth_date)) {
            toast.error("Tug'ilgan sana noto'g'ri. KK.OO.YYYY formatida kiriting (masalan: 12.12.2020)");
            return;
        }
        setSaving(true);
        try {
            const payload = {
                first_name: form.first_name.trim(),
                last_name: form.last_name.trim(),
                middle_name: form.middle_name.trim(),
                status: form.status,
                address: form.address.trim(),
            };

            if (form.birth_date) {
                payload.birth_date = parseUIDateToApi(form.birth_date);
            }
            if (form.school_class) payload.school_class = form.school_class;
            if (form.gender) payload.gender = form.gender;
            if (form.phone) payload.phone = parsePhoneToApi(form.phone);

            const res = await studentService.create(payload);
            const studentId = res.data.id;

            // If parent information is provided, create parent link
            if (form.parent_phone && form.parent_name) {
                try {
                    await studentService.addParent(studentId, {
                        relationship: form.parent_relationship,
                        is_primary: true,
                        parent: {
                            full_name: form.parent_name.trim(),
                            phone: parsePhoneToApi(form.parent_phone),
                        }
                    });
                } catch {
                    console.error("Ota-ona qo'shishda xatolik");
                }
            }

            toast.success("O'quvchi muvaffaqiyatli qo'shildi");
            setShowForm(false);
            setForm({
                first_name: '',
                last_name: '',
                middle_name: '',
                birth_date: '',
                gender: '',
                phone: '',
                address: '',
                school_class: '',
                status: 'active',
                parent_name: '',
                parent_phone: '',
                parent_relationship: 'father',
            });
            loadStudents();
            loadStatistics();
            navigate(`/students/${studentId}`);
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Xatolik yuz berdi');
        } finally {
            setSaving(false);
        }
    };

    // Quick Payment Handlers
    const openQuickPayment = (student) => {
        setQuickPayModal({ open: true, student });
        setQuickPayForm({
            amount: student.remaining_debt > 0 ? formatPrice(student.remaining_debt) : '',
            method: 'cash',
            note: `${student.full_name} to'lovi`,
        });
    };

    const handleQuickPaymentSubmit = async (e) => {
        e.preventDefault();
        const student = quickPayModal.student;
        if (!student) return;

        const amountVal = parsePrice(quickPayForm.amount);
        if (!amountVal || amountVal <= 0) {
            toast.error("To'g'ri to'lov summasini kiriting");
            return;
        }

        setQuickPaySaving(true);
        try {
            // Check if student has contract
            const contractRes = await studentContractService.getAll({ student: student.id });
            const contracts = contractRes.data.results || contractRes.data || [];
            let targetContract = contracts.find(c => c.status === 'active' || c.status === 'pending') || contracts[0];

            if (!targetContract) {
                // Auto create basic contract
                const newContract = await studentContractService.create({
                    student: student.id,
                    monthly_fee: amountVal,
                    term_months: 10,
                    payment_day: 10,
                    status: 'active',
                });
                targetContract = newContract.data;
            }

            await studentContractService.addPayment(targetContract.id, {
                amount: amountVal,
                method: quickPayForm.method,
                note: quickPayForm.note || "Kassa to'lovi",
            });

            toast.success("To'lov muvaffaqiyatli qabul qilindi va Kassaga kiritildi!");
            setQuickPayModal({ open: false, student: null });
            loadStudents();
            loadStatistics();
        } catch (err) {
            toast.error(err.response?.data?.detail || "To'lovni kiritishda xatolik yuz berdi");
        } finally {
            setQuickPaySaving(false);
        }
    };

    return (
        <div className="students-page animate-fadeIn">
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">🎓 O'quvchilar Markazi</h1>
                    <p className="page-subtitle">Maktab o'quvchilari ro'yxati, sinflar taqsimoti va to'lov hisobi</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                        className="btn-secondary"
                        onClick={() => excelService.downloadExport('debtors')}
                        title="Faqat qarzdor o'quvchilar ro'yxatini yuklab olish"
                    >
                        <AlertCircle size={16} color="#ef4444" />
                        Qarzdorlar (.xlsx)
                    </button>
                    <button
                        className="btn-secondary"
                        onClick={() => setIsExcelModalOpen(true)}
                    >
                        <Calendar size={16} />
                        Excel Import / Export
                    </button>
                    <button className="btn-primary" onClick={() => setShowForm(true)}>
                        <Plus size={18} />
                        Yangi O'quvchi
                    </button>
                </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="students-kpi-grid">
                <div className="stu-kpi-card">
                    <div className="stu-kpi-icon total">
                        <Users size={22} />
                    </div>
                    <div className="stu-kpi-info">
                        <span className="stu-kpi-label">Jami O'quvchilar</span>
                        <h3 className="stu-kpi-value">{stats?.total_students ?? students.length} nafar</h3>
                    </div>
                </div>

                <div className="stu-kpi-card">
                    <div className="stu-kpi-icon active">
                        <UserCheck size={22} />
                    </div>
                    <div className="stu-kpi-info">
                        <span className="stu-kpi-label">Faol O'quvchilar</span>
                        <h3 className="stu-kpi-value">{stats?.active_students ?? students.filter(s => s.status === 'active').length} nafar</h3>
                    </div>
                </div>

                <div className="stu-kpi-card highlight-danger">
                    <div className="stu-kpi-icon debt">
                        <DollarSign size={22} />
                    </div>
                    <div className="stu-kpi-info">
                        <span className="stu-kpi-label">Qarzdorlar Soni & Qarz</span>
                        <h3 className="stu-kpi-value text-danger">
                            {stats?.debtor_count ?? 0} nafar
                        </h3>
                        <span className="stu-kpi-sub">{formatMoney(stats?.total_debt_amount ?? 0)}</span>
                    </div>
                </div>

                <div className="stu-kpi-card">
                    <div className="stu-kpi-icon new">
                        <Sparkles size={22} />
                    </div>
                    <div className="stu-kpi-info">
                        <span className="stu-kpi-label">Shu Oyda Qabul</span>
                        <h3 className="stu-kpi-value">{stats?.monthly_new ?? 0} nafar</h3>
                        <span className="stu-kpi-sub">O'g'il: {stats?.male_count || 0} | Qiz: {stats?.female_count || 0}</span>
                    </div>
                </div>
            </div>

            {/* Content Table Card */}
            <div className="content-card">
                <div className="filters-row">
                    <div className="search-box">
                        <Search size={18} color="var(--text-secondary)" />
                        <input
                            placeholder="Ism, familiya, ID yoki telefon..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {search && (
                            <button className="clear-btn" onClick={() => setSearch('')}>
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <select className="filter-select" value={schoolClass} onChange={(e) => setSchoolClass(e.target.value)}>
                        <option value="">🏫 Barcha sinflar</option>
                        {classes.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>

                    <select className="filter-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                        {STATUS_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>

                    <select className="filter-select" value={gender} onChange={(e) => setGender(e.target.value)}>
                        {GENDER_OPTIONS.map((g) => (
                            <option key={g.value} value={g.value}>{g.label}</option>
                        ))}
                    </select>

                    <label className={`checkbox-filter-label ${debtorsOnly ? 'active' : ''}`}>
                        <input
                            type="checkbox"
                            checked={debtorsOnly}
                            onChange={(e) => setDebtorsOnly(e.target.checked)}
                        />
                        <AlertCircle size={16} />
                        Faqat qarzdorlar
                    </label>

                    {hasActiveFilters && (
                        <button className="btn-reset-filters" onClick={resetFilters}>
                            <X size={14} /> Filtrlarni tozalash
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="empty-state">
                        <div className="spinner mx-auto" style={{ width: 36, height: 36, marginBottom: 12 }}></div>
                        <p>O'quvchilar yuklanmoqda...</p>
                    </div>
                ) : students.length === 0 ? (
                    <div className="empty-state">
                        <Users size={56} style={{ opacity: 0.25, marginBottom: 16 }} />
                        <h4 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Hech qanday o'quvchi topilmadi</h4>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                            {hasActiveFilters ? "Kiritilgan filtrlarga mos keluvchi o'quvchi yo'q." : "Hozircha hech qanday o'quvchi ro'yxatdan o'tmagan."}
                        </p>
                        {hasActiveFilters && (
                            <button className="btn-secondary" style={{ marginTop: 14 }} onClick={resetFilters}>
                                Filtrlarni qayta tiklash
                            </button>
                        )}
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>O'quvchi ID</th>
                                    <th>F.I.Sh.</th>
                                    <th>Sinf</th>
                                    <th>Holat</th>
                                    <th>Ota-onasi & Aloqa</th>
                                    <th>To'lov / Qarzdorlik</th>
                                    <th>Qabul Sanasi</th>
                                    <th style={{ textAlign: 'right' }}>Amallar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((s) => {
                                    const initials = ((s.first_name?.[0] || '') + (s.last_name?.[0] || '')).toUpperCase() || 'ST';
                                    return (
                                        <tr key={s.id} className="student-table-row">
                                            <td>
                                                <span className="stu-id-badge">{s.student_number || `STU-${s.id}`}</span>
                                            </td>
                                            <td>
                                                <div className="stu-name-cell" onClick={() => navigate(`/students/${s.id}`)}>
                                                    <div className="stu-avatar" style={{ background: getAvatarBg(s.full_name) }}>
                                                        {initials}
                                                    </div>
                                                    <div className="stu-name-info">
                                                        <strong className="stu-full-name">{s.full_name}</strong>
                                                        {s.gender && (
                                                            <span className="stu-sub-tag">
                                                                {s.gender === 'male' ? "👦 O'g'il bola" : "👧 Qiz bola"}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                {s.class_name ? (
                                                    <span className="class-pill">
                                                        <GraduationCap size={13} /> {s.class_name}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-tag">—</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`status-badge ${s.status}`}>
                                                    {STATUS_LABELS[s.status] || s.status}
                                                </span>
                                            </td>
                                            <td>
                                                {s.primary_parent_phone ? (
                                                    <div className="parent-contact-cell">
                                                        <span className="parent-phone-text">
                                                            {formatApiPhoneToUI(s.primary_parent_phone)}
                                                        </span>
                                                        <button 
                                                            className="btn-copy-mini"
                                                            onClick={() => handleCopyPhone(s.primary_parent_phone, s.id)}
                                                            title="Raqamni nusxalash"
                                                        >
                                                            {copiedPhoneId === s.id ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-tag">Kiritilmagan</span>
                                                )}
                                            </td>
                                            <td>
                                                {s.has_contract ? (
                                                    <div className="debt-cell">
                                                        <span className={`debt-badge ${s.is_debtor ? 'danger' : 'ok'}`}>
                                                            {s.is_debtor ? `Qarz: ${formatMoney(s.remaining_debt)}` : "To'langan"}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="debt-badge none">Shartnoma yo'q</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className="date-text">{s.enrollment_date || '—'}</span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="table-actions" style={{ justifyContent: 'flex-end', gap: '6px' }}>
                                                    <button 
                                                        className="btn-quick-pay" 
                                                        onClick={() => openQuickPayment(s)}
                                                        title="To'lov qabul qilish"
                                                    >
                                                        <CreditCard size={14} />
                                                        <span>To'lov</span>
                                                    </button>
                                                    <button 
                                                        className="btn-icon btn-view" 
                                                        onClick={() => navigate(`/students/${s.id}`)} 
                                                        title="Batafsil ma'lumot"
                                                    >
                                                        <ChevronRight size={16} />
                                                    </button>
                                                    <button 
                                                        className="btn-icon btn-delete" 
                                                        onClick={() => handleDeleteClick(s)} 
                                                        title="O'chirish"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {!loading && totalItems > 0 && (
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        totalItems={totalItems}
                        pageSize={pageSize}
                        onPageChange={(newPage) => setPage(newPage)}
                        onPageSizeChange={(newSize) => {
                            setPageSize(newSize);
                            setPage(1);
                        }}
                        itemName="o'quvchi"
                    />
                )}
            </div>

            {/* Quick Payment Modal */}
            {quickPayModal.open && createPortal(
                <div className="modal-overlay" onClick={() => setQuickPayModal({ open: false, student: null })}>
                    <div className="modal-content modal-quick-pay" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3 className="modal-title">💳 To'lov Qabul Qilish</h3>
                                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                                    {quickPayModal.student?.full_name} ({quickPayModal.student?.class_name || 'Sinf belgilanmagan'})
                                </p>
                            </div>
                            <button className="btn-close-modal" onClick={() => setQuickPayModal({ open: false, student: null })}>
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleQuickPaymentSubmit}>
                            <div className="modal-body">
                                <div className="form-group" style={{ marginBottom: 16 }}>
                                    <label>To'lov Summasi (so'm) *</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Masalan: 1 500 000"
                                        value={quickPayForm.amount}
                                        onChange={(e) => setQuickPayForm({ ...quickPayForm, amount: formatPrice(e.target.value) })}
                                        style={{ fontSize: 16, fontWeight: 600 }}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: 16 }}>
                                    <label>To'lov Usuli</label>
                                    <select
                                        value={quickPayForm.method}
                                        onChange={(e) => setQuickPayForm({ ...quickPayForm, method: e.target.value })}
                                    >
                                        <option value="cash">💵 Naqd pul</option>
                                        <option value="card">💳 Plastik karta (Terminal)</option>
                                        <option value="click">📱 Click / Payme</option>
                                        <option value="transfer">🏦 Bank o'tkazmasi</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Izoh / Kvitansiya eslatmasi</label>
                                    <input
                                        type="text"
                                        placeholder="Masalan: Sentyabr oyi to'lovi"
                                        value={quickPayForm.note}
                                        onChange={(e) => setQuickPayForm({ ...quickPayForm, note: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setQuickPayModal({ open: false, student: null })}>
                                    Bekor
                                </button>
                                <button type="submit" className="btn-primary" disabled={quickPaySaving}>
                                    {quickPaySaving ? 'Qabul qilinmoqda...' : "To'lovni Tasdiqlash"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Add Student Modal */}
            {showForm && createPortal(
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal-content modal-form modal-student-add" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3 className="modal-title">✨ Yangi O'quvchi Ro'yxatdan O'tkazish</h3>
                                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                                    O'quvchi va ota-onaning asosiy ma'lumotlarini to'ldiring
                                </p>
                            </div>
                            <button className="btn-close-modal" onClick={() => setShowForm(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="modal-body">
                                {/* Section 1: Student Information */}
                                <div className="form-section-title">
                                    <GraduationCap size={16} /> O'quvchi Ma'lumotlari
                                </div>
                                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                    <div className="form-group">
                                        <label>Familiya *</label>
                                        <input 
                                            required 
                                            placeholder="Masalan: Aliyev"
                                            value={form.last_name} 
                                            onChange={(e) => setForm({ ...form, last_name: e.target.value })} 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Ism *</label>
                                        <input 
                                            required 
                                            placeholder="Masalan: Sardor"
                                            value={form.first_name} 
                                            onChange={(e) => setForm({ ...form, first_name: e.target.value })} 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Otasining ismi (Sharifi)</label>
                                        <input 
                                            placeholder="Masalan: Jasurovich"
                                            value={form.middle_name} 
                                            onChange={(e) => setForm({ ...form, middle_name: e.target.value })} 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Sinf</label>
                                        <select value={form.school_class} onChange={(e) => setForm({ ...form, school_class: e.target.value })}>
                                            <option value="">Sinfni tanlang</option>
                                            {classes.map((c) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Tug'ilgan sana (KK.OO.YYYY)</label>
                                        <input 
                                            type="text" 
                                            placeholder="12.05.2015" 
                                            value={form.birth_date} 
                                            onChange={(e) => setForm({ ...form, birth_date: formatDateInput(e.target.value) })} 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Jinsi</label>
                                        <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                                            <option value="">Tanlang</option>
                                            <option value="male">Erkak (O'g'il bola)</option>
                                            <option value="female">Ayol (Qiz bola)</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>O'quvchi telefoni</label>
                                        <input 
                                            type="text"
                                            placeholder="+998 90 123 45 67"
                                            value={form.phone}
                                            onChange={(e) => setForm({ ...form, phone: formatPhoneInput(e.target.value) })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Holat</label>
                                        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                                            <option value="active">Faol</option>
                                            <option value="inactive">Nofaol</option>
                                            <option value="on_leave">Vaqtincha ketgan</option>
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label>Yashash manzili</label>
                                        <input 
                                            placeholder="Toshkent sh., Yunusobod tumani, 4-mavze..."
                                            value={form.address} 
                                            onChange={(e) => setForm({ ...form, address: e.target.value })} 
                                        />
                                    </div>
                                </div>

                                {/* Section 2: Parent Information */}
                                <div className="form-section-title" style={{ marginTop: 20 }}>
                                    <Users size={16} /> Ota-ona / Vasiy Ma'lumotlari (Ixtiyoriy)
                                </div>
                                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                    <div className="form-group">
                                        <label>Ota-onaning F.I.Sh.</label>
                                        <input 
                                            placeholder="Masalan: Aliyev Jasur"
                                            value={form.parent_name} 
                                            onChange={(e) => setForm({ ...form, parent_name: e.target.value })} 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Ota-onaning telefon raqami</label>
                                        <input 
                                            type="text" 
                                            placeholder="+998 90 987 65 43" 
                                            value={form.parent_phone} 
                                            onChange={(e) => setForm({ ...form, parent_phone: formatPhoneInput(e.target.value) })} 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Qarindoshlik darajasi</label>
                                        <select value={form.parent_relationship} onChange={(e) => setForm({ ...form, parent_relationship: e.target.value })}>
                                            <option value="father">Otasi</option>
                                            <option value="mother">Onasi</option>
                                            <option value="guardian">Vasiy</option>
                                            <option value="other">Boshqa</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                                    Bekor
                                </button>
                                <button type="submit" className="btn-primary" disabled={saving}>
                                    {saving ? "Qo'shilmoqda..." : "O'quvchini Saqlash"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Delete Modal */}
            {deleteModal.open && createPortal(
                <div className="modal-overlay" onClick={() => setDeleteModal({ open: false, student: null })}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">O'quvchini o'chirish</h3>
                            <button className="btn-close-modal" onClick={() => setDeleteModal({ open: false, student: null })}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="modal-body" style={{ textAlign: 'center', padding: '24px 20px' }}>
                            <div className="modal-icon danger" style={{ margin: '0 auto 16px', width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Trash2 size={24} />
                            </div>
                            <p style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '8px' }}>
                                <strong>{deleteModal.student?.full_name}</strong> o'quvchisini tizimdan butunlay o'chirishni xohlaysizmi?
                            </p>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                Bu o'quvchiga tegishli barcha shartnomalar, to'lovlar va davomat tarixi o'chiriladi.
                            </p>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setDeleteModal({ open: false, student: null })}>
                                Bekor qilish
                            </button>
                            <button 
                                className="btn-primary" 
                                style={{ background: '#ef4444', borderColor: '#ef4444', color: '#fff' }} 
                                onClick={() => confirmDelete(deleteModal.student.id)}
                            >
                                Ha, o'chirilsin
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Excel Modal */}
            <ExcelModal
                isOpen={isExcelModalOpen}
                onClose={() => setIsExcelModalOpen(false)}
                type="students"
                title="O'quvchilar Bazasi (Excel)"
                onImportSuccess={() => {
                    loadStudents();
                    loadStatistics();
                }}
            />
        </div>
    );
};

export default StudentsList;
