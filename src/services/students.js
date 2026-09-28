import api from './api';

export const studentService = {
    getAll: (params) => api.get('/students/', { params }),
    get: (id) => api.get(`/students/${id}/`),
    create: (data) => api.post('/students/', data),
    update: (id, data) => api.patch(`/students/${id}/`, data),
    delete: (id) => api.delete(`/students/${id}/`),
    getDebtors: () => api.get('/students/debtors/'),
    getStatistics: () => api.get('/students/statistics/'),
    addParent: (id, data) => api.post(`/students/${id}/add_parent/`, data),
    updateParent: (id, linkId, data) => api.patch(`/students/${id}/parents/${linkId}/`, data),
    removeParent: (id, linkId) => api.delete(`/students/${id}/parents/${linkId}/`),
    sendSms: (id, message) => api.post(`/students/${id}/send_sms/`, { message }),
};

export const schoolClassService = {
    getAll: (params) => api.get('/school-classes/', { params }),
    get: (id) => api.get(`/school-classes/${id}/`),
    create: (data) => api.post('/school-classes/', data),
    update: (id, data) => api.patch(`/school-classes/${id}/`, data),
    delete: (id) => api.delete(`/school-classes/${id}/`),
    getStudents: (id) => api.get(`/school-classes/${id}/students/`),
};

export const studentContractService = {
    getAll: (params) => api.get('/student-contracts/', { params }),
    get: (id) => api.get(`/student-contracts/${id}/`),
    create: (data) => api.post('/student-contracts/', data),
    update: (id, data) => api.patch(`/student-contracts/${id}/`, data),
    addPayment: (id, data) => api.post(`/student-contracts/${id}/add_payment/`, data),
};

export const studentDocumentService = {
    getAll: (params) => api.get('/student-documents/', { params }),
    upload: (data) => api.post('/student-documents/', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    update: (id, data) => api.patch(`/student-documents/${id}/`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    delete: (id) => api.delete(`/student-documents/${id}/`),
};

export const attendanceService = {
    getDaily: (schoolClass, date) => api.get('/attendance/daily/', {
        params: { school_class: schoolClass, date },
    }),
    bulkSave: (data) => api.post('/attendance/bulk_save/', data),
    getSummary: (schoolClass, date) => api.get('/attendance/summary/', {
        params: { school_class: schoolClass, date },
    }),
};

export const contractPaymentService = {
    update: (id, data) => api.patch(`/contract-payments/${id}/`, data),
    delete: (id) => api.delete(`/contract-payments/${id}/`),
};
