import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Filter, X, RefreshCcw } from 'lucide-react';
import useBodyScrollLock from '../../../hooks/useBodyScrollLock';
import { formatDateInput, isValidDateStr, parseUIDateToApi, formatApiDateToUI } from '../../../utils/dateFormatter';

const AnalyticsFilterDrawer = ({
    isOpen,
    onClose,
    onFilter,
    activeTab,
    initialFilters,
    cities = [],
    buildings = [],
    classes = [],
    stages = [],
    operators = []
}) => {
    useBodyScrollLock(isOpen);
    const [filters, setFilters] = useState(initialFilters);
    const [closing, setClosing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFilters(initialFilters);
            setClosing(false);
        }
    }, [isOpen, initialFilters]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleClose = () => {
        setClosing(true);
        setTimeout(() => {
            onClose();
            setClosing(false);
        }, 250);
    };

    const handleApply = () => {
        const appliedFilters = { ...filters };
        if (appliedFilters.start_date) {
            const uiDate = appliedFilters.start_date.includes('-') ? formatApiDateToUI(appliedFilters.start_date) : appliedFilters.start_date;
            if (isValidDateStr(uiDate)) {
                appliedFilters.start_date = parseUIDateToApi(uiDate);
            }
        }
        if (appliedFilters.end_date) {
            const uiDate = appliedFilters.end_date.includes('-') ? formatApiDateToUI(appliedFilters.end_date) : appliedFilters.end_date;
            if (isValidDateStr(uiDate)) {
                appliedFilters.end_date = parseUIDateToApi(uiDate);
            }
        }
        onFilter(appliedFilters);
        handleClose();
    };

    const handleReset = () => {
        const resetData = {
            start_date: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
            end_date: new Date().toISOString().split('T')[0],
            school_class: '',
            building: '',
            gender: '',
            status: '',
            operator: '',
            stage: '',
            call_status: ''
        };
        setFilters(resetData);
        onFilter(resetData);
        handleClose();
    };

    if (!isOpen && !closing) return null;

    const getTabTitle = () => {
        switch (activeTab) {
            case 'students': return "O'quvchilar";
            case 'sales': return "Sotuv va Moliya";
            case 'marketing': return "Marketing";
            default: return "Leadlar";
        }
    };

    return createPortal(
        <div className={`modal-overlay ${closing ? 'closing' : ''}`} onClick={handleClose}>
            <div
                className={`modal-content modal-form ${closing ? 'closing' : ''}`}
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '440px' }}
            >
                <div className="modal-header">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Filter size={18} />
                        Filterlar ({getTabTitle()})
                    </h3>
                    <button className="modal-close" onClick={handleClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleApply(); }}>
                    <div className="modal-form-body">
                        {/* Date Range Section */}
                        <div className="form-group">
                            <label>Sana oralig'i (Boshlanish — Tugash)</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <input
                                    type="text"
                                    placeholder="KK.OO.YYYY"
                                    name="start_date"
                                    value={filters.start_date ? (filters.start_date.includes('-') ? formatApiDateToUI(filters.start_date) : filters.start_date) : ''}
                                    onChange={(e) => setFilters(prev => ({ ...prev, start_date: formatDateInput(e.target.value) }))}
                                />
                                <input
                                    type="text"
                                    placeholder="KK.OO.YYYY"
                                    name="end_date"
                                    value={filters.end_date ? (filters.end_date.includes('-') ? formatApiDateToUI(filters.end_date) : filters.end_date) : ''}
                                    onChange={(e) => setFilters(prev => ({ ...prev, end_date: formatDateInput(e.target.value) }))}
                                />
                            </div>
                        </div>

                        {/* Students Tab Specific Filters */}
                        {activeTab === 'students' && (
                            <>
                                <div className="form-group">
                                    <label>Sinf / Guruh bo'yicha</label>
                                    <select name="school_class" value={filters.school_class || ''} onChange={handleChange}>
                                        <option value="">Barcha sinflar</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Bino / Filial bo'yicha</label>
                                    <select name="building" value={filters.building || ''} onChange={handleChange}>
                                        <option value="">Barcha binolar</option>
                                        {buildings.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Jinsi bo'yicha</label>
                                    <select name="gender" value={filters.gender || ''} onChange={handleChange}>
                                        <option value="">Barchasi</option>
                                        <option value="male">O'g'il bolalar</option>
                                        <option value="female">Qiz bolalar</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>O'quvchi holati</label>
                                    <select name="status" value={filters.status || ''} onChange={handleChange}>
                                        <option value="">Barchasi</option>
                                        <option value="active">Faol</option>
                                        <option value="inactive">Nofaol</option>
                                        <option value="expelled">Chetlatilgan</option>
                                        <option value="graduated">Bitirgan</option>
                                        <option value="on_leave">Vaqtincha ketgan</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {/* Sales Tab Specific Filters */}
                        {activeTab === 'sales' && (
                            <>
                                <div className="form-group">
                                    <label>Sinf / Guruh bo'yicha</label>
                                    <select name="school_class" value={filters.school_class || ''} onChange={handleChange}>
                                        <option value="">Barcha sinflar</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Bino / Filial bo'yicha</label>
                                    <select name="building" value={filters.building || ''} onChange={handleChange}>
                                        <option value="">Barcha binolar</option>
                                        {buildings.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Shartnoma holati</label>
                                    <select name="status" value={filters.status || ''} onChange={handleChange}>
                                        <option value="">Barchasi</option>
                                        <option value="active">Faol</option>
                                        <option value="pending">Rasmiylashtirilmoqda</option>
                                        <option value="paid">To'liq to'langan</option>
                                        <option value="cancelled">Bekor qilingan</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {/* Leads Tab Specific Filters */}
                        {activeTab === 'leads' && (
                            <>
                                <div className="form-group">
                                    <label>Operator bo'yicha</label>
                                    <select name="operator" value={filters.operator || ''} onChange={handleChange}>
                                        <option value="">Barcha operatorlar</option>
                                        {operators.map((op, i) => {
                                            const val = typeof op === 'object' ? op.id : op;
                                            const label = typeof op === 'object' ? (op.first_name ? `${op.first_name} ${op.last_name || ''}` : op.username) : op;
                                            return (
                                                <option key={i} value={val}>{label}</option>
                                            );
                                        })}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Bosqich bo'yicha</label>
                                    <select name="stage" value={filters.stage || ''} onChange={handleChange}>
                                        <option value="">Barcha bosqichlar</option>
                                        {Array.isArray(stages) && stages.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Qo'ng'iroq holati</label>
                                    <select name="call_status" value={filters.call_status || ''} onChange={handleChange}>
                                        <option value="">Barchasi</option>
                                        <option value="answered">Javob berildi</option>
                                        <option value="not_answered">Javob berilmadi</option>
                                        <option value="client_answered">Mijoz javob berdi</option>
                                        <option value="client_not_answered">Mijoz javob bermadi</option>
                                    </select>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={handleReset}>
                            <RefreshCcw size={16} />
                            Tozalash
                        </button>
                        <button type="submit" className="btn-primary">
                            <Filter size={16} />
                            Qidirish
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default AnalyticsFilterDrawer;
