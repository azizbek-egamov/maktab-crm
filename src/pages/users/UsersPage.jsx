import { createPortal } from 'react-dom';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';
import { getUsers, createUser, updateUser, deleteUser } from '../../services/users';
import {
    SearchIcon,
    EditIcon,
    TrashIcon,
    PlusIcon,
    EmptyIcon,
    CloseIcon,
    SaveIcon
} from '../clients/ClientIcons';
import './UsersPage.css';

const UsersPage = () => {
    const { user: currentUser, refreshUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state
    const [modal, setModal] = useState({ open: false, type: null, user: null });
    const [modalClosing, setModalClosing] = useState(false);
    const [saving, setSaving] = useState(false);

    useBodyScrollLock(modal.open);

    // Form data (Matching Django User Management fields)
    const [formData, setFormData] = useState({
        username: '',
        first_name: '',
        last_name: '',
        password: '',
        is_staff: false,
        is_superuser: false,
        is_active: true,
        role: 'operator'
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const res = await getUsers();
            setUsers(Array.isArray(res.data) ? res.data : res.data.results || []);
        } catch (error) {
            console.error("Error loading users:", error);
            toast.error("Foydalanuvchilarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            username: '',
            first_name: '',
            last_name: '',
            password: '',
            is_staff: false,
            is_superuser: false,
            is_active: true,
            role: 'operator'
        });
    };

    const openCreateModal = () => {
        resetForm();
        setModal({ open: true, type: 'create', user: null });
    };

    const openEditModal = (user) => {
        setFormData({
            username: user.username,
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            password: '', // Don't show password
            is_staff: user.is_staff,
            is_superuser: user.is_superuser,
            is_active: user.is_active,
            role: user.role || 'operator'
        });
        setModal({ open: true, type: 'edit', user });
    };

    const closeModal = () => {
        setModalClosing(true);
        setTimeout(() => {
            setModal({ open: false, type: null, user: null });
            setModalClosing(false);
            resetForm();
        }, 250);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const data = { ...formData };
            if (modal.type === 'edit' && !data.password) {
                delete data.password;
            }

            if (modal.type === 'edit') {
                await updateUser(modal.user.id, data);
                toast.success("Foydalanuvchi yangilandi");

                // Agar joriy foydalanuvchi o'zini o'zgartirsa, sidebarni yangilash
                if (modal.user.id === currentUser.id) {
                    refreshUser();
                }
            } else {
                if (!data.password) {
                    toast.error("Parol kiritilishi shart");
                    setSaving(false);
                    return;
                }
                await createUser(data);
                toast.success("Yangi foydalanuvchi yaratildi");
            }
            closeModal();
            loadUsers();
        } catch (error) {
            console.error("Error saving user:", error);
            const errorMsg = error.response?.data?.detail ||
                (error.response?.data && Object.values(error.response.data)[0]) ||
                "Xatolik yuz berdi";
            toast.error(typeof errorMsg === 'string' ? errorMsg : "Ma'lumotlar noto'g'ri");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (e, user) => {
        e.stopPropagation(); // Avoid opening the edit modal
        if (!window.confirm(`${user.username} foydalanuvchisini o'chirib tashlamoqchimisiz?`)) return;

        try {
            await deleteUser(user.id);
            toast.success("Foydalanuvchi o'chirildi");
            loadUsers();
        } catch (error) {
            console.error("Error deleting user:", error);
            const errorMsg = error.response?.data?.detail || "O'chirishda xatolik";
            toast.error(errorMsg);
        }
    };



    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.first_name + ' ' + user.last_name).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
            'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear();

        return `${day}-${month} ${year}`;
    };

    return (
        <div className="users-page animate-fadeIn">
            <div className="page-header">
                <div className="header-left">
                    <h1 className="page-title">Foydalanuvchilar</h1>
                    <p className="page-subtitle">Tizim foydalanuvchilarini boshqarish va ruxsatlar</p>
                </div>
                <div className="header-actions">
                    <button className="btn-primary" onClick={openCreateModal}>
                        <PlusIcon />
                        <span>Foydalanuvchi qo'shish</span>
                    </button>
                </div>
            </div>




            <div className="page-content">
                <div className="content-card">
                    <div className="card-header">
                        <div className="search-box">
                            <SearchIcon />
                            <input
                                type="text"
                                placeholder="Foydalanuvchini qidirish..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div style={{ marginLeft: 'auto', fontSize: '14px', color: 'var(--text-secondary)' }}>
                            Jami: <strong>{filteredUsers.length}</strong> ta user
                        </div>
                    </div>

                    <div className="responsive-table">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '60px' }}>#</th>
                                    <th>Foydalanuvchi</th>
                                    <th>Roli</th>
                                    <th>Status</th>
                                    <th>Qo'shilgan sana</th>
                                    <th style={{ textAlign: 'right' }}>Amallar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user, index) => (
                                    <tr key={user.id} onClick={() => openEditModal(user)} style={{ cursor: 'pointer' }}>
                                        <td style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>{index + 1}</td>
                                        <td>
                                            <div className="user-cell">
                                                <div className="user-avatar">
                                                    {user.first_name?.[0] || user.username?.[0]?.toUpperCase() || 'U'}
                                                </div>
                                                <div className="user-details">
                                                    <span className="user-full-name">{user.first_name} {user.last_name}</span>
                                                    <span className="user-username">@{user.username}</span>
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                {user.is_superuser ? (
                                                    <span className="role-badge superuser">Superuser</span>
                                                ) : user.is_staff ? (
                                                    <span className="role-badge staff">Xodim</span>
                                                ) : (
                                                    <span className="role-badge default">User</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`role-badge ${user.is_active ? 'active' : 'inactive'}`}>
                                                {user.is_active ? 'Faol' : 'Nofaol'}
                                            </span>
                                        </td>
                                        <td>{formatDate(user.date_joined)}</td>
                                        <td>
                                            <div className="cell-actions" style={{ justifyContent: 'flex-end' }}>
                                                <div className="table-actions">
                                                    <button className="btn-icon btn-edit" onClick={(e) => { e.stopPropagation(); openEditModal(user); }} title="Tahrirlash">
                                                        <EditIcon />
                                                    </button>
                                                    <button className="btn-icon btn-delete" onClick={(e) => handleDelete(e, user)} title="O'chirish">
                                                        <TrashIcon />
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Overlay */}
            {modal.open && createPortal(
                <div className={`modal-overlay ${modalClosing ? 'closing' : ''}`} onClick={closeModal}>
                    <div className={`modal-content modal-form ${modalClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{modal.type === 'edit' ? 'Foydalanuvchini tahrirlash' : 'Yangi foydalanuvchi qo\'shish'}</h3>
                            <button className="modal-close" onClick={closeModal}><CloseIcon /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-form-body">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Username *</label>
                                        <input
                                            type="text"
                                            placeholder="Masalan: admin"
                                            required
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Ismi</label>
                                        <input
                                            type="text"
                                            placeholder="Ism..."
                                            value={formData.first_name}
                                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Familiyasi</label>
                                        <input
                                            type="text"
                                            placeholder="Familiya..."
                                            value={formData.last_name}
                                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group form-full">
                                        <label>Parol {modal.type === 'create' ? '*' : '(Ixtiyoriy)'}</label>
                                        <input
                                            type="password"
                                            required={modal.type === 'create'}
                                            minLength={6}
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            placeholder={modal.type === 'create' ? "Kamida 6 ta belgi" : "O'zgartirish uchun yangi parol kiriting"}
                                        />
                                    </div>

                                    <div className="form-full">
                                        <div className="checkbox-container">
                                            <label className="checkbox-group">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.is_staff}
                                                    onChange={(e) => setFormData({ ...formData, is_staff: e.target.checked })}
                                                />
                                                <span className="checkbox-label">Xodim</span>
                                            </label>
                                            <label className="checkbox-group">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.is_superuser}
                                                    onChange={(e) => setFormData({ ...formData, is_superuser: e.target.checked })}
                                                />
                                                <span className="checkbox-label">Superuser</span>
                                            </label>
                                            <label className="checkbox-group">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.is_active}
                                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                                />
                                                <span className="checkbox-label">Faol</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={closeModal} disabled={saving}>
                                    Bekor qilish
                                </button>
                                <button type="submit" className="btn-primary" disabled={saving}>
                                    {saving ? 'Saqlanmoqda...' : (
                                        <>
                                            <SaveIcon />
                                            <span>{modal.type === 'edit' ? 'Saqlash' : 'Yaratish'}</span>
                                        </>
                                    )}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default UsersPage;
