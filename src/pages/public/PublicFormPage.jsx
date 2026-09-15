import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { toast, Toaster } from 'sonner';

import { API_URL } from '../../services/api';

// Inline styles for premium design
const styles = {
    page: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        position: 'relative',
        overflow: 'hidden',
    },
    backgroundOrbs: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
    },
    orb1: {
        position: 'absolute',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        top: '-100px',
        right: '-100px',
        animation: 'float 8s ease-in-out infinite',
    },
    orb2: {
        position: 'absolute',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, transparent 70%)',
        borderRadius: '50%',
        bottom: '-50px',
        left: '-50px',
        animation: 'float 10s ease-in-out infinite reverse',
    },
    orb3: {
        position: 'absolute',
        width: '200px',
        height: '200px',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        animation: 'pulse 6s ease-in-out infinite',
    },
    card: {
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05) inset',
        padding: '48px 40px',
        maxWidth: '480px',
        width: '100%',
        position: 'relative',
        zIndex: 1,
    },
    projectBadge: {
        display: 'inline-block',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
        color: '#a78bfa',
        fontSize: '12px',
        fontWeight: '600',
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        padding: '6px 16px',
        borderRadius: '20px',
        marginBottom: '16px',
        border: '1px solid rgba(167, 139, 250, 0.2)',
    },
    title: {
        fontSize: '32px',
        fontWeight: '700',
        color: '#ffffff',
        margin: '0 0 12px 0',
        background: 'linear-gradient(135deg, #ffffff 0%, #c7d2fe 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
    },
    description: {
        fontSize: '15px',
        color: 'rgba(255, 255, 255, 0.6)',
        margin: '0 0 32px 0',
        lineHeight: '1.6',
    },
    fieldWrapper: {
        marginBottom: '24px',
    },
    label: {
        display: 'block',
        fontSize: '13px',
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: '8px',
        letterSpacing: '0.3px',
    },
    required: {
        color: '#f87171',
        marginLeft: '4px',
    },
    input: {
        width: '100%',
        padding: '14px 16px',
        fontSize: '15px',
        color: '#ffffff',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        outline: 'none',
        transition: 'all 0.3s ease',
        boxSizing: 'border-box',
    },
    inputFocus: {
        border: '1px solid rgba(99, 102, 241, 0.5)',
        boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
        background: 'rgba(255, 255, 255, 0.08)',
    },
    textarea: {
        minHeight: '120px',
        resize: 'vertical',
    },
    select: {
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgba(255,255,255,0.5)'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        backgroundSize: '20px',
        paddingRight: '40px',
        cursor: 'pointer',
    },
    checkboxWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        cursor: 'pointer',
    },
    checkbox: {
        width: '20px',
        height: '20px',
        accentColor: '#6366f1',
        cursor: 'pointer',
    },
    checkboxLabel: {
        fontSize: '14px',
        color: 'rgba(255, 255, 255, 0.7)',
        cursor: 'pointer',
    },
    submitButton: {
        width: '100%',
        padding: '16px 24px',
        fontSize: '16px',
        fontWeight: '600',
        color: '#ffffff',
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 10px 30px -10px rgba(99, 102, 241, 0.5)',
        marginTop: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
    },
    submitButtonHover: {
        transform: 'translateY(-2px)',
        boxShadow: '0 15px 35px -10px rgba(99, 102, 241, 0.6)',
    },
    submitButtonDisabled: {
        opacity: 0.6,
        cursor: 'not-allowed',
        transform: 'none',
    },
    loadingSpinner: {
        width: '20px',
        height: '20px',
        border: '2px solid rgba(255,255,255,0.3)',
        borderTopColor: '#ffffff',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
    },
    successCard: {
        textAlign: 'center',
    },
    successIcon: {
        width: '80px',
        height: '80px',
        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px auto',
        border: '1px solid rgba(34, 197, 94, 0.3)',
    },
    successTitle: {
        fontSize: '28px',
        fontWeight: '700',
        color: '#ffffff',
        margin: '0 0 12px 0',
    },
    successText: {
        fontSize: '16px',
        color: 'rgba(255, 255, 255, 0.6)',
        margin: 0,
        lineHeight: '1.6',
    },
    errorCard: {
        textAlign: 'center',
    },
    errorIcon: {
        fontSize: '64px',
        marginBottom: '16px',
    },
    errorText: {
        fontSize: '16px',
        color: 'rgba(255, 255, 255, 0.6)',
        margin: 0,
    },
    loadingWrapper: {
        textAlign: 'center',
    },
    loadingDots: {
        display: 'flex',
        justifyContent: 'center',
        gap: '8px',
        marginBottom: '16px',
    },
    loadingDot: {
        width: '12px',
        height: '12px',
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        borderRadius: '50%',
        animation: 'bounce 1.4s ease-in-out infinite',
    },
    loadingText: {
        fontSize: '16px',
        color: 'rgba(255, 255, 255, 0.6)',
    },
};

// CSS keyframes as style tag
const keyframesStyle = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    @keyframes float {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-20px) rotate(5deg); }
    }
    
    @keyframes pulse {
        0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
        50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.1); }
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    @keyframes bounce {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1); }
    }
    
    input::placeholder, textarea::placeholder {
        color: rgba(255, 255, 255, 0.35);
    }
    
    select option {
        background: #1e1b4b;
        color: #ffffff;
    }
`;

const PublicFormPage = () => {
    const { uuid } = useParams();
    const [form, setForm] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({});
    const [honey, setHoney] = useState('');
    const [focusedField, setFocusedField] = useState(null);
    const [isButtonHovered, setIsButtonHovered] = useState(false);
    const [phoneErrors, setPhoneErrors] = useState({});

    useEffect(() => {
        loadForm();
    }, [uuid]);

    const loadForm = async () => {
        try {
            const res = await axios.get(`${API_URL}/public/forms/${uuid}/`);
            setForm(res.data);

            const defaults = {};
            if (res.data.fields) {
                res.data.fields.forEach(f => {
                    if (f.type === 'checkbox') defaults[f.key] = false;
                    else if (f.type === 'phone') defaults[f.key] = '+998';
                    else defaults[f.key] = '';
                });
            }
            setFormData(defaults);
        } catch (error) {
            console.error(error);
            if (error.response) {
                setError(`Xatolik: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            } else if (error.request) {
                setError("Serverga ulanib bo'lmadi. (Network Error). Backend ishlayaptimi?");
            } else {
                setError(`Xatolik: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e, key, type) => {
        const value = type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handlePhoneChange = (e, key) => {
        let raw = e.target.value;
        // Always keep +998 prefix
        if (!raw.startsWith('+998')) {
            raw = '+998';
        }
        // Extract only digits after +998
        const afterPrefix = raw.slice(4).replace(/\D/g, '');
        // Limit to 9 digits
        const limited = afterPrefix.slice(0, 9);
        const finalValue = '+998' + limited;

        setFormData(prev => ({ ...prev, [key]: finalValue }));

        // Clear error when user is typing
        if (phoneErrors[key]) {
            setPhoneErrors(prev => ({ ...prev, [key]: null }));
        }
    };

    const handlePhoneBlur = (key) => {
        setFocusedField(null);
        const value = formData[key] || '+998';
        const digits = value.slice(4);
        if (digits.length > 0 && digits.length < 9) {
            setPhoneErrors(prev => ({ ...prev, [key]: `Telefon raqam to'liq emas (${digits.length}/9 raqam)` }));
        } else {
            setPhoneErrors(prev => ({ ...prev, [key]: null }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate phone fields before submitting
        if (form.fields) {
            const newPhoneErrors = {};
            let hasPhoneError = false;
            form.fields.forEach(field => {
                if (field.type === 'phone' && field.is_active) {
                    const value = formData[field.key] || '+998';
                    const digits = value.slice(4);
                    if (field.required && digits.length === 0) {
                        newPhoneErrors[field.key] = 'Telefon raqamni kiriting';
                        hasPhoneError = true;
                    } else if (digits.length > 0 && digits.length < 9) {
                        newPhoneErrors[field.key] = `Telefon raqam to'liq emas (${digits.length}/9 raqam)`;
                        hasPhoneError = true;
                    }
                }
            });
            if (hasPhoneError) {
                setPhoneErrors(newPhoneErrors);
                toast.error("Telefon raqamni to'g'ri kiriting");
                return;
            }
        }

        setSubmitting(true);

        if (honey) {
            setSubmitting(false);
            return;
        }

        try {
            await axios.post(`${API_URL}/public/forms/${uuid}/submit/`, {
                ...formData,
                _honey: honey
            });
            setSuccess(true);
            toast.success("Muvaffaqiyatli yuborildi!");
        } catch (error) {
            console.error(error);
            if (error.response?.status === 429) {
                toast.error("Juda ko'p urinish. Iltimos biroz kuting.");
            } else {
                toast.error(error.response?.data?.detail || "Xatolik yuz berdi");
            }
        } finally {
            setSubmitting(false);
        }
    };

    const getInputStyle = (fieldKey) => ({
        ...styles.input,
        ...(focusedField === fieldKey ? styles.inputFocus : {}),
    });

    if (loading) {
        return (
            <>
                <style>{keyframesStyle}</style>
                <div style={styles.page}>
                    <div style={styles.backgroundOrbs}>
                        <div style={styles.orb1}></div>
                        <div style={styles.orb2}></div>
                        <div style={styles.orb3}></div>
                    </div>
                    <div style={{ ...styles.card, ...styles.loadingWrapper }}>
                        <div style={styles.loadingDots}>
                            <div style={{ ...styles.loadingDot, animationDelay: '0s' }}></div>
                            <div style={{ ...styles.loadingDot, animationDelay: '0.2s' }}></div>
                            <div style={{ ...styles.loadingDot, animationDelay: '0.4s' }}></div>
                        </div>
                        <p style={styles.loadingText}>Yuklanmoqda...</p>
                    </div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <style>{keyframesStyle}</style>
                <div style={styles.page}>
                    <div style={styles.backgroundOrbs}>
                        <div style={styles.orb1}></div>
                        <div style={styles.orb2}></div>
                        <div style={styles.orb3}></div>
                    </div>
                    <div style={{ ...styles.card, ...styles.errorCard }}>
                        <div style={styles.errorIcon}>😔</div>
                        <h2 style={styles.successTitle}>Xatolik yuz berdi</h2>
                        <p style={styles.errorText}>{error}</p>
                    </div>
                </div>
            </>
        );
    }

    if (success) {
        return (
            <>
                <style>{keyframesStyle}</style>
                <div style={styles.page}>
                    <div style={styles.backgroundOrbs}>
                        <div style={styles.orb1}></div>
                        <div style={styles.orb2}></div>
                        <div style={styles.orb3}></div>
                    </div>
                    <div style={{ ...styles.card, ...styles.successCard }}>
                        <div style={styles.successIcon}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                        <h2 style={styles.successTitle}>Rahmat!</h2>
                        <p style={styles.successText}>
                            Murojaatingiz muvaffaqiyatli qabul qilindi.<br />
                            Tez orada siz bilan bog'lanamiz.
                        </p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <style>{keyframesStyle}</style>
            <div style={styles.page}>
                <Toaster position="top-center" theme="dark" />

                <div style={styles.backgroundOrbs}>
                    <div style={styles.orb1}></div>
                    <div style={styles.orb2}></div>
                    <div style={styles.orb3}></div>
                </div>

                <div style={styles.card}>
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        {form.project_name && (
                            <span style={styles.projectBadge}>
                                {form.project_name}
                            </span>
                        )}
                        <h1 style={styles.title}>{form.title}</h1>
                        {form.description && (
                            <p style={styles.description}>{form.description}</p>
                        )}
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Honeypot Field - Hidden */}
                        <input
                            type="text"
                            name="_honey"
                            value={honey}
                            onChange={(e) => setHoney(e.target.value)}
                            style={{ display: 'none' }}
                            autoComplete="off"
                        />

                        {form.fields && form.fields.map((field) => {
                            if (!field.is_active) return null;

                            return (
                                <div key={field.key} style={styles.fieldWrapper}>
                                    {field.type !== 'checkbox' && (
                                        <label style={styles.label}>
                                            {field.label}
                                            {field.required && <span style={styles.required}>*</span>}
                                        </label>
                                    )}

                                    {field.type === 'textarea' ? (
                                        <textarea
                                            required={field.required}
                                            placeholder={field.placeholder}
                                            value={formData[field.key] || ''}
                                            onChange={(e) => handleChange(e, field.key, field.type)}
                                            onFocus={() => setFocusedField(field.key)}
                                            onBlur={() => setFocusedField(null)}
                                            style={{ ...getInputStyle(field.key), ...styles.textarea }}
                                        />
                                    ) : field.type === 'select' ? (
                                        <select
                                            required={field.required}
                                            value={formData[field.key] || ''}
                                            onChange={(e) => handleChange(e, field.key, field.type)}
                                            onFocus={() => setFocusedField(field.key)}
                                            onBlur={() => setFocusedField(null)}
                                            style={{ ...getInputStyle(field.key), ...styles.select }}
                                        >
                                            <option value="">Tanlang...</option>
                                            {Array.isArray(field.options) ? field.options.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            )) : field.options?.split(',').map(opt => (
                                                <option key={opt.trim()} value={opt.trim()}>{opt.trim()}</option>
                                            ))}
                                        </select>
                                    ) : field.type === 'checkbox' ? (
                                        <label style={styles.checkboxWrapper}>
                                            <input
                                                type="checkbox"
                                                required={field.required}
                                                checked={!!formData[field.key]}
                                                onChange={(e) => handleChange(e, field.key, field.type)}
                                                style={styles.checkbox}
                                            />
                                            <span style={styles.checkboxLabel}>
                                                {field.placeholder || field.label}
                                                {field.required && <span style={styles.required}>*</span>}
                                            </span>
                                        </label>
                                    ) : field.type === 'phone' ? (
                                        <>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                background: 'rgba(255, 255, 255, 0.05)',
                                                border: phoneErrors[field.key]
                                                    ? '1px solid rgba(248, 113, 113, 0.6)'
                                                    : focusedField === field.key
                                                        ? '1px solid rgba(99, 102, 241, 0.5)'
                                                        : '1px solid rgba(255, 255, 255, 0.1)',
                                                borderRadius: '12px',
                                                transition: 'all 0.3s ease',
                                                boxShadow: phoneErrors[field.key]
                                                    ? '0 0 0 3px rgba(248, 113, 113, 0.1)'
                                                    : focusedField === field.key
                                                        ? '0 0 0 3px rgba(99, 102, 241, 0.1)'
                                                        : 'none',
                                            }}>
                                                <span style={{
                                                    padding: '14px 0 14px 16px',
                                                    fontSize: '15px',
                                                    color: 'rgba(255, 255, 255, 0.5)',
                                                    fontWeight: '500',
                                                    userSelect: 'none',
                                                    whiteSpace: 'nowrap',
                                                }}>+998</span>
                                                <input
                                                    type="tel"
                                                    required={field.required}
                                                    placeholder="XX XXX XX XX"
                                                    value={(formData[field.key] || '+998').slice(4)}
                                                    onChange={(e) => {
                                                        const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
                                                        setFormData(prev => ({ ...prev, [field.key]: '+998' + digits }));
                                                        if (phoneErrors[field.key]) {
                                                            setPhoneErrors(prev => ({ ...prev, [field.key]: null }));
                                                        }
                                                    }}
                                                    onFocus={() => setFocusedField(field.key)}
                                                    onBlur={() => handlePhoneBlur(field.key)}
                                                    maxLength={9}
                                                    inputMode="numeric"
                                                    style={{
                                                        flex: 1,
                                                        padding: '14px 16px 14px 6px',
                                                        fontSize: '15px',
                                                        color: '#ffffff',
                                                        background: 'transparent',
                                                        border: 'none',
                                                        outline: 'none',
                                                        boxSizing: 'border-box',
                                                        letterSpacing: '0.5px',
                                                    }}
                                                />
                                            </div>
                                            {phoneErrors[field.key] && (
                                                <p style={{
                                                    color: '#f87171',
                                                    fontSize: '12px',
                                                    marginTop: '6px',
                                                    marginBottom: 0,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                }}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <circle cx="12" cy="12" r="10"></circle>
                                                        <line x1="12" y1="8" x2="12" y2="12"></line>
                                                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                                    </svg>
                                                    {phoneErrors[field.key]}
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <input
                                            type={field.type === 'date' ? 'date' : field.type === 'email' ? 'email' : 'text'}
                                            required={field.required}
                                            placeholder={field.placeholder}
                                            value={formData[field.key] || ''}
                                            onChange={(e) => handleChange(e, field.key, field.type)}
                                            onFocus={() => setFocusedField(field.key)}
                                            onBlur={() => setFocusedField(null)}
                                            style={getInputStyle(field.key)}
                                        />
                                    )}
                                </div>
                            );
                        })}

                        <button
                            type="submit"
                            disabled={submitting}
                            onMouseEnter={() => setIsButtonHovered(true)}
                            onMouseLeave={() => setIsButtonHovered(false)}
                            style={{
                                ...styles.submitButton,
                                ...(isButtonHovered && !submitting ? styles.submitButtonHover : {}),
                                ...(submitting ? styles.submitButtonDisabled : {}),
                            }}
                        >
                            {submitting ? (
                                <>
                                    <div style={styles.loadingSpinner}></div>
                                    Yuborilmoqda...
                                </>
                            ) : (
                                <>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="22" y1="2" x2="11" y2="13"></line>
                                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                    </svg>
                                    Yuborish
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default PublicFormPage;
