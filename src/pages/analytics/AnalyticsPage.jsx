import React, { useState, useEffect } from 'react';
import {
    GraduationCap,
    DollarSign,
    Users,
    TrendingUp,
    AlertCircle,
    Calendar,
    Filter,
    Download,
    RefreshCw,
    Building2,
    PieChart as PieIcon,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    Sparkles,
    Layers,
    Award,
    CheckCircle2,
    Clock,
    Target,
    PhoneCall,
    Megaphone,
    Share2,
    CreditCard,
    Wallet,
    Percent,
    UserCheck,
    UserX,
    Briefcase,
    Inbox,
    Info
} from 'lucide-react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ComposedChart
} from 'recharts';
import { toast } from 'sonner';
import usePageTitle from '../../hooks/usePageTitle';
import analyticsService from '../../services/analytics';
import api from '../../services/api';
import AnalyticsFilterDrawer from './components/AnalyticsFilterDrawer';
import CustomChartTooltip from '../../components/ui/CustomChartTooltip';
import { UITooltip, InfoTooltip } from '../../components/ui/UITooltip';
import { formatApiDateToUI, parseUIDateToApi, isValidDateStr } from '../../utils/dateFormatter';
import './Analytics.css';

const TABS = [
    { id: 'students', label: "O'quvchilar Analitikasi", icon: GraduationCap },
    { id: 'sales', label: "Sotuv va Moliya", icon: DollarSign },
    { id: 'leads', label: "Leadlar va Voronka", icon: Target },
    { id: 'marketing', label: "Marketing va Manbalar", icon: Megaphone }
];

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6', '#14b8a6', '#f43f5e'];

const formatMoney = (amount) => {
    if (!amount && amount !== 0) return "0 so'm";
    return Number(amount).toLocaleString('uz-UZ') + " so'm";
};

const AnalyticsPage = () => {
    usePageTitle('Analitika va BI');

    const [activeTab, setActiveTab] = useState('students');
    const [loading, setLoading] = useState(true);
    const [filterOpen, setFilterOpen] = useState(false);

    // Data states
    const [studentsData, setStudentsData] = useState(null);
    const [salesData, setSalesData] = useState(null);
    const [leadsData, setLeadsData] = useState(null);
    const [marketingData, setMarketingData] = useState(null);

    // Filter reference data
    const [classes, setClasses] = useState([]);
    const [buildings, setBuildings] = useState([]);
    const [operators, setOperators] = useState([]);
    const [stages, setStages] = useState([]);

    // Global Filter state
    const [filters, setFilters] = useState({
        start_date: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        school_class: '',
        building: '',
        gender: '',
        status: '',
        operator: '',
        stage: '',
        call_status: ''
    });

    useEffect(() => {
        loadReferenceData();
    }, []);

    useEffect(() => {
        fetchTabData(activeTab, filters);
    }, [activeTab, filters]);

    const loadReferenceData = async () => {
        try {
            const [classesRes, usersRes, stagesRes] = await Promise.all([
                api.get('/school-classes/').catch(() => api.get('/classes/').catch(() => ({ data: [] }))),
                api.get('/users/').catch(() => ({ data: [] })),
                api.get('/lead-stages/').catch(() => ({ data: [] }))
            ]);
            setClasses(Array.isArray(classesRes.data) ? classesRes.data : classesRes.data.results || []);
            setOperators(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.results || []);
            setStages(Array.isArray(stagesRes.data) ? stagesRes.data : stagesRes.data.results || []);
        } catch (e) {
            console.error("Reference data load error:", e);
        }
    };

    const fetchTabData = async (tab, appliedFilters) => {
        setLoading(true);
        const params = {
            start_date: appliedFilters.start_date || undefined,
            end_date: appliedFilters.end_date || undefined,
            school_class: appliedFilters.school_class || undefined,
            building: appliedFilters.building || undefined,
            gender: appliedFilters.gender || undefined,
            status: appliedFilters.status || undefined,
            operator: appliedFilters.operator || undefined,
            stage: appliedFilters.stage || undefined,
            call_status: appliedFilters.call_status || undefined
        };

        try {
            if (tab === 'students') {
                const res = await analyticsService.getStudentsStats(params);
                setStudentsData(res.data);
            } else if (tab === 'sales') {
                const res = await analyticsService.getSalesStats(params);
                setSalesData(res.data);
            } else if (tab === 'leads') {
                const res = await analyticsService.getStats(params);
                setLeadsData(res.data);
            } else if (tab === 'marketing') {
                const res = await analyticsService.getMarketingStats(params);
                setMarketingData(res.data);
            }
        } catch (error) {
            console.error(`Analytics error for ${tab}:`, error);
            toast.error("Statistika ma'lumotlarini yuklashda xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = () => {
        try {
            let csvContent = "data:text/csv;charset=utf-8,";
            let filename = `analitika_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`;

            if (activeTab === 'students' && studentsData?.classes_breakdown) {
                csvContent += "Sinf,O'quvchilar Soni,Sig'im,Bo'sh O'rinlar,To'lganlik Foizi\n";
                studentsData.classes_breakdown.forEach(c => {
                    csvContent += `"${c.name}",${c.student_count},${c.capacity},${c.available_seats},${c.fill_rate}%\n`;
                });
            } else if (activeTab === 'sales' && salesData?.sales_trend) {
                csvContent += "Oy,Yig'ilgan Summa,Shartnomalar Soni\n";
                salesData.sales_trend.forEach(s => {
                    csvContent += `"${s.label}",${s.collected},${s.contracts_count}\n`;
                });
            } else if (activeTab === 'leads' && leadsData?.leads_by_operator) {
                csvContent += "Operator,Jami Leadlar,Konvertatsiya Qilingan,Konversiya %\n";
                leadsData.leads_by_operator.forEach(op => {
                    csvContent += `"${op.operator_name}",${op.count},${op.converted},${op.conversion_rate}%\n`;
                });
            } else if (activeTab === 'marketing' && marketingData?.channel_roi) {
                csvContent += "Kanal,Mijozlar Soni,O'quvchilar Soni,Tushum\n";
                marketingData.channel_roi.forEach(c => {
                    csvContent += `"${c.name}",${c.clients_count},${c.students_count},${c.revenue}\n`;
                });
            } else {
                toast.info("Eksport qilish uchun ma'lumotlar mavjud emas");
                return;
            }

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("Hisobot CSV formatida yuklab olindi");
        } catch (e) {
            console.error("Export error:", e);
            toast.error("Eksportda xatolik yuz berdi");
        }
    };

    return (
        <div className="analytics-page animate-fadeIn">
            {/* Top Navigation & Header */}
            <div className="analytics-header">
                <div className="header-left">
                    <UITooltip text="BI (Business Intelligence) tahlil va boshqaruv tizimi" position="bottom">
                        <div className="analytics-badge">
                            <Sparkles size={14} />
                            <span>BI & Chuqur Tahlillar</span>
                        </div>
                    </UITooltip>
                    <h1>Analitika va Hisobotlar</h1>
                    <p>O'quvchilar kontingenti, sotuv, leadlar voronkasi va marketing natijadorligi</p>
                </div>

                <div className="header-actions">
                    <UITooltip text="Ma'lumotlarni qayta yuklash" position="bottom">
                        <button className="btn-v2 btn-v2-dark" onClick={() => fetchTabData(activeTab, filters)}>
                            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                            <span>Yangilash</span>
                        </button>
                    </UITooltip>

                    <UITooltip text="Filtrlash parametrlarini ochish" position="bottom">
                        <button className="btn-v2 btn-v2-dark" onClick={() => setFilterOpen(true)}>
                            <Filter size={16} />
                            <span>Filtrlar</span>
                            {(filters.school_class || filters.gender || filters.operator || filters.stage) && (
                                <span className="active-filter-indicator"></span>
                            )}
                        </button>
                    </UITooltip>

                    <UITooltip text="Jadval ma'lumotlarini CSV faylida yuklab olish" position="bottom">
                        <button className="btn-v2 btn-v2-primary" onClick={handleExportCSV}>
                            <Download size={16} />
                            <span>Eksport CSV</span>
                        </button>
                    </UITooltip>
                </div>
            </div>

            {/* Modern Tab Selector */}
            <div className="analytics-tabs-container">
                <div className="analytics-tabs">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                className={`analytics-tab-btn ${isActive ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <Icon size={18} />
                                <span>{tab.label}</span>
                                {isActive && <div className="tab-indicator" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Contents */}
            {loading ? (
                <div className="analytics-loading-state">
                    <div className="loading-spinner"></div>
                    <p>Ma'lumotlar tahlil qilinmoqda...</p>
                </div>
            ) : (
                <div className="analytics-content-body">
                    {/* 1. STUDENTS TAB */}
                    {activeTab === 'students' && (
                        studentsData ? (
                            <div className="tab-view-container animate-slideUp">
                                {/* KPI Cards Grid */}
                                <div className="kpi-grid">
                                    <UITooltip text="Maktabda ro'yxatdan o'tgan faol o'quvchilar soni" position="top" className="w-full">
                                        <div className="kpi-card glass-card" style={{ width: '100%' }}>
                                            <div className="kpi-icon-wrapper primary">
                                                <GraduationCap size={22} />
                                            </div>
                                            <div className="kpi-info">
                                                <span className="kpi-label">Faol O'quvchilar</span>
                                                <h3 className="kpi-value">{studentsData.kpi.active_students} <small>/ {studentsData.kpi.total_students}</small></h3>
                                                <span className="kpi-trend positive">
                                                    <ArrowUpRight size={14} /> Jami kontingent
                                                </span>
                                            </div>
                                        </div>
                                    </UITooltip>

                                    <UITooltip text="Tanlangan sana oralig'ida qabul qilingan o'quvchilar" position="top" className="w-full">
                                        <div className="kpi-card glass-card" style={{ width: '100%' }}>
                                            <div className="kpi-icon-wrapper success">
                                                <TrendingUp size={22} />
                                            </div>
                                            <div className="kpi-info">
                                                <span className="kpi-label">Yangi Qabul Qilinganlar</span>
                                                <h3 className="kpi-value">{studentsData.kpi.new_students_period}</h3>
                                                <span className="kpi-trend neutral">Tanlangan davrda</span>
                                            </div>
                                        </div>
                                    </UITooltip>

                                    <UITooltip text="Mavjud sinflar sig'imining to'lganlik darajasi" position="top" className="w-full">
                                        <div className="kpi-card glass-card" style={{ width: '100%' }}>
                                            <div className="kpi-icon-wrapper info">
                                                <Building2 size={22} />
                                            </div>
                                            <div className="kpi-info">
                                                <span className="kpi-label">Sinflar Sig'imi (To'lganlik)</span>
                                                <h3 className="kpi-value">{studentsData.kpi.capacity_utilization}%</h3>
                                                <span className="kpi-trend info">
                                                    Jami {studentsData.kpi.total_capacity} o'rin
                                                </span>
                                            </div>
                                        </div>
                                    </UITooltip>

                                    <UITooltip text="Shartnoma to'lovi to'liq to'lanmagan o'quvchilar" position="top" className="w-full">
                                        <div className="kpi-card glass-card" style={{ width: '100%' }}>
                                            <div className="kpi-icon-wrapper warning">
                                                <AlertCircle size={22} />
                                            </div>
                                            <div className="kpi-info">
                                                <span className="kpi-label">Qarzdor O'quvchilar</span>
                                                <h3 className="kpi-value">{studentsData.kpi.debtor_count}</h3>
                                                <span className="kpi-trend negative">Faol shartnomalarda</span>
                                            </div>
                                        </div>
                                    </UITooltip>

                                    <UITooltip text="O'qishni to'xtatgan yoki chetlatilgan o'quvchilar" position="top" className="w-full">
                                        <div className="kpi-card glass-card" style={{ width: '100%' }}>
                                            <div className="kpi-icon-wrapper danger">
                                                <UserX size={22} />
                                            </div>
                                            <div className="kpi-info">
                                                <span className="kpi-label">Chiqib Ketgan / Nofaol</span>
                                                <h3 className="kpi-value">{studentsData.kpi.left_students}</h3>
                                                <span className="kpi-trend neutral">Bitirganlar: {studentsData.kpi.graduated_students}</span>
                                            </div>
                                        </div>
                                    </UITooltip>
                                </div>

                                {/* Charts Row 1: Growth & Class Capacity */}
                                <div className="charts-grid-2col">
                                    <div className="chart-card glass-card">
                                        <div className="chart-header">
                                            <div>
                                                <h3 className="chart-title">O'quvchilar O'sish Dinamikasi</h3>
                                                <p className="chart-subtitle">Oylar kesimida yangi qo'shilgan o'quvchilar</p>
                                            </div>
                                            <InfoTooltip text="Oylar bo'yicha qabul qilingan yangi o'quvchilar sonining o'sish tendentsiyasi" />
                                        </div>
                                        <div className="chart-body" style={{ height: '320px' }}>
                                            {studentsData.growth_trend?.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={studentsData.growth_trend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                                        <defs>
                                                            <linearGradient id="studentGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} opacity={0.5} />
                                                        <XAxis dataKey="month_name" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} />
                                                        <YAxis stroke="var(--text-tertiary)" fontSize={12} tickLine={false} axisLine={false} />
                                                        <Tooltip content={<CustomChartTooltip valueSuffix=" nafar" />} />
                                                        <Area type="monotone" dataKey="enrolled" name="Yangi o'quvchilar" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#studentGrowthGrad)" />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="chart-empty-state">
                                                    <Inbox size={30} />
                                                    <span>Ma'lumot topilmadi</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="chart-card glass-card">
                                        <div className="chart-header">
                                            <div>
                                                <h3 className="chart-title">Sinflar To'lganlik Darajasi</h3>
                                                <p className="chart-subtitle">Faol o'quvchilar soni va sinf sig'imi (Top sinflar)</p>
                                            </div>
                                            <InfoTooltip text="Sinflardagi mavjud o'quvchilar soni va umumiy xona sig'imi taqqosi" />
                                        </div>
                                        <div className="chart-body" style={{ height: '320px' }}>
                                            {studentsData.classes_breakdown?.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={studentsData.classes_breakdown.slice(0, 8)} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} opacity={0.5} />
                                                        <XAxis dataKey="name" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} />
                                                        <YAxis stroke="var(--text-tertiary)" fontSize={12} tickLine={false} axisLine={false} />
                                                        <Tooltip content={<CustomChartTooltip valueSuffix=" o'quvchi" />} />
                                                        <Legend />
                                                        <Bar dataKey="student_count" name="Mavjud o'quvchi" fill="#10b981" radius={[6, 6, 0, 0]} />
                                                        <Bar dataKey="capacity" name="Sig'im" fill="rgba(99, 102, 241, 0.3)" radius={[6, 6, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="chart-empty-state">
                                                    <Inbox size={30} />
                                                    <span>Sinflar ma'lumoti topilmadi</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Charts Row 2: Gender, Age & Status */}
                                <div className="charts-grid-3col">
                                    <div className="chart-card glass-card">
                                        <div className="chart-header">
                                            <h3 className="chart-title">Gender Taqsimoti</h3>
                                            <InfoTooltip text="O'g'il va qiz bolalar soni hamda ulushi nisbati" />
                                        </div>
                                        <div className="chart-body" style={{ height: '240px' }}>
                                            {studentsData.gender_breakdown?.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={studentsData.gender_breakdown}
                                                            dataKey="value"
                                                            nameKey="name"
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={55}
                                                            outerRadius={80}
                                                            paddingAngle={5}
                                                        >
                                                            {studentsData.gender_breakdown.map((entry, index) => (
                                                                <Cell key={`gender-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip content={<CustomChartTooltip valueSuffix=" nafar" />} />
                                                        <Legend />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="chart-empty-state">
                                                    <Inbox size={26} />
                                                    <span>Ma'lumot topilmadi</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="chart-card glass-card">
                                        <div className="chart-header">
                                            <h3 className="chart-title">Yosh Guruhlari</h3>
                                            <InfoTooltip text="O'quvchilarning yosh toifalari (7-18+ yosh) bo'yicha taqsimoti" />
                                        </div>
                                        <div className="chart-body" style={{ height: '240px' }}>
                                            {studentsData.age_breakdown?.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={studentsData.age_breakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} opacity={0.5} />
                                                        <XAxis dataKey="name" stroke="var(--text-tertiary)" fontSize={10} tickLine={false} />
                                                        <YAxis stroke="var(--text-tertiary)" fontSize={10} tickLine={false} axisLine={false} />
                                                        <Tooltip content={<CustomChartTooltip valueSuffix=" nafar" />} />
                                                        <Bar dataKey="value" name="O'quvchilar" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="chart-empty-state">
                                                    <Inbox size={26} />
                                                    <span>Ma'lumot topilmadi</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="chart-card glass-card">
                                        <div className="chart-header">
                                            <h3 className="chart-title">Holatlar Taqsimoti</h3>
                                            <InfoTooltip text="O'quvchilarning joriy holati (faol, bitirgan, nofaol)" />
                                        </div>
                                        <div className="chart-body" style={{ height: '240px' }}>
                                            {studentsData.status_breakdown?.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={studentsData.status_breakdown}
                                                            dataKey="value"
                                                            nameKey="name"
                                                            cx="50%"
                                                            cy="50%"
                                                            outerRadius={80}
                                                        >
                                                            {studentsData.status_breakdown.map((entry, index) => (
                                                                <Cell key={`status-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip content={<CustomChartTooltip valueSuffix=" nafar" />} />
                                                        <Legend />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="chart-empty-state">
                                                    <Inbox size={26} />
                                                    <span>Ma'lumot topilmadi</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Classes Breakdown Table */}
                                <div className="analytics-table-card glass-card">
                                    <div className="table-card-header">
                                        <h3>Sinflar Kesimida Batafsil Hisobot</h3>
                                        <span className="badge-count">Jami: {studentsData.classes_breakdown?.length || 0} sinf</span>
                                    </div>
                                    <div className="table-responsive">
                                        <table className="analytics-table">
                                            <thead>
                                                <tr>
                                                    <th>Sinf nomi</th>
                                                    <th>Faol O'quvchilar</th>
                                                    <th>Sinf Sig'imi</th>
                                                    <th>Bo'sh O'rinlar</th>
                                                    <th>To'lganlik Foizi</th>
                                                    <th>Holati</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {studentsData.classes_breakdown?.length > 0 ? (
                                                    studentsData.classes_breakdown.map(c => (
                                                        <tr key={c.id}>
                                                            <td><strong>{c.name}</strong></td>
                                                            <td>{c.student_count} nafar</td>
                                                            <td>{c.capacity || '-'}</td>
                                                            <td><span className="seat-badge">{c.available_seats} ta</span></td>
                                                            <td>
                                                                <UITooltip text={`To'lganlik darajasi: ${c.fill_rate}%`} position="top">
                                                                    <div className="progress-cell">
                                                                        <div className="progress-bar-bg">
                                                                            <div
                                                                                className="progress-bar-fill"
                                                                                style={{
                                                                                    width: `${Math.min(c.fill_rate, 100)}%`,
                                                                                    backgroundColor: c.fill_rate > 90 ? '#10b981' : c.fill_rate > 50 ? '#6366f1' : '#f59e0b'
                                                                                }}
                                                                            />
                                                                        </div>
                                                                        <span className="progress-text">{c.fill_rate}%</span>
                                                                    </div>
                                                                </UITooltip>
                                                            </td>
                                                            <td>
                                                                {c.available_seats === 0 ? (
                                                                    <UITooltip text="Barcha o'rinlar band qilingan" position="top">
                                                                        <span className="status-pill danger">To'lgan</span>
                                                                    </UITooltip>
                                                                ) : c.available_seats <= 3 ? (
                                                                    <UITooltip text="3 tadan kam bo'sh o'rin qolgan" position="top">
                                                                        <span className="status-pill warning">Kam joy</span>
                                                                    </UITooltip>
                                                                ) : (
                                                                    <UITooltip text="Yangi qabul uchun joylar yetarli" position="top">
                                                                        <span className="status-pill success">Joy bor</span>
                                                                    </UITooltip>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={6} className="table-empty-row">
                                                            <div className="table-empty-inner">
                                                                <Inbox size={26} />
                                                                <span>Ma'lumot topilmadi</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="chart-empty-state" style={{ minHeight: '300px' }}>
                                <Inbox size={36} />
                                <span>O'quvchilar bo'yicha ma'lumot topilmadi</span>
                            </div>
                        )
                    )}

                    {/* 2. SALES & FINANCE TAB */}
                    {activeTab === 'sales' && (
                        salesData ? (
                            <div className="tab-view-container animate-slideUp">
                                {/* KPI Cards Grid */}
                                <div className="kpi-grid">
                                    <UITooltip text="Mavjud barcha faol va rasmiylashtirilgan shartnomalarning umumiy summasi" position="top" className="w-full">
                                        <div className="kpi-card glass-card" style={{ width: '100%' }}>
                                            <div className="kpi-icon-wrapper primary">
                                                <DollarSign size={22} />
                                            </div>
                                            <div className="kpi-info">
                                                <span className="kpi-label">Shartnomalar Hajmi</span>
                                                <h3 className="kpi-value">{formatMoney(salesData.kpi.total_contracts_amount)}</h3>
                                                <span className="kpi-trend positive">
                                                    {salesData.kpi.active_contracts_count} ta faol shartnoma
                                                </span>
                                            </div>
                                        </div>
                                    </UITooltip>

                                    <UITooltip text="Haqiqatda qabul qilingan va kassaga kirim qilingan to'lovlar" position="top" className="w-full">
                                        <div className="kpi-card glass-card" style={{ width: '100%' }}>
                                            <div className="kpi-icon-wrapper success">
                                                <Wallet size={22} />
                                            </div>
                                            <div className="kpi-info">
                                                <span className="kpi-label">Yig'ilgan Tushum</span>
                                                <h3 className="kpi-value">{formatMoney(salesData.kpi.total_collected_amount)}</h3>
                                                <span className="kpi-trend success">
                                                    {salesData.kpi.collection_rate}% to'lov intizomi
                                                </span>
                                            </div>
                                        </div>
                                    </UITooltip>

                                    <UITooltip text="Shartnomalar bo'yicha o'quvchilarning qoldiq qarzdorlik summasi" position="top" className="w-full">
                                        <div className="kpi-card glass-card" style={{ width: '100%' }}>
                                            <div className="kpi-icon-wrapper danger">
                                                <AlertCircle size={22} />
                                            </div>
                                            <div className="kpi-info">
                                                <span className="kpi-label">Qoldiq Qarzdorlik</span>
                                                <h3 className="kpi-value">{formatMoney(salesData.kpi.total_debt_amount)}</h3>
                                                <span className="kpi-trend negative">
                                                    {salesData.kpi.debtor_contracts_count} ta qarzdor shartnoma
                                                </span>
                                            </div>
                                        </div>
                                    </UITooltip>

                                    <UITooltip text="Bitta shartnomaga to'g'ri keluvchi o'rtacha to'lov qiymati" position="top" className="w-full">
                                        <div className="kpi-card glass-card" style={{ width: '100%' }}>
                                            <div className="kpi-icon-wrapper info">
                                                <CreditCard size={22} />
                                            </div>
                                            <div className="kpi-info">
                                                <span className="kpi-label">O'rtacha Chek (Deal Size)</span>
                                                <h3 className="kpi-value">{formatMoney(salesData.kpi.avg_contract_value)}</h3>
                                                <span className="kpi-trend info">1 ta shartnomaga</span>
                                            </div>
                                        </div>
                                    </UITooltip>
                                </div>

                                {/* Sales Dynamic & Payment Methods */}
                                <div className="charts-grid-2col">
                                    <div className="chart-card glass-card">
                                        <div className="chart-header">
                                            <div>
                                                <h3 className="chart-title">Oylik Tushum va Shartnomalar Dinamikasi</h3>
                                                <p className="chart-subtitle">Haqiqiy to'lovlar tushumi (so'm) va yangi shartnomalar soni</p>
                                            </div>
                                            <InfoTooltip text="Oylar kesimida yig'ilgan tushum (so'm) va tuzilgan yangi shartnomalar soni dinamikasi" />
                                        </div>
                                        <div className="chart-body" style={{ height: '320px' }}>
                                            {salesData.sales_trend?.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <ComposedChart data={salesData.sales_trend} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} opacity={0.5} />
                                                        <XAxis dataKey="label" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} />
                                                        <YAxis yAxisId="left" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} axisLine={false} />
                                                        <YAxis yAxisId="right" orientation="right" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} axisLine={false} />
                                                        <Tooltip content={<CustomChartTooltip />} />
                                                        <Legend />
                                                        <Bar yAxisId="left" dataKey="collected" name="Yig'ilgan tushum (so'm)" fill="#10b981" radius={[6, 6, 0, 0]} />
                                                        <Line yAxisId="right" type="monotone" dataKey="contracts_count" name="Shartnomalar soni" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} />
                                                    </ComposedChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="chart-empty-state">
                                                    <Inbox size={30} />
                                                    <span>Moliyaviy ma'lumotlar mavjud emas</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="chart-card glass-card">
                                        <div className="chart-header">
                                            <div>
                                                <h3 className="chart-title">To'lov Turlari Balansi</h3>
                                                <p className="chart-subtitle">Naqd, Plastik karta, Click/Payme va Bank o'tkazmalari</p>
                                            </div>
                                            <InfoTooltip text="Qaysi to'lov usuli (Naqd, Karta, Payme/Click, Bank) orqali ko'proq pul tushganligi ulushi" />
                                        </div>
                                        <div className="chart-body" style={{ height: '320px' }}>
                                            {salesData.payment_methods?.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={salesData.payment_methods}
                                                            dataKey="total"
                                                            nameKey="name"
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={65}
                                                            outerRadius={95}
                                                            paddingAngle={4}
                                                        >
                                                            {salesData.payment_methods.map((entry, index) => (
                                                                <Cell key={`pm-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip content={<CustomChartTooltip />} />
                                                        <Legend />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="chart-empty-state">
                                                    <Inbox size={30} />
                                                    <span>To'lov turlari mavjud emas</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Revenue by Class & Debtor Aging */}
                                <div className="charts-grid-2col">
                                    <div className="chart-card glass-card">
                                        <div className="chart-header">
                                            <h3 className="chart-title">Sinflar Kesimida Daromad (Top 10)</h3>
                                            <InfoTooltip text="Eng ko'p daromad keltirgan eng yaxshi sinflar reytingi" />
                                        </div>
                                        <div className="chart-body" style={{ height: '280px' }}>
                                            {salesData.revenue_by_class?.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={salesData.revenue_by_class} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} opacity={0.5} />
                                                        <XAxis dataKey="name" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} />
                                                        <YAxis stroke="var(--text-tertiary)" fontSize={12} tickLine={false} axisLine={false} />
                                                        <Tooltip content={<CustomChartTooltip />} />
                                                        <Bar dataKey="total" name="Jami daromad" fill="#6366f1" radius={[6, 6, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="chart-empty-state">
                                                    <Inbox size={26} />
                                                    <span>Ma'lumot topilmadi</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="chart-card glass-card">
                                        <div className="chart-header">
                                            <h3 className="chart-title">Qarzdorlik Muddatlari (Debtor Aging)</h3>
                                            <InfoTooltip text="Qarzdorlik muddatlari (1-15, 16-30, 31-60, 60+ kun) bo'yicha to'lanmagan mablag'lar taqsimoti" />
                                        </div>
                                        <div className="chart-body" style={{ height: '280px' }}>
                                            {salesData.debt_aging?.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={salesData.debt_aging} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} opacity={0.5} />
                                                        <XAxis dataKey="range" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} />
                                                        <YAxis stroke="var(--text-tertiary)" fontSize={12} tickLine={false} axisLine={false} />
                                                        <Tooltip content={<CustomChartTooltip />} />
                                                        <Bar dataKey="total" name="Qarzdorlik summasi" fill="#ef4444" radius={[6, 6, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="chart-empty-state">
                                                    <Inbox size={26} />
                                                    <span>Ma'lumot topilmadi</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="chart-empty-state" style={{ minHeight: '300px' }}>
                                <Inbox size={36} />
                                <span>Sotuv va moliya bo'yicha ma'lumot topilmadi</span>
                            </div>
                        )
                    )}

                    {/* 3. LEADS & FUNNEL TAB */}
                    {activeTab === 'leads' && (
                        leadsData ? (
                            <div className="tab-view-container animate-slideUp">
                                {/* KPI Cards Grid */}
                                <div className="kpi-grid">
                                    <UITooltip text="Tizimga kelib tushgan jami yangi murojaatlar" position="top" className="w-full">
                                        <div className="kpi-card glass-card" style={{ width: '100%' }}>
                                            <div className="kpi-icon-wrapper primary">
                                                <Target size={22} />
                                            </div>
                                            <div className="kpi-info">
                                                <span className="kpi-label">Jami Leadlar</span>
                                                <h3 className="kpi-value">{leadsData.conversion_stats?.total || 0}</h3>
                                                <span className="kpi-trend positive">Faol muzokaralar: {leadsData.conversion_stats?.active}</span>
                                            </div>
                                        </div>
                                    </UITooltip>

                                    <UITooltip text="Muvaffaqiyatli shartnoma tuzgan va o'quvchiga aylangan leadlar" position="top" className="w-full">
                                        <div className="kpi-card glass-card" style={{ width: '100%' }}>
                                            <div className="kpi-icon-wrapper success">
                                                <UserCheck size={22} />
                                            </div>
                                            <div className="kpi-info">
                                                <span className="kpi-label">Konvertatsiya Bo'lgan</span>
                                                <h3 className="kpi-value">{leadsData.conversion_stats?.converted || 0}</h3>
                                                <span className="kpi-trend success">O'quvchiga aylangan</span>
                                            </div>
                                        </div>
                                    </UITooltip>

                                    <UITooltip text="Jami leadlarning shartnomaga aylanish umumiy foizi" position="top" className="w-full">
                                        <div className="kpi-card glass-card" style={{ width: '100%' }}>
                                            <div className="kpi-icon-wrapper info">
                                                <Percent size={22} />
                                            </div>
                                            <div className="kpi-info">
                                                <span className="kpi-label">Konversiya Darajasi (CR)</span>
                                                <h3 className="kpi-value">{leadsData.conversion_stats?.rate || 0}%</h3>
                                                <span className="kpi-trend info">Umumiy muvaffaqiyat</span>
                                            </div>
                                        </div>
                                    </UITooltip>

                                    <UITooltip text="Rejalashtirilgan va muddati o'tib ketgan qayta qo'ng'iroqlar" position="top" className="w-full">
                                        <div className="kpi-card glass-card" style={{ width: '100%' }}>
                                            <div className="kpi-icon-wrapper warning">
                                                <Clock size={22} />
                                            </div>
                                            <div className="kpi-info">
                                                <span className="kpi-label">Eslatmalar (Follow-ups)</span>
                                                <h3 className="kpi-value">{leadsData.conversion_stats?.follow_up_total || 0}</h3>
                                                <span className="kpi-trend negative">Muddati o'tgan: {leadsData.conversion_stats?.follow_up_overdue}</span>
                                            </div>
                                        </div>
                                    </UITooltip>
                                </div>

                                {/* Conversion Funnel Visualization */}
                                <div className="chart-card glass-card funnel-card">
                                    <div className="chart-header">
                                        <div>
                                            <h3 className="chart-title">Leadlar Konversiya Voronkasi (Funnel Pipeline)</h3>
                                            <p className="chart-subtitle">Har bir bosqichdagi leadlar ulushi va o'tish darajasi</p>
                                        </div>
                                        <InfoTooltip text="Murojaatdan boshlab o'quvchiga aylanguncha bo'lgan bosqichma-bosqich oqim" />
                                    </div>
                                    <div className="funnel-container">
                                        {leadsData.funnel_stages?.length > 0 ? (
                                            leadsData.funnel_stages.map((stage, idx) => (
                                                <UITooltip key={stage.id || idx} text={`${stage.name}: ${stage.count} ta lead (${stage.percentage}%)`} position="top" className="w-full">
                                                    <div className="funnel-step" style={{ width: '100%' }}>
                                                        <div className="funnel-step-header">
                                                            <span className="step-name">{stage.name}</span>
                                                            <span className="step-count">{stage.count} ta ({stage.percentage}%)</span>
                                                        </div>
                                                        <div className="funnel-bar-wrapper">
                                                            <div
                                                                className="funnel-bar-fill"
                                                                style={{
                                                                    width: `${Math.max(stage.percentage, 4)}%`,
                                                                    backgroundColor: stage.color || COLORS[idx % COLORS.length]
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </UITooltip>
                                            ))
                                        ) : (
                                            <div className="chart-empty-state">
                                                <Inbox size={28} />
                                                <span>Voronka bosqichlari ma'lumoti topilmadi</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Daily Leads & Operator Performance */}
                                <div className="charts-grid-2col">
                                    <div className="chart-card glass-card">
                                        <div className="chart-header">
                                            <div>
                                                <h3 className="chart-title">Hafta Kunlari Bo'yicha Oqim</h3>
                                                <p className="chart-subtitle">Mijozlar eng faol murojaat qiladigan kunlar</p>
                                            </div>
                                            <InfoTooltip text="Hafta kunlari (Dushanba-Yakshanba) bo'yicha qachon eng ko'p murojaat kelishi" />
                                        </div>
                                        <div className="chart-body" style={{ height: '300px' }}>
                                            {leadsData.peak_days?.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={leadsData.peak_days} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} opacity={0.5} />
                                                        <XAxis dataKey="day" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} />
                                                        <YAxis stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} />
                                                        <Tooltip content={<CustomChartTooltip valueSuffix=" lead" />} />
                                                        <Bar dataKey="count" name="Leadlar soni" fill="#6366f1" radius={[6, 6, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="chart-empty-state">
                                                    <Inbox size={26} />
                                                    <span>Ma'lumot mavjud emas</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="chart-card glass-card">
                                        <div className="chart-header">
                                            <div>
                                                <h3 className="chart-title">Qo'ng'iroq Natijalari Balansi</h3>
                                                <p className="chart-subtitle">Javob berilgan va berilmagan qo'ng'iroqlar</p>
                                            </div>
                                            <InfoTooltip text="Operatorlar tomonidan amalga oshirilgan qo'ng'iroqlarning natijalari taqsimoti" />
                                        </div>
                                        <div className="chart-body" style={{ height: '300px' }}>
                                            {leadsData.call_status_distribution?.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={leadsData.call_status_distribution}
                                                            dataKey="value"
                                                            nameKey="name"
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={60}
                                                            outerRadius={90}
                                                            paddingAngle={4}
                                                        >
                                                            {leadsData.call_status_distribution.map((entry, index) => (
                                                                <Cell key={`cs-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip content={<CustomChartTooltip valueSuffix=" ta" />} />
                                                        <Legend />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="chart-empty-state">
                                                    <Inbox size={26} />
                                                    <span>Qo'ng'iroq holatlari mavjud emas</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Operator Leaderboard Table */}
                                <div className="analytics-table-card glass-card">
                                    <div className="table-card-header">
                                        <h3>Operatorlar Samaradorlik Peshqadamlari (Leaderboard)</h3>
                                    </div>
                                    <div className="table-responsive">
                                        <table className="analytics-table">
                                            <thead>
                                                <tr>
                                                    <th>Operator</th>
                                                    <th>Qabul Qilingan Leadlar</th>
                                                    <th>Konvertatsiya Qilingan</th>
                                                    <th>Konversiya %</th>
                                                    <th>Javob Berish Tezligi</th>
                                                    <th>Qo'ng'iroq Samaradorligi</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {leadsData.leads_by_operator?.length > 0 ? (
                                                    leadsData.leads_by_operator.map(op => (
                                                        <tr key={op.operator_id}>
                                                            <td><strong>{op.operator_name}</strong></td>
                                                            <td>{op.count} ta</td>
                                                            <td><span className="badge-converted">{op.converted} ta</span></td>
                                                            <td>
                                                                <UITooltip text={`Konversiya ko'rsatkichi: ${op.conversion_rate}%`} position="top">
                                                                    <div className="progress-cell">
                                                                        <div className="progress-bar-bg">
                                                                            <div
                                                                                className="progress-bar-fill"
                                                                                style={{
                                                                                    width: `${Math.min(op.conversion_rate, 100)}%`,
                                                                                    backgroundColor: op.conversion_rate > 30 ? '#10b981' : '#6366f1'
                                                                                }}
                                                                            />
                                                                        </div>
                                                                        <span className="progress-text">{op.conversion_rate}%</span>
                                                                    </div>
                                                                </UITooltip>
                                                            </td>
                                                            <td>{op.avg_reaction_time || "-"}</td>
                                                            <td>{op.call_rate}%</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={6} className="table-empty-row">
                                                            <div className="table-empty-inner">
                                                                <Inbox size={26} />
                                                                <span>Ma'lumot topilmadi</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="chart-empty-state" style={{ minHeight: '300px' }}>
                                <Inbox size={36} />
                                <span>Leadlar bo'yicha ma'lumot topilmadi</span>
                            </div>
                        )
                    )}

                    {/* 4. MARKETING & CHANNELS TAB */}
                    {activeTab === 'marketing' && (
                        marketingData ? (
                            <div className="tab-view-container animate-slideUp">
                                {/* KPI Cards Grid */}
                                <div className="kpi-grid">
                                    <UITooltip text="Tizimda ulangan va hisoblanayotgan marketing manbalari" position="top" className="w-full">
                                        <div className="kpi-card glass-card" style={{ width: '100%' }}>
                                            <div className="kpi-icon-wrapper primary">
                                                <Megaphone size={22} />
                                            </div>
                                            <div className="kpi-info">
                                                <span className="kpi-label">Marketing Kanallari</span>
                                                <h3 className="kpi-value">{marketingData.channel_roi?.length || 0} ta</h3>
                                                <span className="kpi-trend positive">Faol reklama manbalari</span>
                                            </div>
                                        </div>
                                    </UITooltip>

                                    <UITooltip text="Reklama kanallari orqali kelib shartnoma imzolagan o'quvchilar soni" position="top" className="w-full">
                                        <div className="kpi-card glass-card" style={{ width: '100%' }}>
                                            <div className="kpi-icon-wrapper success">
                                                <Share2 size={22} />
                                            </div>
                                            <div className="kpi-info">
                                                <span className="kpi-label">Reklamadan Kelgan O'quvchilar</span>
                                                <h3 className="kpi-value">
                                                    {marketingData.channel_roi?.reduce((sum, item) => sum + (item.students_count || 0), 0)} nafar
                                                </h3>
                                                <span className="kpi-trend success">Shartnoma tuzgan</span>
                                            </div>
                                        </div>
                                    </UITooltip>

                                    <UITooltip text="Reklama orqali kelgan o'quvchilardan tushgan umumiy to'lovlar summasi" position="top" className="w-full">
                                        <div className="kpi-card glass-card" style={{ width: '100%' }}>
                                            <div className="kpi-icon-wrapper info">
                                                <DollarSign size={22} />
                                            </div>
                                            <div className="kpi-info">
                                                <span className="kpi-label">Reklamadan Tushgan Tushum</span>
                                                <h3 className="kpi-value">
                                                    {formatMoney(marketingData.channel_roi?.reduce((sum, item) => sum + (item.revenue || 0), 0))}
                                                </h3>
                                                <span className="kpi-trend info">Jami tushum</span>
                                            </div>
                                        </div>
                                    </UITooltip>
                                </div>

                                {/* Channel ROI Charts */}
                                <div className="charts-grid-2col">
                                    <div className="chart-card glass-card">
                                        <div className="chart-header">
                                            <div>
                                                <h3 className="chart-title">Kanallar Bo'yicha Mijozlar va O'quvchilar</h3>
                                                <p className="chart-subtitle">Qaysi kanal ko'proq real o'quvchi keltirgani</p>
                                            </div>
                                            <InfoTooltip text="Murojaat qilgan barcha mijozlar va ular ichidan shartnoma tuzgan haqiqiy o'quvchilar taqqosi" />
                                        </div>
                                        <div className="chart-body" style={{ height: '320px' }}>
                                            {marketingData.channel_roi?.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={marketingData.channel_roi} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} opacity={0.5} />
                                                        <XAxis dataKey="name" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} />
                                                        <YAxis stroke="var(--text-tertiary)" fontSize={12} tickLine={false} axisLine={false} />
                                                        <Tooltip content={<CustomChartTooltip valueSuffix=" nafar" />} />
                                                        <Legend />
                                                        <Bar dataKey="clients_count" name="Mijozlar (Murojaat)" fill="rgba(99, 102, 241, 0.4)" radius={[6, 6, 0, 0]} />
                                                        <Bar dataKey="students_count" name="O'quvchilar (Shartnoma)" fill="#10b981" radius={[6, 6, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="chart-empty-state">
                                                    <Inbox size={30} />
                                                    <span>Marketing ma'lumoti mavjud emas</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="chart-card glass-card">
                                        <div className="chart-header">
                                            <div>
                                                <h3 className="chart-title">Manbalar Bo'yicha Tushum Taqsimoti</h3>
                                                <p className="chart-subtitle">Har bir reklama kanali olib kelgan daromad (so'm)</p>
                                            </div>
                                            <InfoTooltip text="Har bir reklama kanali orqali tushgan daromad (so'm) ulushlari" />
                                        </div>
                                        <div className="chart-body" style={{ height: '320px' }}>
                                            {marketingData.channel_roi?.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={marketingData.channel_roi}
                                                            dataKey="revenue"
                                                            nameKey="name"
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={65}
                                                            outerRadius={95}
                                                            paddingAngle={4}
                                                        >
                                                            {marketingData.channel_roi.map((entry, index) => (
                                                                <Cell key={`roi-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip content={<CustomChartTooltip />} />
                                                        <Legend />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="chart-empty-state">
                                                    <Inbox size={30} />
                                                    <span>Tushum ma'lumoti yo'q</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Marketing Specialists Breakdown */}
                                <div className="analytics-table-card glass-card">
                                    <div className="table-card-header">
                                        <h3>Marketing Mutaxassislari va Kampaniyalar</h3>
                                    </div>
                                    <div className="table-responsive">
                                        <table className="analytics-table">
                                            <thead>
                                                <tr>
                                                    <th>Mutaxassis / Kampaniya</th>
                                                    <th>Google Sheets Ulanmalari</th>
                                                    <th>Jalb Qilingan Leadlar</th>
                                                    <th>Konversiya Qilingan</th>
                                                    <th>Konversiya Darajasi</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {marketingData.specialists?.length > 0 ? (
                                                    marketingData.specialists.map(m => (
                                                        <tr key={m.id}>
                                                            <td><strong>{m.name}</strong></td>
                                                            <td>{m.sheets_count} ta jadval</td>
                                                            <td>{m.leads_count} ta</td>
                                                            <td><span className="badge-converted">{m.converted_count} ta</span></td>
                                                            <td>
                                                                <UITooltip text={`Konversiya: ${m.conversion_rate}%`} position="top">
                                                                    <div className="progress-cell">
                                                                        <div className="progress-bar-bg">
                                                                            <div
                                                                                className="progress-bar-fill"
                                                                                style={{
                                                                                    width: `${Math.min(m.conversion_rate, 100)}%`,
                                                                                    backgroundColor: '#6366f1'
                                                                                }}
                                                                            />
                                                                        </div>
                                                                        <span className="progress-text">{m.conversion_rate}%</span>
                                                                    </div>
                                                                </UITooltip>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={5} className="table-empty-row">
                                                            <div className="table-empty-inner">
                                                                <Inbox size={26} />
                                                                <span>Ma'lumot topilmadi</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="chart-empty-state" style={{ minHeight: '300px' }}>
                                <Inbox size={36} />
                                <span>Marketing bo'yicha ma'lumot topilmadi</span>
                            </div>
                        )
                    )}
                </div>
            )}

            {/* Filter Drawer */}
            <AnalyticsFilterDrawer
                isOpen={filterOpen}
                onClose={() => setFilterOpen(false)}
                onFilter={(newFilters) => setFilters(newFilters)}
                activeTab={activeTab}
                initialFilters={filters}
                classes={classes}
                buildings={buildings}
                stages={stages}
                operators={operators}
            />
        </div>
    );
};

export default AnalyticsPage;
