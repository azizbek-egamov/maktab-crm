import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Send, Upload, FileText, Edit, HelpCircle, Download } from 'lucide-react';
import { toast } from 'sonner';
import {
    studentService,
    schoolClassService,
    studentContractService,
    studentDocumentService,
    contractPaymentService,
} from '../../services/students';
import api from '../../services/api';
import { formatDateInput, isValidDateStr, parseUIDateToApi, formatApiDateToUI } from '../../utils/dateFormatter';
import { formatPhoneInput, parsePhoneToApi, formatApiPhoneToUI } from '../../utils/phoneFormatter';
import { formatPrice, parsePrice } from '../../utils/priceFormatter';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';
import './Students.css';

const TABS = [
    { id: 'basic', label: 'Asosiy' },
    { id: 'parents', label: 'Ota-ona' },
    { id: 'payment', label: "To'lov" },
    { id: 'documents', label: 'Hujjatlar' },
    { id: 'history', label: 'Tarix' },
];

const STATUS_LABELS = {
    active: 'Faol', inactive: 'Nofaol', expelled: 'Chetlatilgan',
    graduated: 'Bitirgan', on_leave: 'Vaqtincha ketgan',
};

const RELATIONSHIP_LABELS = {
    father: 'Ota',
    mother: 'Ona',
    guardian: 'Vasiy',
    other: 'Boshqa',
};

const PAYMENT_METHOD_LABELS = {
    cash: 'Naqd',
    card: 'Karta',
    transfer: "O'tkazma",
    click: 'Click/Payme',
};

const HISTORY_ACTION_LABELS = {
    created: 'Yaratildi',
    updated: 'Yangilandi',
    parent_added: "Ota-ona qo'shildi",
    parent_removed: "Ota-ona olib tashlandi",
    sms_sent: 'SMS yuborildi',
    enrollment: 'Qabul qilindi',
    contract_created: 'Shartnoma yaratildi',
    payment: "To'lov",
    document: 'Hujjat yuklandi',
};

const formatMoney = (n) => new Intl.NumberFormat('uz-UZ').format(n || 0) + " so'm";

const getFileUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    const baseUrl = api.defaults.baseURL ? api.defaults.baseURL.replace(/\/api\/?$/, '') : '';
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

const Tooltip = ({ text }) => (
    <span className="tooltip-container">
        <HelpCircle size={14} />
        <span className="tooltip-box">{text}</span>
    </span>
);

const StudentDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [classes, setClasses] = useState([]);
    const [tab, setTab] = useState('basic');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({});
    const [parentForm, setParentForm] = useState({ full_name: '', phone: '', relationship: 'father', is_primary: true });
    const [contractForm, setContractForm] = useState({ monthly_fee: '', term_months: 10, payment_day: 10, initial_payment: 0 });
    const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'cash', note: '' });
    const [docForm, setDocForm] = useState({ title: '', doc_type: 'other', file: null });
    const [smsText, setSmsText] = useState('');
    const [editParentModal, setEditParentModal] = useState({ open: false, link: null });
    const [editParentForm, setEditParentForm] = useState({ full_name: '', phone: '', relationship: 'father', is_primary: false });
    const [editContractModal, setEditContractModal] = useState({ open: false, contract: null });
    const [editContractForm, setEditContractForm] = useState({ monthly_fee: '', term_months: 10, payment_day: 10, initial_payment: '', discount_percent: 0, status: 'active' });
    const [chartModal, setChartModal] = useState({ open: false, imageUrl: null });
    const [editPaymentModal, setEditPaymentModal] = useState({ open: false, payment: null });
    const [editPaymentForm, setEditPaymentForm] = useState({ amount: '', method: 'cash', note: '', payment_date: '' });
    const [editDocModal, setEditDocModal] = useState({ open: false, doc: null });
    const [editDocForm, setEditDocForm] = useState({ title: '', doc_type: 'other', file: null });

    useBodyScrollLock(editParentModal.open || editContractModal.open || editPaymentModal.open || editDocModal.open || chartModal.open);

    const load = async () => {
        setLoading(true);
        try {
            const res = await studentService.get(id);
            setStudent(res.data);
            setForm({
                first_name: res.data.first_name,
                last_name: res.data.last_name,
                middle_name: res.data.middle_name || '',
                birth_date: formatApiDateToUI(res.data.birth_date) || '',
                gender: res.data.gender || '',
                phone: formatApiPhoneToUI(res.data.phone || ''),
                address: res.data.address || '',
                status: res.data.status,
                school_class: res.data.school_class || '',
                notes: res.data.notes || '',
            });
        } catch {
            toast.error("O'quvchi topilmadi");
            navigate('/students');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        schoolClassService.getAll({ active: 'true' }).then((r) => setClasses(r.data.results || r.data || []));
    }, [id]);

    const saveBasic = async () => {
        if (form.birth_date && !isValidDateStr(form.birth_date)) {
            toast.error("Tug'ilgan sana noto'g'ri. KK.OO.YYYY formatida kiriting (masalan: 12.12.2020)");
            return;
        }
        setSaving(true);
        try {
            const payload = { ...form };
            if (payload.birth_date) {
                payload.birth_date = parseUIDateToApi(payload.birth_date);
            } else {
                payload.birth_date = null;
            }
            if (payload.phone) {
                payload.phone = parsePhoneToApi(payload.phone);
                if (payload.phone.length < 12) {
                    toast.error("Telefon raqami to'liq bo'lishi kerak (+998 XX XXX XX XX)");
                    setSaving(false);
                    return;
                }
            }
            if (!payload.school_class) payload.school_class = null;
            await studentService.update(id, payload);
            toast.success('Saqlandi');
            load();
        } catch {
            toast.error('Saqlashda xatolik');
        } finally {
            setSaving(false);
        }
    };

    const addParent = async (e) => {
        e.preventDefault();
        try {
            const parentPayload = {
                relationship: parentForm.relationship,
                is_primary: parentForm.is_primary,
                parent: {
                    full_name: parentForm.full_name,
                    phone: parsePhoneToApi(parentForm.phone),
                }
            };
            if (!parentPayload.parent.phone || parentPayload.parent.phone.length < 12) {
                toast.error("Ota-ona telefon raqami to'liq bo'lishi kerak (+998 XX XXX XX XX)");
                return;
            }
            await studentService.addParent(id, parentPayload);
            toast.success("Ota-ona qo'shildi");
            setParentForm({ full_name: '', phone: '', relationship: 'father', is_primary: false });
            load();
        } catch {
            toast.error('Xatolik');
        }
    };

    const handleEditParentClick = (link) => {
        setEditParentForm({
            full_name: link.parent.full_name,
            phone: formatApiPhoneToUI(link.parent.phone),
            relationship: link.relationship,
            is_primary: link.is_primary,
        });
        setEditParentModal({ open: true, link });
    };

    const handleUpdateParent = async (e) => {
        e.preventDefault();
        try {
            const parentPayload = {
                relationship: editParentForm.relationship,
                is_primary: editParentForm.is_primary,
                parent: {
                    full_name: editParentForm.full_name,
                    phone: parsePhoneToApi(editParentForm.phone),
                }
            };
            if (!parentPayload.parent.phone || parentPayload.parent.phone.length < 12) {
                toast.error("Ota-ona telefon raqami to'liq bo'lishi kerak (+998 XX XXX XX XX)");
                return;
            }
            await studentService.updateParent(id, editParentModal.link.id, parentPayload);
            toast.success("Ota-ona ma'lumotlari yangilandi");
            setEditParentModal({ open: false, link: null });
            load();
        } catch {
            toast.error('Xatolik');
        }
    };

    const handleEditContractClick = (contract) => {
        setEditContractForm({
            monthly_fee: formatPrice(contract.monthly_fee),
            term_months: contract.term_months,
            payment_day: contract.payment_day,
            initial_payment: formatPrice(contract.initial_payment || 0),
            discount_percent: contract.discount_percent,
            status: contract.status,
        });
        setEditContractModal({ open: true, contract });
    };

    const handleUpdateContract = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                monthly_fee: parsePrice(editContractForm.monthly_fee),
                term_months: parseInt(editContractForm.term_months, 10),
                payment_day: parseInt(editContractForm.payment_day, 10),
                initial_payment: parsePrice(editContractForm.initial_payment),
                discount_percent: parseFloat(editContractForm.discount_percent || 0),
                status: editContractForm.status,
            };
            await studentContractService.update(editContractModal.contract.id, payload);
            toast.success("Shartnoma ma'lumotlari yangilandi");
            setEditContractModal({ open: false, contract: null });
            load();
        } catch {
            toast.error("Xatolik yuz berdi");
        }
    };

    const handleEditPaymentClick = (payment) => {
        setEditPaymentForm({
            amount: formatPrice(payment.amount),
            method: payment.method,
            note: payment.note || '',
            payment_date: formatApiDateToUI(payment.payment_date) || '',
        });
        setEditPaymentModal({ open: true, payment });
    };

    const handleUpdatePayment = async (e) => {
        e.preventDefault();
        const paymentDateUI = editPaymentForm.payment_date;
        if (paymentDateUI && !isValidDateStr(paymentDateUI)) {
            toast.error("Sana noto'g'ri. KK.OO.YYYY formatida kiriting (masalan: 12.12.2020)");
            return;
        }
        try {
            await contractPaymentService.update(editPaymentModal.payment.id, {
                amount: parsePrice(editPaymentForm.amount),
                method: editPaymentForm.method,
                note: editPaymentForm.note,
                payment_date: paymentDateUI ? parseUIDateToApi(paymentDateUI) : null,
            });
            toast.success("To'lov ma'lumotlari yangilandi");
            setEditPaymentModal({ open: false, payment: null });
            load();
        } catch {
            toast.error("Tahrirlashda xatolik");
        }
    };

    const handleDeletePayment = async (paymentId) => {
        if (!confirm("Haqiqatan ham ushbu to'lovni bekor qilmoqchimisiz (o'chirmoqchimisiz)?")) return;
        try {
            await contractPaymentService.delete(paymentId);
            toast.success("To'lov bekor qilindi");
            load();
        } catch {
            toast.error("Bekor qilishda xatolik");
        }
    };

    const handleShowPdf = async (contractId) => {
        try {
            const res = await api.get(`/student-contracts/${contractId}/generate_schedule_pdf/`, { responseType: 'blob' });
            const file = new Blob([res.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);
            window.open(fileURL, '_blank');
        } catch {
            toast.error("PDF grafik yuklashda xatolik");
        }
    };

    const removeParent = async (linkId) => {
        if (!confirm('Olib tashlansinmi?')) return;
        await studentService.removeParent(id, linkId);
        load();
    };

    const createContract = async (e) => {
        e.preventDefault();
        try {
            await studentContractService.create({
                student: parseInt(id, 10),
                monthly_fee: parsePrice(contractForm.monthly_fee),
                term_months: contractForm.term_months,
                payment_day: contractForm.payment_day,
                initial_payment: contractForm.initial_payment ? parsePrice(contractForm.initial_payment) : 0,
                status: 'active',
            });
            toast.success('Shartnoma yaratildi');
            setContractForm({ monthly_fee: '', term_months: 10, payment_day: 10, initial_payment: '' });
            load();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Xatolik');
        }
    };

    const addPayment = async (contractId) => {
        if (!paymentForm.amount) return;
        try {
            await studentContractService.addPayment(contractId, {
                ...paymentForm,
                amount: parsePrice(paymentForm.amount)
            });
            toast.success("To'lov qo'shildi");
            setPaymentForm({ amount: '', method: 'cash', note: '' });
            load();
        } catch {
            toast.error('Xatolik');
        }
    };

    const uploadDoc = async (e) => {
        e.preventDefault();
        if (!docForm.file) {
            toast.error('Fayl tanlang');
            return;
        }
        const fd = new FormData();
        fd.append('student', id);
        fd.append('title', docForm.title || docForm.file.name);
        fd.append('doc_type', docForm.doc_type);
        fd.append('file', docForm.file);
        try {
            await studentDocumentService.upload(fd);
            toast.success('Yuklandi');
            setDocForm({ title: '', doc_type: 'other', file: null });
            load();
        } catch {
            toast.error('Yuklashda xatolik');
        }
    };

    const removeDoc = async (docId) => {
        if (!confirm("Haqiqatan ham ushbu hujjatni o'chirib tashlamoqchimisiz?")) return;
        try {
            await studentDocumentService.delete(docId);
            toast.success("Hujjat o'chirildi");
            load();
        } catch {
            toast.error("O'chirishda xatolik");
        }
    };

    const handleEditDocClick = (doc) => {
        setEditDocForm({
            title: doc.title,
            doc_type: doc.doc_type,
            file: null,
        });
        setEditDocModal({ open: true, doc });
    };

    const handleUpdateDoc = async (e) => {
        e.preventDefault();
        const fd = new FormData();
        fd.append('title', editDocForm.title);
        fd.append('doc_type', editDocForm.doc_type);
        if (editDocForm.file) {
            fd.append('file', editDocForm.file);
        }
        try {
            await studentDocumentService.update(editDocModal.doc.id, fd);
            toast.success("Hujjat yangilandi");
            setEditDocModal({ open: false, doc: null });
            load();
        } catch {
            toast.error("Yangilashda xatolik");
        }
    };

    const sendSms = async () => {
        if (!smsText.trim()) return;
        try {
            await studentService.sendSms(id, smsText);
            toast.success('SMS yuborildi');
            setSmsText('');
        } catch (err) {
            toast.error(err.response?.data?.error || 'SMS xatolik');
        }
    };

    if (loading || !student) {
        return <div className="students-page student-details-page"><div className="empty-state">Yuklanmoqda...</div></div>;
    }

    const activeContract = student.contracts?.[0];

    return (
        <div className="students-page student-details-page animate-fadeIn">
            <button className="btn-secondary" style={{ marginBottom: 16 }} onClick={() => navigate('/students')}>
                <ArrowLeft size={16} /> Orqaga
            </button>

            <div className="content-card">
                <div className="profile-header">
                    <div className="avatar">
                        {(student.first_name?.[0] || 'O').toUpperCase()}
                    </div>
                    <div className="profile-meta">
                        <h2>{student.full_name}</h2>
                        <p>{student.student_number} · {student.class_name || 'Sinf biriktirilmagan'} · {STATUS_LABELS[student.status]}</p>
                        {student.lead_id && (
                            <p style={{ marginTop: 4, fontSize: 13, color: '#6366f1' }}>Lead #{student.lead_id} orqali qabul qilingan</p>
                        )}
                    </div>
                    {student.is_debtor && (
                        <span className="debt-badge">Qarz: {formatMoney(student.remaining_debt)}</span>
                    )}
                </div>

                <div className="tabs">
                    {TABS.map((t) => (
                        <button key={t.id} className={`tab-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
                            {t.label}
                        </button>
                    ))}
                </div>

                <div className="tab-content">
                    {tab === 'basic' && (
                        <>
                            <div className="form-grid">
                                <div className="form-group"><label>Familiya</label>
                                    <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></div>
                                <div className="form-group"><label>Ism</label>
                                    <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></div>
                                <div className="form-group"><label>Otasining ismi</label>
                                    <input value={form.middle_name} onChange={(e) => setForm({ ...form, middle_name: e.target.value })} /></div>
                                <div className="form-group"><label>Tug'ilgan sana (KK.OO.YYYY)</label>
                                    <input 
                                        type="text" 
                                        placeholder="KK.OO.YYYY" 
                                        value={form.birth_date} 
                                        onChange={(e) => setForm({ ...form, birth_date: formatDateInput(e.target.value) })} 
                                    /></div>
                                <div className="form-group"><label>Jins</label>
                                    <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                                        <option value="">—</option>
                                        <option value="male">Erkak</option>
                                        <option value="female">Ayol</option>
                                    </select></div>
                                <div className="form-group"><label>Sinf</label>
                                    <select value={form.school_class} onChange={(e) => setForm({ ...form, school_class: e.target.value })}>
                                        <option value="">—</option>
                                        {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select></div>
                                <div className="form-group"><label>Holat</label>
                                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                                        {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select></div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Manzil</label>
                                    <textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Izohlar</label>
                                    <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                            </div>
                            <button className="btn-primary" style={{ marginTop: 20 }} onClick={saveBasic} disabled={saving}>
                                <Save size={16} /> {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                            </button>
                        </>
                    )}

                    {tab === 'parents' && (
                        <>
                            {student.parent_links?.map((link) => (
                                <div key={link.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                                    <div>
                                        <strong>{link.parent.full_name}</strong>
                                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                            {link.parent.phone ? formatApiPhoneToUI(link.parent.phone) : '—'} · {RELATIONSHIP_LABELS[link.relationship] || link.relationship} {link.is_primary && '· Asosiy'}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button className="btn-secondary" onClick={() => handleEditParentClick(link)} title="Tahrirlash">
                                            <Edit size={14} />
                                        </button>
                                        <button className="btn-secondary" onClick={() => removeParent(link.id)} title="O'chirish">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <form onSubmit={addParent} style={{ marginTop: 24 }}>
                                <h4 style={{ margin: '0 0 16px' }}>Ota-ona qo'shish</h4>
                                <div className="form-grid">
                                    <div className="form-group"><label>F.I.Sh.</label>
                                        <input required value={parentForm.full_name} onChange={(e) => setParentForm({ ...parentForm, full_name: e.target.value })} /></div>
                                    <div className="form-group"><label>Telefon</label>
                                        <input required value={parentForm.phone} onChange={(e) => setParentForm({ ...parentForm, phone: formatPhoneInput(e.target.value) })} /></div>
                                    <div className="form-group"><label>Qarindoshlik</label>
                                        <select value={parentForm.relationship} onChange={(e) => setParentForm({ ...parentForm, relationship: e.target.value })}>
                                            <option value="father">Ota</option>
                                            <option value="mother">Ona</option>
                                            <option value="guardian">Vasiy</option>
                                        </select></div>
                                </div>
                                <button type="submit" className="btn-primary" style={{ marginTop: 12 }}><Plus size={16} /> Qo'shish</button>
                            </form>
                            <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border-color)' }}>
                                <h4>SMS yuborish (ota-onaga)</h4>
                                <textarea rows={3} style={{ width: '100%', marginTop: 8, padding: 12, borderRadius: 10, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                    value={smsText} onChange={(e) => setSmsText(e.target.value)} placeholder="Xabar matni..." />
                                <button className="btn-primary" style={{ marginTop: 12 }} onClick={sendSms}><Send size={16} /> Yuborish</button>
                            </div>
                        </>
                    )}

                    {tab === 'payment' && (
                        <>
                            {activeContract ? (
                                <div style={{ marginBottom: 24 }}>
                                    <div className="info-grid" style={{ marginBottom: 16 }}>
                                        <div className="info-item"><label>Shartnoma</label><span>{activeContract.contract_number}</span></div>
                                        <div className="info-item"><label>Oylik</label><span>{formatMoney(activeContract.monthly_fee)}</span></div>
                                        <div className="info-item"><label>Jami</label><span>{formatMoney(activeContract.total_amount)}</span></div>
                                        <div className="info-item"><label>To'langan</label><span>{formatMoney(activeContract.paid_amount)}</span></div>
                                        <div className="info-item"><label>Qolgan</label><span style={{ color: activeContract.is_debtor ? '#dc2626' : 'inherit' }}>{formatMoney(activeContract.remaining_debt)}</span></div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <button className="btn-secondary" onClick={() => handleEditContractClick(activeContract)}>
                                            <Edit size={14} /> Shartnomani tahrirlash
                                        </button>
                                        <button className="btn-secondary" onClick={() => handleShowPdf(activeContract.id)}>
                                            To'lov grafigini ko'rish
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={createContract} style={{ marginBottom: 24, padding: 20, background: 'var(--bg-secondary)', borderRadius: 12 }}>
                                    <h4 style={{ margin: '0 0 16px' }}>Shartnoma yaratish</h4>
                                    <div className="form-grid">
                                         <div className="form-group">
                                             <label>
                                                 Oylik to'lov <span className="text-danger">*</span>
                                                 <Tooltip text="O'quvchi har oyda to'lashi kerak bo'lgan oylik dars to'lov summasi." />
                                             </label>
                                             <input type="text" placeholder="2 500 000" required value={contractForm.monthly_fee} onChange={(e) => setContractForm({ ...contractForm, monthly_fee: formatPrice(e.target.value) })} />
                                         </div>
                                         <div className="form-group">
                                             <label>
                                                 Muddati (oy)
                                                 <Tooltip text="O'quv shartnomasining umumiy muddati (necha oy dars davom etishi)." />
                                             </label>
                                             <input type="number" required value={contractForm.term_months} onChange={(e) => setContractForm({ ...contractForm, term_months: e.target.value })} />
                                         </div>
                                         <div className="form-group">
                                             <label>
                                                 To'lov kuni (kun)
                                                 <Tooltip text="Har oyning aynan shu kunigacha oylik to'lovni amalga oshirish kerak." />
                                             </label>
                                             <input type="number" required value={contractForm.payment_day} onChange={(e) => setContractForm({ ...contractForm, payment_day: e.target.value })} />
                                         </div>
                                         <div className="form-group">
                                             <label>
                                                 Boshlang'ich to'lov
                                                 <Tooltip text="Shartnoma tuzilayotgan paytda to'langan dastlabki/avans to'lovi." />
                                             </label>
                                             <input type="text" placeholder="500 000" value={contractForm.initial_payment} onChange={(e) => setContractForm({ ...contractForm, initial_payment: formatPrice(e.target.value) })} />
                                         </div>
                                    </div>
                                    <button type="submit" className="btn-primary" style={{ marginTop: 12 }}>Shartnoma yaratish</button>
                                </form>
                            )}
                            {activeContract && (
                                <>
                                    <h4>To'lov qo'shish</h4>
                                    <div className="form-grid" style={{ marginTop: 12 }}>
                                        <div className="form-group"><label>Summa</label>
                                            <input type="text" placeholder="100 000" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: formatPrice(e.target.value) })} /></div>
                                        <div className="form-group"><label>Usul</label>
                                            <select value={paymentForm.method} onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}>
                                                <option value="cash">Naqd</option>
                                                <option value="card">Karta</option>
                                                <option value="transfer">O'tkazma</option>
                                                <option value="click">Click/Payme</option>
                                            </select></div>
                                        <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Izoh</label>
                                            <input type="text" placeholder="Qo'shimcha izoh yoki ma'lumotlar..." value={paymentForm.note} onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })} /></div>
                                    </div>
                                    <button className="btn-primary" style={{ marginTop: 12 }} onClick={() => addPayment(activeContract.id)}>To'lov kiritish</button>
                                    {activeContract.payments?.length > 0 && (
                                        <table className="data-table" style={{ marginTop: 24 }}>
                                            <thead><tr><th>Sana</th><th>Summa</th><th>Usul</th><th>Izoh</th><th style={{ width: 100 }}>Harakatlar</th></tr></thead>
                                            <tbody>
                                                {activeContract.payments.map((p) => (
                                                    <tr key={p.id}>
                                                        <td>{p.payment_date}</td>
                                                        <td>{formatMoney(p.amount)}</td>
                                                        <td>{PAYMENT_METHOD_LABELS[p.method] || p.method}</td>
                                                        <td>{p.note || '—'}</td>
                                                        <td>
                                                            <div style={{ display: 'flex', gap: 8 }}>
                                                                <button className="btn-secondary" style={{ padding: 6 }} onClick={() => handleEditPaymentClick(p)} title="Tahrirlash">
                                                                    <Edit size={14} />
                                                                </button>
                                                                <button className="btn-secondary" style={{ padding: 6, color: '#dc2626' }} onClick={() => handleDeletePayment(p.id)} title="Bekor qilish">
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </>
                            )}
                        </>
                    )}

                    {tab === 'documents' && (
                        <>
                            {student.documents?.map((d) => (
                                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                                    <FileText size={20} />
                                    <div style={{ flex: 1 }}>
                                        <strong>{d.title}</strong>
                                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{d.doc_type} · {d.created_at?.slice(0, 10)}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        {d.file && (
                                            <a href={getFileUrl(d.file)} target="_blank" rel="noreferrer" className="btn-secondary" style={{ padding: '6px 8px', display: 'inline-flex', alignItems: 'center' }} title="Yuklab olish">
                                                <Download size={14} />
                                            </a>
                                        )}
                                        <button className="btn-secondary" style={{ padding: '6px 8px' }} onClick={() => handleEditDocClick(d)} title="Tahrirlash / Almashtirish">
                                            <Edit size={14} />
                                        </button>
                                        <button className="btn-secondary" style={{ padding: '6px 8px', color: '#dc2626' }} onClick={() => removeDoc(d.id)} title="O'chirish">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <form onSubmit={uploadDoc} style={{ marginTop: 24 }}>
                                <h4>Hujjat yuklash</h4>
                                <div className="form-grid" style={{ marginTop: 12 }}>
                                    <div className="form-group"><label>Nomi</label>
                                        <input value={docForm.title} onChange={(e) => setDocForm({ ...docForm, title: e.target.value })} /></div>
                                    <div className="form-group"><label>Turi</label>
                                        <select value={docForm.doc_type} onChange={(e) => setDocForm({ ...docForm, doc_type: e.target.value })}>
                                            <option value="birth_cert">Tug'ilganlik guvohnomasi</option>
                                            <option value="medical">Tibbiy</option>
                                            <option value="contract">Shartnoma</option>
                                            <option value="application">Ariza</option>
                                            <option value="other">Boshqa</option>
                                        </select></div>
                                    <div className="form-group"><label>Fayl</label>
                                        <input type="file" required onChange={(e) => setDocForm({ ...docForm, file: e.target.files[0] })} /></div>
                                </div>
                                <button type="submit" className="btn-primary" style={{ marginTop: 12 }}><Upload size={16} /> Yuklash</button>
                            </form>
                        </>
                    )}

                    {tab === 'history' && (
                        <>
                            {student.history?.length ? student.history.map((h) => (
                                <div key={h.id} className="history-item">
                                    <div className="history-action">{h.description}</div>
                                    <div className="history-meta">
                                        {HISTORY_ACTION_LABELS[h.action] || h.action} · {h.changed_by_name || 'Tizim'} · {new Date(h.created_at).toLocaleString('uz-UZ')}
                                    </div>
                                </div>
                            )) : (
                                <p className="empty-state">Tarix bo'sh</p>
                            )}
                        </>
                    )}
                </div>
            </div>
            {editParentModal.open && createPortal(
                <div className="modal-overlay" onClick={() => setEditParentModal({ open: false, link: null })}>
                    <div className="modal-content modal-form animate-fadeIn" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">Ota-onani tahrirlash</h3>
                        </div>
                        <form onSubmit={handleUpdateParent}>
                            <div className="modal-body" style={{ display: 'grid', gap: 16 }}>
                                <div className="form-group">
                                    <label>F.I.Sh. *</label>
                                    <input required value={editParentForm.full_name} onChange={(e) => setEditParentForm({ ...editParentForm, full_name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Telefon *</label>
                                    <input required value={editParentForm.phone} onChange={(e) => setEditParentForm({ ...editParentForm, phone: formatPhoneInput(e.target.value) })} />
                                </div>
                                <div className="form-group">
                                    <label>Qarindoshlik *</label>
                                    <select value={editParentForm.relationship} onChange={(e) => setEditParentForm({ ...editParentForm, relationship: e.target.value })}>
                                        <option value="father">Ota</option>
                                        <option value="mother">Ona</option>
                                        <option value="guardian">Vasiy</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-actions" style={{ marginTop: 20 }}>
                                <button type="button" className="btn-secondary" onClick={() => setEditParentModal({ open: false, link: null })}>Bekor qilish</button>
                                <button type="submit" className="btn-primary"><Save size={16} /> Saqlash</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {editContractModal.open && createPortal(
                <div className="modal-overlay" onClick={() => setEditContractModal({ open: false, contract: null })}>
                    <div className="modal-content modal-form animate-fadeIn" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">Shartnomani tahrirlash</h3>
                        </div>
                        <form onSubmit={handleUpdateContract}>
                            <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label>Oylik to'lov *</label>
                                    <input type="text" required value={editContractForm.monthly_fee} onChange={(e) => setEditContractForm({ ...editContractForm, monthly_fee: formatPrice(e.target.value) })} />
                                </div>
                                <div className="form-group">
                                    <label>Muddati (oy) *</label>
                                    <input type="number" required value={editContractForm.term_months} onChange={(e) => setEditContractForm({ ...editContractForm, term_months: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>To'lov kuni (kun) *</label>
                                    <input type="number" required value={editContractForm.payment_day} onChange={(e) => setEditContractForm({ ...editContractForm, payment_day: e.target.value })} />
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label>Boshlang'ich to'lov</label>
                                    <input type="text" value={editContractForm.initial_payment} onChange={(e) => setEditContractForm({ ...editContractForm, initial_payment: formatPrice(e.target.value) })} />
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label>Holati</label>
                                    <select value={editContractForm.status} onChange={(e) => setEditContractForm({ ...editContractForm, status: e.target.value })}>
                                        <option value="pending">Rasmiylashtirilmoqda</option>
                                        <option value="active">Faol</option>
                                        <option value="paid">To'liq to'langan</option>
                                        <option value="cancelled">Bekor qilingan</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-actions" style={{ marginTop: 20 }}>
                                <button type="button" className="btn-secondary" onClick={() => setEditContractModal({ open: false, contract: null })}>Bekor qilish</button>
                                <button type="submit" className="btn-primary"><Save size={16} /> Saqlash</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
            {editPaymentModal.open && createPortal(
                <div className="modal-overlay" onClick={() => setEditPaymentModal({ open: false, payment: null })}>
                    <div className="modal-content modal-form animate-fadeIn" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">To'lovni tahrirlash</h3>
                        </div>
                        <form onSubmit={handleUpdatePayment}>
                            <div className="modal-body" style={{ display: 'grid', gap: 16 }}>
                                <div className="form-group">
                                    <label>Summa *</label>
                                    <input type="text" required value={editPaymentForm.amount} onChange={(e) => setEditPaymentForm({ ...editPaymentForm, amount: formatPrice(e.target.value) })} />
                                </div>
                                <div className="form-group">
                                    <label>Usul *</label>
                                    <select value={editPaymentForm.method} onChange={(e) => setEditPaymentForm({ ...editPaymentForm, method: e.target.value })}>
                                        <option value="cash">Naqd</option>
                                        <option value="card">Karta</option>
                                        <option value="transfer">O'tkazma</option>
                                        <option value="click">Click/Payme</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Sana (KK.OO.YYYY) *</label>
                                    <input type="text" placeholder="KK.OO.YYYY" required value={editPaymentForm.payment_date} onChange={(e) => setEditPaymentForm({ ...editPaymentForm, payment_date: formatDateInput(e.target.value) })} />
                                </div>
                                <div className="form-group">
                                    <label>Izoh</label>
                                    <input type="text" value={editPaymentForm.note} onChange={(e) => setEditPaymentForm({ ...editPaymentForm, note: e.target.value })} />
                                </div>
                            </div>
                            <div className="modal-actions" style={{ marginTop: 20 }}>
                                <button type="button" className="btn-secondary" onClick={() => setEditPaymentModal({ open: false, payment: null })}>Bekor qilish</button>
                                <button type="submit" className="btn-primary"><Save size={16} /> Saqlash</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
            {editDocModal.open && createPortal(
                <div className="modal-overlay" onClick={() => setEditDocModal({ open: false, doc: null })}>
                    <div className="modal-content modal-form animate-fadeIn" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">Hujjatni tahrirlash / almashtirish</h3>
                        </div>
                        <form onSubmit={handleUpdateDoc}>
                            <div className="modal-body" style={{ display: 'grid', gap: 16 }}>
                                <div className="form-group">
                                    <label>Nomi *</label>
                                    <input required value={editDocForm.title} onChange={(e) => setEditDocForm({ ...editDocForm, title: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Turi *</label>
                                    <select value={editDocForm.doc_type} onChange={(e) => setEditDocForm({ ...editDocForm, doc_type: e.target.value })}>
                                        <option value="birth_cert">Tug'ilganlik guvohnomasi</option>
                                        <option value="medical">Tibbiy</option>
                                        <option value="contract">Shartnoma</option>
                                        <option value="application">Ariza</option>
                                        <option value="other">Boshqa</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Yangi fayl (almashtirish uchun yuklang)</label>
                                    <input type="file" onChange={(e) => setEditDocForm({ ...editDocForm, file: e.target.files[0] })} />
                                </div>
                            </div>
                            <div className="modal-actions" style={{ marginTop: 20 }}>
                                <button type="button" className="btn-secondary" onClick={() => setEditDocModal({ open: false, doc: null })}>Bekor qilish</button>
                                <button type="submit" className="btn-primary"><Save size={16} /> Saqlash</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default StudentDetails;
