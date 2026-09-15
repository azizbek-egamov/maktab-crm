import React, { useState, useEffect, useRef } from 'react';
import { leadService } from '../../services/leads';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import Modal from '../../components/ui/Modal';
import { formatPhoneInput, parsePhoneToApi, formatApiPhoneToUI } from '../../utils/phoneFormatter';
import { MEDIA_BASE_URL } from '../../services/api';
import './LeadForm.css';

// Icons
const PhoneIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
    </svg>
);

const UploadIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
);

const TrashIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
);

// Phone Input with Formatting
const PhoneInput = ({ value, onChange, placeholder }) => {
    const handleChange = (e) => {
        onChange(formatPhoneInput(e.target.value));
    };

    return (
        <div className="phone-input-wrapper">
            <PhoneIcon />
            <input
                type="text"
                value={value || '+998'}
                onChange={handleChange}
                placeholder={placeholder || "+998 99 123 45 67"}
                className="phone-input"
            />
        </div>
    );
};

const LeadForm = ({ isOpen, onClose, lead: initialLead, initialStageId, onSuccess }) => {
    const { user } = useAuth();
    const isEdit = !!initialLead;
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [uploadingAudio, setUploadingAudio] = useState(false);
    const [localLead, setLocalLead] = useState(initialLead);

    // Helper to get full URL for media
    const getFullUrl = (path) => {
        if (!path) return '';
        if (typeof path !== 'string') return '';
        if (path.startsWith('http')) return path;
        // Default backend media URL
        return `${MEDIA_BASE_URL}${path}`;
    };
    const [deleting, setDeleting] = useState(false);
    const [stages, setStages] = useState([]);
    const [newNote, setNewNote] = useState('');

    const callStatusOptions = [
        { value: '', label: "Qo'ng'iroq qilinmagan" },
        { value: 'answered', label: "Javob berdi" },
        { value: 'not_answered', label: "Javob bermadi" },
        { value: 'client_answered', label: "Mijoz javob berdi" },
        { value: 'client_not_answered', label: "Mijoz javob bermadi" }
    ];

    const [formData, setFormData] = useState({
        client_name: '',
        phone_number: '+',
        stage: '',
        call_status: '',
        duration_hours: 0,
        duration_minutes: 0,
        duration_seconds: 0,
        audio_file: null,
        audio_file_name: '',
        lead_turi: '',
        date_at: '',
        notes: ''
    });

    const formatDateForInput = (dateStr) => {
        if (!dateStr) return '';
        try {
            // Replace space with T for datetime-local compatibility
            const formatted = dateStr.replace(' ', 'T');
            // Browser needs specifically YYYY-MM-DDTHH:mm
            return formatted.substring(0, 16);
        } catch (e) {
            console.error("Date formatting error:", e);
            return '';
        }
    };

    useEffect(() => {
        if (isOpen) {
            setLocalLead(initialLead);
            fetchStages();
            if (isEdit && initialLead) {
                fetchLeadData(); // Fetch full object with recordings
                let hours = 0, minutes = 0, seconds = 0;
                if (initialLead.call_duration) {
                    const parts = initialLead.call_duration.split(':');
                    hours = parseInt(parts[0]) || 0;
                    minutes = parseInt(parts[1]) || 0;
                    seconds = parseInt(parts[2]) || 0;
                }


                setFormData({
                    client_name: initialLead.client_name || '',
                    phone_number: formatApiPhoneToUI(initialLead.phone_number || ''),
                    stage: (initialLead.stage?.id || initialLead.stage || '').toString(),
                    call_status: initialLead.call_status || '',
                    duration_hours: hours,
                    duration_minutes: minutes,
                    duration_seconds: seconds,
                    lead_turi: initialLead.lead_turi || '',
                    date_at: formatDateForInput(initialLead.date_at),
                    notes: initialLead.notes || ''
                });
            } else {
                setFormData({
                    client_name: '',
                    phone_number: '',
                    stage: initialStageId ? initialStageId.toString() : '',
                    call_status: '',
                    duration_hours: 0, duration_minutes: 0, duration_seconds: 0,
                    audio_file: null, audio_file_name: '',
                    lead_turi: '',
                    date_at: '',
                    notes: ''
                });
            }
        }
    }, [isOpen, initialLead, initialStageId]);

    const fetchLeadData = async () => {
        if (!initialLead?.id) return;
        try {
            const res = await leadService.get(initialLead.id);
            setLocalLead(res.data);
            
            // Sync form data with fresh data from server
            if (res.data) {
                setFormData(prev => ({
                    ...prev,
                    client_name: res.data.client_name || prev.client_name,
                    phone_number: formatApiPhoneToUI(res.data.phone_number) || prev.phone_number,
                    lead_turi: res.data.lead_turi || prev.lead_turi,
                    date_at: res.data.date_at ? formatDateForInput(res.data.date_at) : prev.date_at,
                    notes: res.data.notes || prev.notes
                }));
            }
        } catch (error) {
            console.error("Failed to refresh lead data:", error);
        }
    };

    const fetchStages = async () => {
        try {
            const res = await leadService.getStages();
            const stagesData = Array.isArray(res.data) ? res.data : (res.data.results || []);
            setStages(stagesData);

            if (!isEdit && !formData.stage && stagesData.length > 0) {
                const defaultStage = initialStageId || (stagesData[0]?.id).toString();
                setFormData(prev => ({ ...prev, stage: defaultStage }));
            }
        } catch (error) {
            console.error(error);
            setStages([]);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;
        if (type === 'file' && files[0]) {
            const selectedFile = files[0];
            setFormData(prev => ({
                ...prev,
                audio_file: selectedFile,
                audio_file_name: selectedFile.name
            }));

            // If editing, we can offer immediate upload or wait for save
            // Let's keep it in state for the main save for now to be simple, 
            // but the user wants to "listen" - so I must provide a preview URL.
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleUploadAudio = async () => {
        if (!formData.audio_file || !isEdit) return;

        setUploadingAudio(true);
        try {
            await leadService.addAudio(localLead.id, formData.audio_file);
            toast.success("Audio yuklandi");
            setFormData(prev => ({ ...prev, audio_file: null, audio_file_name: '' }));
            fetchLeadData(); // Refresh local list
            if (onSuccess) onSuccess(); // Refresh kanban
        } catch (error) {
            console.error(error);
            toast.error("Audio yuklashda xatolik");
        } finally {
            setUploadingAudio(false);
        }
    };

    const handleDeleteAudio = async (audioId) => {
        if (!window.confirm("Bu audio yozuvni o'chirishni xohlaysizmi?")) return;

        try {
            await leadService.deleteAudio(audioId);
            toast.success("Audio yozuv o'chirildi");
            fetchLeadData(); // Refresh local list
            if (onSuccess) onSuccess(); // Refresh lead data to update the list
        } catch (error) {
            console.error(error);
            toast.error("Audio yozuvni o'chirishda xatolik");
        }
    };

    const handleAddNote = () => {
        if (!newNote.trim()) return;

        const now = new Date();
        const dateStr = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const opName = user?.first_name || user?.username || "Operator";

        const entry = `\n[${dateStr} - ${opName}]: ${newNote.trim()}`;

        setFormData(prev => ({
            ...prev,
            notes: (prev.notes || '').trim() + entry
        }));
        setNewNote('');
    };

    const handleClose = () => {
        onClose();
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        const rawPhone = parsePhoneToApi(formData.phone_number);
        if (rawPhone.length < 12) {
            toast.error("Telefon raqam to'liq kiritilishi kerak");
            return;
        }

        setLoading(true);
        try {
            const data = new FormData();
            data.append('client_name', formData.client_name);
            data.append('phone_number', rawPhone);
            data.append('stage', formData.stage);
            data.append('call_status', formData.call_status);

            const hours = parseInt(formData.duration_hours) || 0;
            const minutes = parseInt(formData.duration_minutes) || 0;
            const seconds = parseInt(formData.duration_seconds) || 0;
            if (hours > 0 || minutes > 0 || seconds > 0) {
                const duration = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                data.append('call_duration', duration);
            }


            if (formData.audio_file) {
                data.append('audio_recording', formData.audio_file);
            }

            data.append('lead_turi', formData.lead_turi);
            if (formData.date_at) {
                data.append('date_at', formData.date_at);
            }
            data.append('notes', formData.notes);

            if (isEdit) {
                await leadService.update(localLead.id, data);
                toast.success("Lead yangilandi");
            } else {
                await leadService.create(data);
                toast.success("Yangi lead qo'shildi");
            }
            onSuccess();
            handleClose();
        } catch (error) {
            console.error(error);
            toast.error("Xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (!localLead?.id) {
            console.error("Delete error: Lead ID is missing", localLead);
            toast.error("Lead ID topilmadi");
            return;
        }

        if (window.confirm("Bu leadni o'chirishni xohlaysizmi? Bu amalni qaytarib bo'lmaydi.")) {
            setDeleting(true);
            try {
                console.log("Deleting lead:", localLead.id);
                await leadService.delete(localLead.id);
                toast.success("Lead o'chirildi");
                if (onSuccess) onSuccess();
                handleClose();
            } catch (error) {
                console.error("Delete error details:", error);
                const errorMsg = error.response?.data?.detail || "O'chirishda xatolik yuz berdi";
                toast.error(errorMsg);
            } finally {
                setDeleting(false);
            }
        }
    };

    const modalFooter = (
        <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
            {isEdit && (!user?.role || user.role !== 'operator') && (
                <button
                    type="button"
                    className="btn-v2 btn-v2-danger"
                    onClick={(e) => handleDelete(e)}
                    disabled={deleting}
                >
                    {deleting ? "O'chirilmoqda..." : "O'chirish"}
                </button>
            )}
            <div style={{ flex: 1 }}></div>
            <button type="button" className="btn-v2 btn-v2-danger-light" onClick={handleClose} style={{ marginRight: '8px' }}>
                Bekor qilish
            </button>
            <button type="submit" className="btn-v2 btn-v2-primary" disabled={loading} onClick={handleSubmit}>
                {loading ? 'Saqlanmoqda...' : (isEdit ? 'Yangilash' : 'Saqlash')}
            </button>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={isEdit ? "Leadni tahrirlash" : "Lead qo'shish"}
            size="lg"
            footer={modalFooter}
        >
            <form onSubmit={handleSubmit}>
                <div className="modal-form-body">
                    <div className="form-group">
                        <label>Mijoz ismi</label>
                        <input
                            type="text"
                            name="client_name"
                            value={formData.client_name}
                            onChange={handleChange}
                            placeholder="To'liq ismni kiriting"
                        />
                    </div>

                    <div className="form-row two-cols">
                        <div className="form-group">
                            <label>Telefon raqami</label>
                            <PhoneInput
                                value={formData.phone_number}
                                onChange={(val) => setFormData(p => ({ ...p, phone_number: val }))}
                            />
                        </div>
                        <div className="form-group">
                            <label>Qo'ng'iroq holati</label>
                            <select
                                name="call_status"
                                value={formData.call_status}
                                onChange={handleChange}
                            >
                                {callStatusOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-row two-cols">
                        <div className="form-group">
                            <label>Qo'ng'iroq davomiyligi</label>
                            <span className="info-text">
                                {(formData.duration_hours > 0 || formData.duration_minutes > 0 || formData.duration_seconds > 0)
                                    ? `${String(formData.duration_hours).padStart(2, '0')}:${String(formData.duration_minutes).padStart(2, '0')}:${String(formData.duration_seconds).padStart(2, '0')}`
                                    : 'Mavjud emas'
                                }
                            </span>
                        </div>
                        <div className="form-group">
                            <label>Audio yozuvlar</label>
                            <div className="audio-upload-section">
                                <input
                                    type="file"
                                    name="audio_file"
                                    accept="audio/*"
                                    onChange={handleChange}
                                    style={{ display: 'none' }}
                                    ref={fileInputRef}
                                />

                                <div className="current-recordings">
                                    {/* Main recording (backward compatibility) */}
                                    {localLead?.audio_recording && (
                                        <div className="audio-item">
                                            <span className="audio-label">Asosiy yozuv</span>
                                            <audio controls src={getFullUrl(localLead.audio_recording)} style={{ height: '32px', width: '100%' }} />
                                        </div>
                                    )}

                                    {/* List of recordings from LeadAudio model */}
                                    {localLead?.audio_recordings?.map((rec, index) => (
                                        <div key={rec.id} className="audio-item">
                                            <div className="audio-item-header">
                                                <span className="audio-label">Yozuv #{localLead.audio_recordings.length - index}</span>
                                                <button
                                                    type="button"
                                                    className="audio-delete-btn"
                                                    onClick={() => handleDeleteAudio(rec.id)}
                                                    title="O'chirish"
                                                >
                                                    <TrashIcon />
                                                </button>
                                            </div>
                                            <audio controls src={getFullUrl(rec.file)} style={{ height: '32px', width: '100%' }} />
                                        </div>
                                    ))}

                                    {!localLead?.audio_recording && (!localLead?.audio_recordings || localLead.audio_recordings.length === 0) && !formData.audio_file && (
                                        <div className="no-audio">Audio yozuvlar mavjud emas</div>
                                    )}
                                </div>

                                <div className="add-audio-box">
                                    {formData.audio_file ? (
                                        <div className="selected-file-preview">
                                            <div className="file-info">
                                                <span className="file-name">{formData.audio_file_name}</span>
                                                <button
                                                    type="button"
                                                    className="remove-btn"
                                                    onClick={() => setFormData(p => ({ ...p, audio_file: null, audio_file_name: '' }))}
                                                >
                                                    O'chirish
                                                </button>
                                            </div>
                                            <div className="preview-player">
                                                <span className="preview-label">Tanlangan faylni eshitish:</span>
                                                <audio controls src={URL.createObjectURL(formData.audio_file)} style={{ height: '32px', width: '100%' }} />
                                            </div>
                                            {isEdit && (
                                                <button
                                                    type="button"
                                                    className="btn-v2 btn-v2-primary btn-sm"
                                                    onClick={handleUploadAudio}
                                                    disabled={uploadingAudio}
                                                    style={{ marginTop: '8px', width: '100%' }}
                                                >
                                                    {uploadingAudio ? "Yuklanmoqda..." : "Hozir yuklash"}
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            className="audio-upload-btn"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <UploadIcon />
                                            <span>Yangi audio qo'shish</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>


                    <div className="form-group">
                        <label>Sana va vaqt</label>
                        <input
                            type="datetime-local"
                            name="date_at"
                            value={formData.date_at}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Bosqich (Status)</label>
                        <select
                            name="stage"
                            value={formData.stage}
                            onChange={handleChange}
                        >
                            <option value="">Bosqichni tanlang</option>
                            {stages.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Lead turi</label>
                        <input
                            type="text"
                            name="lead_turi"
                            value={formData.lead_turi}
                            onChange={handleChange}
                            placeholder="Lead turini kiriting"
                        />
                    </div>

                    <div className="form-group notes-section">
                        <label>Izohlar (Tarix)</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            placeholder="Hali izohlar yo'q..."
                            rows={4}
                            className="notes-history"
                        />

                        <div className="add-note-container">
                            <textarea
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                placeholder="Yangi izoh qo'shish..."
                                rows={2}
                                className="new-note-input"
                            />
                            <button
                                type="button"
                                className="btn-add-note"
                                onClick={handleAddNote}
                                disabled={!newNote.trim()}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                Qo'shish
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default LeadForm;
