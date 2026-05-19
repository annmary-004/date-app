import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api';
import '../auth-animated.css';

function Login({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await API.post('/api/auth/login', { email, password });
      setUser(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('token', res.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-animated-page">
      <div className="auth-glass-container">
        
        <div className="auth-hero">
          <h1>Dating App</h1>
          <p>
            Welcome back to the most vibrant space to meet new people. 
            Connect, chat, and find exactly who you're looking for.
          </p>
        </div>

        <div className="auth-form-wrap">
          <h2>Sign In</h2>
          <p className="auth-subtitle">Welcome back! Please enter your details.</p>

          {error && <div className="glass-alert">{error}</div>}

          <form onSubmit={handleLogin} className="glass-form">
            <div className="glass-field">
              <label>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="glass-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="glass-field">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="glass-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="glass-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="glass-switch">
            New here? <Link to="/register">Create an account</Link>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;
