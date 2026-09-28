import React, { useState, useEffect } from 'react';
import {
    Target,
    Calendar,
    UserCheck,
    PhoneCall,
    TrendingUp,
    Inbox,
    RefreshCw,
    Users,
    PieChart as PieIcon,
    BarChart3,
    Clock,
    Flame
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { leadService } from '../../services/leads';
import CustomChartTooltip from '../../components/ui/CustomChartTooltip';
import { UITooltip, InfoTooltip } from '../../components/ui/UITooltip';
import { formatDateInput, isValidDateStr, parseUIDateToApi } from '../../utils/dateFormatter';
import '../analytics/Analytics.css';
import './Leads.css';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#ef4444', '#14b8a6', '#3b82f6'];

const LeadsStatistics = () => {
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [data, setData] = useState({
        total: 0,
        today: 0,
        converted: 0,
        answered: 0,
        active: 0,
        conversion_rate: 0,
        by_stage: [],
        funnel_stages: [],
        by_status: [],
        by_source: [],
        by_operator: [],
        peak_days: []
    });

    const handlePeriodChange = (val) => {
        setPeriod(val);
        const now = new Date();
        const formatDateObj = (d) => {
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}.${month}.${year}`;
        };

        if (val === 'today') {
            const todayStr = formatDateObj(now);
            setDateFrom(todayStr);
            setDateTo(todayStr);
        } else if (val === '7d') {
            const past = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
            setDateFrom(formatDateObj(past));
            setDateTo(formatDateObj(now));
        } else if (val === '30d') {
            const past = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
            setDateFrom(formatDateObj(past));
            setDateTo(formatDateObj(now));
        } else if (val === 'this_month') {
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            setDateFrom(formatDateObj(start));
            setDateTo(formatDateObj(now));
        } else if (val === 'all') {
            setDateFrom('');
            setDateTo('');
        }
    };

    const fetchStats = async () => {
        setLoading(true);
        try {
            const params = {};
            if (dateFrom && isValidDateStr(dateFrom)) params.date_from = parseUIDateToApi(dateFrom);
            if (dateTo && isValidDateStr(dateTo)) params.date_to = parseUIDateToApi(dateTo);

            const res = await leadService.getStatistics(params);
            setData(res.data || {});
        } catch (error) {
            console.error("Stats load error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [dateFrom, dateTo]);

    return (
        <div className="leads-statistics-view analytics-page" style={{ padding: 0, minHeight: 'auto', background: 'transparent' }}>
            {/* Filter Bar */}
            <div className="leads-toolbar mb-5 flex items-center justify-between flex-wrap gap-3">
                <div className="toolbar-left flex items-center gap-3 flex-wrap">
                    <div className="period-presets flex items-center gap-1.5 bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border-color)]">
                        {[
                            { key: 'all', label: 'Barchasi' },
                            { key: 'today', label: 'Bugun' },
                            { key: '7d', label: '7 kun' },
                            { key: '30d', label: '30 kun' },
                            { key: 'this_month', label: 'Shu oy' },
                        ].map(p => (
                            <button
                                key={p.key}
                                type="button"
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    period === p.key
                                        ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                                }`}
                                onClick={() => handlePeriodChange(p.key)}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    <div className="date-filter-group">
                        <div className="date-filter">
                            <label>Dan</label>
                            <input
                                type="text"
                                placeholder="KK.OO.YYYY"
                                value={dateFrom}
                                onChange={(e) => {
                                    setPeriod('custom');
                                    setDateFrom(formatDateInput(e.target.value));
                                }}
                            />
                        </div>
                        <span className="date-filter-divider"></span>
                        <div className="date-filter">
                            <label>Gacha</label>
                            <input
                                type="text"
                                placeholder="KK.OO.YYYY"
                                value={dateTo}
                                onChange={(e) => {
                                    setPeriod('custom');
                                    setDateTo(formatDateInput(e.target.value));
                                }}
                            />
                        </div>
                        {(dateFrom || dateTo) && (
                            <button
                                className="clear-filter-btn"
                                onClick={() => {
                                    setPeriod('all');
                                    setDateFrom('');
                                    setDateTo('');
                                }}
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    <button className="btn-v2 btn-v2-dark" onClick={fetchStats}>
                        <RefreshCw size={14} />
                        <span>Yangilash</span>
                    </button>
                </div>
            </div>

            {/* KPI Cards Grid with Tooltips */}
            <div className="kpi-grid mb-6">
                <UITooltip text="Tanlangan davr bo'yicha tizimdagi barcha kelib tushgan jami leadlar" position="top" className="w-full">
                    <div className="kpi-card glass-card" style={{ width: '100%' }}>
                        <div className="kpi-icon-wrapper primary">
                            <Target size={22} />
                        </div>
                        <div className="kpi-info">
                            <span className="kpi-label">Jami Leadlar</span>
                            <h3 className="kpi-value">{data.total || 0}</h3>
                            <span className="kpi-trend positive">
                                Faol: {data.active || 0} ta
                            </span>
                        </div>
                    </div>
                </UITooltip>

                <UITooltip text="Bugungi sana davomida yangi kelib tushgan leadlar" position="top" className="w-full">
                    <div className="kpi-card glass-card" style={{ width: '100%' }}>
                        <div className="kpi-icon-wrapper success">
                            <Calendar size={22} />
                        </div>
                        <div className="kpi-info">
                            <span className="kpi-label">Bugungi Leadlar</span>
                            <h3 className="kpi-value">{data.today || 0}</h3>
                            <span className="kpi-trend success">
                                Bugun kelgan yangi
                            </span>
                        </div>
                    </div>
                </UITooltip>

                <UITooltip text="Muvaffaqiyatli shartnoma imzolab mijozga aylangan leadlar" position="top" className="w-full">
                    <div className="kpi-card glass-card" style={{ width: '100%' }}>
                        <div className="kpi-icon-wrapper warning">
                            <UserCheck size={22} />
                        </div>
                        <div className="kpi-info">
                            <span className="kpi-label">Mijozga Aylangan</span>
                            <h3 className="kpi-value">{data.converted || 0}</h3>
                            <span className="kpi-trend info">
                                Shartnoma / Qabul
                            </span>
                        </div>
                    </div>
                </UITooltip>

                <UITooltip text="Operatorlar tomonidan aloqa o'rnatilgan va javob bergan mijozlar" position="top" className="w-full">
                    <div className="kpi-card glass-card" style={{ width: '100%' }}>
                        <div className="kpi-icon-wrapper info">
                            <PhoneCall size={22} />
                        </div>
                        <div className="kpi-info">
                            <span className="kpi-label">Javob Berganlar</span>
                            <h3 className="kpi-value">{data.answered || 0}</h3>
                            <span className="kpi-trend info">
                                Aloqa o'rnatilgan
                            </span>
                        </div>
                    </div>
                </UITooltip>

                <UITooltip text="Jami leadlarning mijozga aylanish samaradorlik foizi" position="top" className="w-full">
                    <div className="kpi-card glass-card" style={{ width: '100%' }}>
                        <div className="kpi-icon-wrapper danger">
                            <TrendingUp size={22} />
                        </div>
                        <div className="kpi-info">
                            <span className="kpi-label">Konversiya Darajasi</span>
                            <h3 className="kpi-value">{data.conversion_rate || 0}%</h3>
                            <span className="kpi-trend positive">
                                Lead → Mijoz samarasi
                            </span>
                        </div>
                    </div>
                </UITooltip>
            </div>

            {loading ? (
                <div className="loading-state text-center py-20">
                    <div className="spinner mx-auto"></div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Funnel Pipeline Overview */}
                    {data.funnel_stages && data.funnel_stages.length > 0 && (
                        <div className="chart-card glass-card funnel-card">
                            <div className="chart-header">
                                <div>
                                    <h3 className="chart-title">🔄 Leadlar Konversiya Voronkasi (Pipeline Funnel)</h3>
                                    <p className="chart-subtitle">Bosqichlar kesimida leadlar oqimi va o'tish darajasi</p>
                                </div>
                                <InfoTooltip text="Murojaatdan boshlab muvaffaqiyatli mijozga aylanguncha bo'lgan bosqichma-bosqich jarayon" />
                            </div>
                            <div className="funnel-container">
                                {data.funnel_stages.map((stage, idx) => (
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
                                                        backgroundColor: stage.fill || stage.color || COLORS[idx % COLORS.length]
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </UITooltip>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Row 1: Marketing Distribution & Stage Distribution */}
                    <div className="charts-grid-2col">
                        {/* Marketing Channels Distribution */}
                        <div className="chart-card glass-card">
                            <div className="chart-header">
                                <div>
                                    <h3 className="chart-title">🎯 Marketing Manbalari Taqsimoti</h3>
                                    <p className="chart-subtitle">Leadlar qaysi kanallardan (Instagram, Telegram, ...) kelgan</p>
                                </div>
                                <InfoTooltip text="Reklama kampaniyalari va ijtimoiy tarmoqlardan kelgan murojaatlar ulushi" />
                            </div>
                            <div className="chart-body" style={{ height: '320px' }}>
                                {!data.by_source || data.by_source.length === 0 ? (
                                    <div className="chart-empty-state">
                                        <Inbox size={30} />
                                        <span>Ma'lumot topilmadi</span>
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={data.by_source}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={65}
                                                outerRadius={95}
                                                paddingAngle={4}
                                                cornerRadius={6}
                                                dataKey="count"
                                                nameKey="name"
                                            >
                                                {data.by_source.map((entry, index) => (
                                                    <Cell key={`source-cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} stroke="var(--card-bg)" strokeWidth={2} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip content={<CustomChartTooltip />} />
                                            <Legend 
                                                verticalAlign="bottom" 
                                                height={40} 
                                                iconType="circle" 
                                                formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500 }}>{value}</span>}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        {/* Stage Distribution */}
                        <div className="chart-card glass-card">
                            <div className="chart-header">
                                <div>
                                    <h3 className="chart-title">📊 Bosqichlar Kesimida Taqsimot</h3>
                                    <p className="chart-subtitle">Kanban ustunlari bo'yicha leadlar taqsimoti</p>
                                </div>
                                <InfoTooltip text="Kanban doskasidagi har bir holat/bosqichda ayni paytda mavjud leadlar soni" />
                            </div>
                            <div className="chart-body" style={{ height: '320px' }}>
                                {!data.by_stage || data.by_stage.length === 0 ? (
                                    <div className="chart-empty-state">
                                        <Inbox size={30} />
                                        <span>Ma'lumot topilmadi</span>
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={data.by_stage} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.5} vertical={false} />
                                            <XAxis dataKey="name" fontSize={11} stroke="var(--text-secondary)" tickLine={false} axisLine={{ stroke: 'var(--border-color)' }} />
                                            <YAxis fontSize={11} stroke="var(--text-secondary)" tickLine={false} axisLine={{ stroke: 'var(--border-color)' }} />
                                            <RechartsTooltip content={<CustomChartTooltip />} />
                                            <Bar dataKey="count" name="Leadlar soni" radius={[8, 8, 0, 0]} maxBarSize={45}>
                                                {data.by_stage.map((entry, index) => (
                                                    <Cell key={`stage-cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Call Status & Operator Performance */}
                    <div className="charts-grid-2col">
                        {/* Call Status Distribution */}
                        <div className="chart-card glass-card">
                            <div className="chart-header">
                                <div>
                                    <h3 className="chart-title">📞 Qo'ng'iroq Holatlari</h3>
                                    <p className="chart-subtitle">Operatorlar qo'ng'iroq javob natijalari</p>
                                </div>
                                <InfoTooltip text="Mijozlar bilan amalga oshirilgan telefon muloqotlari natijasi" />
                            </div>
                            <div className="chart-body" style={{ height: '320px' }}>
                                {!data.by_status || data.by_status.length === 0 ? (
                                    <div className="chart-empty-state">
                                        <Inbox size={30} />
                                        <span>Ma'lumot topilmadi</span>
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={data.by_status}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={92}
                                                paddingAngle={4}
                                                cornerRadius={6}
                                                dataKey="count"
                                                nameKey="name"
                                            >
                                                {data.by_status.map((entry, index) => (
                                                    <Cell key={`status-cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="var(--card-bg)" strokeWidth={2} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip content={<CustomChartTooltip />} />
                                            <Legend 
                                                verticalAlign="bottom" 
                                                height={40} 
                                                iconType="circle" 
                                                formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500 }}>{value}</span>}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        {/* Operator Performance */}
                        <div className="chart-card glass-card">
                            <div className="chart-header">
                                <div>
                                    <h3 className="chart-title">👤 Operatorlar Faolligi</h3>
                                    <p className="chart-subtitle">Operatorlarga biriktirilgan leadlar soni</p>
                                </div>
                                <InfoTooltip text="Menejer va operatorlarga taqsimlangan jami leadlar hajmi" />
                            </div>
                            <div className="chart-body" style={{ height: '320px' }}>
                                {!data.by_operator || data.by_operator.length === 0 ? (
                                    <div className="chart-empty-state">
                                        <Inbox size={30} />
                                        <span>Ma'lumot topilmadi</span>
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={data.by_operator}
                                            layout="vertical"
                                            margin={{ top: 10, right: 30, left: 30, bottom: 5 }}
                                        >
                                            <defs>
                                                <linearGradient id="leadsOpBarGrad" x1="0" y1="0" x2="1" y2="0">
                                                    <stop offset="0%" stopColor="#6366f1" />
                                                    <stop offset="100%" stopColor="#8b5cf6" />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.4} horizontal={true} vertical={false} />
                                            <XAxis type="number" stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={{ stroke: 'var(--border-color)' }} />
                                            <YAxis dataKey="name" type="category" width={120} tickLine={false} stroke="var(--text-secondary)" fontSize={12} axisLine={{ stroke: 'var(--border-color)' }} />
                                            <RechartsTooltip content={<CustomChartTooltip />} />
                                            <Bar dataKey="count" name="Leadlar soni" fill="url(#leadsOpBarGrad)" barSize={20} radius={[0, 8, 8, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Row 3: Peak Days Distribution */}
                    {data.peak_days && data.peak_days.length > 0 && (
                        <div className="chart-card glass-card">
                            <div className="chart-header">
                                <div>
                                    <h3 className="chart-title">📅 Hafta Kunlari Bo'yicha Murojaatlar</h3>
                                    <p className="chart-subtitle">Mijozlar haftaning qaysi kunlarida eng ko'p murojaat qilishi</p>
                                </div>
                                <InfoTooltip text="Dushanbadan Yakshanbagacha kelib tushgan yangi leadlar taqsimoti" />
                            </div>
                            <div className="chart-body" style={{ height: '260px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.peak_days} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} opacity={0.5} />
                                        <XAxis dataKey="day" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                                        <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                                        <RechartsTooltip content={<CustomChartTooltip valueSuffix=" lead" />} />
                                        <Bar dataKey="count" name="Leadlar soni" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={45} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LeadsStatistics;
