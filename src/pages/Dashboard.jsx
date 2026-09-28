import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { analyticsService } from '../services/analytics';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import { Users, CheckCircle2, Briefcase, TrendingUp, Calendar, Inbox, Award } from 'lucide-react';
import CustomChartTooltip from '../components/ui/CustomChartTooltip';
import { UITooltip, InfoTooltip } from '../components/ui/UITooltip';
import './Dashboard.css';

const Dashboard = () => {
    const { user } = useAuth();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSummary();
    }, []);

    const fetchSummary = async () => {
        try {
            const res = await analyticsService.getSummary();
            setSummary(res.data);
        } catch (error) {
            console.error("Dashboard stats error:", error);
        } finally {
            setLoading(false);
        }
    };

    const stats = [
        { label: "O'quvchilar", value: summary?.counts?.students || '0', color: 'primary', icon: Users, tooltip: "Tizimda ro'yxatdan o'tgan faol o'quvchilarning umumiy soni" },
        { label: 'Yangi qabul (oy)', value: summary?.counts?.new_students_month || '0', color: 'success', icon: CheckCircle2, tooltip: "So'nggi 30 kun ichida qabul qilingan yangi o'quvchilar" },
        { label: 'Qarzdorlar', value: summary?.counts?.debtor_students || '0', color: 'warning', icon: Briefcase, tooltip: "To'lov muddati kechikkan yoki qoldiq qarzi bor o'quvchilar" },
        { label: 'Konversiya', value: (summary?.counts?.conversion_rate || '0') + '%', color: 'cyan', icon: TrendingUp, tooltip: "Barcha leadlarning mijoz/o'quvchiga aylanish foizi" },
    ];

    const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#ef4444', '#14b8a6'];

    const getSourceLabel = (source) => {
        if (!source || source === 'null' || source === 'undefined') return 'Kiritilmagan / Boshqa';
        const mappings = {
            'Telegramda': 'Telegram',
            'Instagramda': 'Instagram',
            'YouTubeda': 'YouTube',
            'Odamlar orasida': 'Odamlar orasida',
            'Xech qayerda': 'Tavsiya / Boshqa'
        };
        return mappings[source] || source;
    };

    const processedSourceDistribution = (summary?.charts?.source_distribution || []).map(item => ({
        ...item,
        displaySource: getSourceLabel(item.source)
    }));

    const getDateInfo = () => {
        const date = new Date();
        const weekdays = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
        const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
        return {
            weekday: weekdays[date.getDay()],
            formatted: `${date.getDate()}-${months[date.getMonth()]} ${date.getFullYear()}`
        };
    };

    const dateInfo = getDateInfo();

    if (loading && !summary) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Ma'lumotlar yuklanmoqda...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-content animate-fadeIn">
            <header className="dashboard-header">
                <div className="header-info">
                    <p className="greeting">Xush kelibsiz,</p>
                    <h1 className="title">
                        {user?.first_name || user?.username || 'Admin'} <span>👋</span>
                    </h1>
                </div>
                <UITooltip text="Bugungi sana" position="left">
                    <div className="date-box">
                        <Calendar size={18} />
                        <div>
                            <span className="date-label">{dateInfo.weekday}</span>
                            <span className="date-value">{dateInfo.formatted}</span>
                        </div>
                    </div>
                </UITooltip>
            </header>

            {/* Counts Section with Tooltip Info */}
            <section className="stats-grid">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <UITooltip key={stat.label} text={stat.tooltip} position="top" className="stat-card-tooltip-wrap">
                            <div className={`stat-card stat-${stat.color}`}>
                                <div className="stat-icon">
                                    <Icon size={22} />
                                </div>
                                <div className="stat-info-box">
                                    <span className="stat-value">{stat.value}</span>
                                    <span className="stat-label">{stat.label}</span>
                                </div>
                            </div>
                        </UITooltip>
                    );
                })}
            </section>

            {/* Charts Section */}
            <section className="charts-grid-layout">
                {/* Leads Growth */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>📈 Oylik Leadlar O'sishi</h3>
                        <InfoTooltip text="Oxirgi 30 kunda kunlar bo'yicha tushgan yangi murojaatlar dinamikasi" />
                    </div>
                    <div className="chart-container">
                        {!summary?.charts?.leads_growth || summary.charts.leads_growth.length === 0 ? (
                            <div className="chart-no-data">
                                <Inbox size={28} />
                                <span>Ma'lumot topilmadi</span>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={290}>
                                <AreaChart data={summary?.charts?.leads_growth || []} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorLeadsGrowth" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.45} />
                                            <stop offset="100%" stopColor="#6366f1" stopOpacity={0.0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                                    <Tooltip content={<CustomChartTooltip valueSuffix=" ta" />} />
                                    <Area
                                        type="monotone"
                                        dataKey="count"
                                        name="Yangi leadlar"
                                        stroke="#6366f1"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorLeadsGrowth)"
                                        activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Lead Stages */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>📊 Leadlar Bosqichlari Taqsimoti</h3>
                        <InfoTooltip text="Leadlarning qaysi bosqichda turganligi soni va holati" />
                    </div>
                    <div className="chart-container">
                        {!summary?.charts?.stage_distribution || summary.charts.stage_distribution.length === 0 ? (
                            <div className="chart-no-data">
                                <Inbox size={28} />
                                <span>Ma'lumot topilmadi</span>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={290}>
                                <BarChart data={summary?.charts?.stage_distribution || []} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                                    <Tooltip content={<CustomChartTooltip valueSuffix=" ta" />} />
                                    <Bar dataKey="count" name="Leadlar" radius={[8, 8, 0, 0]} barSize={34}>
                                        {(summary?.charts?.stage_distribution || []).map((entry, index) => (
                                             <Cell
                                                key={`cell-${index}`}
                                                fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Lead Sources Donut Chart */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>🎯 Mijozlar Manbasi</h3>
                        <InfoTooltip text="Mijozlar qaysi reklama kanallari orqali murojaat qilganligi nisbati" />
                    </div>
                    {processedSourceDistribution.length === 0 ? (
                        <div className="chart-container">
                            <div className="chart-no-data">
                                <Inbox size={28} />
                                <span>Ma'lumot topilmadi</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="chart-container pie-chart-container">
                                <ResponsiveContainer width="100%" height={210}>
                                    <PieChart>
                                        <Pie
                                            data={processedSourceDistribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={55}
                                            outerRadius={85}
                                            paddingAngle={4}
                                            cornerRadius={5}
                                            dataKey="count"
                                            nameKey="displaySource"
                                            stroke="none"
                                        >
                                            {processedSourceDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomChartTooltip valueSuffix=" ta" />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            {/* Custom Legend */}
                            <div className="custom-pie-legend">
                                {processedSourceDistribution.map((item, index) => (
                                    <UITooltip key={index} text={`${item.displaySource}: ${item.count} ta mijoz`} position="bottom">
                                        <div className="legend-item">
                                            <span
                                                className="legend-dot"
                                                style={{
                                                    background: CHART_COLORS[index % CHART_COLORS.length],
                                                    boxShadow: `0 0 6px ${CHART_COLORS[index % CHART_COLORS.length]}80`
                                                }}
                                            ></span>
                                            <span className="legend-text">{item.displaySource} ({item.count})</span>
                                        </div>
                                    </UITooltip>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Top Operators */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>🏆 Top Operatorlar</h3>
                        <InfoTooltip text="Eng ko'p lead qabul qilgan va muvaffaqiyatli konversiya qilgan xodimlar" />
                    </div>
                    <div className="chart-container">
                        <div className="operators-list">
                            {summary?.top_operators?.length > 0 ? (
                                summary.top_operators.map((op, idx) => (
                                    <UITooltip key={idx} text={`${op.full_name}: ${op.lead_count} ta lead, ${op.success_rate}% muvaffaqiyat`} position="left" className="w-full">
                                        <div className="operator-item" style={{ width: '100%' }}>
                                            <div className="operator-info">
                                                <div className="operator-avatar">
                                                    {op.full_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="operator-details">
                                                    <span className="operator-name">{op.full_name}</span>
                                                    <span className="operator-leads">{op.lead_count} lead</span>
                                                </div>
                                            </div>
                                            <div className="operator-performance">
                                                <div className="performance-bar">
                                                    <div
                                                        className="performance-fill"
                                                        style={{ width: `${Math.min(op.success_rate, 100)}%` }}
                                                    ></div>
                                                </div>
                                                <span className="performance-text">{op.success_rate}% samaradorlik</span>
                                            </div>
                                        </div>
                                    </UITooltip>
                                ))
                            ) : (
                                <div className="chart-no-data">
                                    <Inbox size={28} />
                                    <span>Ma'lumot topilmadi</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Dashboard;
