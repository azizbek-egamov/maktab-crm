import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { instagramService } from '../../services/instagram';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';
import { Send, X, RefreshCw, Instagram, User, Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import './InstagramChatModal.css';

const InstagramChatModal = ({ isOpen, onClose, threadId, recipientId, username, accountId }) => {
    useBodyScrollLock(isOpen);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [inputText, setInputText] = useState('');
    const [sending, setSending] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (isOpen && threadId) {
            fetchMessages();
        }
    }, [isOpen, threadId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const response = await instagramService.getMessages(threadId, accountId);
            if (response.data) {
                setMessages(response.data);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
            toast.error('Xabarlar yuklanishida xatolik');
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim() || sending) return;

        setSending(true);
        try {
            await instagramService.sendMessage(recipientId, inputText.trim(), accountId);
            setInputText('');
            // Optimistic update or refetch
            fetchMessages();
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Xabar yuborishda xatolik');
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="chat-modal-overlay" onClick={onClose}>
            <div className="chat-modal-container" onClick={e => e.stopPropagation()}>
                <div className="chat-modal-header">
                    <div className="chat-user-info">
                        <div className="chat-avatar">
                            <User size={20} />
                        </div>
                        <div className="chat-user-details">
                            <h3>{username || 'Instagram User'}</h3>
                            <span className="chat-status">
                                <Instagram size={12} className="ig-icon" /> Direct
                            </span>
                        </div>
                    </div>
                    <div className="chat-actions">
                        <button className="refresh-btn" onClick={fetchMessages} title="Yangilash">
                            <RefreshCw size={18} className={loading ? 'spinning' : ''} />
                        </button>
                        <button className="close-btn" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="chat-messages-area" ref={scrollRef}>
                    {loading && messages.length === 0 ? (
                        <div className="chat-loading">
                            <RefreshCw size={24} className="spinning" />
                            <span>Yuklanmoqda...</span>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="chat-empty">
                            <Instagram size={48} className="empty-icon" />
                            <p>Xabarlar mavjud emas</p>
                        </div>
                    ) : (
                        <div className="messages-list">
                            {messages.map((msg, index) => {
                                const isMe = msg.from && msg.from.id !== recipientId;
                                return (
                                    <div key={msg.id || index} className={`message-wrapper ${isMe ? 'me' : 'them'}`}>
                                        <div className="message-bubble">
                                            <p className="message-text">{msg.text}</p>
                                            <span className="message-time">
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <form className="chat-input-area" onSubmit={handleSendMessage}>
                    <button type="button" className="attachment-btn" title="Fayl biriktirish (Tez kunda)">
                        <Paperclip size={20} />
                    </button>
                    <input 
                        type="text" 
                        placeholder="Xabar yozing..." 
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        disabled={sending}
                    />
                    <button type="submit" className="send-btn" disabled={!inputText.trim() || sending}>
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default InstagramChatModal;
