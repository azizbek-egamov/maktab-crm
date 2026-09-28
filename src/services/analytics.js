import api from './api';

export const getAnalytics = async (params) => {
    return api.get('/analytics/leads_stats/', { params });
};

export const analyticsService = {
    getSummary: async () => {
        return api.get('/analytics/summary/');
    },
    getStudentsStats: async (params) => {
        return api.get('/analytics/students_stats/', { params });
    },
    getSalesStats: async (params) => {
        return api.get('/analytics/sales_stats/', { params });
    },
    getOperatorFormalarStats: async (params) => {
        return api.get('/analytics/operator_formalar_stats/', { params });
    },
    getFormalarStats: async (params) => {
        return api.get('/analytics/operator_formalar_stats/', { params });
    },
    getMarketingStats: async (params) => {
        return api.get('/analytics/marketing_stats/', { params });
    },
    getMarketingProjectStats: async (params) => {
        return api.get('/analytics/marketing_project_stats/', { params });
    },
    getStats: getAnalytics,
    getAnalytics
};

export default analyticsService;
