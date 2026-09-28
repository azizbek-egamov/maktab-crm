import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { FileSpreadsheet, Download, Upload, FileText, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import excelService from '../services/excel';
import useBodyScrollLock from '../hooks/useBodyScrollLock';
import './ExcelModal.css';

const ExcelModal = ({
    isOpen,
    onClose,
    type = 'students', // 'students' | 'finance' | 'leads' | 'contracts' | 'debtors'
    title = "Excel Boshqaruvi",
    onImportSuccess,
}) => {
    useBodyScrollLock(isOpen);
    const [tab, setTab] = useState('export'); // 'export' | 'import'
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const handleExport = async () => {
        setLoading(true);
        try {
            await excelService.downloadExport(type);
            toast.success("Excel fayl muvaffaqiyatli yuklab olindi!");
            onClose();
        } catch (err) {
            toast.error("Excel faylni yuklab olishda xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            await excelService.downloadTemplate(type);
            toast.success("Shablon yuklab olindi");
        } catch (err) {
            toast.error("Shablonni yuklab olishda xatolik");
        }
    };

    const handleFileChange = (e) => {
        const selected = e.target.files?.[0];
        if (selected) {
            setFile(selected);
            setImportResult(null);
        }
    };

    const handleImport = async () => {
        if (!file) {
            toast.warning("Iltimos, avval Excel (.xlsx) faylini tanlang");
            return;
        }

        setLoading(true);
        try {
            const res = await excelService.importFile(type, file);
            setImportResult(res);
            toast.success(`${res.created_count || 0} ta ma'lumot muvaffaqiyatli yuklandi!`);
            if (onImportSuccess) onImportSuccess();
        } catch (err) {
            const msg = err.response?.data?.error || "Faylni yuklashda xatolik yuz berdi";
            toast.error(msg);
            setImportResult({ success: false, error: msg });
        } finally {
            setLoading(false);
        }
    };

    const isImportSupported = ['students', 'leads', 'finance'].includes(type);

    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content excel-custom-modal animate-scaleUp" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="modal-header-icon excel-icon">
                            <FileSpreadsheet size={20} />
                        </div>
                        <div>
                            <h3 className="modal-title">{title}</h3>
                            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                                .xlsx formatida eksport va import
                            </p>
                        </div>
                    </div>
                    <button className="modal-close-btn" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                {isImportSupported && (
                    <div className="excel-nav-tabs">
                        <button
                            type="button"
                            className={`excel-nav-tab ${tab === 'export' ? 'active' : ''}`}
                            onClick={() => setTab('export')}
                        >
                            <Download size={16} />
                            Excelga yuklash (Eksport)
                        </button>
                        <button
                            type="button"
                            className={`excel-nav-tab ${tab === 'import' ? 'active' : ''}`}
                            onClick={() => setTab('import')}
                        >
                            <Upload size={16} />
                            Exceldan yuklash (Import)
                        </button>
                    </div>
                )}

                <div className="modal-body" style={{ padding: '20px 24px' }}>
                    {tab === 'export' ? (
                        <div className="excel-section">
                            <div className="excel-tip-card">
                                <div className="excel-tip-header">
                                    <span className="badge-tag">Format: .XLSX</span>
                                </div>
                                <h4 style={{ margin: '8px 0 4px', fontSize: '15px', color: 'var(--text-primary)' }}>
                                    {type.toUpperCase()} ma'lumotlari eksporti
                                </h4>
                                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                    Tizimdagi barcha ma'lumotlar ustunlari to'g'ri formatlangan, chiroyli sarlavhalar va raqamli ko'rinishda Excel fayliga joylashtiriladi.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="btn-primary w-full"
                                style={{ justifyContent: 'center', padding: '12px' }}
                                onClick={handleExport}
                                disabled={loading}
                            >
                                <Download size={18} />
                                {loading ? "Yuklanmoqda..." : "Excel Faylini Yuklab Olish (.xlsx)"}
                            </button>
                        </div>
                    ) : (
                        <div className="excel-section">
                            <div className="excel-template-row">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FileText size={18} color="var(--accent-primary)" />
                                    <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>
                                        Namunaviy to'g'ri shablon
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    style={{ padding: '6px 12px', fontSize: '12px' }}
                                    onClick={handleDownloadTemplate}
                                >
                                    Shablonni olish (.xlsx)
                                </button>
                            </div>

                            <div
                                className={`excel-upload-zone ${file ? 'has-file' : ''}`}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept=".xlsx, .xls, .csv"
                                    style={{ display: 'none' }}
                                />
                                <div className="excel-upload-icon-box">
                                    <Upload size={24} />
                                </div>
                                {file ? (
                                    <div>
                                        <p style={{ margin: '0 0 2px', fontWeight: 600, color: 'var(--text-primary)' }}>{file.name}</p>
                                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                            ({(file.size / 1024).toFixed(1)} KB) — Boshqa fayl tanlash uchun bosing
                                        </span>
                                    </div>
                                ) : (
                                    <div>
                                        <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                                            Excel faylni tanlang yoki shu yerga tashlang
                                        </p>
                                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                            Qo'llab-quvvatlanadi: .xlsx, .xls, .csv
                                        </span>
                                    </div>
                                )}
                            </div>

                            {importResult && (
                                <div className={`excel-status-banner ${importResult.success ? 'success' : 'error'}`}>
                                    {importResult.success ? (
                                        <>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                                                <CheckCircle2 size={16} /> Muvaffaqiyatli yakunlandi!
                                            </div>
                                            <p style={{ margin: '4px 0 0', fontSize: '13px' }}>
                                                Qo'shilgan ma'lumotlar: <strong>{importResult.created_count}</strong> ta
                                            </p>
                                        </>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                                            <AlertTriangle size={16} /> {importResult.error}
                                        </div>
                                    )}
                                </div>
                            )}

                            <button
                                type="button"
                                className="btn-primary w-full"
                                style={{ justifyContent: 'center', padding: '12px', marginTop: '14px' }}
                                onClick={handleImport}
                                disabled={loading || !file}
                            >
                                <Upload size={18} />
                                {loading ? "Yuklanmoqda..." : "Bazaga Saqlash (Import)"}
                            </button>
                        </div>
                    )}
                </div>

                <div className="modal-actions" style={{ padding: '14px 24px' }}>
                    <button type="button" className="btn-secondary" onClick={onClose}>
                        Yopish
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ExcelModal;
