import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import usePageTitle from '../../hooks/usePageTitle';
import './Leads.css';
import LeadForm from './LeadForm';

// Icons
const PlusIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

const KanbanIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="5" height="18" rx="1" />
        <rect x="11" y="3" width="5" height="12" rx="1" />
        <rect x="19" y="3" width="5" height="15" rx="1" />
    </svg>
);

const ListIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
);

const StatsIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 20V10" />
        <path d="M12 20V4" />
        <path d="M6 20v-6" />
    </svg>
);

const LeadsPage = () => {
    usePageTitle('Leadlar CRM');
    const navigate = useNavigate();
    const location = useLocation();

    // Active tab detection
    const currentTab = location.pathname.includes('/list')
        ? 'list'
        : location.pathname.includes('/stats')
            ? 'stats'
            : 'kanban';

    // Total leads count for header
    const [totalLeads, setTotalLeads] = useState(0);

    // Modal State
    const [modal, setModal] = useState({
        open: false,
        lead: null,
        initialStageId: null,
        type: 'create'
    });

    // Refresh trigger
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Redirect to kanban by default
    useEffect(() => {
        if (location.pathname === '/leads' || location.pathname === '/leads/') {
            navigate('kanban', { replace: true });
        }
    }, [location.pathname, navigate]);

    // Handlers
    const openCreateModal = (initialStageId = null) => {
        setModal({ open: true, lead: null, initialStageId, type: 'create' });
    };

    const openEditModal = (lead) => {
        setModal({ open: true, lead, initialStageId: null, type: 'edit' });
    };

    const closeModal = () => {
        setModal({ open: false, lead: null, initialStageId: null, type: 'create' });
    };

    const handleSuccess = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    // Update total leads count from child
    const updateTotalLeads = (count) => {
        setTotalLeads(count);
    };

    return (
        <div className="leads-page animate-fadeIn">
            {/* Page Header */}
            <div className="page-header">
                <div className="header-left">
                    <div>
                        <h1 className="page-title">Leadlar (Mijozlar oqimi)</h1>
                        <p className="page-subtitle">
                            {totalLeads > 0 ? `Jami ${totalLeads} ta lead ro'yxatda` : "Barcha manbalardan kelgan leadlar boshqaruvi"}
                        </p>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="btn-primary flex items-center gap-2" onClick={() => openCreateModal()}>
                        <PlusIcon />
                        <span>Lead qo'shish</span>
                    </button>
                </div>
            </div>

            {/* Leads View Navigation Tabs */}
            <div className="leads-nav-tabs-wrapper mb-4">
                <div className="leads-nav-tabs">
                    <button
                        className={`leads-tab-btn ${currentTab === 'kanban' ? 'active' : ''}`}
                        onClick={() => navigate('/leads/kanban')}
                    >
                        <KanbanIcon />
                        <span>Kanban doskasi</span>
                    </button>
                    <button
                        className={`leads-tab-btn ${currentTab === 'list' ? 'active' : ''}`}
                        onClick={() => navigate('/leads/list')}
                    >
                        <ListIcon />
                        <span>Ro'yxat ko'rinishi</span>
                    </button>
                    <button
                        className={`leads-tab-btn ${currentTab === 'stats' ? 'active' : ''}`}
                        onClick={() => navigate('/leads/stats')}
                    >
                        <StatsIcon />
                        <span>Statistika & Tahlil</span>
                    </button>
                </div>
            </div>

            <div className="page-content">
                <Outlet context={{
                    openCreateModal,
                    openEditModal,
                    refreshTrigger,
                    updateTotalLeads
                }} />
            </div>

            {/* Modal */}
            <LeadForm
                isOpen={modal.open}
                onClose={closeModal}
                lead={modal.lead}
                initialStageId={modal.initialStageId}
                onSuccess={handleSuccess}
            />
        </div>
    );
};

export default LeadsPage;
