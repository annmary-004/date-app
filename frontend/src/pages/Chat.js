import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { io } from 'socket.io-client';
import API from '../api';

function Chat({ user }) {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [matchData, setMatchData] = useState(null);
  const [sending, setSending] = useState(false);
  const socketRef = useRef();
  const scrollRef = useRef();

  useEffect(() => {
    const socket = io('http://localhost:5000');
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
          const alreadyExists = prev.some((item) => item._id && item._id === message._id);
          if (alreadyExists) return prev;
          return [...prev, message];
        });
      }
    });

    return () => {
      socket.off('receiveMessage');
      socket.disconnect();
    };
  }, [matchId, user._id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const text = input.trim();
    setInput('');
    setSending(true);

    const newMsg = {
      sender: user._id,
      receiver: matchId,
      text
    };

    try {
      const res = await API.post('/api/chat', newMsg);
      setMessages((prev) => [...prev, res.data]);
      socketRef.current.emit('sendMessage', res.data);
    } catch (err) {
      console.error('Failed to send message', err);
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const getAvatar = (data) => {
    if (!data) return '';
    if (data.image) return data.image.startsWith('http') ? data.image : `http://localhost:5000${data.image}`;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&size=80&background=ff4b4b&color=fff`;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="screen chat-screen">
      <section className="screen-hero">
        <div className="hero-copy">
          <span className="eyebrow">Conversation</span>
          <h2>Same chat, cleaner thread layout.</h2>
          <p>Everything still runs on the same message data and real-time socket flow.</p>
        </div>
      </section>

      <div className="glass-panel chat-shell">
        <div className="chat-header">
          <button onClick={() => navigate(-1)} className="back-btn">
            <ArrowLeft size={22} />
          </button>
          {matchData && (
            <>
              <img src={getAvatar(matchData)} alt={matchData.name} />
              <div className="chat-header-copy">
                <span className="chat-title">
                  {matchData.name}
                  {matchData.age != null ? `, ${matchData.age}` : ''}
                </span>
                <span className="chat-subtitle">
                  {[
                    matchData.gender,
                    matchData.showMe ? `Into ${matchData.showMe}` : '',
                    matchData.sexualOrientation,
                    [matchData.occupation, matchData.city].filter(Boolean).join(' · ')
                  ]
                    .filter(Boolean)
                    .join(' · ') || 'Say hi— you already saw their full profile.'}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="glass-panel empty-thread">
              <h3>No messages yet</h3>
              <p>Say hi and get the conversation started.</p>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div key={msg._id || idx} className={`message ${msg.sender === user._id ? 'sent' : 'received'}`}>
              <span>{msg.text}</span>
              <span className="msg-time">{formatTime(msg.timestamp || msg.createdAt)}</span>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>

        <form className="chat-input" onSubmit={sendMessage}>
          <input
            type="text"
            placeholder="Type a message..."
            className="input-field chat-text-field"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="send-btn" disabled={!input.trim() || sending}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default Chat;
