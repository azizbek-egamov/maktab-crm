import React, { useState, useEffect } from 'react';
import { leadService } from '../../services/leads';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { formatDateInput, isValidDateStr, parseUIDateToApi } from '../../utils/dateFormatter';

const RefreshIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="23 4 23 10 17 10"></polyline>
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
    </svg>
);

const UsersIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
);

const CalendarIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);

const CheckCircleIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
);

const PhoneCallIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
    </svg>
);

const TrendingUpIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
        <polyline points="17 6 23 6 23 12"></polyline>
    </svg>
);

const StatCard = ({ title, value, subtitle, icon, gradient }) => (
    <div className="stat-card" style={{ background: gradient }}>
        <div className="stat-info">
            <span className="stat-title">{title}</span>
            <span className="stat-value">{value}</span>
            {subtitle && <span className="stat-sub" style={{ fontSize: '11px', opacity: 0.85 }}>{subtitle}</span>}
        </div>
        <div className="stat-icon">{icon}</div>
    </div>
);

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
        conversion_rate: 0,
        by_stage: [],
        by_status: [],
        by_source: [],
        by_operator: []
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
            setData(res.data);
        } catch (error) {
            console.error("Stats load error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [dateFrom, dateTo]);

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#ef4444', '#14b8a6'];

    return (
        <div className="leads-statistics-view animate-fadeIn">
            {/* Filter Bar */}
            <div className="leads-toolbar mb-4">
                <div className="toolbar-left">
                    <div className="period-presets flex items-center gap-1.5">
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
                                className={`btn-v2 btn-sm ${period === p.key ? 'btn-v2-primary' : 'btn-v2-dark'}`}
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
                        <RefreshIcon />
                        <span>Yangilash</span>
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="stats-row mb-4">
                <StatCard
                    title="Jami Leadlar"
                    value={data.total || 0}
                    subtitle="Tanlangan davrda"
                    gradient="linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                    icon={<UsersIcon />}
                />
                <StatCard
                    title="Bugungi Leadlar"
                    value={data.today || 0}
                    subtitle="Bugun kelgan yangi"
                    gradient="linear-gradient(135deg, #10b981 0%, #34d399 100%)"
                    icon={<CalendarIcon />}
                />
                <StatCard
                    title="Mijozga Aylangan"
                    value={data.converted || 0}
                    subtitle="Shartnoma / Qabul"
                    gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                    icon={<CheckCircleIcon />}
                />
                <StatCard
                    title="Javob Berganlar"
                    value={data.answered || 0}
                    subtitle="Aloqa o'rnatilgan"
                    gradient="linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)"
                    icon={<PhoneCallIcon />}
                />
                <StatCard
                    title="Konversiya Darajasi"
                    value={`${data.conversion_rate || 0}%`}
                    subtitle="Lead → Mijoz samarasi"
                    gradient="linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)"
                    icon={<TrendingUpIcon />}
                />
            </div>

            {loading ? (
                <div className="loading-state text-center py-20">
                    <div className="spinner mx-auto"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Marketing Channels Distribution */}
                    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-base font-bold text-[var(--text-primary)]">🎯 Marketing Manbalari Taqsimoti</h3>
                                <p className="text-xs text-[var(--text-secondary)]">Leadlar qaysi kanallardan (Instagram, Telegram, ...) kelgan</p>
                            </div>
                        </div>
                        <div style={{ height: 320 }}>
                            {!data.by_source || data.by_source.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-[var(--text-secondary)] text-sm">Ma'lumot topilmadi</div>
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
                                            dataKey="count"
                                        >
                                            {data.by_source.map((entry, index) => (
                                                <Cell key={`source-cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                                borderRadius: '12px',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                color: '#fff'
                                            }}
                                        />
                                        <Legend verticalAlign="bottom" height={40} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Stage Distribution */}
                    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-base font-bold text-[var(--text-primary)]">📊 Bosqichlar Kesimida</h3>
                                <p className="text-xs text-[var(--text-secondary)]">Kanban ustunlari bo'yicha leadlar taqsimoti</p>
                            </div>
                        </div>
                        <div style={{ height: 320 }}>
                            {!data.by_stage || data.by_stage.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-[var(--text-secondary)] text-sm">Ma'lumot topilmadi</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.by_stage} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.5} vertical={false} />
                                        <XAxis dataKey="name" fontSize={11} stroke="var(--text-secondary)" tickLine={false} />
                                        <YAxis fontSize={11} stroke="var(--text-secondary)" tickLine={false} />
                                        <RechartsTooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                                borderRadius: '12px',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                color: '#fff'
                                            }}
                                        />
                                        <Bar dataKey="count" name="Leadlar soni" radius={[6, 6, 0, 0]}>
                                            {data.by_stage.map((entry, index) => (
                                                <Cell key={`stage-cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Call Status Distribution */}
                    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-base font-bold text-[var(--text-primary)]">📞 Qo'ng'iroq Holatlari</h3>
                                <p className="text-xs text-[var(--text-secondary)]">Operatorlar qo'ng'iroq javob natijalari</p>
                            </div>
                        </div>
                        <div style={{ height: 320 }}>
                            {!data.by_status || data.by_status.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-[var(--text-secondary)] text-sm">Ma'lumot topilmadi</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data.by_status}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={4}
                                            dataKey="count"
                                        >
                                            {data.by_status.map((entry, index) => (
                                                <Cell key={`status-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                                borderRadius: '12px',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                color: '#fff'
                                            }}
                                        />
                                        <Legend verticalAlign="bottom" height={40} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Operator Performance */}
                    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-base font-bold text-[var(--text-primary)]">👤 Operatorlar Faolligi</h3>
                                <p className="text-xs text-[var(--text-secondary)]">Operatorlarga biriktirilgan leadlar soni</p>
                            </div>
                        </div>
                        <div style={{ height: 320 }}>
                            {!data.by_operator || data.by_operator.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-[var(--text-secondary)] text-sm">Ma'lumot topilmadi</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={data.by_operator}
                                        layout="vertical"
                                        margin={{ top: 10, right: 30, left: 30, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.5} horizontal={true} vertical={false} />
                                        <XAxis type="number" stroke="var(--text-secondary)" fontSize={11} />
                                        <YAxis dataKey="name" type="category" width={120} tickLine={false} stroke="var(--text-secondary)" fontSize={12} />
                                        <RechartsTooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                                borderRadius: '12px',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                color: '#fff'
                                            }}
                                        />
                                        <Bar dataKey="count" name="Leadlar soni" fill="#6366f1" barSize={18} radius={[0, 6, 6, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeadsStatistics;
