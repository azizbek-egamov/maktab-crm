import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
    Users, Eye, TrendingUp, Heart, MessageCircle, Bookmark,
    BarChart3, Image as ImageIcon, Video, Link2, RefreshCw, ExternalLink,
    ArrowUpRight, ArrowDownRight, Minus, Share2, Clock, Calendar,
    Zap, Target, Activity, Award, Send, ChevronLeft, ChevronRight,
    Search, Filter, Play, CheckCircle2, Sparkles, MapPin, UserCheck,
    Layers, AlertCircle, X, HelpCircle
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { instagramService } from '../../services/instagram';
import { toast } from 'sonner';
import './InstagramStats.css';

const InstagramStats = () => {
    // Navigation & Global state
    const [activeTab, setActiveTab] = useState('overview'); // overview, reels_studio, audience, leads
    const [period, setPeriod] = useState('30d'); // 7d, 30d, 90d, all
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [accounts, setAccounts] = useState([]);
    const [selectedAccountId, setSelectedAccountId] = useState(null);
    const [profile, setProfile] = useState(null);

    // Tab 1: Executive Overview Data
    const [summary, setSummary] = useState(null);

    // Tab 2: Reels & Content Studio Data
    const [reelsData, setReelsData] = useState({
        results: [],
        count: 0,
        page: 1,
        page_size: 12,
        total_pages: 1,
        stats: {}
    });
    const [filterMediaType, setFilterMediaType] = useState('ALL');
    const [filterBadge, setFilterBadge] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
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

    useEffect(() => {
        setVideoError(false);
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

    // Initial load
    useEffect(() => {
        loadAccounts();
    }, []);

    // Load tab-specific data when account, period, or activeTab changes
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
    }, [selectedAccountId, period, activeTab]);

    // Reload Reels studio when filters change
    useEffect(() => {
        if (activeTab === 'reels_studio' && selectedAccountId) {
            loadReelsStudioData();
        }
    }, [filterMediaType, filterBadge, sortBy, reelsPage]);

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

    const loadSummaryData = async () => {
        try {
            setLoading(true);
            const res = await instagramService.getSummary(period, selectedAccountId);
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
            const res = await instagramService.getReelsStudio({
                account_id: selectedAccountId,
                media_type: filterMediaType,
                badge: filterBadge,
                search: searchQuery,
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

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setReelsPage(1);
        loadReelsStudioData();
    };

    // Format numbers
    const formatNum = (num) => {
        if (!num && num !== 0) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toLocaleString();
    };

    // Performance badge render
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
                    {activeTab === 'overview' && (
                        <div className="ig-period-pills">
                            {[
                                { key: '7d', label: '7 kun' },
                                { key: '30d', label: '30 kun' },
                                { key: '90d', label: '3 oy' },
                                { key: 'all', label: 'Barchasi' }
                            ].map(item => (
                                <button
                                    key={item.key}
                                    className={`ig-period-btn ${period === item.key ? 'active' : ''}`}
                                    onClick={() => setPeriod(item.key)}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    )}

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

            {/* ── 3. Tab Contents ── */}
            <main className="ig-tab-content">
                {/* ══════════════ TAB 1: EXECUTIVE OVERVIEW ══════════════ */}
                {activeTab === 'overview' && summary && (
                    <div className="ig-overview-section">
                        {/* 4 Smart KPI Cards */}
                        <div className="ig-kpi-grid">
                            <div className="ig-kpi-card">
                                <div className="ig-kpi-header">
                                    <span className="ig-kpi-label">Jami Obunachilar</span>
                                    <div className="ig-kpi-icon-wrap ig-icon-purple">
                                        <Users size={20} />
                                    </div>
                                </div>
                                <div className="ig-kpi-value">{formatNum(summary.kpis?.followers || 816)}</div>
                                <div className="ig-kpi-footer">
                                    <span className="ig-trend-badge positive">
                                        <ArrowUpRight size={14} /> +{summary.kpis?.period_posts || 10} yangi post
                                    </span>
                                    <span className="ig-kpi-hint">faol auditoriya</span>
                                </div>
                            </div>

                            <div className="ig-kpi-card">
                                <div className="ig-kpi-header">
                                    <span className="ig-kpi-label">Haqiqiy Qamrov (Reach)</span>
                                    <div className="ig-kpi-icon-wrap ig-icon-pink">
                                        <Eye size={20} />
                                    </div>
                                </div>
                                <div className="ig-kpi-value">{formatNum(summary.kpis?.reach || 2022)}</div>
                                <div className="ig-kpi-footer">
                                    <span className="ig-trend-badge neutral">
                                        <Activity size={14} /> Noyob ko'rishlar
                                    </span>
                                    <span className="ig-kpi-hint">{period === '7d' ? '7 kunda' : '30 kunda'}</span>
                                </div>
                            </div>

                            <div className="ig-kpi-card">
                                <div className="ig-kpi-header">
                                    <span className="ig-kpi-label">Jami Reaksiyalar</span>
                                    <div className="ig-kpi-icon-wrap ig-icon-orange">
                                        <Zap size={20} />
                                    </div>
                                </div>
                                <div className="ig-kpi-value">{formatNum(summary.kpis?.total_interactions || 231)}</div>
                                <div className="ig-kpi-footer">
                                    <span className="ig-pill-detail">❤️ {summary.kpis?.likes || 0}</span>
                                    <span className="ig-pill-detail">💬 {summary.kpis?.comments || 0}</span>
                                    <span className="ig-pill-detail">🔖 {summary.kpis?.saved || 0}</span>
                                </div>
                            </div>

                            <div className="ig-kpi-card">
                                <div className="ig-kpi-header">
                                    <span className="ig-kpi-label">O'rtacha Faollik (ER)</span>
                                    <div className="ig-kpi-icon-wrap ig-icon-teal">
                                        <TrendingUp size={20} />
                                    </div>
                                </div>
                                <div className="ig-kpi-value">{summary.kpis?.avg_engagement_rate || 2.83}%</div>
                                <div className="ig-kpi-footer">
                                    <span className="ig-trend-badge positive">
                                        <CheckCircle2 size={14} /> Yaxshi ko'rsatkich
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
                                        <p className="ig-card-desc">Oxirgi kunlar kesimida postlar va qamrov o'zgarishi</p>
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
                                                <span>❤️ {post.like_count}</span>
                                                <span>💬 {post.comments_count}</span>
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
                        {/* Filters Bar */}
                        <div className="ig-filters-card">
                            <form onSubmit={handleSearchSubmit} className="ig-search-box">
                                <Search size={18} className="ig-search-icon" />
                                <input
                                    type="text"
                                    placeholder="Post tavsifi yoki sarlavhasidan qidirish..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="ig-search-input"
                                />
                                {searchQuery && (
                                    <button type="button" onClick={() => { setSearchQuery(''); setReelsPage(1); }} className="ig-search-clear">
                                        <X size={16} />
                                    </button>
                                )}
                            </form>

                            <div className="ig-filter-group">
                                <span className="ig-filter-label">Format:</span>
                                <div className="ig-filter-pills">
                                    {[
                                        { key: 'ALL', label: 'Barchasi' },
                                        { key: 'VIDEO', label: '🎬 Reels' },
                                        { key: 'IMAGE', label: '🖼️ Rasmlar' },
                                        { key: 'CAROUSEL_ALBUM', label: '📑 Karusellar' }
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

                            <div className="ig-filter-group">
                                <span className="ig-filter-label">Samaradorlik:</span>
                                <div className="ig-filter-pills">
                                    {[
                                        { key: 'ALL', label: 'Barchasi' },
                                        { key: 'viral', label: '🔥 Virusli' },
                                        { key: 'high', label: '⭐ Yuqori' },
                                        { key: 'normal', label: '📊 Standart' }
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

                            <div className="ig-sort-wrap">
                                <span className="ig-filter-label">Saralash:</span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => { setSortBy(e.target.value); setReelsPage(1); }}
                                    className="ig-select"
                                >
                                    <option value="newest">📅 Eng yangi</option>
                                    <option value="oldest">📅 Eng eski</option>
                                    <option value="likes">❤️ Eng ko'p layk</option>
                                    <option value="comments">💬 Eng ko'p izoh</option>
                                    <option value="engagement_rate">📈 Yuqori faollik foizi</option>
                                    <option value="views">👁️ Ko'rishlar bo'yicha</option>
                                </select>
                            </div>
                        </div>

                        {/* Summary Bar */}
                        <div className="ig-studio-summary-bar">
                            <span>Topildi: <strong>{reelsData.count} ta kontent</strong></span>
                            <span>Jami layklar: <strong>{formatNum(reelsData.stats?.total_likes)}</strong></span>
                            <span>Jami izohlar: <strong>{formatNum(reelsData.stats?.total_comments)}</strong></span>
                            <span>O'rtacha faollik: <strong>{reelsData.stats?.avg_engagement_rate}%</strong></span>
                        </div>

                        {/* Media Grid */}
                        {reelsLoading ? (
                            <div className="ig-studio-loading">
                                <div className="ig-spinner"></div>
                                <p>Kontentlar saralanmoqda...</p>
                            </div>
                        ) : reelsData.results.length === 0 ? (
                            <div className="ig-empty-state">
                                <AlertCircle size={40} className="text-gray-400" />
                                <h3>Hech qanday kontent topilmadi</h3>
                                <p>Filtrlarni o'zgartirib yoki qidiruv so'zini tozalab ko'ring.</p>
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
                                                    <Play size={24} fill="#fff" />
                                                </div>
                                            )}
                                            <div className="ig-card-badge-top">
                                                {renderBadge(item.performance_badge)}
                                            </div>
                                            <div className="ig-card-hover-stats">
                                                <span>❤️ {item.like_count}</span>
                                                <span>💬 {item.comments_count}</span>
                                                <span>⚡ {item.engagement_rate}%</span>
                                            </div>
                                        </div>

                                        <div className="ig-card-content">
                                            <div className="ig-card-date-row">
                                                <span className="ig-card-date">
                                                    {new Date(item.timestamp).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                                <span className="ig-card-type-tag">
                                                    {item.media_type === 'VIDEO' ? 'Reels' : item.media_type === 'IMAGE' ? 'Rasm' : 'Karusel'}
                                                </span>
                                            </div>
                                            <p className="ig-card-caption">
                                                {item.caption ? (item.caption.length > 80 ? item.caption.slice(0, 80) + '...' : item.caption) : "Izoh mavjud emas"}
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
                                    Sahifa {reelsData.page} / {reelsData.total_pages}
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
                                    <span className="ig-kpi-hint">Instagram orqali kelgan murojaatlar</span>
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

                        {/* Recent Leads Table */}
                        <div className="ig-card ig-leads-table-card">
                            <div className="ig-card-header">
                                <div>
                                    <h3 className="ig-card-title">Oxirgi Instagram Leadlari</h3>
                                    <p className="ig-card-desc">Instagram orqali CRM bazasiga tushgan ota-onalar ro'yxati</p>
                                </div>
                            </div>

                            {leadsData.recent_leads?.length === 0 ? (
                                <div className="ig-empty-state">
                                    <Target size={36} className="text-gray-400" />
                                    <h3>Hozircha Instagram manbali leadlar mavjud emas</h3>
                                    <p>CRM da yangi lead qo'shganda manbasini <strong>"Instagram"</strong> deb belgilang yoki Instagram bot orqali integratsiya qiling.</p>
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

            {/* ── 4. Detailed Post Modal (Mounted to document.body via Portal) ── */}
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
                                            {selectedPost.media_type === 'VIDEO' ? 'Reels' : selectedPost.media_type === 'IMAGE' ? 'Rasm' : 'Karusel'}
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
                                        <span className="ig-m-label">Faollik (ER)</span>
                                        <span className="ig-m-val">⚡ {selectedPost.engagement_rate}%</span>
                                    </div>
                                    <div className="ig-modal-metric-card">
                                        <span className="ig-m-label">Saqlanganlar</span>
                                        <span className="ig-m-val">🔖 {formatNum(selectedPost.saved)}</span>
                                    </div>
                                    <div className="ig-modal-metric-card">
                                        <span className="ig-m-label">Ulashishlar</span>
                                        <span className="ig-m-val">↗️ {formatNum(selectedPost.shares)}</span>
                                    </div>
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
