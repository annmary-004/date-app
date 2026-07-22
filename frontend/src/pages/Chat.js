import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Send, Camera, MoreVertical, Mic, Image as ImageIcon,
  Video, MapPin, Edit2, X, Plus, Crown, PhoneCall, Clock
} from 'lucide-react';
import { io } from 'socket.io-client';
import API from '../api';
import { absoluteApiUrl, API_BASE_URL } from '../config';

function Chat({ user }) {
  const { matchId } = useParams();
  const navigate = useNavigate();

  const userPhotos = user.images && user.images.length > 0 ? user.images : (user.image ? [user.image] : []);
  const hasMinPhotos = userPhotos.length >= 4;

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [matchData, setMatchData] = useState(null);
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState('');
  const [chatExpired, setChatExpired] = useState(false);
  const socketRef = useRef();
  const scrollRef = useRef();
  const inputRef = useRef();

  const [menuOpen, setMenuOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [editingMsg, setEditingMsg] = useState(null);
  const [activeMenuMsg, setActiveMenuMsg] = useState(null);
  const [recording, setRecording] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState('');
  const [mediaType, setMediaType] = useState('text');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    if (!hasMinPhotos) return;
    const socket = io(API_BASE_URL);
    socketRef.current = socket;

    const loadThread = async () => {
      try {
        const [matchResponse, messageResponse] = await Promise.all([
          API.get(`/api/user/${matchId}`),
          API.get(`/api/chat/${user._id}/${matchId}`)
        ]);
        setMatchData(matchResponse.data);
        setMessages(messageResponse.data);
      } catch (error) {
        console.error('Failed to load chat', error);
      }
    };

    loadThread();

    socket.on('receiveMessage', (message) => {
      if (
        (message.sender === matchId && message.receiver === user._id) ||
        (message.sender === user._id && message.receiver === matchId)
      ) {
        setMessages((prev) => {
          const existingIdx = prev.findIndex((item) => item._id === message._id);
          if (existingIdx !== -1) {
            const updated = [...prev];
            updated[existingIdx] = message;
            return updated;
          }
          return [...prev, message];
        });
      }
    });

    return () => {
      socket.off('receiveMessage');
      socket.disconnect();
    };
  }, [matchId, user._id, hasMinPhotos]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSafetyAction = async (action) => {
    setMenuOpen(false);
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      const endpoint = action === 'report' ? '/api/user/report' : `/api/user/${action}`;
      const payload = action === 'report'
        ? { reporter: user._id, reported: matchId, reason: 'User reported from chat' }
        : { userId: user._id, targetId: matchId };
      await API.post(endpoint, payload);
      navigate('/matches');
    } catch (err) {
      alert(`Failed to ${action} user`);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
      setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
      setAttachOpen(false);
    }
  };

  const sendLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setInput(`https://www.google.com/maps?q=${latitude},${longitude}`);
        setMediaType('location');
        setAttachOpen(false);
      }, () => alert('Location access denied'));
    }
  };

  const startRecording = async () => {
    setAttachOpen(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = e => audioChunksRef.current.push(e.data);
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], 'voice-note.webm', { type: 'audio/webm' });
        setMediaFile(file);
        setMediaType('voice');
        setMediaPreview(URL.createObjectURL(audioBlob));
        audioChunksRef.current = [];
      };
      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (err) {
      alert('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setRecording(false);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() && !mediaFile) return;

    if (editingMsg) {
      try {
        const res = await API.put(`/api/chat/${editingMsg._id}`, { text: input });
        socketRef.current.emit('sendMessage', res.data);
        setEditingMsg(null);
        setInput('');
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to edit');
      }
      return;
    }

    setSending(true);
    try {
      let res;
      if (mediaFile) {
        const formData = new FormData();
        formData.append('sender', user._id);
        formData.append('receiver', matchId);
        formData.append('text', input);
        formData.append('messageType', mediaType);
        formData.append('media', mediaFile);
        res = await API.post('/api/chat', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        res = await API.post('/api/chat', { sender: user._id, receiver: matchId, text: input, messageType: mediaType });
      }

      socketRef.current.emit('sendMessage', res.data);
      setInput('');
      setMediaFile(null);
      setMediaPreview('');
      setMediaType('text');
      setChatError('');
    } catch (error) {
      setChatError(error.response?.data?.error || 'Failed to send');
      if (error.response?.data?.error?.includes('expired')) {
        setChatExpired(true);
      }
    } finally {
      setSending(false);
    }
  };

  const getAvatar = (data) => {
    if (!data) return '';
    if (data.image) return absoluteApiUrl(data.image);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&size=80&background=f43f5e&color=fff`;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Group messages by date
  const groupedMessages = [];
  let lastDate = null;
  for (const msg of messages) {
    const dateLabel = formatDate(msg.timestamp || msg.createdAt);
    if (dateLabel !== lastDate) {
      groupedMessages.push({ type: 'date', label: dateLabel, key: `date-${msg._id}` });
      lastDate = dateLabel;
    }
    groupedMessages.push({ type: 'msg', data: msg, key: msg._id });
  }

  if (!hasMinPhotos) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{
          maxWidth: '420px', padding: '40px 32px', borderRadius: '28px',
          background: 'var(--surface)', textAlign: 'center',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.08)', border: '1px solid var(--line)'
        }}>
          <Camera size={36} style={{ color: '#f43f5e' }} />
          <h3 style={{ fontWeight: '800', fontSize: '1.4rem', margin: 0 }}>4 Photos Required</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.93rem', lineHeight: '1.6', margin: 0 }}>
            Upload at least <strong>4 verified face photos</strong> to chat with matches.
          </p>
          <button onClick={() => navigate('/profile/photos')} style={{
            width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
            background: 'linear-gradient(135deg, #e11d48, #f43f5e)',
            color: '#fff', fontWeight: '800', fontSize: '0.97rem', cursor: 'pointer'
          }}>Upload Photos Now</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)' }}>

      {/* ── HEADER ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px 16px',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--line)',
        position: 'sticky', top: 0, zIndex: 50,
        backdropFilter: 'blur(20px)'
      }}>
        <button
          onClick={() => navigate('/matches')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)', padding: '6px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ArrowLeft size={22} />
        </button>

        {matchData && (
          <>
            <div style={{ position: 'relative' }}>
              <img
                src={getAvatar(matchData)}
                alt={matchData.name}
                style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--line)' }}
              />
              <div style={{
                position: 'absolute', bottom: '1px', right: '1px',
                width: '11px', height: '11px', borderRadius: '50%',
                background: '#22c55e', border: '2px solid var(--surface)'
              }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-main)' }}>{matchData.name}</div>
              <div style={{ fontSize: '0.72rem', color: '#22c55e', fontWeight: '600' }}>Active now</div>
            </div>
          </>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '6px', borderRadius: '10px' }}
            >
              <MoreVertical size={20} />
            </button>
            {menuOpen && (
              <div onClick={() => setMenuOpen(false)} style={{
                position: 'fixed', inset: 0, zIndex: 98, background: 'transparent'
              }} />
            )}
            {menuOpen && (
              <div style={{
                position: 'absolute', top: '110%', right: 0, zIndex: 99,
                background: 'var(--surface)', border: '1px solid var(--line)',
                borderRadius: '16px', overflow: 'hidden', minWidth: '180px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
              }}>
                {[
                  { label: 'Unmatch', action: 'unmatch', color: 'var(--text-main)' },
                  { label: 'Report User', action: 'report', color: '#f59e0b' },
                  { label: 'Block User', action: 'block', color: '#e11d48' }
                ].map(item => (
                  <button
                    key={item.action}
                    onClick={() => handleSafetyAction(item.action)}
                    style={{
                      display: 'block', width: '100%', padding: '12px 18px',
                      background: 'none', border: 'none', cursor: 'pointer',
                      textAlign: 'left', color: item.color, fontWeight: '600', fontSize: '0.9rem',
                      borderBottom: '1px solid var(--line)'
                    }}
                  >{item.label}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── CHAT EXPIRED BANNER ── */}
      {chatExpired && (
        <div style={{
          padding: '14px 20px', background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(217,119,6,0.1))',
          borderBottom: '1px solid rgba(245,158,11,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Crown size={18} style={{ color: '#d97706', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.88rem', color: '#92400e' }}>Chat expired after 5 days</div>
              <div style={{ fontSize: '0.77rem', color: '#b45309' }}>Upgrade to Premium to continue this conversation</div>
            </div>
          </div>
          <button onClick={() => navigate('/payment')} style={{
            padding: '8px 14px', borderRadius: '20px', border: 'none',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#fff', fontWeight: '800', fontSize: '0.78rem', cursor: 'pointer', flexShrink: 0
          }}>Get Premium</button>
        </div>
      )}

      {/* ── CHAT ERROR ── */}
      {chatError && !chatExpired && (
        <div style={{
          padding: '10px 16px', background: 'rgba(225,29,72,0.08)',
          borderBottom: '1px solid rgba(225,29,72,0.15)',
          color: '#e11d48', fontSize: '0.85rem', textAlign: 'center', fontWeight: '600'
        }}>{chatError}</div>
      )}

      {/* ── MESSAGES ── */}
      <div
        style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}
        onClick={() => { setActiveMenuMsg(null); setMenuOpen(false); setAttachOpen(false); }}
      >
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            {matchData && (
              <div style={{ marginBottom: '20px' }}>
                <img
                  src={getAvatar(matchData)}
                  alt={matchData.name}
                  style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 12px', display: 'block', border: '3px solid var(--line)' }}
                />
                <div style={{ fontWeight: '800', fontSize: '1.1rem' }}>{matchData.name}</div>
                {matchData.bio && <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px', fontStyle: 'italic' }}>"{matchData.bio}"</div>}
              </div>
            )}
            <div style={{
              display: 'inline-block', padding: '10px 20px', borderRadius: '50px',
              background: 'var(--surface)', border: '1px solid var(--line)',
              color: 'var(--text-muted)', fontSize: '0.83rem', fontWeight: '600'
            }}>
              👋 Say hi and break the ice!
            </div>
          </div>
        )}

        {groupedMessages.map((item) => {
          if (item.type === 'date') {
            return (
              <div key={item.key} style={{ textAlign: 'center', margin: '16px 0 10px' }}>
                <span style={{
                  display: 'inline-block', padding: '4px 14px', borderRadius: '50px',
                  background: 'var(--surface)', border: '1px solid var(--line)',
                  color: 'var(--text-muted)', fontSize: '0.73rem', fontWeight: '700'
                }}>{item.label}</span>
              </div>
            );
          }

          const msg = item.data;
          const isMe = msg.sender === user._id;

          return (
            <div key={item.key} style={{
              display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start',
              marginBottom: '6px', position: 'relative'
            }}>
              {/* Match avatar on received side */}
              {!isMe && matchData && (
                <img
                  src={getAvatar(matchData)}
                  alt=""
                  style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover', alignSelf: 'flex-end', marginRight: '8px', flexShrink: 0 }}
                />
              )}

              <div style={{ maxWidth: '72%' }}>
                <div
                  onClick={(e) => { e.stopPropagation(); if (isMe && !msg.isDeleted) setActiveMenuMsg(activeMenuMsg === msg._id ? null : msg._id); }}
                  style={{
                    padding: msg.messageType !== 'text' ? '6px' : '10px 14px',
                    borderRadius: isMe ? '20px 20px 6px 20px' : '20px 20px 20px 6px',
                    background: isMe
                      ? 'linear-gradient(135deg, #e11d48, #f43f5e)'
                      : 'var(--surface)',
                    color: isMe ? '#fff' : 'var(--text-main)',
                    fontSize: '0.9rem', lineHeight: '1.5',
                    cursor: isMe && !msg.isDeleted ? 'pointer' : 'default',
                    border: isMe ? 'none' : '1px solid var(--line)',
                    boxShadow: isMe ? '0 4px 12px rgba(225,29,72,0.2)' : '0 2px 8px rgba(0,0,0,0.06)',
                    position: 'relative'
                  }}
                >
                  {msg.isDeleted ? (
                    <span style={{ fontStyle: 'italic', opacity: 0.6, fontSize: '0.83rem' }}>Message deleted</span>
                  ) : (
                    <>
                      {msg.messageType === 'image' && msg.mediaUrl && (
                        <img src={absoluteApiUrl(msg.mediaUrl)} alt="attachment" style={{ maxWidth: '220px', borderRadius: '14px', display: 'block' }} />
                      )}
                      {msg.messageType === 'video' && msg.mediaUrl && (
                        <video src={absoluteApiUrl(msg.mediaUrl)} controls style={{ maxWidth: '220px', borderRadius: '14px', display: 'block' }} />
                      )}
                      {msg.messageType === 'voice' && msg.mediaUrl && (
                        <audio src={absoluteApiUrl(msg.mediaUrl)} controls style={{ maxWidth: '240px' }} />
                      )}
                      {msg.messageType === 'location' ? (
                        <a href={msg.text} target="_blank" rel="noreferrer" style={{ color: isMe ? '#fff' : '#f43f5e', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                          <MapPin size={16} /> 📍 View Location
                        </a>
                      ) : (
                        msg.text && <span>{msg.text}</span>
                      )}
                      {msg.isEdited && (
                        <span style={{ fontSize: '0.65rem', opacity: 0.65, marginLeft: '6px' }}>(edited)</span>
                      )}
                    </>
                  )}
                </div>

                <div style={{
                  textAlign: isMe ? 'right' : 'left',
                  fontSize: '0.68rem', color: 'var(--text-muted)', margin: '3px 4px 0',
                  display: 'flex', alignItems: 'center', justifyContent: isMe ? 'flex-end' : 'flex-start', gap: '4px'
                }}>
                  <Clock size={9} />
                  {formatTime(msg.timestamp || msg.createdAt)}
                </div>

                {/* Message action popup */}
                {activeMenuMsg === msg._id && isMe && !msg.isDeleted && (
                  <div style={{
                    position: 'absolute', top: 0, right: isMe ? '100%' : 'auto', left: isMe ? 'auto' : '100%',
                    marginRight: isMe ? '8px' : 0, marginLeft: isMe ? 0 : '8px',
                    background: 'var(--surface)', border: '1px solid var(--line)',
                    borderRadius: '14px', overflow: 'hidden', zIndex: 10,
                    boxShadow: '0 8px 28px rgba(0,0,0,0.15)'
                  }}>
                    {msg.messageType === 'text' && (
                      <button
                        onClick={() => { setEditingMsg(msg); setInput(msg.text); setActiveMenuMsg(null); inputRef.current?.focus(); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          padding: '10px 16px', background: 'none', border: 'none',
                          cursor: 'pointer', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.85rem',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <Edit2 size={14} /> Edit (5 min)
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* ── EDIT INDICATOR ── */}
      {editingMsg && (
        <div style={{
          padding: '8px 16px', background: 'rgba(244,63,94,0.08)',
          borderTop: '1px solid rgba(244,63,94,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: '0.8rem', color: '#f43f5e', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Edit2 size={13} /> Editing message
          </span>
          <button onClick={() => { setEditingMsg(null); setInput(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── MEDIA PREVIEW ── */}
      {mediaPreview && (
        <div style={{
          padding: '10px 16px', background: 'var(--surface)',
          borderTop: '1px solid var(--line)',
          display: 'flex', alignItems: 'center', gap: '12px'
        }}>
          {mediaType === 'image' && <img src={mediaPreview} alt="preview" style={{ height: '64px', borderRadius: '10px' }} />}
          {mediaType === 'video' && <video src={mediaPreview} style={{ height: '64px', borderRadius: '10px' }} />}
          {mediaType === 'voice' && <audio src={mediaPreview} controls style={{ height: '36px' }} />}
          <button onClick={() => { setMediaFile(null); setMediaPreview(''); setMediaType('text'); }} style={{
            background: '#f43f5e', color: '#fff', border: 'none', borderRadius: '50%',
            width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── ATTACH POPUP ── */}
      {attachOpen && (
        <>
          <div onClick={() => setAttachOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'transparent' }} />
          <div style={{
            position: 'fixed', bottom: '80px', left: '16px', zIndex: 50,
            background: 'var(--surface)', border: '1px solid var(--line)',
            borderRadius: '20px', padding: '12px 16px',
            display: 'flex', gap: '20px',
            boxShadow: '0 -4px 32px rgba(0,0,0,0.12)'
          }}>
            {[
              { icon: <ImageIcon size={22} />, label: 'Photo', accept: 'image/*' },
              { icon: <Video size={22} />, label: 'Video', accept: 'video/*' }
            ].map(item => (
              <label key={item.label} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', color: 'var(--text-main)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(244,63,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f43f5e' }}>
                  {item.icon}
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: '700' }}>{item.label}</span>
                <input type="file" accept={item.accept} hidden onChange={handleFileChange} />
              </label>
            ))}
            <button type="button" onClick={sendLocation} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', color: 'var(--text-main)'
            }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e' }}>
                <MapPin size={22} />
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: '700' }}>Location</span>
            </button>
          </div>
        </>
      )}

      {/* ── INPUT BAR ── */}
      <form
        onSubmit={sendMessage}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 12px 10px',
          background: 'var(--surface)',
          borderTop: '1px solid var(--line)',
          position: 'sticky', bottom: 0,
          paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))'
        }}
      >
        {!editingMsg && (
          <button
            type="button"
            onClick={() => setAttachOpen(!attachOpen)}
            style={{
              background: 'var(--surface-strong)', border: '1px solid var(--line)',
              width: '40px', height: '40px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0
            }}
          >
            <Plus size={20} />
          </button>
        )}

        <div style={{ flex: 1, position: 'relative' }}>
          <input
            ref={inputRef}
            type="text"
            placeholder={chatExpired ? 'Chat expired — upgrade to Premium' : editingMsg ? 'Edit your message...' : 'Message...'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={chatExpired && !editingMsg}
            style={{
              width: '100%', padding: '10px 16px',
              borderRadius: '50px',
              background: 'var(--surface-strong)',
              border: '1px solid var(--line)',
              color: 'var(--text-main)',
              fontSize: '0.92rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {!input.trim() && !mediaFile && !editingMsg ? (
          <button
            type="button"
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            style={{
              width: '40px', height: '40px', borderRadius: '50%', border: 'none',
              background: recording ? 'linear-gradient(135deg, #e11d48, #f43f5e)' : 'var(--surface-strong)',
              border: '1px solid var(--line)',
              color: recording ? '#fff' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
              boxShadow: recording ? '0 0 0 4px rgba(244,63,94,0.2)' : 'none'
            }}
          >
            <Mic size={18} />
          </button>
        ) : (
          <button
            type="submit"
            disabled={(!input.trim() && !mediaFile) || sending || (chatExpired && !editingMsg)}
            style={{
              width: '42px', height: '42px', borderRadius: '50%', border: 'none',
              background: 'linear-gradient(135deg, #e11d48, #f43f5e)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
              boxShadow: '0 4px 14px rgba(225,29,72,0.3)',
              opacity: ((!input.trim() && !mediaFile) || sending) ? 0.5 : 1,
              transition: 'opacity 0.2s'
            }}
          >
            <Send size={17} />
          </button>
        )}
      </form>
    </div>
  );
}

export default Chat;
