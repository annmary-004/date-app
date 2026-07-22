import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await API.post('/api/auth/login', { email, password });
      if (res.data.user.role !== 'admin') {
        setError('Access denied. Admins only.');
        setLoading(false);
        return;
      }
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/admin/dashboard');
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen auth-screen" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel auth-card" style={{ maxWidth: '400px', width: '100%', padding: '40px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '8px', fontSize: '1.8rem', fontWeight: '800' }}>Admin Area</h2>
        <p style={{ textAlign: 'center', color: '#57534e', marginBottom: '32px' }}>Heartly Administration</p>
        
        {error && <div className="error-msg" style={{ background: '#ffe8e8', color: '#b42318', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>{error}</div>}
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="input-group">
            <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Admin Email</label>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e7e5e4' }}
            />
          </div>
          <div className="input-group">
            <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Password</label>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e7e5e4' }}
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
            style={{ 
              marginTop: '12px',
              width: '100%', 
              padding: '14px', 
              borderRadius: '12px', 
              border: 'none', 
              background: 'linear-gradient(135deg, #1c1917 0%, #44403c 100%)', 
              color: '#ffffff', 
              fontWeight: '700',
              cursor: 'pointer' 
            }}
          >
            {loading ? 'Authenticating...' : 'Login to Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;
