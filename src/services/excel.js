import api from './api';

export const excelService = {
    // 1. Export fayllarini yuklab olish (Blob orqali brauzerda yuklash)
    downloadExport: async (exportType, customFilename) => {
        try {
            const response = await api.get(`/excel/export/${exportType}/`, {
                responseType: 'blob',
            });

            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            const defaultFilename = `${exportType}_${new Date().toISOString().slice(0, 10)}.xlsx`;
            link.setAttribute('download', customFilename || defaultFilename);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            return true;
        } catch (error) {
            console.error('Excel eksportda xatolik:', error);
            throw error;
        }
    },

    // 2. Excel Shablonini yuklab olish
    downloadTemplate: async (templateType) => {
        try {
            const response = await api.get(`/excel/template/${templateType}/`, {
                responseType: 'blob',
            });

            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `shablon_${templateType}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            return true;
        } catch (error) {
            console.error('Shablon yuklashda xatolik:', error);
            throw error;
        }
    },

    // 3. Excel faylni bazaga yuklash (Import)
    importFile: async (importType, file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post(`/excel/import/${importType}/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};

export default excelService;
