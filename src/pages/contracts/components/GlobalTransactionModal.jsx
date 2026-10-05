'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { contractService } from '../../../services/contracts';
import Modal from '../../../components/ui/Modal';
import { DollarSignIcon, DownloadIcon, EditIcon, SaveIcon, CloseIcon, CalendarIcon, HistoryIcon } from '../ContractIcons';
import { toast } from 'sonner';

const METHOD_CONFIG = {
    cash: { label: 'Naqd', badgeClass: 'method-cash', icon: '💵' },
    card: { label: 'Karta', badgeClass: 'method-card', icon: '💳' },
    click: { label: 'Click / Payme', badgeClass: 'method-click', icon: '📱' },
    transfer: { label: "O'tkazma", badgeClass: 'method-transfer', icon: '🏦' },
};

const GlobalTransactionModal = ({ isOpen, onClose, contractId, formatPrice }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [downloadingId, setDownloadingId] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editDate, setEditDate] = useState('');
    const [editTime, setEditTime] = useState('');
    const [editNote, setEditNote] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isOpen && contractId) {
            fetchTransactions();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, contractId]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const response = await contractService.getTransactions(contractId);
            setTransactions(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Tranzaksiyalarni yuklashda xatolik:", error);
            toast.error("To'lovlar tarixini yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPdf = async (transactionId) => {
        setDownloadingId(transactionId);
        toast.loading("Kvitansiya tayyorlanmoqda...", { id: 'receipt-loading' });
        try {
            const response = await contractService.downloadTransactionPdf(contractId, transactionId);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
            toast.dismiss('receipt-loading');
            toast.success("Kvitansiya ochildi");
        } catch (error) {
            console.error("PDF yuklashda xatolik:", error);
            toast.dismiss('receipt-loading');
            toast.error("PDF yaratishda xatolik yuz berdi");
        } finally {
            setDownloadingId(null);
        }
    };

    const handleEdit = (t) => {
        const d = new Date(t.paid_date);
        const dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        const timeStr = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');

        setEditingId(t.id);
        setEditDate(dateStr);
        setEditTime(timeStr);
        setEditNote(t.note || '');
    };

    const handleSave = async (t) => {
        if (!editDate) {
            toast.error("Sanani kiriting");
            return;
        }

        const timeStr = editTime || '00:00';
        const combinedDate = new Date(`${editDate}T${timeStr}:00`);

        setLoading(true);
        try {
            await contractService.updateTransaction(contractId, t.id, {
                paid_date: combinedDate.toISOString(),
                note: editNote
            });
            toast.success("Tranzaksiya muvaffaqiyatli saqlandi");
            setEditingId(null);
            fetchTransactions();
        } catch {
            toast.error("O'zgarishlarni saqlashda xatolik");
            setLoading(false);
        }
    };

    const formatUzbekDate = (dateStr) => {
        if (!dateStr) return '—';
        const date = new Date(dateStr);
        const months = [
            'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
            'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
        ];
        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Calculate Summary KPIs
    const totalCollected = useMemo(() => {
        return transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    }, [transactions]);

    const latestTxDate = useMemo(() => {
        if (!transactions.length) return null;
        return transactions[0].paid_date;
    }, [transactions]);

    // Filter transactions
    const filteredTransactions = useMemo(() => {
        if (!searchQuery.trim()) return transactions;
        const q = searchQuery.toLowerCase();
        return transactions.filter(t => 
            (t.receipt_number && t.receipt_number.toLowerCase().includes(q)) ||
            (t.note && t.note.toLowerCase().includes(q)) ||
            (t.month_name && t.month_name.toLowerCase().includes(q)) ||
            (t.created_by_name && t.created_by_name.toLowerCase().includes(q)) ||
            String(t.amount).includes(q)
        );
    }, [transactions, searchQuery]);

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Umumiy to'lovlar tarixi"
            icon={<HistoryIcon width="22" height="22" />}
            size="lg"
            footer={
                <button
                    className="btn-secondary"
                    onClick={onClose}
                    type="button"
                    style={{ minWidth: 100 }}
                >
                    Yopish
                </button>
            }
        >
            <div className="tx-history-modal">
                {/* Summary KPI Strip */}
                <div className="tx-summary-strip">
                    <div className="tx-stat-card total-sum">
                        <div className="tx-stat-icon">
                            <DollarSignIcon width="20" height="20" />
                        </div>
                        <div className="tx-stat-content">
                            <span className="tx-stat-label">Jami to'langan summa</span>
                            <span className="tx-stat-value text-success">
                                +{formatPrice ? formatPrice(totalCollected) : `${totalCollected.toLocaleString()} so'm`}
                            </span>
                        </div>
                    </div>

                    <div className="tx-stat-card count">
                        <div className="tx-stat-icon blue">
                            <HistoryIcon width="20" height="20" />
                        </div>
                        <div className="tx-stat-content">
                            <span className="tx-stat-label">Tranzaksiyalar soni</span>
                            <span className="tx-stat-value">{transactions.length} ta</span>
                        </div>
                    </div>

                    <div className="tx-stat-card date">
                        <div className="tx-stat-icon purple">
                            <CalendarIcon width="20" height="20" />
                        </div>
                        <div className="tx-stat-content">
                            <span className="tx-stat-label">Oxirgi to'lov</span>
                            <span className="tx-stat-value date-text">
                                {latestTxDate ? `${formatUzbekDate(latestTxDate)} (${formatTime(latestTxDate)})` : '—'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Filter & Search Bar */}
                {transactions.length > 0 && (
                    <div className="tx-search-bar">
                        <input
                            type="text"
                            placeholder="Chek raqami, oy, kassir yoki izoh bo'yicha qidirish..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="tx-search-input"
                        />
                        {searchQuery && (
                            <button className="tx-search-clear" onClick={() => setSearchQuery('')}>
                                <CloseIcon width="14" height="14" />
                            </button>
                        )}
                    </div>
                )}

                {/* Transactions List */}
                {loading ? (
                    <div className="tx-loading">
                        <div className="tx-spinner" />
                        <span>To'lovlar tarixi yuklanmoqda...</span>
                    </div>
                ) : filteredTransactions.length > 0 ? (
                    <div className="tx-items-list">
                        {filteredTransactions.map((t) => {
                            const methodCfg = METHOD_CONFIG[t.payment_method] || { label: t.payment_method || 'Naqd', badgeClass: 'method-cash', icon: '💳' };
                            const isEditing = editingId === t.id;

                            return (
                                <div key={t.id} className={`tx-card ${isEditing ? 'is-editing' : ''}`}>
                                    <div className="tx-card-left">
                                        <div className="tx-receipt-header">
                                            <span className="tx-receipt-badge">
                                                🧾 {t.receipt_number || `CHEK-${t.id}`}
                                            </span>
                                            {t.month_name && (
                                                <span className="tx-month-tag">
                                                    {t.month_name}
                                                </span>
                                            )}
                                        </div>

                                        {isEditing ? (
                                            <div className="tx-edit-fields">
                                                <div className="tx-edit-group">
                                                    <label>Sana</label>
                                                    <input
                                                        type="date"
                                                        value={editDate}
                                                        onChange={(e) => setEditDate(e.target.value)}
                                                        className="tx-input"
                                                    />
                                                </div>
                                                <div className="tx-edit-group">
                                                    <label>Vaqt</label>
                                                    <input
                                                        type="time"
                                                        value={editTime}
                                                        onChange={(e) => setEditTime(e.target.value)}
                                                        className="tx-input"
                                                    />
                                                </div>
                                                <div className="tx-edit-group" style={{ gridColumn: '1 / -1' }}>
                                                    <label>Izoh</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Izoh..."
                                                        value={editNote}
                                                        onChange={(e) => setEditNote(e.target.value)}
                                                        className="tx-input"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="tx-meta-info">
                                                <div className="tx-datetime">
                                                    <CalendarIcon width="14" height="14" />
                                                    <span>{formatUzbekDate(t.paid_date)}</span>
                                                    <span className="tx-time-chip">{formatTime(t.paid_date)}</span>
                                                </div>
                                                <div className="tx-badges-row">
                                                    <span className={`tx-method-badge ${methodCfg.badgeClass}`}>
                                                        {methodCfg.icon} {methodCfg.label}
                                                    </span>
                                                    {t.created_by_name && (
                                                        <span className="tx-cashier-badge">
                                                            👤 {t.created_by_name}
                                                        </span>
                                                    )}
                                                </div>
                                                {t.note && (
                                                    <p className="tx-note-text">
                                                        "{t.note}"
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="tx-card-right">
                                        <div className="tx-amount-display">
                                            <span className="tx-amount-label">To'langan</span>
                                            <span className="tx-amount-val">
                                                +{formatPrice ? formatPrice(t.amount) : `${Number(t.amount).toLocaleString()} so'm`}
                                            </span>
                                        </div>

                                        <div className="tx-actions">
                                            {isEditing ? (
                                                <>
                                                    <button
                                                        className="tx-btn-save"
                                                        onClick={() => handleSave(t)}
                                                        title="Saqlash"
                                                    >
                                                        <SaveIcon width="15" height="15" /> Saqlash
                                                    </button>
                                                    <button
                                                        className="tx-btn-cancel"
                                                        onClick={() => setEditingId(null)}
                                                        title="Bekor qilish"
                                                    >
                                                        <CloseIcon width="15" height="15" /> Bekor
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        className="tx-btn-edit"
                                                        onClick={() => handleEdit(t)}
                                                        title="Sana va izohni tahrirlash"
                                                    >
                                                        <EditIcon width="15" height="15" /> Tahrirlash
                                                    </button>
                                                    <button
                                                        className="tx-btn-pdf"
                                                        onClick={() => handleDownloadPdf(t.id)}
                                                        disabled={downloadingId === t.id}
                                                        title="Rasmiy kvitansiya (PDF) yuklab olish"
                                                    >
                                                        <DownloadIcon width="15" height="15" />
                                                        {downloadingId === t.id ? 'Yuklanmoqda...' : 'Kvitansiya'}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="tx-empty-state">
                        <div className="tx-empty-icon">🧾</div>
                        <h4>To'lovlar tarixi mavjud emas</h4>
                        <p>Ushbu shartnoma bo'yicha hali to'lovlar amalga oshirilmagan yoki qidiruv bo'yicha ma'lumot topilmadi.</p>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default GlobalTransactionModal;
