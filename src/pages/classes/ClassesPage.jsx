import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, GraduationCap, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { schoolClassService } from '../../services/students';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';
import '../students/Students.css';

const formatUzbekDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const months = [
            'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
            'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
        ];
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        return `${day}-${month} ${year}-yil`;
    } catch {
        return '—';
    }
};

const ClassesPage = () => {
    const navigate = useNavigate();
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedClassId, setSelectedClassId] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ open: false, schoolClass: null });
    const [form, setForm] = useState({
        name: '', grade: 1, section: 'A', max_students: 30,
    });

    useBodyScrollLock(showForm || deleteModal.open);

    const load = async () => {
        setLoading(true);
        try {
            const res = await schoolClassService.getAll();
            setClasses(res.data.results || res.data || []);
        } catch {
            toast.error('Sinflarni yuklashda xatolik');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const openCreate = () => {
        setSelectedClassId(null);
        setForm({
            name: '', grade: 1, section: 'A', max_students: 30,
        });
        setShowForm(true);
    };

    const openEdit = (c) => {
        setSelectedClassId(c.id);
        setForm({
            name: c.name || '',
            grade: c.grade || 1,
            section: c.section || '',
            max_students: c.max_students || 30,
        });
        setShowForm(true);
    };

    const handleDeleteClick = (schoolClass) => {
        setDeleteModal({ open: true, schoolClass });
    };

    const confirmDelete = async (classId) => {
        try {
            await schoolClassService.delete(classId);
            toast.success("Sinf o'chirildi");
            setDeleteModal({ open: false, schoolClass: null });
            load();
        } catch (err) {
            toast.error(err.response?.data?.detail || "O'chirishda xatolik yuz berdi. Bog'liq o'quvchilar borligi sababli o'chirib bo'lmasligi mumkin.");
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...form, grade: parseInt(form.grade, 10), max_students: parseInt(form.max_students, 10) };
            if (!payload.name) payload.name = `${payload.grade}-${payload.section}`;
            
            if (selectedClassId) {
                await schoolClassService.update(selectedClassId, payload);
                toast.success('Sinf tahrirlandi');
            } else {
                await schoolClassService.create(payload);
                toast.success('Sinf yaratildi');
            }
            setShowForm(false);
            load();
        } catch {
            toast.error('Xatolik');
        }
    };

    return (
        <div className="students-page animate-fadeIn">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Sinflar</h1>
                    <p className="page-subtitle">Guruhlar va o'quvchilar sig'imi</p>
                </div>
                <button className="btn-primary" onClick={openCreate}>
                    <Plus size={18} /> Yangi sinf
                </button>
            </div>

            <div className="content-card">
                {loading ? (
                    <div className="loading-state">
                        <div className="loading-spinner" />
                        <span className="loading-text">Sinflar yuklanmoqda...</span>
                    </div>
                ) : classes.length === 0 ? (
                    <div className="empty-state">
                        <GraduationCap size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                        <p>Sinflar yo'q</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Sinf</th>
                                <th>O'quvchilar</th>
                                <th>Yaratilgan vaqti</th>
                                <th style={{ textAlign: 'right' }}>Amallar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {classes.map((c) => (
                                <tr key={c.id}>
                                    <td><strong>{c.name}</strong></td>
                                    <td>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                            <Users size={14} />
                                            {c.student_count || 0} / {c.max_students}
                                        </span>
                                    </td>
                                    <td>{formatUzbekDate(c.created_at)}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                                            <button className="btn-icon btn-edit" onClick={() => openEdit(c)} title="Tahrirlash">
                                                <Edit size={16} />
                                            </button>
                                            <button className="btn-icon btn-delete" onClick={() => handleDeleteClick(c)} title="O'chirish">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>


            {showForm && createPortal(
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal-content modal-form" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{selectedClassId ? 'Sinfni tahrirlash' : 'Yangi sinf'}</h3>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Nomi</label>
                                        <input placeholder="5-A" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Sinf raqami</label>
                                        <input type="number" min="1" max="11" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Harfi</label>
                                        <input value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Maksimal o'quvchilar soni</label>
                                        <input type="number" min="1" max="100" value={form.max_students} onChange={(e) => setForm({ ...form, max_students: e.target.value })} required />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Bekor</button>
                                <button type="submit" className="btn-primary">{selectedClassId ? 'Saqlash' : 'Yaratish'}</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {deleteModal.open && createPortal(
                <div className="modal-overlay" onClick={() => setDeleteModal({ open: false, schoolClass: null })}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Sinfni o'chirish</h3>
                        </div>
                        <div className="modal-body" style={{ textAlign: 'center', padding: '32px 24px' }}>
                            <div className="modal-icon danger" style={{ margin: '0 auto 20px', width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent-danger-light)', color: 'var(--accent-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Trash2 size={24} />
                            </div>
                            <p style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '8px' }}>
                                <strong>{deleteModal.schoolClass?.name}</strong> sinfini o'chirishni xohlaysizmi?
                            </p>
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                Sinf o'chirilganda, undagi barcha o'quvchilar sinfsiz qoladi. Bu amalni ortga qaytarib bo'lmaydi.
                            </p>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setDeleteModal({ open: false, schoolClass: null })}>
                                Bekor qilish
                            </button>
                            <button className="btn-primary" style={{ background: 'var(--accent-danger)', borderColor: 'var(--accent-danger)', boxShadow: '0 4px 12px var(--accent-danger-light)' }} onClick={() => confirmDelete(deleteModal.schoolClass.id)}>
                                O'chirish
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default ClassesPage;


