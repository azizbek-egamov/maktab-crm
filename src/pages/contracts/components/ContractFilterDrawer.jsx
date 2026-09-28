import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FilterIcon, CloseIcon, RefreshCwIcon } from '../ContractIcons';
import useBodyScrollLock from '../../../hooks/useBodyScrollLock';
import api from '../../../services/api';
import { formatDateInput, isValidDateStr, parseUIDateToApi, formatApiDateToUI } from '../../../utils/dateFormatter';

const ContractFilterDrawer = ({
    isOpen,
    onClose,
    onFilter,
    initialFilters
}) => {
    useBodyScrollLock(isOpen);
    const [filters, setFilters] = useState(initialFilters);
    const [cities, setCities] = useState([]);
    const [buildings, setBuildings] = useState([]);
    const [loadingOptions, setLoadingOptions] = useState(false);
    const [closing, setClosing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFilters(initialFilters);
            fetchOptions();
            setClosing(false);
        }
    }, [isOpen, initialFilters]);

    const fetchOptions = async () => {
        setLoadingOptions(true);
        try {
            const [citiesRes, buildingsRes] = await Promise.all([
                api.get('/cities/'),
                api.get('/buildings/')
            ]);
            setCities(citiesRes.data.results || citiesRes.data);
            setBuildings(buildingsRes.data.results || buildingsRes.data);
        } catch (error) {
            console.error("Error fetching filter options:", error);
        } finally {
            setLoadingOptions(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
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
            } else {
                appliedFilters.start_date = '';
            }
        }
        if (appliedFilters.end_date) {
            const uiDate = appliedFilters.end_date.includes('-') ? formatApiDateToUI(appliedFilters.end_date) : appliedFilters.end_date;
            if (isValidDateStr(uiDate)) {
                appliedFilters.end_date = parseUIDateToApi(uiDate);
            } else {
                appliedFilters.end_date = '';
            }
        }
        onFilter(appliedFilters);
        handleClose();
    };

    const handleReset = () => {
        const resetData = {
            start_date: '',
            end_date: '',
            city: '',
            building: '',
            debt_status: '',
            status: ''
        };
        setFilters(resetData);
        onFilter(resetData);
        handleClose();
    };

    if (!isOpen && !closing) return null;

    // Filter buildings based on selected city
    const filteredBuildings = filters.city
        ? buildings.filter(b => b.city === parseInt(filters.city))
        : buildings;

    return createPortal(
        <div className={`modal-overlay ${closing ? 'closing' : ''}`} onClick={handleClose}>
            <div
                className={`modal-content modal-form ${closing ? 'closing' : ''}`}
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '420px' }}
            >
                <div className="modal-header">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FilterIcon width="18" height="18" />
                        Filterlar
                    </h3>
                    <button className="modal-close" onClick={handleClose}>
                        <CloseIcon width="20" height="20" />
                    </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleApply(); }}>
                    <div className="modal-form-body">
                        {/* Contract Date Section */}
                        <div className="form-group">
                            <label>Shartnoma sanasi</label>
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
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                Oraliq bo'yicha tuzilgan shartnomalar
                            </p>
                        </div>

                        {/* City Section */}
                        <div className="form-group">
                            <label>Shahar bo'yicha</label>
                            <select name="city" value={filters.city} onChange={handleChange}>
                                <option value="">Barchasi</option>
                                {cities.map(city => (
                                    <option key={city.id} value={city.id}>{city.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Building Section */}
                        <div className="form-group">
                            <label>Binolar bo'yicha</label>
                            <select name="building" value={filters.building} onChange={handleChange}>
                                <option value="">Barchasi</option>
                                {filteredBuildings.map(building => (
                                    <option key={building.id} value={building.id}>{building.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Debt Status Section */}
                        <div className="form-group">
                            <label>Qarzdorlik bo'yicha</label>
                            <select name="debt_status" value={filters.debt_status} onChange={handleChange}>
                                <option value="">Barchasi</option>
                                <option value="has_debt">Qarzdorligi borlar</option>
                                <option value="no_debt">Qarzdorligi yo'qlar</option>
                            </select>
                        </div>

                        {/* Status Section */}
                        <div className="form-group">
                            <label>Holati bo'yicha</label>
                            <select name="status" value={filters.status} onChange={handleChange}>
                                <option value="">Barchasi</option>
                                <option value="pending">Rasmiylashtirilmoqda</option>
                                <option value="active">Faol</option>
                                <option value="paid">To'liq to'langan</option>
                                <option value="completed">Tugallangan</option>
                                <option value="cancelled">Bekor qilingan</option>
                            </select>
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={handleReset}>
                            <RefreshCwIcon width="16" height="16" />
                            Tozalash
                        </button>
                        <button type="submit" className="btn-primary">
                            <FilterIcon width="16" height="16" />
                            Filterlash
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default ContractFilterDrawer;
