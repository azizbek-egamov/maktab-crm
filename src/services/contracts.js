import api from './api';

export const contractService = {
    getAll: (params) => api.get('/student-contracts/', { params }),
    get: (id) => api.get(`/student-contracts/${id}/`),
    getById: (id) => api.get(`/student-contracts/${id}/`),
    create: (data) => api.post('/student-contracts/', data),
    update: (id, data) => api.patch(`/student-contracts/${id}/`, data),
    delete: (id) => api.delete(`/student-contracts/${id}/`),
    addPayment: (id, data) => api.post(`/student-contracts/${id}/add_payment/`, data),
    makePayment: (id, data) => api.post(`/student-contracts/${id}/add_payment/`, data),
    getPayments: (id) => api.get(`/contract-payments/?contract=${id}`),
};


export default contractService;
