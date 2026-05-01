import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Heart, Lock, Mail } from 'lucide-react';
import API from '../api';

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
    <div className="auth-page auth-page-login">
      <div className="login-shell glass-panel">
        <div className="login-brand">
          <div className="auth-brand-mark login-brand-icon">
            <Heart size={22} strokeWidth={2.5} fill="currentColor" />
          </div>
          <h1>Welcome back</h1>
          <p>
            After you sign in, every profile shows <strong>gender</strong>, <strong>who they want to date</strong>,
            orientation, lifestyle, and more—like the big dating apps.
          </p>
        </div>

        {error && <p className="form-alert">{error}</p>}

        <form onSubmit={handleLogin} className="auth-form login-form">
          <label className="field-group field-with-icon">
            <span>Email</span>
            <div className="input-wrap">
              <Mail className="input-icon" size={20} aria-hidden />
              <input
                type="email"
                placeholder="you@example.com"
                className="input-field input-has-icon"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </label>

          <label className="field-group field-with-icon">
            <span>Password</span>
            <div className="input-wrap">
              <Lock className="input-icon" size={20} aria-hidden />
              <input
                type="password"
                placeholder="Your password"
                className="input-field input-has-icon"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </label>

          <button type="submit" className="btn-primary" disabled={loading}>
            <span>{loading ? 'Signing in...' : 'Sign in'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <p className="auth-switch">
          New here? <Link to="/register">Create a profile</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
