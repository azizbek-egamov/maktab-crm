import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    Users, Eye, TrendingUp, Heart, MessageCircle, Bookmark,
    BarChart3, Image as ImageIcon, Video, Link2, RefreshCw, ExternalLink,
    ArrowUpRight, ArrowDownRight, Minus, Share2, Clock, Calendar,
    Zap, Target, Activity, Award, Send, ChevronLeft, ChevronRight,
    Search, Filter, Play, CheckCircle2, Sparkles, MapPin, UserCheck,
    Layers, AlertCircle, X, HelpCircle, Download, Copy, Check, SlidersHorizontal,
    RotateCcw
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { instagramService } from '../../services/instagram';
import { toast } from 'sonner';
import './InstagramStats.css';

const DATE_PRESETS = [
    { key: 'all', label: 'Barchasi' },
    { key: 'today', label: 'Bugun' },
    { key: 'yesterday', label: 'Kecha' },
    { key: '7d', label: '7 kun' },
    { key: '30d', label: '30 kun' },
    { key: '90d', label: '90 kun' },
    { key: 'this_month', label: 'Shu oy' },
    { key: 'last_month', label: "O'tgan oy" },
    { key: 'this_year', label: 'Shu yil' },
    { key: 'custom', label: 'Maxsus sana 📅' }
];

const SORT_OPTIONS = [
    { value: 'newest', label: '📅 Eng yangi birinchi' },
    { value: 'oldest', label: '📅 Eng eski birinchi' },
    { value: 'views', label: "👁️ Ko'rishlar (kamayish)" },
    { value: 'reach', label: '👥 Qamrov / Reach (kamayish)' },
    { value: 'likes', label: '❤️ Like-lar (kamayish)' },
    { value: 'comments', label: '💬 Izohlar (kamayish)' },
    { value: 'saved', label: '🔖 Saqlanganlar (kamayish)' },
    { value: 'shares', label: '↗️ Ulashishlar (kamayish)' },
    { value: 'engagement_rate', label: '📈 Faollik (ER %)' },
];

const InstagramStats = () => {
    // Navigation & Tabs
    const [activeTab, setActiveTab] = useState('overview'); // overview, reels_studio, audience, leads
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [accounts, setAccounts] = useState([]);
    const [selectedAccountId, setSelectedAccountId] = useState(null);
    const [profile, setProfile] = useState(null);

    // Global Date Range State
    const [datePreset, setDatePreset] = useState('30d');
    const [customDateFrom, setCustomDateFrom] = useState('');
    const [customDateTo, setCustomDateTo] = useState('');
    const [appliedDateFrom, setAppliedDateFrom] = useState('');
    const [appliedDateTo, setAppliedDateTo] = useState('');

    // Tab 1: Executive Overview Data
    const [summary, setSummary] = useState(null);

    // Tab 2: Reels & Content Studio Data
    const [reelsData, setReelsData] = useState({
        results: [],
        count: 0,
        page: 1,
        page_size: 12,
        total_pages: 1,
        format_counts: { ALL: 0, VIDEO: 0, IMAGE: 0, CAROUSEL_ALBUM: 0 },
        badge_counts: { ALL: 0, viral: 0, high: 0, normal: 0 },
        stats: {}
    });
    const [filterMediaType, setFilterMediaType] = useState('ALL');
    const [filterBadge, setFilterBadge] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [reelsPage, setReelsPage] = useState(1);
    const [reelsLoading, setReelsLoading] = useState(false);

    // Tab 3: Audience Intelligence Data
    const [audienceData, setAudienceData] = useState(null);

    // Tab 4: CRM Leads Data
    const [leadsData, setLeadsData] = useState(null);

    // Modal state
    const [selectedPost, setSelectedPost] = useState(null);
    const [videoError, setVideoError] = useState(false);
    const [copiedCaption, setCopiedCaption] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);

    // Debounce search query (300ms)
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setReelsPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Modal state reset on selection change
    useEffect(() => {
        setVideoError(false);
        setCopiedCaption(false);
        setCopiedLink(false);
    }, [selectedPost]);

    // Modal body lock & Escape key listener
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setSelectedPost(null);
            }
        };

        if (selectedPost) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedPost]);

    // Initial load accounts
    useEffect(() => {
        loadAccounts();
    }, []);

    // Load tab-specific data
    useEffect(() => {
        if (selectedAccountId) {
            if (activeTab === 'overview') {
                loadSummaryData();
            } else if (activeTab === 'reels_studio') {
                loadReelsStudioData();
            } else if (activeTab === 'audience') {
                loadAudienceData();
            } else if (activeTab === 'leads') {
                loadLeadsData();
            }
        }
    }, [selectedAccountId, activeTab, datePreset, appliedDateFrom, appliedDateTo]);

    // Reload Reels Studio when filter options change
    useEffect(() => {
        if (activeTab === 'reels_studio' && selectedAccountId) {
            loadReelsStudioData();
        }
    }, [filterMediaType, filterBadge, debouncedSearch, sortBy, reelsPage]);

    const loadAccounts = async () => {
        try {
            setLoading(true);
            const res = await instagramService.getAccounts();
            const accountsList = res.data || [];
            setAccounts(accountsList);

            if (accountsList.length > 0) {
                setSelectedAccountId(accountsList[0].id);
                const profRes = await instagramService.getProfile(accountsList[0].id);
                setProfile(profRes.data);
            }
        } catch (error) {
            console.error('Akkauntlarni yuklashda xatolik:', error);
            toast.error("Instagram akkauntlarini yuklab bo'lmadi");
        } finally {
            setLoading(false);
        }
    };

    const getFilterDateParams = () => {
        const params = { account_id: selectedAccountId };
        if (datePreset === 'custom') {
            if (appliedDateFrom) params.date_from = appliedDateFrom;
            if (appliedDateTo) params.date_to = appliedDateTo;
        } else {
            params.period = datePreset;
        }
        return params;
    };

    const loadSummaryData = async () => {
        try {
            setLoading(true);
            const params = getFilterDateParams();
            const res = await instagramService.getSummary(params);
            if (res.data && res.data.connected) {
                setSummary(res.data);
            }
        } catch (error) {
            console.error('Summary error:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadReelsStudioData = async () => {
        try {
            setReelsLoading(true);
            const dateParams = getFilterDateParams();
            const res = await instagramService.getReelsStudio({
                ...dateParams,
                media_type: filterMediaType,
                badge: filterBadge,
                search: debouncedSearch,
                sort_by: sortBy,
                page: reelsPage,
                page_size: 12
            });
            if (res.data) {
                setReelsData(res.data);
            }
        } catch (error) {
            console.error('Reels studio error:', error);
        } finally {
            setReelsLoading(false);
        }
    };

    const loadAudienceData = async () => {
        try {
            setLoading(true);
            const res = await instagramService.getAudience(selectedAccountId);
            if (res.data) {
                setAudienceData(res.data);
            }
        } catch (error) {
            console.error('Audience error:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadLeadsData = async () => {
        try {
            setLoading(true);
            const res = await instagramService.getPostLeads();
            if (res.data) {
                setLeadsData(res.data);
            }
        } catch (error) {
            console.error('Leads error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSyncNow = async () => {
        try {
            setSyncing(true);
            toast.info("Instagram ma'lumotlari yangilanmoqda...");
            const res = await instagramService.syncNow(selectedAccountId);
            if (res.data && res.data.success) {
                toast.success(res.data.message || "Barcha postlar va statistika yangilandi!");
                if (activeTab === 'overview') loadSummaryData();
                else if (activeTab === 'reels_studio') loadReelsStudioData();
                else if (activeTab === 'audience') loadAudienceData();
                else if (activeTab === 'leads') loadLeadsData();
            } else {
                toast.error(res.data?.error || "Sinxronizatsiyada xatolik yuz berdi");
            }
        } catch (error) {
            console.error('Sync error:', error);
            toast.error("Meta Graph API bilan aloqada xatolik yuz berdi");
        } finally {
            setSyncing(false);
        }
    };

    const handleConnectAccount = async () => {
        try {
            const redirectUri = `${window.location.origin}/instagram/callback`;
            const res = await instagramService.getAuthUrl(redirectUri);
            if (res.data && res.data.auth_url) {
                window.location.href = res.data.auth_url;
            }
        } catch (error) {
            console.error('Connect error:', error);
            toast.error("Ulanish havolasini olishda xatolik");
        }
    };

    const handleSelectPreset = (presetKey) => {
        setDatePreset(presetKey);
        if (presetKey === 'custom') {
            const todayStr = new Date().toISOString().slice(0, 10);
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
            const from = customDateFrom || thirtyDaysAgo;
            const to = customDateTo || todayStr;
            setCustomDateFrom(from);
            setCustomDateTo(to);
            setAppliedDateFrom(from);
            setAppliedDateTo(to);
        } else {
            setAppliedDateFrom('');
            setAppliedDateTo('');
        }
        setReelsPage(1);
    };

    const handleApplyCustomDates = () => {
        const todayStr = new Date().toISOString().slice(0, 10);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        
        let from = customDateFrom;
        let to = customDateTo;

        if (!from && !to) {
            from = thirtyDaysAgo;
            to = todayStr;
            setCustomDateFrom(from);
            setCustomDateTo(to);
        }

        if (from && to && from > to) {
            toast.error("Boshlang'ich sana tugash sanasidan katta bo'lishi mumkin emas");
            return;
        }

        setAppliedDateFrom(from || '');
        setAppliedDateTo(to || '');
        setReelsPage(1);
        toast.success("Sana filtri qo'llandi");
    };

    const handleClearCustomDates = () => {
        setCustomDateFrom('');
        setCustomDateTo('');
        setAppliedDateFrom('');
        setAppliedDateTo('');
        setDatePreset('30d');
        setReelsPage(1);
        toast.info("Standart davrga qaytarildi (30 kun)");
    };

    const handleResetAllFilters = () => {
        setFilterMediaType('ALL');
        setFilterBadge('ALL');
        setSearchQuery('');
        setDebouncedSearch('');
        setSortBy('newest');
        setDatePreset('30d');
        setCustomDateFrom('');
        setCustomDateTo('');
        setAppliedDateFrom('');
        setAppliedDateTo('');
        setReelsPage(1);
        toast.info("Barcha filtrlar tozalandi");
    };

    const hasActiveFilters = useMemo(() => {
        return (
            filterMediaType !== 'ALL' ||
            filterBadge !== 'ALL' ||
            debouncedSearch !== '' ||
            sortBy !== 'newest' ||
            datePreset !== '30d' ||
            appliedDateFrom !== '' ||
            appliedDateTo !== ''
        );
    }, [filterMediaType, filterBadge, debouncedSearch, sortBy, datePreset, appliedDateFrom, appliedDateTo]);

    // Export current filtered results to CSV
    const handleExportCSV = () => {
        if (!reelsData.results || reelsData.results.length === 0) {
            toast.error("Eksport qilish uchun postlar mavjud emas");
            return;
        }

        const headers = ['ID', 'Turi', 'Sana', 'Layklar', 'Izohlar', 'Qamrov', "Ko'rishlar", 'Saqlanganlar', 'Ulashishlar', 'ER (%)', 'Belgi', 'Havola', 'Tavsif'];
        const rows = reelsData.results.map(post => [
            post.id,
            post.media_type,
            new Date(post.timestamp).toISOString(),
            post.like_count,
            post.comments_count,
            post.reach,
            post.impressions,
            post.saved,
            post.shares,
            post.engagement_rate,
            post.performance_badge,
            post.permalink || '',
            `"${(post.caption || '').replace(/"/g, '""')}"`
        ]);

        const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `instagram_posts_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Eksport qilindi: CSV fayl yuklab olindi");
    };

    // Format numbers
    const formatNum = (num) => {
        if (!num && num !== 0) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toLocaleString();
    };

    // Copy caption helper
    const handleCopyCaption = (text) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedCaption(true);
        toast.success("Tavsifdan nusxa olindi!");
        setTimeout(() => setCopiedCaption(false), 2000);
    };

    // Copy link helper
    const handleCopyLink = (link) => {
        if (!link) return;
        navigator.clipboard.writeText(link);
        setCopiedLink(true);
        toast.success("Instagram havolasi nusxalandi!");
        setTimeout(() => setCopiedLink(false), 2000);
    };

    // Performance badge renderer
    const renderBadge = (badge) => {
        if (badge === 'viral') {
            return <span className="ig-badge ig-badge-viral"><Sparkles size={12} /> Virusli</span>;
        }
        if (badge === 'high') {
            return <span className="ig-badge ig-badge-high"><Zap size={12} /> Yuqori faollik</span>;
        }
        return <span className="ig-badge ig-badge-normal">Standart</span>;
    };

    if (loading && !summary && !reelsData.results.length) {
        return (
            <div className="ig-loading-screen">
                <div className="ig-spinner"></div>
                <p>Instagram analitika markazi yuklanmoqda...</p>
            </div>
        );
    }

    if (!accounts.length && !profile?.connected) {
        return (
            <div className="ig-connect-container">
                <div className="ig-connect-card">
                    <div className="ig-logo-badge">
                        <div className="ig-gradient-ring">
                            <Activity size={40} className="text-white" />
                        </div>
                    </div>
                    <h2>Instagram Marketing Markazi</h2>
                    <p className="ig-connect-desc">
                        Maktabingizning Instagram sahifasini ulang va professional analitika,
                        Reels tahlili, auditoriya geografiyasi hamda CRM leadlarini real vaqtda kuzating.
                    </p>
                    <button onClick={handleConnectAccount} className="ig-btn-primary ig-btn-large">
                        <Zap size={18} /> Instagram Akkauntni Ulash
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="ig-dashboard-container">
            {/* ── 1. Top Header & Account Bar ── */}
            <header className="ig-top-header">
                <div className="ig-header-left">
                    <div className="ig-avatar-wrapper">
                        {profile?.profile_picture_url ? (
                            <img src={profile.profile_picture_url} alt="Profile" className="ig-avatar" />
                        ) : (
                            <div className="ig-avatar-placeholder">
                                <Users size={24} />
                            </div>
                        )}
                        <span className="ig-online-dot" title="Faol ulanish"></span>
                    </div>
                    <div className="ig-header-info">
                        <div className="ig-header-title-row">
                            <h1 className="ig-title">@{summary?.username || profile?.username || 'ebru__school'}</h1>
                            <span className="ig-account-type-badge">Business & CRM</span>
                        </div>
                        <p className="ig-subtitle">
                            {summary?.kpis?.followers ? formatNum(summary.kpis.followers) : '816'} obunachi • {summary?.kpis?.total_posts || '84'} post & reels
                        </p>
                    </div>
                </div>

                <div className="ig-header-actions">
                    <button
                        onClick={handleSyncNow}
                        disabled={syncing}
                        className={`ig-btn-secondary ${syncing ? 'loading' : ''}`}
                        title="Meta Graph API dan yangi ma'lumotlarni tortib olish"
                    >
                        <RefreshCw size={16} className={syncing ? 'spin-icon' : ''} />
                        <span>{syncing ? 'Sinxronlanmoqda...' : 'Sinxronlash'}</span>
                    </button>
                </div>
            </header>

            {/* ── 2. Modern Navigation Tabs ── */}
            <nav className="ig-nav-tabs">
                <button
                    className={`ig-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    <BarChart3 size={18} />
                    <span>Umumiy Boshqaruv</span>
                </button>
                <button
                    className={`ig-tab-btn ${activeTab === 'reels_studio' ? 'active' : ''}`}
                    onClick={() => setActiveTab('reels_studio')}
                >
                    <Video size={18} />
                    <span>Reels & Kontent Studio</span>
                    <span className="ig-tab-counter">{summary?.kpis?.total_posts || '84'}</span>
                </button>
                <button
                    className={`ig-tab-btn ${activeTab === 'audience' ? 'active' : ''}`}
                    onClick={() => setActiveTab('audience')}
                >
                    <MapPin size={18} />
                    <span>Auditoriya & Geografiya</span>
                </button>
                <button
                    className={`ig-tab-btn ${activeTab === 'leads' ? 'active' : ''}`}
                    onClick={() => setActiveTab('leads')}
                >
                    <Target size={18} />
                    <span>CRM Lead Konversiyasi</span>
                </button>
            </nav>

            {/* ── 3. Global Date Range Selector Bar (Overview & Reels Tabs) ── */}
            {(activeTab === 'overview' || activeTab === 'reels_studio') && (
                <div className="ig-global-date-bar">
                    <div className="ig-date-presets-row">
                        <span className="ig-date-bar-label">
                            <Calendar size={15} />
                            <span>Davr:</span>
                        </span>
                        <div className="ig-period-pills">
                            {DATE_PRESETS.map(item => (
                                <button
                                    key={item.key}
                                    className={`ig-period-btn ${datePreset === item.key ? 'active' : ''}`}
                                    onClick={() => handleSelectPreset(item.key)}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Date Range Picker Inputs */}
                    {datePreset === 'custom' && (
                        <div className="ig-custom-datepicker-wrap">
                            <div className="ig-date-input-group">
                                <label>Dan:</label>
                                <input
                                    type="date"
                                    value={customDateFrom}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setCustomDateFrom(val);
                                        if (val) {
                                            setAppliedDateFrom(val);
                                            setReelsPage(1);
                                        }
                                    }}
                                    className="ig-date-input"
                                />
                            </div>
                            <div className="ig-date-input-group">
                                <label>Gacha:</label>
                                <input
                                    type="date"
                                    value={customDateTo}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setCustomDateTo(val);
                                        if (val) {
                                            setAppliedDateTo(val);
                                            setReelsPage(1);
                                        }
                                    }}
                                    className="ig-date-input"
                                />
                            </div>
                            <button onClick={handleApplyCustomDates} className="ig-btn-apply-date">
                                Qo'llash
                            </button>
                            <button onClick={handleClearCustomDates} className="ig-btn-clear-date" title="Tozalash">
                                <X size={15} />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ── 4. Tab Contents ── */}
            <main className="ig-tab-content">
                {/* ══════════════ TAB 1: EXECUTIVE OVERVIEW ══════════════ */}
                {activeTab === 'overview' && summary && (
                    <div className="ig-overview-section">
                        {/* Period Active Banner */}
                        <div className="ig-period-active-banner">
                            <div className="ig-banner-text">
                                <Calendar size={16} className="text-pink-400" />
                                <span>
                                    Tanlangan oraliq: <strong>{datePreset === 'custom' ? `${appliedDateFrom || customDateFrom} — ${appliedDateTo || customDateTo}` : DATE_PRESETS.find(d => d.key === datePreset)?.label}</strong>
                                    {' '}• <strong>{summary.kpis?.period_posts || 0} ta post</strong> topildi (jami {summary.kpis?.total_posts || 84} tadan)
                                </span>
                            </div>
                            <div className="ig-banner-stats">
                                <span>❤️ {formatNum(summary.kpis?.likes)} layk</span>
                                <span>💬 {formatNum(summary.kpis?.comments)} izoh</span>
                                <span>👥 {formatNum(summary.kpis?.reach)} qamrov</span>
                            </div>
                        </div>

                        {/* 4 Smart KPI Cards */}
                        <div className="ig-kpi-grid">
                            <div className="ig-kpi-card">
                                <div className="ig-kpi-header">
                                    <span className="ig-kpi-label">Tanlangan Davrda Postlar</span>
                                    <div className="ig-kpi-icon-wrap ig-icon-purple">
                                        <Video size={20} />
                                    </div>
                                </div>
                                <div className="ig-kpi-value">{summary.kpis?.period_posts || 0} ta</div>
                                <div className="ig-kpi-footer">
                                    <span className="ig-trend-badge positive">
                                        <ArrowUpRight size={14} /> Jami: {summary.kpis?.total_posts || 84} tadan
                                    </span>
                                    <span className="ig-kpi-hint">faol kontentlar</span>
                                </div>
                            </div>

                            <div className="ig-kpi-card">
                                <div className="ig-kpi-header">
                                    <span className="ig-kpi-label">Haqiqiy Qamrov (Reach)</span>
                                    <div className="ig-kpi-icon-wrap ig-icon-pink">
                                        <Eye size={20} />
                                    </div>
                                </div>
                                <div className="ig-kpi-value">{formatNum(summary.kpis?.reach || 0)}</div>
                                <div className="ig-kpi-footer">
                                    <span className="ig-trend-badge neutral">
                                        <Activity size={14} /> Noyob ko'rishlar
                                    </span>
                                    <span className="ig-kpi-hint">tanlangan oraliqda</span>
                                </div>
                            </div>

                            <div className="ig-kpi-card">
                                <div className="ig-kpi-header">
                                    <span className="ig-kpi-label">Jami Reaksiyalar</span>
                                    <div className="ig-kpi-icon-wrap ig-icon-orange">
                                        <Zap size={20} />
                                    </div>
                                </div>
                                <div className="ig-kpi-value">{formatNum(summary.kpis?.total_interactions || 0)}</div>
                                <div className="ig-kpi-footer">
                                    <span className="ig-pill-detail">❤️ {formatNum(summary.kpis?.likes)}</span>
                                    <span className="ig-pill-detail">💬 {formatNum(summary.kpis?.comments)}</span>
                                    <span className="ig-pill-detail">🔖 {formatNum(summary.kpis?.saved)}</span>
                                    <span className="ig-pill-detail">↗️ {formatNum(summary.kpis?.shares)}</span>
                                </div>
                            </div>

                            <div className="ig-kpi-card">
                                <div className="ig-kpi-header">
                                    <span className="ig-kpi-label">O'rtacha Faollik (ER)</span>
                                    <div className="ig-kpi-icon-wrap ig-icon-teal">
                                        <TrendingUp size={20} />
                                    </div>
                                </div>
                                <div className="ig-kpi-value">{summary.kpis?.avg_engagement_rate || 0}%</div>
                                <div className="ig-kpi-footer">
                                    <span className="ig-trend-badge positive">
                                        <CheckCircle2 size={14} /> Yuqori faollik
                                    </span>
                                    <span className="ig-kpi-hint">soha normasi 2-3%</span>
                                </div>
                            </div>
                        </div>

                        {/* Charts Row */}
                        <div className="ig-charts-row">
                            <div className="ig-card ig-chart-card">
                                <div className="ig-card-header">
                                    <div>
                                        <h3 className="ig-card-title">Qamrov va Faollik Dinamikasi</h3>
                                        <p className="ig-card-desc">Tanlangan oraliqda postlar, qamrov va foydalanuvchilar faolligi</p>
                                    </div>
                                </div>
                                <div className="ig-chart-container">
                                    <ResponsiveContainer width="100%" height={260}>
                                        <AreaChart data={summary.daily_trends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="reachGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#e1306c" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="#e1306c" stopOpacity={0.0} />
                                                </linearGradient>
                                                <linearGradient id="interactionGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#833ab4" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="#833ab4" stopOpacity={0.0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#2a2e3d" vertical={false} />
                                            <XAxis dataKey="formatted_date" stroke="#71788e" fontSize={12} tickLine={false} />
                                            <YAxis stroke="#71788e" fontSize={12} tickLine={false} axisLine={false} />
                                            <Tooltip
                                                contentStyle={{ background: '#1c202f', border: '1px solid #2e354b', borderRadius: '8px', color: '#fff' }}
                                                labelStyle={{ fontWeight: 'bold', color: '#ff758c' }}
                                            />
                                            <Area type="monotone" dataKey="reach" name="Qamrov (Reach)" stroke="#e1306c" strokeWidth={2.5} fillOpacity={1} fill="url(#reachGradient)" />
                                            <Area type="monotone" dataKey="interactions" name="Reaksiyalar" stroke="#833ab4" strokeWidth={2.5} fillOpacity={1} fill="url(#interactionGradient)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Format Performance Comparison */}
                            <div className="ig-card ig-format-card">
                                <div className="ig-card-header">
                                    <div>
                                        <h3 className="ig-card-title">Formatlar Samaradorligi</h3>
                                        <p className="ig-card-desc">Reels, Rasm va Karusellar taqqoslanishi</p>
                                    </div>
                                </div>

                                <div className="ig-format-list">
                                    {['VIDEO', 'IMAGE', 'CAROUSEL_ALBUM'].map(type => {
                                        const item = summary.format_performance?.[type] || { label: type, count: 0, avg_likes: 0, avg_engagement_rate: 0 };
                                        const isReel = type === 'VIDEO';
                                        return (
                                            <div key={type} className={`ig-format-item ${isReel ? 'highlight' : ''}`}>
                                                <div className="ig-format-icon">
                                                    {type === 'VIDEO' ? <Video size={20} /> : type === 'IMAGE' ? <ImageIcon size={20} /> : <Layers size={20} />}
                                                </div>
                                                <div className="ig-format-body">
                                                    <div className="ig-format-title-row">
                                                        <span className="ig-format-name">{item.label} ({item.count} ta)</span>
                                                        <span className="ig-format-er">{item.avg_engagement_rate}% faollik</span>
                                                    </div>
                                                    <div className="ig-format-bar-wrap">
                                                        <div
                                                            className="ig-format-bar"
                                                            style={{
                                                                width: `${Math.min(item.avg_engagement_rate * 10, 100)}%`,
                                                                background: isReel ? 'linear-gradient(90deg, #e1306c, #f77737)' : '#4f5975'
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <div className="ig-format-stats">
                                                        <span>O'rtacha layk: <strong>{item.avg_likes}</strong></span>
                                                        {isReel && <span className="ig-tag-best">⭐ Eng yuqori natija</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Best Time Heatmap & AI Recommendations */}
                        <div className="ig-bottom-grid">
                            <div className="ig-card ig-heatmap-card">
                                <div className="ig-card-header">
                                    <div>
                                        <h3 className="ig-card-title">Eng Yaxshi Post Vaqti (Heatmap)</h3>
                                        <p className="ig-card-desc">Tarixiy faollik asosida hisoblangan haftalik jadval</p>
                                    </div>
                                    <div className="ig-best-pill">
                                        <Clock size={14} />
                                        <span>{summary.best_time_heatmap?.best_day}: {summary.best_time_heatmap?.best_time_window}</span>
                                    </div>
                                </div>

                                <div className="ig-heatmap-wrapper">
                                    <div className="ig-heatmap-grid">
                                        <div className="ig-heatmap-row-header">
                                            <span>Kun / Soat</span>
                                            <div className="ig-heatmap-hours">
                                                <span>09:00</span>
                                                <span>12:00</span>
                                                <span>15:00</span>
                                                <span>18:00</span>
                                                <span>21:00</span>
                                            </div>
                                        </div>

                                        {summary.best_time_heatmap?.days?.map((dayName, dayIdx) => (
                                            <div key={dayName} className="ig-heatmap-row">
                                                <span className="ig-day-label">{dayName.slice(0, 3)}</span>
                                                <div className="ig-cells-row">
                                                    {summary.best_time_heatmap.matrix[dayIdx]?.map((val, hourIdx) => {
                                                        const intensity = Math.min(Math.floor(val / 30), 4);
                                                        return (
                                                            <div
                                                                key={hourIdx}
                                                                className={`ig-heat-cell heat-${intensity}`}
                                                                title={`${dayName} soat ${hourIdx}:00 — Faollik balli: ${val}`}
                                                            ></div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="ig-heatmap-legend">
                                        <span>Kam faol</span>
                                        <div className="ig-legend-cells">
                                            <span className="ig-heat-cell heat-0"></span>
                                            <span className="ig-heat-cell heat-1"></span>
                                            <span className="ig-heat-cell heat-2"></span>
                                            <span className="ig-heat-cell heat-3"></span>
                                            <span className="ig-heat-cell heat-4"></span>
                                        </div>
                                        <span>Juda faol 🔥</span>
                                    </div>
                                </div>
                            </div>

                            <div className="ig-card ig-ai-card">
                                <div className="ig-card-header">
                                    <div>
                                        <h3 className="ig-card-title flex items-center gap-2">
                                            <Sparkles size={18} className="text-yellow-400" />
                                            Aqlli Marketing Tavsiyalari
                                        </h3>
                                        <p className="ig-card-desc">Maktab profilini rivojlantirish bo'yicha maslahatlar</p>
                                    </div>
                                </div>

                                <div className="ig-ai-list">
                                    {summary.recommendations?.map(rec => (
                                        <div key={rec.id} className="ig-ai-item">
                                            <div className="ig-ai-tag-row">
                                                <span className="ig-ai-tag">{rec.tag}</span>
                                                <span className="ig-ai-badge">Amaliy maslahat</span>
                                            </div>
                                            <h4 className="ig-ai-title">{rec.title}</h4>
                                            <p className="ig-ai-desc">{rec.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Top 5 Performing Posts */}
                        <div className="ig-card ig-top-posts-card">
                            <div className="ig-card-header">
                                <div>
                                    <h3 className="ig-card-title">⭐ Eng Muvaffaqiyatli Postlar</h3>
                                    <p className="ig-card-desc">Eng ko'p reaksiyalar va qiziqish to'plagan kontentlar</p>
                                </div>
                                <button className="ig-btn-link" onClick={() => setActiveTab('reels_studio')}>
                                    Barcha postlarni ko'rish ↗
                                </button>
                            </div>

                            <div className="ig-top-posts-grid">
                                {summary.top_posts?.map(post => (
                                    <div key={post.id} className="ig-mini-post-card" onClick={() => setSelectedPost(post)}>
                                        <div className="ig-mini-thumb-wrap">
                                            <img
                                                src={post.thumbnail_url || post.media_url}
                                                alt="Post"
                                                className="ig-mini-thumb"
                                                onError={(e) => {
                                                    if (post.thumbnail_url && e.target.src !== post.thumbnail_url) {
                                                        e.target.src = post.thumbnail_url;
                                                    }
                                                }}
                                            />
                                            {post.media_type === 'VIDEO' && (
                                                <div className="ig-play-overlay">
                                                    <Play size={18} fill="#fff" />
                                                </div>
                                            )}
                                            <div className="ig-badge-overlay">
                                                {renderBadge(post.performance_badge)}
                                            </div>
                                        </div>
                                        <div className="ig-mini-post-info">
                                            <div className="ig-mini-metrics">
                                                <span>❤️ {formatNum(post.like_count)}</span>
                                                <span>💬 {formatNum(post.comments_count)}</span>
                                                <span>⚡ {post.engagement_rate}%</span>
                                            </div>
                                            <p className="ig-mini-caption">{post.caption || "Izohsiz post"}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ══════════════ TAB 2: REELS & CONTENT STUDIO ══════════════ */}
                {activeTab === 'reels_studio' && (
                    <div className="ig-studio-section">
                        {/* Filters Control Center */}
                        <div className="ig-filters-card">
                            {/* Search bar */}
                            <div className="ig-search-box">
                                <Search size={18} className="ig-search-icon" />
                                <input
                                    type="text"
                                    placeholder="Post tavsifi yoki kalit so'zdan qidirish (avto-filtr)..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="ig-search-input"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => { setSearchQuery(''); setReelsPage(1); }}
                                        className="ig-search-clear"
                                        title="Qidiruvni tozalash"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            {/* Format Filter with Live Dynamic Counts */}
                            <div className="ig-filter-group">
                                <span className="ig-filter-label">Format:</span>
                                <div className="ig-filter-pills">
                                    {[
                                        { key: 'ALL', label: `Hammasi (${reelsData.format_counts?.ALL ?? reelsData.count})` },
                                        { key: 'VIDEO', label: `🎬 Reels (${reelsData.format_counts?.VIDEO ?? 0})` },
                                        { key: 'IMAGE', label: `📸 Rasm (${reelsData.format_counts?.IMAGE ?? 0})` },
                                        { key: 'CAROUSEL_ALBUM', label: `🎠 Karusel (${reelsData.format_counts?.CAROUSEL_ALBUM ?? 0})` }
                                    ].map(item => (
                                        <button
                                            key={item.key}
                                            className={`ig-pill-btn ${filterMediaType === item.key ? 'active' : ''}`}
                                            onClick={() => { setFilterMediaType(item.key); setReelsPage(1); }}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Badge Filter with Live Dynamic Counts */}
                            <div className="ig-filter-group">
                                <span className="ig-filter-label">Samaradorlik:</span>
                                <div className="ig-filter-pills">
                                    {[
                                        { key: 'ALL', label: `Barchasi (${reelsData.badge_counts?.ALL ?? reelsData.count})` },
                                        { key: 'viral', label: `🔥 Virusli (${reelsData.badge_counts?.viral ?? 0})` },
                                        { key: 'high', label: `⭐ Yuqori (${reelsData.badge_counts?.high ?? 0})` },
                                        { key: 'normal', label: `📊 Standart (${reelsData.badge_counts?.normal ?? 0})` }
                                    ].map(item => (
                                        <button
                                            key={item.key}
                                            className={`ig-pill-btn ${filterBadge === item.key ? 'active' : ''}`}
                                            onClick={() => { setFilterBadge(item.key); setReelsPage(1); }}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sort Selector */}
                            <div className="ig-sort-wrap">
                                <span className="ig-filter-label">Saralash:</span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => { setSortBy(e.target.value); setReelsPage(1); }}
                                    className="ig-select"
                                >
                                    {SORT_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* CSV Export Button */}
                            <button
                                onClick={handleExportCSV}
                                className="ig-btn-export"
                                title="Hozirgi filtrlangan postlarni Excel/CSV formatida yuklab olish"
                            >
                                <Download size={15} />
                                <span>CSV Eksport</span>
                            </button>
                        </div>

                        {/* Active Filters Tag Bar (Displays when filters are active) */}
                        {hasActiveFilters && (
                            <div className="ig-active-filters-bar">
                                <span className="ig-active-label">Faol filtrlar:</span>
                                <div className="ig-active-tags-list">
                                    {filterMediaType !== 'ALL' && (
                                        <span className="ig-tag-chip">
                                            Format: {filterMediaType === 'VIDEO' ? 'Reels' : filterMediaType === 'IMAGE' ? 'Rasm' : 'Karusel'}
                                            <button onClick={() => { setFilterMediaType('ALL'); setReelsPage(1); }}><X size={12} /></button>
                                        </span>
                                    )}
                                    {filterBadge !== 'ALL' && (
                                        <span className="ig-tag-chip">
                                            Belgi: {filterBadge === 'viral' ? '🔥 Virusli' : filterBadge === 'high' ? '⭐ Yuqori' : 'Standart'}
                                            <button onClick={() => { setFilterBadge('ALL'); setReelsPage(1); }}><X size={12} /></button>
                                        </span>
                                    )}
                                    {debouncedSearch && (
                                        <span className="ig-tag-chip">
                                            Qidiruv: "{debouncedSearch}"
                                            <button onClick={() => { setSearchQuery(''); setReelsPage(1); }}><X size={12} /></button>
                                        </span>
                                    )}
                                    {datePreset !== '30d' && (
                                        <span className="ig-tag-chip">
                                            Davr: {datePreset === 'custom' ? `${appliedDateFrom || '...'} ~ ${appliedDateTo || '...'}` : datePreset}
                                            <button onClick={() => { setDatePreset('30d'); setAppliedDateFrom(''); setAppliedDateTo(''); setReelsPage(1); }}><X size={12} /></button>
                                        </span>
                                    )}
                                    {sortBy !== 'newest' && (
                                        <span className="ig-tag-chip">
                                            Saralash: {SORT_OPTIONS.find(s => s.value === sortBy)?.label.split(' ')[1] || sortBy}
                                            <button onClick={() => { setSortBy('newest'); setReelsPage(1); }}><X size={12} /></button>
                                        </span>
                                    )}
                                </div>
                                <button onClick={handleResetAllFilters} className="ig-btn-reset-filters">
                                    <RotateCcw size={13} />
                                    <span>Filtrlarni tozalash</span>
                                </button>
                            </div>
                        )}

                        {/* Aggregated Studio Summary Bar */}
                        <div className="ig-studio-summary-bar">
                            <span>Topildi: <strong>{reelsData.count} ta kontent</strong></span>
                            <span>Jami qamrov: <strong>{formatNum(reelsData.stats?.total_reach)}</strong></span>
                            <span>Jami layklar: <strong>{formatNum(reelsData.stats?.total_likes)}</strong></span>
                            <span>Jami izohlar: <strong>{formatNum(reelsData.stats?.total_comments)}</strong></span>
                            <span>Saqlanganlar: <strong>{formatNum(reelsData.stats?.total_saved)}</strong></span>
                            <span>Ulashishlar: <strong>{formatNum(reelsData.stats?.total_shares)}</strong></span>
                            <span>O'rtacha faollik: <strong>{reelsData.stats?.avg_engagement_rate}%</strong></span>
                        </div>

                        {/* Media Grid */}
                        {reelsLoading ? (
                            <div className="ig-studio-loading">
                                <div className="ig-spinner"></div>
                                <p>Kontentlar saralanmoqda va filtrlari hisoblanmoqda...</p>
                            </div>
                        ) : reelsData.results.length === 0 ? (
                            <div className="ig-empty-state">
                                <AlertCircle size={44} className="text-gray-400" />
                                <h3>Tanlangan parametrlar bo'yicha kontent topilmadi</h3>
                                <p>Filtrlarni o'zgartirib yoki tozalab ko'ring.</p>
                                <button onClick={handleResetAllFilters} className="ig-btn-secondary mt-3">
                                    <RotateCcw size={15} /> Filtrlarni qayta o'rnatish
                                </button>
                            </div>
                        ) : (
                            <div className="ig-media-grid">
                                {reelsData.results.map(item => (
                                    <div key={item.id} className="ig-media-card">
                                        <div className="ig-card-preview" onClick={() => setSelectedPost(item)}>
                                            <img
                                                src={item.thumbnail_url || item.media_url}
                                                alt="Post thumbnail"
                                                className="ig-media-thumb"
                                                loading="lazy"
                                                onError={(e) => {
                                                    if (item.thumbnail_url && e.target.src !== item.thumbnail_url) {
                                                        e.target.src = item.thumbnail_url;
                                                    }
                                                }}
                                            />
                                            {item.media_type === 'VIDEO' && (
                                                <div className="ig-card-play-icon">
                                                    <Play size={26} fill="#fff" />
                                                </div>
                                            )}
                                            <div className="ig-card-badge-top">
                                                {renderBadge(item.performance_badge)}
                                            </div>
                                            <div className="ig-card-hover-stats">
                                                <span>❤️ {formatNum(item.like_count)}</span>
                                                <span>💬 {formatNum(item.comments_count)}</span>
                                                <span>👥 {formatNum(item.reach)}</span>
                                                <span>⚡ {item.engagement_rate}%</span>
                                            </div>
                                        </div>

                                        <div className="ig-card-content">
                                            <div className="ig-card-date-row">
                                                <span className="ig-card-date">
                                                    {new Date(item.timestamp).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                                <span className="ig-card-type-tag">
                                                    {item.media_type === 'VIDEO' ? '🎬 Reels' : item.media_type === 'IMAGE' ? '📸 Rasm' : '🎠 Karusel'}
                                                </span>
                                            </div>
                                            <p className="ig-card-caption">
                                                {item.caption ? (item.caption.length > 90 ? item.caption.slice(0, 90) + '...' : item.caption) : "Izoh mavjud emas"}
                                            </p>
                                            <div className="ig-card-actions">
                                                <button className="ig-card-btn-view" onClick={() => setSelectedPost(item)}>
                                                    Batafsil
                                                </button>
                                                {item.permalink && (
                                                    <a
                                                        href={item.permalink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="ig-card-btn-link"
                                                        title="Instagram ilovasida ochish"
                                                    >
                                                        <ExternalLink size={15} />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {reelsData.total_pages > 1 && (
                            <div className="ig-pagination">
                                <button
                                    disabled={reelsPage <= 1}
                                    onClick={() => setReelsPage(prev => Math.max(prev - 1, 1))}
                                    className="ig-page-btn"
                                >
                                    <ChevronLeft size={16} /> Oldingi
                                </button>
                                <span className="ig-page-indicator">
                                    Sahifa <strong>{reelsData.page}</strong> / {reelsData.total_pages} (Jami {reelsData.count} ta)
                                </span>
                                <button
                                    disabled={reelsPage >= reelsData.total_pages}
                                    onClick={() => setReelsPage(prev => Math.min(prev + 1, reelsData.total_pages))}
                                    className="ig-page-btn"
                                >
                                    Keyingi <ChevronRight size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════════ TAB 3: AUDIENCE & GEOGRAPHY ══════════════ */}
                {activeTab === 'audience' && audienceData && (
                    <div className="ig-audience-section">
                        <div className="ig-audience-grid">
                            <div className="ig-card ig-audience-cities-card">
                                <div className="ig-card-header">
                                    <div>
                                        <h3 className="ig-card-title">O'zbekiston Shaharlari Taqsimoti</h3>
                                        <p className="ig-card-desc">Obunachilarning hududiy joylashuvi va ulushi</p>
                                    </div>
                                    <div className="ig-best-pill">
                                        <MapPin size={14} />
                                        <span>Asosiy: {audienceData.top_region}</span>
                                    </div>
                                </div>

                                <div className="ig-city-progress-list">
                                    {audienceData.cities?.map((c, idx) => (
                                        <div key={idx} className="ig-city-item">
                                            <div className="ig-city-header">
                                                <span className="ig-city-name">{c.city}</span>
                                                <span className="ig-city-count">{c.count} kishi ({c.percentage}%)</span>
                                            </div>
                                            <div className="ig-city-track">
                                                <div
                                                    className="ig-city-fill"
                                                    style={{
                                                        width: `${Math.min(c.percentage * 2.2, 100)}%`,
                                                        background: idx === 0
                                                            ? 'linear-gradient(90deg, #e1306c, #f77737)'
                                                            : idx === 1
                                                                ? 'linear-gradient(90deg, #833ab4, #e1306c)'
                                                                : '#4f5975'
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="ig-card ig-audience-insights-card">
                                <div className="ig-card-header">
                                    <h3 className="ig-card-title flex items-center gap-2">
                                        <Target size={18} className="text-pink-500" />
                                        Hududiy Marketing Strategiyasi
                                    </h3>
                                </div>

                                <div className="ig-geo-box">
                                    <div className="ig-geo-stat-number">{audienceData.total_tracked_audience}</div>
                                    <p className="ig-geo-stat-label">Tahlil qilingan obunachilar soni</p>
                                    <p className="ig-geo-desc">{audienceData.audience_summary}</p>
                                </div>

                                <div className="ig-geo-tips">
                                    <div className="ig-geo-tip-item">
                                        <CheckCircle2 size={16} className="text-teal-400" />
                                        <span>Tuproqqal'a va Hazorasp ota-onalariga mo'ljallangan qabul reklamalarini kuchaytiring.</span>
                                    </div>
                                    <div className="ig-geo-tip-item">
                                        <CheckCircle2 size={16} className="text-teal-400" />
                                        <span>Maktab yotoqxonasi va transport xizmati haqidagi postlar qo'shni tumanlardan o'quvchilarni jalb qilishda eng samarali.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══════════════ TAB 4: CRM LEAD CONVERSION ══════════════ */}
                {activeTab === 'leads' && leadsData && (
                    <div className="ig-leads-section">
                        {/* How it Works / Educational Guide Banner */}
                        <div className="ig-card ig-guide-banner">
                            <div className="ig-guide-header">
                                <div className="ig-guide-icon-badge">
                                    <Target size={22} className="text-pink-400" />
                                </div>
                                <div className="ig-guide-info">
                                    <h3 className="ig-guide-title">Instagram ➡️ CRM Qabul Konversiyasi qanday ishlaydi?</h3>
                                    <p className="ig-guide-desc">
                                        Ushbu bo'lim Instagram tarmog'idan kelgan ota-onalar murojaatini (lead), ularning ochiq darsdagi ishtirokini
                                        va yakunda maktabga qabul qilingan o'quvchilar sonini (haqiqiy ROI) avtomatik bog'lab beradi.
                                    </p>
                                </div>
                                <a href="/leads" className="ig-btn-primary ig-guide-cta">
                                    <Users size={16} /> CRM Leadlariga O'tish ↗
                                </a>
                            </div>

                            <div className="ig-guide-steps-grid">
                                <div className="ig-step-item">
                                    <span className="ig-step-num">1</span>
                                    <div>
                                        <h4 className="ig-step-title">Murojaatni qabul qilish</h4>
                                        <p className="ig-step-desc">Instagram Direct, izohlar yoki bio-havoladan telefon qilgan ota-onani CRM ga qo'shing.</p>
                                    </div>
                                </div>
                                <div className="ig-step-item">
                                    <span className="ig-step-num">2</span>
                                    <div>
                                        <h4 className="ig-step-title">Manbani belgilash</h4>
                                        <p className="ig-step-desc">Lead ma'lumotida <strong>"Qayerdan eshitgan" (Manba)</strong> maydonini <strong>"Instagramda"</strong> deb tanlang.</p>
                                    </div>
                                </div>
                                <div className="ig-step-item">
                                    <span className="ig-step-num">3</span>
                                    <div>
                                        <h4 className="ig-step-title">Shartnoma va Qabul</h4>
                                        <p className="ig-step-desc">Mijoz o'quvchini maktabga qabul qildirgach, konversiya foizi va daromad avtomatik hisoblanadi.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Visual 4-Step Marketing Funnel */}
                        <div className="ig-card ig-funnel-card">
                            <div className="ig-card-header">
                                <div>
                                    <h3 className="ig-card-title">Marketing & Qabul Voronkasi (Conversion Funnel)</h3>
                                    <p className="ig-card-desc">Instagram qamrovidan maktab o'quvchisiga aylanishgacha bo'lgan to'liq bosqichlar</p>
                                </div>
                            </div>

                            <div className="ig-funnel-steps-row">
                                <div className="ig-funnel-step">
                                    <div className="ig-funnel-badge ig-f-1">1-bosqich</div>
                                    <div className="ig-funnel-val">{formatNum(summary?.kpis?.reach || 16443)}</div>
                                    <div className="ig-funnel-name">Instagram Qamrov</div>
                                    <p className="ig-funnel-sub">Post va Reelslarni ko'rganlar</p>
                                </div>
                                <div className="ig-funnel-arrow">➜</div>

                                <div className="ig-funnel-step">
                                    <div className="ig-funnel-badge ig-f-2">2-bosqich</div>
                                    <div className="ig-funnel-val">{leadsData.total_instagram_leads || 0} ta</div>
                                    <div className="ig-funnel-name">CRM Leadlar</div>
                                    <p className="ig-funnel-sub">Instagram manbali ota-onalar</p>
                                </div>
                                <div className="ig-funnel-arrow">➜</div>

                                <div className="ig-funnel-step">
                                    <div className="ig-funnel-badge ig-f-3">3-bosqich</div>
                                    <div className="ig-funnel-val">{leadsData.converted_clients_count || 0} ta</div>
                                    <div className="ig-funnel-name">Mijozga Aylangan</div>
                                    <p className="ig-funnel-sub">Muzokara / Ochiq dars</p>
                                </div>
                                <div className="ig-funnel-arrow">➜</div>

                                <div className="ig-funnel-step ig-funnel-winner">
                                    <div className="ig-funnel-badge ig-f-4">Yakuniy natija</div>
                                    <div className="ig-funnel-val text-teal-400">{leadsData.enrolled_students_count || 0} ta</div>
                                    <div className="ig-funnel-name">Qabul Qilingan</div>
                                    <p className="ig-funnel-sub">Shartnoma tuzgan o'quvchilar</p>
                                </div>
                            </div>
                        </div>

                        {/* 4 Smart KPI Cards */}
                        <div className="ig-kpi-grid">
                            <div className="ig-kpi-card">
                                <div className="ig-kpi-header">
                                    <span className="ig-kpi-label">Instagram Leadlari</span>
                                    <div className="ig-kpi-icon-wrap ig-icon-pink">
                                        <Target size={20} />
                                    </div>
                                </div>
                                <div className="ig-kpi-value">{leadsData.total_instagram_leads || 0} ta</div>
                                <div className="ig-kpi-footer">
                                    <span className="ig-kpi-hint">Jami CRM leadlari: {leadsData.total_all_leads || 1} ta</span>
                                </div>
                            </div>

                            <div className="ig-kpi-card">
                                <div className="ig-kpi-header">
                                    <span className="ig-kpi-label">Mijozga Aylanganlar</span>
                                    <div className="ig-kpi-icon-wrap ig-icon-orange">
                                        <UserCheck size={20} />
                                    </div>
                                </div>
                                <div className="ig-kpi-value">{leadsData.converted_clients_count || 0} ta</div>
                                <div className="ig-kpi-footer">
                                    <span className="ig-kpi-hint">Muloqotdan so'ng mijoz bo'lganlar</span>
                                </div>
                            </div>

                            <div className="ig-kpi-card">
                                <div className="ig-kpi-header">
                                    <span className="ig-kpi-label">Qabul Qilingan O'quvchilar</span>
                                    <div className="ig-kpi-icon-wrap ig-icon-teal">
                                        <Award size={20} />
                                    </div>
                                </div>
                                <div className="ig-kpi-value">{leadsData.enrolled_students_count || 0} ta</div>
                                <div className="ig-kpi-footer">
                                    <span className="ig-kpi-hint">Maktabga qabul qilingan o'quvchilar</span>
                                </div>
                            </div>

                            <div className="ig-kpi-card">
                                <div className="ig-kpi-header">
                                    <span className="ig-kpi-label">Konversiya Foizi</span>
                                    <div className="ig-kpi-icon-wrap ig-icon-purple">
                                        <TrendingUp size={20} />
                                    </div>
                                </div>
                                <div className="ig-kpi-value">{leadsData.conversion_rate_percent || 0}%</div>
                                <div className="ig-kpi-footer">
                                    <span className="ig-kpi-hint">Lead ➡️ Shartnoma unumdorligi</span>
                                </div>
                            </div>
                        </div>

                        {/* Marketing Channels Comparison */}
                        {leadsData.sources_breakdown?.length > 0 && (
                            <div className="ig-card ig-sources-card">
                                <div className="ig-card-header">
                                    <div>
                                        <h3 className="ig-card-title">Barcha Reklama va Marketing Manbalari Taqqoslanishi</h3>
                                        <p className="ig-card-desc">Qaysi tarmoq maktabga eng ko'p ota-ona va o'quvchilarni olib kelmoqda</p>
                                    </div>
                                </div>

                                <div className="ig-sources-grid">
                                    {leadsData.sources_breakdown.map((src, sIdx) => (
                                        <div key={sIdx} className={`ig-source-card ${src.is_instagram ? 'highlight-ig' : ''}`}>
                                            <div className="ig-source-top">
                                                <span className="ig-source-title">{src.label}</span>
                                                {src.is_instagram && <span className="ig-badge ig-badge-viral">Instagram</span>}
                                            </div>
                                            <div className="ig-source-numbers">
                                                <div>
                                                    <span className="ig-s-num-label">Leadlar:</span>
                                                    <span className="ig-s-num-val">{src.leads_count} ta</span>
                                                </div>
                                                <div>
                                                    <span className="ig-s-num-label">O'quvchilar:</span>
                                                    <span className="ig-s-num-val">{src.students_count} ta</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recent Leads Table */}
                        <div className="ig-card ig-leads-table-card">
                            <div className="ig-card-header">
                                <div>
                                    <h3 className="ig-card-title">Instagram Manbali Ota-onalar Ro'yxati</h3>
                                    <p className="ig-card-desc">Instagram orqali CRM ga tushgan leadlar holati</p>
                                </div>
                                <a href="/leads" className="ig-btn-link">
                                    Barcha leadlarni ko'rish ↗
                                </a>
                            </div>

                            {leadsData.recent_leads?.length === 0 ? (
                                <div className="ig-empty-state">
                                    <Target size={44} className="text-gray-400" />
                                    <h3>Hozircha "Instagram" manbali leadlar mavjud emas</h3>
                                    <p>Yangi kelgan ota-onalarni CRM dagi Leadlar bo'limida qo'shganda, ularning manbasini <strong>"Instagramda"</strong> deb belgilang.</p>
                                    <a href="/leads" className="ig-btn-primary mt-3">
                                        <Users size={16} /> Leadlar Bo'limiga O'tish
                                    </a>
                                </div>
                            ) : (
                                <div className="ig-table-responsive">
                                    <table className="ig-table">
                                        <thead>
                                            <tr>
                                                <th>Mijoz Ismi</th>
                                                <th>Telefon</th>
                                                <th>Bosqich</th>
                                                <th>Holati</th>
                                                <th>Sana</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {leadsData.recent_leads.map(lead => (
                                                <tr key={lead.id}>
                                                    <td className="font-semibold">{lead.client_name}</td>
                                                    <td>{lead.phone_number}</td>
                                                    <td>
                                                        <span
                                                            className="ig-stage-pill"
                                                            style={{ backgroundColor: `${lead.stage_color}22`, color: lead.stage_color }}
                                                        >
                                                            {lead.stage}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {lead.is_converted ? (
                                                            <span className="ig-status-converted">✅ Shartnoma tuzilgan</span>
                                                        ) : (
                                                            <span className="ig-status-pending">⏳ Jarayonda</span>
                                                        )}
                                                    </td>
                                                    <td className="text-gray-400">
                                                        {new Date(lead.created_at).toLocaleDateString('uz-UZ')}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* ── 5. Detailed Post Modal (Mounted to document.body via Portal) ── */}
            {selectedPost && createPortal(
                <div className="ig-modal-backdrop" onClick={() => setSelectedPost(null)}>
                    <div className="ig-modal-box" onClick={(e) => e.stopPropagation()}>
                        <button
                            className="ig-modal-close"
                            onClick={() => setSelectedPost(null)}
                            aria-label="Yopish"
                        >
                            <X size={20} />
                        </button>

                        <div className="ig-modal-grid">
                            <div className="ig-modal-media-col">
                                {selectedPost.media_type === 'VIDEO' ? (
                                    selectedPost.media_url && !videoError ? (
                                        <video
                                            key={selectedPost.id}
                                            src={selectedPost.media_url}
                                            poster={selectedPost.thumbnail_url}
                                            controls
                                            playsInline
                                            autoPlay
                                            muted
                                            className="ig-modal-video"
                                            onError={() => setVideoError(true)}
                                        />
                                    ) : (
                                        <img
                                            src={selectedPost.thumbnail_url || selectedPost.media_url}
                                            alt="Reels Thumbnail"
                                            className="ig-modal-img"
                                            onError={(e) => {
                                                if (selectedPost.media_url && e.target.src !== selectedPost.media_url) {
                                                    e.target.src = selectedPost.media_url;
                                                }
                                            }}
                                        />
                                    )
                                ) : (
                                    <img
                                        src={selectedPost.media_url || selectedPost.thumbnail_url}
                                        alt="Post Full"
                                        className="ig-modal-img"
                                        onError={(e) => {
                                            if (selectedPost.thumbnail_url && e.target.src !== selectedPost.thumbnail_url) {
                                                e.target.src = selectedPost.thumbnail_url;
                                            }
                                        }}
                                    />
                                )}
                                {selectedPost.media_type === 'VIDEO' && (
                                    <div className="ig-modal-video-badge">
                                        <Video size={14} /> <span>Reels Formati</span>
                                    </div>
                                )}
                            </div>

                            <div className="ig-modal-info-col">
                                <div className="ig-modal-header">
                                    <div className="ig-modal-badge-row">
                                        {renderBadge(selectedPost.performance_badge)}
                                        <span className="ig-modal-type">
                                            {selectedPost.media_type === 'VIDEO' ? '🎬 Reels' : selectedPost.media_type === 'IMAGE' ? '📸 Rasm' : '🎠 Karusel'}
                                        </span>
                                    </div>
                                    <span className="ig-modal-date">
                                        {new Date(selectedPost.timestamp).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>

                                <div className="ig-modal-caption-box">
                                    <p className="ig-modal-caption-text">
                                        {selectedPost.caption || "Ushbu post uchun matnli izoh mavjud emas."}
                                    </p>
                                </div>

                                <div className="ig-modal-metrics-grid">
                                    <div className="ig-modal-metric-card">
                                        <span className="ig-m-label">Layklar</span>
                                        <span className="ig-m-val">❤️ {formatNum(selectedPost.like_count)}</span>
                                    </div>
                                    <div className="ig-modal-metric-card">
                                        <span className="ig-m-label">Izohlar</span>
                                        <span className="ig-m-val">💬 {formatNum(selectedPost.comments_count)}</span>
                                    </div>
                                    <div className="ig-modal-metric-card">
                                        <span className="ig-m-label">Qamrov (Reach)</span>
                                        <span className="ig-m-val">👥 {formatNum(selectedPost.reach)}</span>
                                    </div>
                                    <div className="ig-modal-metric-card">
                                        <span className="ig-m-label">Ko'rishlar</span>
                                        <span className="ig-m-val">👁️ {formatNum(selectedPost.impressions || (selectedPost.reach ? selectedPost.reach * 1.3 : 0))}</span>
                                    </div>
                                    <div className="ig-modal-metric-card">
                                        <span className="ig-m-label">Saqlanganlar</span>
                                        <span className="ig-m-val">🔖 {formatNum(selectedPost.saved)}</span>
                                    </div>
                                    <div className="ig-modal-metric-card">
                                        <span className="ig-m-label">Ulashishlar</span>
                                        <span className="ig-m-val">↗️ {formatNum(selectedPost.shares)}</span>
                                    </div>
                                    <div className="ig-modal-metric-card col-span-2">
                                        <span className="ig-m-label">Faollik Darajasi (ER)</span>
                                        <span className="ig-m-val text-teal-400">⚡ {selectedPost.engagement_rate}%</span>
                                    </div>
                                </div>

                                <div className="ig-modal-actions-row">
                                    {selectedPost.caption && (
                                        <button
                                            onClick={() => handleCopyCaption(selectedPost.caption)}
                                            className="ig-modal-btn-action"
                                            title="Tavsifdan nusxa olish"
                                        >
                                            {copiedCaption ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                                            <span>{copiedCaption ? 'Nusxalandi!' : 'Tavsifni nusxalash'}</span>
                                        </button>
                                    )}
                                    {selectedPost.permalink && (
                                        <button
                                            onClick={() => handleCopyLink(selectedPost.permalink)}
                                            className="ig-modal-btn-action"
                                            title="Instagram havolasini nusxalash"
                                        >
                                            {copiedLink ? <Check size={16} className="text-green-400" /> : <Link2 size={16} />}
                                            <span>{copiedLink ? 'Havola nusxalandi!' : 'Havolani nusxalash'}</span>
                                        </button>
                                    )}
                                </div>

                                <div className="ig-modal-footer">
                                    {selectedPost.permalink && (
                                        <a
                                            href={selectedPost.permalink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="ig-btn-primary w-full"
                                        >
                                            <ExternalLink size={16} /> Instagramda Ochish
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default InstagramStats;
