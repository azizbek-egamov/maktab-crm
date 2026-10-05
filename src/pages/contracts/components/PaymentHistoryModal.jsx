'use client';

import React, { useState } from 'react';
import { HistoryIcon, DownloadIcon, CalendarIcon } from '../ContractIcons';
import Modal from '../../../components/ui/Modal';
import { contractService } from '../../../services/contracts';
import { toast } from 'sonner';

const METHOD_CONFIG = {
    cash: { label: 'Naqd', badgeClass: 'method-cash', icon: '💵' },
    card: { label: 'Karta', badgeClass: 'method-card', icon: '💳' },
    click: { label: 'Click / Payme', badgeClass: 'method-click', icon: '📱' },
    transfer: { label: "O'tkazma", badgeClass: 'method-transfer', icon: '🏦' },
};

const PaymentHistoryModal = ({ isOpen, onClose, payment, contractId, formatPrice }) => {
    const [downloadingId, setDownloadingId] = useState(null);

    if (!isOpen || !payment) return null;

    const history = payment.history || [];
    const monthName = payment.month_number === 0
        ? "Boshlang'ich to'lov"
        : `${payment.month_name || `${payment.month_number}-oy`}`;

    const amount = parseFloat(payment.amount || 0);
    const amountPaid = parseFloat(payment.amount_paid || 0);
    const remaining = Math.max(0, amount - amountPaid);
    const percent = amount > 0 ? Math.min(100, Math.round((amountPaid / amount) * 100)) : (amountPaid > 0 ? 100 : 0);

    const handleDownloadPdf = async (transactionId) => {
        if (!contractId || !transactionId) return;
        setDownloadingId(transactionId);
        toast.loading("Kvitansiya tayyorlanmoqda...", { id: 'receipt-loading' });
        try {
            const response = await contractService.downloadTransactionPdf(contractId, transactionId);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
            toast.dismiss('receipt-loading');
            toast.success("Kvitansiya ochildi");
        } catch {
            toast.dismiss('receipt-loading');
            toast.error("PDF yaratishda xatolik yuz berdi");
        } finally {
            setDownloadingId(null);
        }
    };

    const formatUzbekDate = (dateStr) => {
        if (!dateStr) return '—';
        const date = new Date(dateStr);
        const months = [
            'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
            'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
        ];
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${monthName} to'lov tarixi`}
            icon={<HistoryIcon width="22" height="22" />}
            size="md"
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
            <div className="single-month-history-modal">
                {/* Status Summary Banner */}
                <div className="month-summary-box">
                    <div className="month-metrics-grid">
                        <div className="month-metric-item">
                            <span className="metric-label">Reja miqdori</span>
                            <span className="metric-val">{formatPrice(amount)}</span>
                        </div>
                        <div className="month-metric-item">
                            <span className="metric-label">To'langan</span>
                            <span className="metric-val text-success">+{formatPrice(amountPaid)}</span>
                        </div>
                        <div className="month-metric-item">
                            <span className="metric-label">Qoldiq qarz</span>
                            <span className={`metric-val ${remaining > 0 ? 'text-danger' : 'text-success'}`}>
                                {formatPrice(remaining)}
                            </span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="month-progress-container">
                        <div className="month-progress-bar">
                            <div
                                className="month-progress-fill"
                                style={{
                                    width: `${percent}%`,
                                    background: percent >= 100 ? '#10b981' : percent > 0 ? '#3b82f6' : '#94a3b8'
                                }}
                            />
                        </div>
                        <span className="month-progress-text">{percent}% to'langan</span>
                    </div>
                </div>

                {/* History Timeline */}
                <div className="history-timeline-section">
                    <h4 className="timeline-header">KIRITILGAN TO'LOVLAR</h4>

                    {history && history.length > 0 ? (
                        <div className="timeline-list">
                            {history.map((item, index) => {
                                const methodCfg = METHOD_CONFIG[item.payment_method] || { label: item.payment_method || 'Naqd', badgeClass: 'method-cash', icon: '💵' };
                                return (
                                    <div key={item.id || index} className="timeline-card">
                                        <div className="timeline-card-main">
                                            <div className="timeline-left">
                                                <div className="timeline-receipt-badge">
                                                    🧾 {item.receipt_number || `CHEK-${item.id || index + 1}`}
                                                </div>
                                                <div className="timeline-datetime">
                                                    <CalendarIcon width="13" height="13" />
                                                    <span>{formatUzbekDate(item.paid_date)}</span>
                                                    <span className="timeline-time-chip">{formatTime(item.paid_date)}</span>
                                                </div>
                                                <div className="timeline-method-badge">
                                                    <span className={`tx-method-badge ${methodCfg.badgeClass}`}>
                                                        {methodCfg.icon} {methodCfg.label}
                                                    </span>
                                                </div>
                                                {item.note && (
                                                    <div className="timeline-note">"{item.note}"</div>
                                                )}
                                            </div>

                                            <div className="timeline-right">
                                                <span className="timeline-amount text-success">
                                                    +{formatPrice(item.amount)}
                                                </span>

                                                {contractId && item.id && (
                                                    <button
                                                        className="timeline-pdf-btn"
                                                        onClick={() => handleDownloadPdf(item.id)}
                                                        disabled={downloadingId === item.id}
                                                        title="Kvitansiya (PDF)"
                                                    >
                                                        <DownloadIcon width="14" height="14" />
                                                        {downloadingId === item.id ? 'Yuklanmoqda...' : 'Chek'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="empty-timeline-alert">
                            <div className="empty-icon">⏳</div>
                            <p>Ushbu oy bo'yicha to'lovlar hali kiritilmagan</p>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default PaymentHistoryModal;
