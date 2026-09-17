import api from './api';

export const instagramService = {
    // Profil ma'lumotlari
    getProfile: async (accountId = null) => {
        return api.get('/instagram/profile/', { params: { account_id: accountId } });
    },

    // OAuth URL olish
    getAuthUrl: async (redirectUri) => {
        return api.get('/instagram/auth-url/', { params: { redirect_uri: redirectUri } });
    },

    // OAuth callback — code bilan token olish
    connectAccount: async (code, redirectUri) => {
        return api.post('/instagram/callback/', { code, redirect_uri: redirectUri });
    },

    // Akkauntni uzish
    disconnect: async (accountId) => {
        return api.post('/instagram/disconnect/', { account_id: accountId });
    },

    // 1. Dashboard Executive Summary (KPIs, Charts, Heatmap, Format Comparison, AI Advice)
    getSummary: async (params = '30d', accountId = null) => {
        let queryParams = {};
        if (typeof params === 'object' && params !== null) {
            queryParams = params;
        } else {
            queryParams = { period: params, account_id: accountId };
        }
        return api.get('/instagram/summary/', { params: queryParams });
    },

    // 2. Reels & Kontent Studio (Kengaytirilgan Filtrlar, Qidiruv, Pagination)
    getReelsStudio: async (params = {}) => {
        return api.get('/instagram/reels-studio/', { params });
    },

    // 3. Auditoriya & Geografiya Intellekti (Shaharlar, Foizlar, Faol Soatlar)
    getAudience: async (accountId = null) => {
        return api.get('/instagram/audience/', { params: { account_id: accountId } });
    },

    // 4. Tezkor Sinxronizatsiya (Sync Now)
    syncNow: async (accountId = null) => {
        return api.post('/instagram/sync/', { account_id: accountId });
    },

    getSyncStatus: async () => {
        return api.get('/instagram/sync/');
    },

    // 5. CRM Lead Integratsiyasi & Konversiya
    getPostLeads: async () => {
        return api.get('/instagram/post-leads/');
    },

    // Barcha akkauntlar ro'yxati
    getAccounts: async () => {
        return api.get('/instagram/accounts/');
    },

    // Legacy Stats / Media (if needed for fallback)
    getStats: async (period = 'day', accountId = null) => {
        return api.get('/instagram/stats/', { params: { period, account_id: accountId } });
    },

    getMedia: async (limit = 20, accountId = null) => {
        return api.get('/instagram/media/', { params: { limit, account_id: accountId } });
    },
};

