import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    AlertCircle,
    Plus,
    Minus,
    FileSpreadsheet,
    Search,
    RefreshCw,
    Calendar,
    DollarSign,
    CreditCard,
    Building2,
    Tag,
    X,
    Trash2,
    ArrowUpRight,
    ArrowDownRight,
    Banknote
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import usePageTitle from '../../hooks/usePageTitle';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';
import financeService from '../../services/finance';
import excelService from '../../services/excel';
import ExcelModal from '../../components/ExcelModal';
import CustomChartTooltip from '../../components/ui/CustomChartTooltip';
import '../students/Students.css';

import '../Dashboard.css';
import './FinanceDashboard.css';

const FinanceDashboard = () => {
    usePageTitle('Moliya va Kassa');

    const [summary, setSummary] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('month'); // 'month' | 'year' | 'all'

    // Filtrlar
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterAccount, setFilterAccount] = useState('');
    const [filterCategory, setFilterCategory] = useState('');

    // Modallar
    const [isTxModalOpen, setIsTxModalOpen] = useState(false);
    const [txModalType, setTxModalType] = useState('expense'); // 'income' | 'expense'
    const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ open: false, tx: null });

    useBodyScrollLock(isTxModalOpen || deleteModal.open);

    // Form holati
    const [txForm, setTxForm] = useState({
        amount: '',
        title: '',
        category: '',
        account: '',
        payment_method: 'cash',
        date: new Date().toISOString().slice(0, 10),
        notes: '',
    });
    const [submitting, setSubmitting] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [sumRes, txRes, accRes, catRes] = await Promise.all([
                financeService.getSummary({ period }),
                financeService.getTransactions({
                    search,
                    type: filterType,
                    account: filterAccount,
                    category: filterCategory
                }),
                financeService.getAccounts(),
                financeService.getCategories(),
            ]);

            setSummary(sumRes.data);
            setTransactions(txRes.data.results || txRes.data || []);
            setAccounts(accRes.data.results || accRes.data || []);
            setCategories(catRes.data.results || catRes.data || []);
        } catch (err) {
            console.error("Moliya ma'lumotlarini yuklashda xatolik:", err);
            toast.error("Moliya ma'lumotlarini yuklab bo'lmadi");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [period, filterType, filterAccount, filterCategory]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const openTxModal = (type) => {
        setTxModalType(type);
        setTxForm({
            amount: '',
            title: '',
            category: categories[0]?.id || '',
            account: accounts[0]?.id || '',
            payment_method: 'cash',
            date: new Date().toISOString().slice(0, 10),
            notes: '',
        });
        setIsTxModalOpen(true);
    };

    const handleCreateTransaction = async (e) => {
        e.preventDefault();
        if (!txForm.amount || !txForm.title) {
            toast.warning("Summa va sarlavha maydonlarini to'ldiring");
            return;
        }

        setSubmitting(true);
        try {
            await financeService.createTransaction({
                ...txForm,
                transaction_type: txModalType,
                amount: Number(txForm.amount),
            });
            toast.success(`${txModalType === 'income' ? 'Kirdi' : 'Chiqim'} muvaffaqiyatli saqlandi!`);
            setIsTxModalOpen(false);
            fetchData();
        } catch (err) {
            console.error(err);
            toast.error("Tranzaksiyani saqlashda xatolik");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteTransaction = async (id) => {
        try {
            await financeService.deleteTransaction(id);
            toast.success("Tranzaksiya o'chirildi");
            setDeleteModal({ open: false, tx: null });
            fetchData();
        } catch {
            toast.error("O'chirishda xatolik yuz berdi");
        }
    };

    const formatMoney = (val) => {
        if (!val && val !== 0) return "0 so'm";
        return Number(val).toLocaleString('uz-UZ') + " so'm";
    };

    const formatShortMoney = (val) => {
        if (!val && val !== 0) return "0";
        return Number(val).toLocaleString('uz-UZ');
    };

    return (
        <div className="students-page finance-theme animate-fadeIn">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Moliya va Kassa</h1>
                    <p className="page-subtitle">Daromadlar, xarajatlar va kassa balansi boshqaruvi</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setIsExcelModalOpen(true)}
                    >
                        <FileSpreadsheet size={18} color="#10b981" />
                        Excel Boshqaruvi
                    </button>
                    <button
                        type="button"
                        className="btn-primary"
                        style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' }}
                        onClick={() => openTxModal('income')}
                    >
                        <Plus size={18} />
                        Kirdi (Daromad)
                    </button>
                    <button
                        type="button"
                        className="btn-primary"
                        style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)' }}
                        onClick={() => openTxModal('expense')}
                    >
                        <Minus size={18} />
                        Chiqim (Xarajat)
                    </button>
                </div>
            </div>

            {/* Period Selector Tabs */}
            <div className="period-tabs-wrapper">
                <button
                    className={`period-tab-btn ${period === 'month' ? 'active' : ''}`}
                    onClick={() => setPeriod('month')}
                >
                    Shu oy
                </button>
                <button
                    className={`period-tab-btn ${period === 'year' ? 'active' : ''}`}
                    onClick={() => setPeriod('year')}
                >
                    Shu yil
                </button>
                <button
                    className={`period-tab-btn ${period === 'all' ? 'active' : ''}`}
                    onClick={() => setPeriod('all')}
                >
                    Barcha davr
                </button>
            </div>

            {/* Top Stat Cards (Matching Dashboard stats-grid) */}
            <section className="stats-grid" style={{ marginBottom: '24px' }}>
                <div className="stat-card stat-success">
                    <div className="stat-icon">
                        <TrendingUp size={24} />
                    </div>
                    <div className="stat-info-box">
                        <span className="stat-value">{formatMoney(summary?.total_income)}</span>
                        <span className="stat-label">Jami Tushum (Kirdi)</span>
                    </div>
                </div>

                <div className="stat-card stat-warning">
                    <div className="stat-icon">
                        <TrendingDown size={24} />
                    </div>
                    <div className="stat-info-box">
                        <span className="stat-value">{formatMoney(summary?.total_expense)}</span>
                        <span className="stat-label">Jami Xarajat (Chiqim)</span>
                    </div>
                </div>

                <div className="stat-card stat-primary">
                    <div className="stat-icon">
                        <Wallet size={24} />
                    </div>
                    <div className="stat-info-box">
                        <span className="stat-value">{formatMoney(summary?.net_profit)}</span>
                        <span className="stat-label">Sof Foyda (Balans)</span>
                    </div>
                </div>

                <div className="stat-card stat-cyan">
                    <div className="stat-icon">
                        <AlertCircle size={24} />
                    </div>
                    <div className="stat-info-box">
                        <span className="stat-value">{formatMoney(summary?.students_summary?.total_debt_sum)}</span>
                        <span className="stat-label">O'quvchilar Qarzdorligi ({summary?.students_summary?.debtors_count || 0} ta)</span>
                    </div>
                </div>
            </section>

            {/* Kassalar / Hisob raqamlar qoldig'i */}
            <div className="cashboxes-container">
                <div className="cashboxes-header">
                    <h3 className="cashboxes-title">
                        <Banknote size={20} color="var(--accent-primary)" />
                        Kassalar va Hisob Raqamlar Balansi
                    </h3>
                </div>
                <div className="cashboxes-grid">
                    {summary?.accounts?.map((acc) => (
                        <div key={acc.id} className="cashbox-card">
                            <div className="cashbox-icon-wrap">
                                {acc.account_type === 'cash' ? <DollarSign size={20} /> : acc.account_type === 'bank' ? <Building2 size={20} /> : <CreditCard size={20} />}
                            </div>
                            <div className="cashbox-details">
                                <span className="cashbox-name">{acc.name}</span>
                                <strong className="cashbox-amount">{formatMoney(acc.balance)}</strong>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Charts Section */}
            <div className="charts-grid-layout" style={{ marginBottom: '24px' }}>
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>📊 Oylar Kesimida Kirdi-Chiqdi Tahlili</h3>
                    </div>
                    <div className="chart-container" style={{ minHeight: '300px' }}>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={summary?.monthly_trends || []} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="incomeBarGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" />
                                        <stop offset="100%" stopColor="#059669" />
                                    </linearGradient>
                                    <linearGradient id="expenseBarGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#ef4444" />
                                        <stop offset="100%" stopColor="#dc2626" />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
                                <XAxis dataKey="short_month" stroke="var(--text-secondary)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomChartTooltip formatter={(val) => formatMoney(val)} />} />
                                <Bar dataKey="income" name="Kirdi (Daromad)" fill="url(#incomeBarGrad)" radius={[8, 8, 0, 0]} barSize={22} />
                                <Bar dataKey="expense" name="Chiqim (Xarajat)" fill="url(#expenseBarGrad)" radius={[8, 8, 0, 0]} barSize={22} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-header">
                        <h3>🎯 Chiqimlar Kategoriyalar Bo'yicha</h3>
                    </div>
                    <div className="chart-container" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        {summary?.expense_by_category?.length > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height={210}>
                                    <PieChart>
                                        <Pie
                                            data={summary.expense_by_category}
                                            dataKey="total"
                                            nameKey="category__name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={85}
                                            innerRadius={55}
                                            paddingAngle={4}
                                            cornerRadius={5}
                                            stroke="none"
                                        >
                                            {summary.expense_by_category.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.category__color || '#6366f1'} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomChartTooltip formatter={(val) => formatMoney(val)} />} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="custom-pie-legend" style={{ marginTop: '10px' }}>
                                    {summary.expense_by_category.slice(0, 5).map((item, index) => (
                                        <div key={index} className="legend-item">
                                            <span
                                                className="legend-dot"
                                                style={{
                                                    background: item.category__color || '#6366f1',
                                                    boxShadow: `0 0 6px ${item.category__color || '#6366f1'}80`
                                                }}
                                            ></span>
                                            <span className="legend-text">
                                                {item.category__name} ({formatMoney(item.total)})
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="chart-no-data">Chiqimlar hali kiritilmagan</div>
                        )}
                    </div>
                </div>
            </div>


            {/* Tranzaksiyalar Jadvali (Matching Content Card & Data Table) */}
            <div className="content-card">
                <div className="filters-row">
                    <div className="search-box">
                        <Search size={18} color="var(--text-secondary)" />
                        <input
                            placeholder="Sarlavha, izoh, o'quvchi..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <select className="filter-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                        <option value="">Barcha turlar</option>
                        <option value="income">Kirdi (Daromad)</option>
                        <option value="expense">Chiqim (Xarajat)</option>
                    </select>

                    <select className="filter-select" value={filterAccount} onChange={(e) => setFilterAccount(e.target.value)}>
                        <option value="">Barcha kassalar</option>
                        {accounts.map((a) => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                    </select>

                    <select className="filter-select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                        <option value="">Barcha kategoriyalar</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>

                    <button
                        type="button"
                        className="btn-secondary"
                        style={{ marginLeft: 'auto', padding: '8px 14px' }}
                        onClick={() => excelService.downloadExport('finance')}
                    >
                        <FileSpreadsheet size={16} />
                        Excelga olish
                    </button>
                </div>

                {loading ? (
                    <div className="loading-state">
                        <div className="loading-spinner" />
                        <span className="loading-text">Tranzaksiyalar yuklanmoqda...</span>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="empty-state">
                        <Wallet size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                        <p>Tranzaksiyalar topilmadi</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Sana</th>
                                <th>Turi</th>
                                <th>Sarlavha</th>
                                <th>Kategoriya / O'quvchi</th>
                                <th>Kassa</th>
                                <th>To'lov Usuli</th>
                                <th style={{ textAlign: 'right' }}>Summa</th>
                                <th style={{ textAlign: 'right' }}>Amallar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((tx) => (
                                <tr key={tx.id}>
                                    <td>{tx.date}</td>
                                    <td>
                                        <span className={`finance-badge-type ${tx.transaction_type}`}>
                                            {tx.transaction_type === 'income' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                                            {tx.transaction_type === 'income' ? 'Kirdi' : 'Chiqim'}
                                        </span>
                                    </td>
                                    <td>
                                        <strong>{tx.title}</strong>
                                        {tx.notes && <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{tx.notes}</div>}
                                    </td>
                                    <td>
                                        {tx.category_name ? (
                                            <span className="category-pill" style={{ borderColor: tx.category_color, color: tx.category_color }}>
                                                {tx.category_name}
                                            </span>
                                        ) : tx.student_name ? (
                                            <span>O'quvchi: <strong>{tx.student_name}</strong></span>
                                        ) : '—'}
                                    </td>
                                    <td>{tx.account_name || 'Asosiy'}</td>
                                    <td>
                                        <span className="method-tag">{tx.payment_method_display || tx.payment_method}</span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <span className={`amount-cell ${tx.transaction_type === 'income' ? 'amount-income' : 'amount-expense'}`}>
                                            {tx.transaction_type === 'income' ? '+' : '-'}{formatShortMoney(tx.amount)} so'm
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        {!tx.contract_payment && (
                                            <button
                                                className="btn-icon btn-delete"
                                                onClick={() => setDeleteModal({ open: true, tx })}
                                                title="O'chirish"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Tranzaksiya Qo'shish Modali (Matching System Modal Pattern) */}
            {isTxModalOpen && createPortal(
                <div className="modal-overlay" onClick={() => setIsTxModalOpen(false)}>
                    <div className="modal-content modal-form animate-scaleUp" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {txModalType === 'income' ? "➕ Yangi Kirdi (Daromad)" : "➖ Yangi Chiqim (Xarajat)"}
                            </h3>
                            <button className="modal-close-btn" onClick={() => setIsTxModalOpen(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateTransaction}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Summa (so'm)*</label>
                                        <input
                                            type="number"
                                            required
                                            placeholder="Masalan: 500000"
                                            value={txForm.amount}
                                            onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Sarlavha / Maqsad*</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder={txModalType === 'income' ? "Masalan: Kurs uchun to'lov" : "Masalan: O'qituvchi oyligi, Ijara"}
                                            value={txForm.title}
                                            onChange={(e) => setTxForm({ ...txForm, title: e.target.value })}
                                        />
                                    </div>

                                    {txModalType === 'expense' && (
                                        <div className="form-group">
                                            <label>Xarajat Kategoriyasi</label>
                                            <select
                                                value={txForm.category}
                                                onChange={(e) => setTxForm({ ...txForm, category: e.target.value })}
                                            >
                                                <option value="">Tanlang...</option>
                                                {categories.map((c) => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <div className="form-group">
                                        <label>Kassa / Hisob</label>
                                        <select
                                            value={txForm.account}
                                            onChange={(e) => setTxForm({ ...txForm, account: e.target.value })}
                                        >
                                            {accounts.map((a) => (
                                                <option key={a.id} value={a.id}>{a.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>To'lov Usuli</label>
                                        <select
                                            value={txForm.payment_method}
                                            onChange={(e) => setTxForm({ ...txForm, payment_method: e.target.value })}
                                        >
                                            <option value="cash">Naqd</option>
                                            <option value="card">Karta</option>
                                            <option value="transfer">O'tkazma</option>
                                            <option value="click">Click / Payme</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Sana</label>
                                        <input
                                            type="date"
                                            value={txForm.date}
                                            onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label>Izoh</label>
                                        <textarea
                                            rows="2"
                                            placeholder="Qo'shimcha ma'lumot..."
                                            value={txForm.notes}
                                            onChange={(e) => setTxForm({ ...txForm, notes: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setIsTxModalOpen(false)}
                                >
                                    Bekor qilish
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    style={{
                                        background: txModalType === 'income' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                                    }}
                                    disabled={submitting}
                                >
                                    {submitting ? "Saqlanmoqda..." : "Saqlash"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* O'chirish Tasdiqlash Modali */}
            {deleteModal.open && createPortal(
                <div className="modal-overlay" onClick={() => setDeleteModal({ open: false, tx: null })}>
                    <div className="modal-content animate-scaleUp" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Tranzaksiyani o'chirish</h3>
                        </div>
                        <div className="modal-body" style={{ textAlign: 'center', padding: '32px 24px' }}>
                            <div className="modal-icon danger" style={{ margin: '0 auto 20px', width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent-danger-light)', color: 'var(--accent-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Trash2 size={24} />
                            </div>
                            <p style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '8px' }}>
                                <strong>{deleteModal.tx?.title}</strong> tranzaksiyasini o'chirishni xohlaysizmi?
                            </p>
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                Summasi: {formatMoney(deleteModal.tx?.amount)}
                            </p>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setDeleteModal({ open: false, tx: null })}>
                                Bekor qilish
                            </button>
                            <button
                                className="btn-primary"
                                style={{ background: 'var(--accent-danger)', borderColor: 'var(--accent-danger)' }}
                                onClick={() => handleDeleteTransaction(deleteModal.tx.id)}
                            >
                                O'chirish
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
                type="finance"
                title="Moliya Excel Boshqaruvi"
                onImportSuccess={fetchData}
            />
        </div>
    );
};

export default FinanceDashboard;
