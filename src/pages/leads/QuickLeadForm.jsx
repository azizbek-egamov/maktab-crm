import React, { useState } from 'react';
import { leadService } from '../../services/leads';
import { toast } from 'sonner';
import { formatPhoneInput, parsePhoneToApi } from '../../utils/phoneFormatter';

const HEARD_SOURCES = [
    { value: 'Instagramda', label: '📸 Instagram' },
    { value: 'Telegramda', label: '✈️ Telegram' },
    { value: 'Facebookda', label: '📘 Facebook' },
    { value: 'Influencer', label: '⭐ Influencer' },
    { value: 'Referral', label: '👥 Referral' },
    { value: 'YouTubeda', label: '▶️ YouTube' },
    { value: 'Odamlar orasida', label: '🗣️ Odamlar orasida' },
    { value: 'Xech qayerda', label: '❓ Boshqa' },
];

const QuickLeadForm = ({ stageId, onCancel, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        client_name: '',
        phone_number: '',
        heard_source: 'Instagramda',
        notes: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhoneChange = (e) => {
        setFormData(prev => ({ ...prev, phone_number: formatPhoneInput(e.target.value) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const rawPhone = parsePhoneToApi(formData.phone_number);
        if (rawPhone.length < 12) {
            toast.error("Telefon raqamni to'liq kiriting");
            return;
        }

        setLoading(true);
        try {
            const data = new FormData();
            data.append('client_name', formData.client_name);
            data.append('phone_number', rawPhone);
            data.append('stage', stageId);
            data.append('heard_source', formData.heard_source || 'Instagramda');

            if (formData.notes) data.append('notes', formData.notes);

            await leadService.create(data);
            toast.success("Lead qo'shildi");
            onSuccess();
            setFormData({ client_name: '', phone_number: '', heard_source: 'Instagramda', notes: '' });
        } catch (error) {
            console.error(error);
            toast.error("Xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="quick-lead-form">
            <form onSubmit={handleSubmit}>
                <div className="form-group-sm">
                    <label>Mijoz ismi</label>
                    <input
                        type="text"
                        name="client_name"
                        value={formData.client_name}
                        onChange={handleChange}
                        placeholder="Mijoz ismini kiriting"
                        autoFocus
                    />
                </div>

                <div className="form-group-sm">
                    <label>Telefon raqami *</label>
                    <input
                        type="text"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handlePhoneChange}
                        placeholder="+998"
                    />
                </div>

                <div className="form-group-sm">
                    <label>Manba (Marketing)</label>
                    <select
                        name="heard_source"
                        value={formData.heard_source}
                        onChange={handleChange}
                    >
                        {HEARD_SOURCES.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group-sm">
                    <label>Izoh</label>
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder="Qo'shimcha ma'lumotlar..."
                        rows={2}
                    />
                </div>

                <div className="quick-form-actions">
                    <button
                        type="submit"
                        className="btn-v2 btn-v2-success btn-sm"
                        disabled={loading}
                    >
                        {loading ? '...' : (
                            <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                <span>Saqlash</span>
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        className="btn-v2 btn-v2-light btn-sm"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        × Bekor qilish
                    </button>
                </div>
            </form>
        </div>
    );
};

export default QuickLeadForm;
