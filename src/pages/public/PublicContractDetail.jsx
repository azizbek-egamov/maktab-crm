import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { contractService } from '../../services/contracts';
import { 
    Calendar, 
    User, 
    CheckCircle, 
    AlertCircle, 
    Clock, 
    FileText, 
    GraduationCap,
    Download,
    Sun,
    Moon
} from 'lucide-react';
import './PublicContractDetail.css';
import { useTheme } from '../../context/ThemeContext';

const PublicContractDetail = () => {
    const { token } = useParams();
    const { theme, toggleTheme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [contract, setContract] = useState(null);
    const [student, setStudent] = useState(null);
    const [payments, setPayments] = useState([]);
    const [downloadingId, setDownloadingId] = useState(null);

    useEffect(() => {
        if (token) {
            loadPublicData();
        }
    }, [token]);

    const loadPublicData = async () => {
        try {
            setLoading(true);
            const res = await contractService.getPublicDetail(token);
            setContract(res.data.contract);
            setStudent(res.data.student);
            setPayments(Array.isArray(res.data.payments) ? res.data.payments : []);
        } catch (err) {
            setError(err.response?.data?.error || "Shartnoma ma'lumotlarini yuklashda xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('uz-UZ').format(Math.round(price || 0)) + " so'm";
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '---';
        const date = new Date(dateStr);
        const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
            'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
        return `${date.getDate()}-${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    const handleDownloadGrafik = async () => {
        if (!contract) return;
        setDownloadingId('grafik');
        try {
            const res = await contractService.downloadGrafikPdf(contract.id);
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (err) {
            console.error("PDF yuklashda xatolik:", err);
        } finally {
            setDownloadingId(null);
        }
    };

    if (loading) {
        return (
            <div className="public-loading-wrap">
                <div className="spinner"></div>
                <p>Ma'lumotlar yuklanmoqda...</p>
            </div>
        );
    }

    if (error || !contract) {
        return (
            <div className="public-error-wrap">
                <AlertCircle size={48} color="#ef4444" />
                <h2>Xatolik</h2>
                <p>{error || "Shartnoma topilmadi"}</p>
            </div>
        );
    }

    const totalPrice = contract.total_price || contract.total_amount || 0;
    const remainingBalance = contract.remaining_balance ?? contract.remaining_debt ?? 0;
    const totalPaid = contract.paid_amount ?? (totalPrice - remainingBalance);
    const percentPaid = totalPrice > 0 ? Math.min(100, Math.round((totalPaid / totalPrice) * 100)) : 0;

    return (
        <div className="public-contract-container">
            {/* Top Navigation / Branding */}
            <header className="public-header">
                <div className="brand-box">
                    <div className="brand-logo">
                        <GraduationCap size={28} />
                    </div>
                    <div>
                        <h1>«EBRU SCHOOL»</h1>
                        <span>O'quvchi shartnomasi va to'lovlar portali</span>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="btn-theme-toggle" onClick={toggleTheme} title="Mavzuni almashtirish">
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    <button className="btn-pdf-download" onClick={handleDownloadGrafik} disabled={downloadingId === 'grafik'}>
                        <Download size={16} />
                        <span>{downloadingId === 'grafik' ? 'Yuklanmoqda...' : 'To\'lov grafigi PDF'}</span>
                    </button>
                </div>
            </header>

            {/* Student & Contract Card */}
            <div className="public-main-card">
                <div className="card-top-banner">
                    <div className="student-badge-wrap">
                        <div className="student-avatar">
                            {(student?.first_name?.[0] || 'O').toUpperCase()}
                        </div>
                        <div className="student-info">
                            <h2>{student?.full_name || contract.student_name || contract.client_name}</h2>
                            <p>Sinf: <strong>{student?.class_name || contract.class_name || 'Biriktirilmagan'}</strong> · ID: #{student?.student_number || student?.id}</p>
                        </div>
                    </div>
                    <div className="contract-badge">
                        <span className="contract-num">Shartnoma #{contract.contract_number}</span>
                        <span className={`status-pill ${contract.status}`}>
                            {contract.status === 'active' && 'Faol'}
                            {contract.status === 'paid' && 'To\'liq to\'langan'}
                            {contract.status === 'cancelled' && 'Bekor qilingan'}
                        </span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="payment-progress-section">
                    <div className="progress-labels">
                        <span>To'lov bajarilishi</span>
                        <span className="percent-text">{percentPaid}%</span>
                    </div>
                    <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${percentPaid}%` }}></div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="stats-row">
                    <div className="stat-box">
                        <span className="stat-lbl">Umumiy to'lov</span>
                        <span className="stat-val primary">{formatPrice(totalPrice)}</span>
                    </div>
                    <div className="stat-box">
                        <span className="stat-lbl">To'langan</span>
                        <span className="stat-val success">{formatPrice(totalPaid)}</span>
                    </div>
                    <div className="stat-box">
                        <span className="stat-lbl">Qolgan qarz</span>
                        <span className="stat-val danger">{formatPrice(remainingBalance)}</span>
                    </div>
                    <div className="stat-box">
                        <span className="stat-lbl">Har oy to'lov kuni</span>
                        <span className="stat-val warning">Oyning {contract.payment_day}-kuni</span>
                    </div>
                </div>
            </div>

            {/* Schedule Table */}
            <div className="public-table-card">
                <div className="table-card-header">
                    <h3><FileText size={20} /> Oylik to'lovlar jadvali</h3>
                    <span className="badge-count">{payments.length} ta oy</span>
                </div>

                <div className="table-responsive">
                    <table className="public-table">
                        <thead>
                            <tr>
                                <th>№</th>
                                <th>Oy</th>
                                <th>To'lov muddati</th>
                                <th>Belgilangan summa</th>
                                <th>To'langan</th>
                                <th>Qoldiq</th>
                                <th>Holat</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((p, idx) => {
                                const isPaid = p.amount_paid > 0 && p.remaining <= 0;
                                const isPartial = p.amount_paid > 0 && p.remaining > 0;
                                return (
                                    <tr key={p.id} className={isPaid ? 'row-paid' : ''}>
                                        <td>{idx + 1}</td>
                                        <td>
                                            <strong>{p.month_number === 0 ? "Boshlang'ich to'lov" : p.month_name || `${p.month_number}-oy`}</strong>
                                        </td>
                                        <td>
                                            <div className="date-cell">
                                                <Calendar size={14} />
                                                <span>{formatDate(p.due_date)}</span>
                                            </div>
                                        </td>
                                        <td className="amount-cell">{formatPrice(p.amount)}</td>
                                        <td className="amount-cell text-success">+{formatPrice(p.amount_paid)}</td>
                                        <td className={`amount-cell ${p.remaining > 0 ? 'text-danger' : 'text-success'}`}>
                                            {formatPrice(p.remaining)}
                                        </td>
                                        <td>
                                            {isPaid && (
                                                <span className="status-tag tag-success">
                                                    <CheckCircle size={12} /> To'langan
                                                </span>
                                            )}
                                            {isPartial && (
                                                <span className="status-tag tag-warning">
                                                    <Clock size={12} /> Qisman
                                                </span>
                                            )}
                                            {!isPaid && !isPartial && (
                                                <span className="status-tag tag-waiting">
                                                    <Clock size={12} /> Kutilmoqda
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer */}
            <footer className="public-footer">
                <p>© {new Date().getFullYear()} EBRU SCHOOL. Barcha huquqlar himoyalangan.</p>
                <p style={{ fontSize: 12, marginTop: 4, color: 'var(--text-secondary)' }}>To'lov bo'yicha savollar bo'lsa maktab ma'muriyatiga murojaat qiling.</p>
            </footer>
        </div>
    );
};

export default PublicContractDetail;
