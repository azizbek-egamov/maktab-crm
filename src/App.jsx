import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { SidebarProvider } from './context/SidebarContext';
import { Toaster } from 'sonner';
import { PageTitleHandler } from './hooks/usePageTitle';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ClientsList from './pages/clients/ClientsList';
import LeadsPage from './pages/leads/LeadsPage';
import LeadsKanban from './pages/leads/LeadsKanban';
import LeadsList from './pages/leads/LeadsList';
import LeadsStatistics from './pages/leads/LeadsStatistics';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import UsersPage from './pages/users/UsersPage';

import FormList from './pages/forms/FormList';
import FormBuilder from './pages/forms/FormBuilder';
import PublicFormPage from './pages/public/PublicFormPage';
import FormSubmissions from './pages/forms/FormSubmissions';
import InstagramStats from './pages/instagram/InstagramStats';
import InstagramCallback from './pages/instagram/InstagramCallback';
import GoogleSheets from './pages/google-sheets/GoogleSheets';
import PrivacyPolicy from './pages/PrivacyPolicy';
import StudentsList from './pages/students/StudentsList';
import StudentDetails from './pages/students/StudentDetails';
import ClassesPage from './pages/classes/ClassesPage';
import './index.css';

// Layout wrapper for protected routes
const ProtectedLayout = ({ children, allowedRoles }) => (
    <ProtectedRoute allowedRoles={allowedRoles}>
        <Layout>{children}</Layout>
    </ProtectedRoute>
);

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <SidebarProvider>
                    <BrowserRouter>
                        <PageTitleHandler />
                        <Routes>
                            {/* Public Routes */}
                            <Route path="/f/:uuid" element={<PublicFormPage />} />
                            <Route path="/privacy" element={<PrivacyPolicy />} />

                            <Route path="/login" element={<Login />} />

                            {/* Dashboard */}
                            <Route path="/" element={<ProtectedLayout allowedRoles={['admin']}><Dashboard /></ProtectedLayout>} />
                            <Route path="/analytics" element={<ProtectedLayout allowedRoles={['admin']}><AnalyticsPage /></ProtectedLayout>} />
                            <Route path="/instagram" element={<ProtectedLayout allowedRoles={['admin']}><InstagramStats /></ProtectedLayout>} />
                            <Route path="/instagram/callback" element={<ProtectedLayout allowedRoles={['admin']}><InstagramCallback /></ProtectedLayout>} />
                            <Route path="/google-sheets" element={<ProtectedLayout allowedRoles={['admin']}><GoogleSheets /></ProtectedLayout>} />
                            <Route path="/users" element={<ProtectedLayout allowedRoles={['admin']}><UsersPage /></ProtectedLayout>} />


                            <Route path="/clients" element={<ProtectedLayout allowedRoles={['admin', 'operator']}><ClientsList /></ProtectedLayout>} />

                            <Route path="/leads" element={<ProtectedLayout allowedRoles={['admin', 'operator', 'manager', 'sales_manager']}><LeadsPage /></ProtectedLayout>}>
                                <Route index element={<Navigate to="kanban" replace />} />
                                <Route path="kanban" element={<LeadsKanban />} />
                                <Route path="list" element={<ProtectedLayout allowedRoles={['admin', 'operator', 'manager', 'sales_manager']}><LeadsList /></ProtectedLayout>} />
                                <Route path="stats" element={<ProtectedLayout allowedRoles={['admin', 'operator', 'manager', 'sales_manager']}><LeadsStatistics /></ProtectedLayout>} />
                            </Route>


                            {/* Forms */}
                            <Route path="/forms" element={<ProtectedLayout allowedRoles={['admin']}><FormList /></ProtectedLayout>} />
                            <Route path="/forms/new" element={<ProtectedLayout allowedRoles={['admin']}><FormBuilder /></ProtectedLayout>} />
                            <Route path="/forms/:id/edit" element={<ProtectedLayout allowedRoles={['admin']}><FormBuilder /></ProtectedLayout>} />
                            <Route path="/forms/:id/submissions" element={<ProtectedLayout allowedRoles={['admin']}><FormSubmissions /></ProtectedLayout>} />
                            <Route path="/forms/:id/preview" element={<PublicFormPage />} />

                            {/* O'quvchilar */}
                            <Route path="/students" element={<ProtectedLayout allowedRoles={['admin', 'registrator', 'teacher']}><StudentsList /></ProtectedLayout>} />
                            <Route path="/students/:id" element={<ProtectedLayout allowedRoles={['admin', 'registrator', 'teacher']}><StudentDetails /></ProtectedLayout>} />
                            <Route path="/classes" element={<ProtectedLayout allowedRoles={['admin', 'registrator']}><ClassesPage /></ProtectedLayout>} />

                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes >
                    </BrowserRouter >
                    <Toaster
                        position="top-center"
                        richColors
                        toastOptions={{
                            duration: 3000,
                            className: 'custom-toast',
                        }}
                    />
                </SidebarProvider >
            </AuthProvider >
        </ThemeProvider >
    );
}

// Coming Soon placeholder
const ComingSoon = ({ title }) => (
    <div style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
    }}>
        <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            boxShadow: '0 10px 30px rgba(99, 102, 241, 0.3)',
        }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
            </svg>
        </div>
        <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: 'var(--text-primary)',
            margin: '0 0 12px',
        }}>
            {title}
        </h2>
        <p style={{
            fontSize: '16px',
            color: 'var(--text-secondary)',
            margin: '0',
        }}>
            Bu bo'lim tez orada qo'shiladi
        </p>
    </div>
);

export default App;
