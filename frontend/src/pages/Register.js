import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api';
import './register-flat.css';
import { User, Mail, Lock, Calendar, Eye, EyeOff, Sparkles, Heart } from 'lucide-react';

function Register({ setUser }) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', dob: '', gender: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  // Load Google Identity Services SDK
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters.');
        setLoading(false);
        return;
      }

      const data = new FormData();
      data.append('name', formData.name);
      data.append('email', formData.email);
      data.append('password', formData.password);
      if (formData.gender) data.append('gender', formData.gender);
      if (formData.dob) data.append('dob', formData.dob);

      await API.post('/api/auth/register', data);

      const res = await API.post('/api/auth/login', {
        email: formData.email,
        password: formData.password
      });

      setUser(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('token', res.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.msg || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    if (!window.google) {
      setError("Google Sign-In SDK is still loading. Please try again in a moment.");
      return;
    }

    const clientId = "490808537455-jeoc5772eli072hsbhjafotnu5lmij9d.apps.googleusercontent.com";

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'email profile openid',
      callback: async (tokenResponse) => {
        if (tokenResponse && tokenResponse.access_token) {
          setLoading(true);
          setError('');
          try {
            const res = await API.post('/api/auth/google', {
              accessToken: tokenResponse.access_token
            });
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            localStorage.setItem('token', res.data.token);
            navigate('/');
          } catch (err) {
            console.error("Google auth api error details:", err);
            const errMsg = err.response?.data?.error || err.response?.data?.msg || err.message || "Google login failed. Try again.";
            setError(errMsg);
          } finally {
            setLoading(false);
          }
        }
      }
    });
    client.requestAccessToken();
  };

  const update = (key) => (e) => setFormData({ ...formData, [key]: e.target.value });

  return (
    <div className="register-compact-page">
      <div className="register-compact-card">
        <div className="register-compact-header">
          <div className="register-compact-brand">
            <Heart className="register-compact-heart" size={24} fill="#e11d48" color="#e11d48" />
            <span>Heartly</span>
          </div>
          <h2>Create Account</h2>
          <p className="register-compact-subtitle">
            Let's find your perfect match
          </p>
        </div>

        {error && <div className="register-compact-alert">{error}</div>}

        <form onSubmit={handleRegister} className="register-compact-form">
          <div className="register-compact-field">
            <label>Full Name</label>
            <div className="register-compact-input-wrap">
              <User size={18} className="register-compact-icon" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={update('name')}
              />
            </div>
          </div>

          <div className="register-compact-field">
            <label>Email Address</label>
            <div className="register-compact-input-wrap">
              <Mail size={18} className="register-compact-icon" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={update('email')}
              />
            </div>
          </div>

          <div className="register-compact-row">
            <div className="register-compact-field">
              <label>Password</label>
              <div className="register-compact-input-wrap">
                <Lock size={18} className="register-compact-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={update('password')}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="register-compact-field">
              <label>Confirm Password</label>
              <div className="register-compact-input-wrap">
                <Lock size={18} className="register-compact-icon" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={update('confirmPassword')}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div className="register-compact-row">
            <div className="register-compact-field">
              <label>Date of Birth</label>
              <div className="register-compact-input-wrap">
                <Calendar size={18} className="register-compact-icon" />
                <input
                  type="date"
                  required
                  value={formData.dob}
                  onChange={update('dob')}
                />
              </div>
            </div>

            <div className="register-compact-field">
              <label>Gender</label>
              <div className="register-compact-input-wrap">
                <Sparkles size={18} className="register-compact-icon" />
                <select required value={formData.gender} onChange={update('gender')}>
                  <option value="">Select gender</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>
            </div>
          </div>

          <button type="submit" className="register-compact-submit-btn" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="register-compact-divider">
          <span>or</span>
        </div>

        <button
          type="button"
          className="google-signin-btn"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" className="google-icon" fill="currentColor">
            <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.579-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.986 0-.746-.08-1.32-.176-1.785H12.24z"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="register-compact-footer">
          <span>Already have an account?</span>
          <Link to="/login">Log In</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
