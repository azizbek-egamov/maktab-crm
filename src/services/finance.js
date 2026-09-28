import api from './api';

export const financeService = {
    // Xulosa va hisobot
    getSummary: (params) => api.get('/finance/summary/', { params }),

    // Tranzaksiyalar
    getTransactions: (params) => api.get('/finance/transactions/', { params }),
    getTransaction: (id) => api.get(`/finance/transactions/${id}/`),
    createTransaction: (data) => api.post('/finance/transactions/', data),
    updateTransaction: (id, data) => api.patch(`/finance/transactions/${id}/`, data),
    deleteTransaction: (id) => api.delete(`/finance/transactions/${id}/`),

    // Kassalar / Hisoblar
    getAccounts: (params) => api.get('/finance/accounts/', { params }),
    createAccount: (data) => api.post('/finance/accounts/', data),
    updateAccount: (id, data) => api.patch(`/finance/accounts/${id}/`, data),
    deleteAccount: (id) => api.delete(`/finance/accounts/${id}/`),

    // Xarajat kategoriyalari
    getCategories: (params) => api.get('/finance/categories/', { params }),
    createCategory: (data) => api.post('/finance/categories/', data),
    updateCategory: (id, data) => api.patch(`/finance/categories/${id}/`, data),
    deleteCategory: (id) => api.delete(`/finance/categories/${id}/`),
};

export default financeService;
