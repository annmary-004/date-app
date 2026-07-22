import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, MapPin, User, EyeOff, Bell, Trash2, AlertTriangle, X } from 'lucide-react';
import API from '../api';

function Settings({ user, setUser }) {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [subError, setSubError] = useState('');
  const [submittingPlan, setSubmittingPlan] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState(user?.subscriptionPlan || 'free');

  // Delete account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1); // 1 = warning, 2 = confirm email
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState(
    user?.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt) : null
  );
  const [form, setForm] = useState({
    distancePreference: user?.distancePreference ?? 30,
    minAgePreference: user?.minAgePreference ?? 18,
    maxAgePreference: Math.min(user?.maxAgePreference ?? 35, 45),
    showOnlineStatus: Boolean(user?.showOnlineStatus ?? true),
    pushNotifications: Boolean(user?.pushNotifications ?? true),
    emailNotifications: Boolean(user?.emailNotifications ?? false),
    incognitoMode: Boolean(user?.incognitoMode ?? false),
    themePreference: localStorage.getItem('themePreference') || 'system'
  });

  // Helper to apply theme immediately
  const applyTheme = (theme) => {
    const root = document.documentElement;
    root.classList.remove('dark-theme');
    document.body.classList.remove('dark-theme');
    
    if (theme === 'dark') {
      root.classList.add('dark-theme');
      document.body.classList.add('dark-theme');
    } else if (theme === 'system') {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark-theme');
        document.body.classList.add('dark-theme');
      }
    }
    localStorage.setItem('themePreference', theme);
    window.dispatchEvent(new Event('themeChange'));
  };

  if (!user || !user._id) {
    return (
      <div className="screen profile-screen">
        <section className="glass-panel profile-panel edit-panel">
          <div className="edit-top">
            <button className="btn-icon" type="button" onClick={() => navigate(-1)}>
              <ArrowLeft size={18} />
              <span>Back</span>
            </button>
            <h2>Preferences</h2>
          </div>
          <p className="form-alert">Unable to load settings. Please log in again.</p>
        </section>
      </div>
    );
  }

  const setValue = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const formatExpiry = (date) => {
    if (!date) return 'Not active';
    return new Date(date).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const purchasePlan = async (plan) => {
    setSubError('');
    setSubmittingPlan(true);

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setSubError('Could not load payment SDK.');
      setSubmittingPlan(false);
      return;
    }

    try {
      const res = await API.post(`/api/user/subscribe/${user._id}`, { plan });
      const { orderId, amount, currency, key } = res.data;

      const options = {
        key,
        amount,
        currency,
        name: 'Date App Premium',
        description: `Subscribe for ${plan} plan`,
        order_id: orderId,
        handler: async (response) => {
          try {
            const verifyRes = await API.post(`/api/user/verify-payment/${user._id}`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan
            });
            setUser(verifyRes.data);
            localStorage.setItem('user', JSON.stringify(verifyRes.data));
            setSubscriptionPlan(verifyRes.data.subscriptionPlan || 'free');
            setSubscriptionExpiresAt(verifyRes.data.subscriptionExpiresAt ? new Date(verifyRes.data.subscriptionExpiresAt) : null);
          } catch (verifyErr) {
            setSubError(verifyErr.response?.data?.error || 'Payment verification failed.');
          }
        },
        prefill: {
          name: user.name,
          email: user.email
        },
        theme: {
          color: '#ff5a5f'
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (failure) => {
        setSubError(failure.error?.description || 'Payment failed. Please try again.');
      });
      razorpay.open();
    } catch (err) {
      setSubError(err.response?.data?.error || err.message || 'Failed to initiate payment.');
    } finally {
      setSubmittingPlan(false);
    }
  };

  const handleMinAge = (e) => {
    const val = parseInt(e.target.value);
    if (val < form.maxAgePreference) {
      setForm(prev => ({ ...prev, minAgePreference: val }));
    }
  };

  const handleMaxAge = (e) => {
    const val = Math.min(parseInt(e.target.value), 45);
    if (val > form.minAgePreference) {
      setForm(prev => ({ ...prev, maxAgePreference: val }));
    }
  };

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await API.put(`/api/user/settings/${user._id}`, form);
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      localStorage.setItem('themePreference', form.themePreference);
      // Trigger a custom event to notify App.js immediately
      window.dispatchEvent(new Event('themeChange'));
      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="screen profile-screen">
      <section className="glass-panel profile-panel edit-panel">
        <div className="edit-top">
          <button className="btn-icon" type="button" onClick={() => navigate('/profile')}>
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>
          <h2>Preferences</h2>
        </div>

        {error && <p className="form-alert">{error}</p>}

        <form onSubmit={onSave} className="auth-form" style={{display: 'flex', flexDirection: 'column', gap: '32px'}}>
          
          <div className="preference-block">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px'}}>
              <h3 style={{fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px'}}><MapPin size={18} /> Distance</h3>
              <span style={{fontWeight: '700', color: 'var(--accent)'}}>{form.distancePreference} km</span>
            </div>
            <input 
              type="range" 
              className="premium-slider" 
              min={1} 
              max={150} 
              value={form.distancePreference} 
              onChange={setValue('distancePreference')} 
            />
          </div>

          <div className="preference-block">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px'}}>
              <h3 style={{fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px'}}><User size={18} /> Age</h3>
              <span style={{fontWeight: '700', color: 'var(--accent)'}}>{form.minAgePreference} - {form.maxAgePreference}</span>
            </div>
            <div className="dual-slider-container">
              <div className="slider-track" style={{
                left: `${((form.minAgePreference - 18) / (45 - 18)) * 100}%`,
                right: `${100 - ((form.maxAgePreference - 18) / (45 - 18)) * 100}%`
              }}></div>
              <input type="range" className="premium-slider dual-thumb" min={18} max={45} value={form.minAgePreference} onChange={handleMinAge} />
              <input type="range" className="premium-slider dual-thumb" min={18} max={45} value={form.maxAgePreference} onChange={handleMaxAge} />
            </div>
            <p style={{marginTop: '12px', color: 'var(--text-muted)'}}>Age filter is free for everyone — no payment required.</p>
          </div>

          <div className="preference-block">
            <h3 style={{fontSize: '1.1rem', marginBottom: '16px'}}>Subscription plans</h3>
            <p style={{marginBottom: '16px', color: 'var(--text-muted)'}}>
              Unlimited swipes and age selection are free. Subscribe only if you want chat access beyond 7 days.
            </p>
            <div className="subscription-plans" style={{display: 'grid', gap: '12px'}}>
              {['weekly', 'monthly', 'yearly'].map((planKey) => {
                const planLabel = planKey === 'weekly' ? 'Weekly' : planKey === 'monthly' ? 'Monthly' : 'Yearly';
                const planPrice = planKey === 'weekly' ? 150 : planKey === 'monthly' ? 199 : 2999;
                const planDesc = planKey === 'weekly' ? '7 days' : planKey === 'monthly' ? '30 days' : '365 days';
                return (
                  <button
                    key={planKey}
                    type="button"
                    onClick={() => purchasePlan(planKey)}
                    disabled={submittingPlan}
                    className="btn-primary"
                    style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px'}}
                  >
                    <span>{planLabel} ₹{planPrice}</span>
                    <span style={{fontSize: '0.9rem', color: 'var(--text-muted)'}}>{planDesc}</span>
                  </button>
                );
              })}
            </div>
            <div style={{marginTop: '16px'}}>
              <div style={{fontWeight: '600'}}>Current plan:</div>
              <div>{subscriptionPlan === 'free' ? 'Free user' : `${subscriptionPlan.charAt(0).toUpperCase() + subscriptionPlan.slice(1)} plan`}</div>
              <div>Expires: {formatExpiry(subscriptionExpiresAt)}</div>
            </div>
            {subError && <p className="form-alert">{subError}</p>}
          </div>

          <div className="preference-block">
            <h3 style={{fontSize: '1.1rem', marginBottom: '16px'}}>Appearance</h3>
            <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
              <button 
                type="button"
                onClick={() => { setForm({...form, themePreference: 'light'}); applyTheme('light'); }}
                style={{
                  flex: '1 1 0px', minWidth: '80px', padding: '14px 10px', borderRadius: '12px', cursor: 'pointer',
                  border: form.themePreference === 'light' ? '2px solid #e11d48' : '2px solid var(--line)',
                  background: form.themePreference === 'light' ? 'rgba(225,29,72,0.08)' : 'var(--surface)',
                  color: 'var(--text-main)', fontWeight: '700', fontSize: '0.88rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                ☀️ Light
              </button>
              <button 
                type="button"
                onClick={() => { setForm({...form, themePreference: 'dark'}); applyTheme('dark'); }}
                style={{
                  flex: '1 1 0px', minWidth: '80px', padding: '14px 10px', borderRadius: '12px', cursor: 'pointer',
                  border: form.themePreference === 'dark' ? '2px solid #e11d48' : '2px solid var(--line)',
                  background: form.themePreference === 'dark' ? 'rgba(225,29,72,0.08)' : 'var(--surface)',
                  color: 'var(--text-main)', fontWeight: '700', fontSize: '0.88rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                🌙 Dark
              </button>
              <button 
                type="button"
                onClick={() => { setForm({...form, themePreference: 'system'}); applyTheme('system'); }}
                style={{
                  flex: '1 1 0px', minWidth: '100px', padding: '14px 10px', borderRadius: '12px', cursor: 'pointer',
                  border: form.themePreference === 'system' ? '2px solid #e11d48' : '2px solid var(--line)',
                  background: form.themePreference === 'system' ? 'rgba(225,29,72,0.08)' : 'var(--surface)',
                  color: 'var(--text-main)', fontWeight: '700', fontSize: '0.88rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                💻 System
              </button>
            </div>
          </div>

          <div className="preference-block">
            <h3 style={{fontSize: '1.1rem', marginBottom: '16px'}}>Privacy Controls</h3>
            <label className="setting-toggle">
              <input type="checkbox" checked={form.showOnlineStatus} onChange={setValue('showOnlineStatus')} />
              <span>Show my online status</span>
            </label>
            <label className="setting-toggle">
              <input type="checkbox" checked={form.incognitoMode} onChange={setValue('incognitoMode')} />
              <span style={{display: 'flex', alignItems: 'center', gap: '8px'}}>Incognito mode <EyeOff size={14}/></span>
            </label>
          </div>

          <div className="preference-block">
            <h3 style={{fontSize: '1.1rem', marginBottom: '16px'}}>Notifications</h3>
            <label className="setting-toggle">
              <input type="checkbox" checked={form.pushNotifications} onChange={setValue('pushNotifications')} />
              <span style={{display: 'flex', alignItems: 'center', gap: '8px'}}>Push notifications <Bell size={14}/></span>
            </label>
            <label className="setting-toggle">
              <input type="checkbox" checked={form.emailNotifications} onChange={setValue('emailNotifications')} />
              <span>Email notifications</span>
            </label>
          </div>

          <button className="btn-primary" type="submit" disabled={saving} style={{marginTop: '16px'}}>
            <Save size={18} />
            <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
          </button>
        </form>

        {/* ── DANGER ZONE ── */}
        <div style={{
          marginTop: '32px', padding: '24px',
          border: '1.5px solid rgba(225,29,72,0.2)',
          borderRadius: '20px',
          background: 'rgba(225,29,72,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <AlertTriangle size={18} style={{ color: '#e11d48' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#e11d48', margin: 0 }}>Danger Zone</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.55', margin: '0 0 16px' }}>
            Permanently delete your account. This will remove all your data including matches, messages, photos, and profile information. This action <strong>cannot be undone</strong>.
          </p>
          <button
            type="button"
            onClick={() => { setShowDeleteModal(true); setDeleteStep(1); setDeleteConfirmInput(''); setDeleteError(''); }}
            style={{
              padding: '10px 20px', borderRadius: '12px', border: '1.5px solid rgba(225,29,72,0.4)',
              background: 'transparent', color: '#e11d48', fontWeight: '700', fontSize: '0.88rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(225,29,72,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Trash2 size={16} /> Delete My Account
          </button>
        </div>
      </section>

      {/* ── DELETE ACCOUNT MODAL ── */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
        }}>
          <div style={{
            background: 'var(--surface)', borderRadius: '28px',
            padding: '32px 28px', maxWidth: '440px', width: '100%',
            boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
            border: '1px solid var(--line)'
          }}>
            {/* Close */}
            <button
              onClick={() => setShowDeleteModal(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            ><X size={20} /></button>

            {deleteStep === 1 ? (
              <>
                <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: 'rgba(225,29,72,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                  <Trash2 size={28} style={{ color: '#e11d48' }} />
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '900', margin: '0 0 12px' }}>Delete Account?</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6', margin: '0 0 8px' }}>Deleting your account will permanently remove:</p>
                <ul style={{ color: 'var(--text-muted)', fontSize: '0.87rem', lineHeight: '1.9', paddingLeft: '20px', margin: '0 0 24px' }}>
                  <li>Your profile and all photos</li>
                  <li>All your matches and likes</li>
                  <li>All your messages and conversations</li>
                  <li>Your subscription (no refunds)</li>
                </ul>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    style={{ flex: 1, padding: '12px', borderRadius: '14px', border: '1.5px solid var(--line)', background: 'transparent', color: 'var(--text-main)', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' }}
                  >Cancel</button>
                  <button
                    onClick={() => setDeleteStep(2)}
                    style={{ flex: 1, padding: '12px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg, #e11d48, #f43f5e)', color: '#fff', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' }}
                  >Continue</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: 'rgba(225,29,72,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                  <AlertTriangle size={28} style={{ color: '#e11d48' }} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '900', margin: '0 0 8px' }}>Final Confirmation</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 0 16px', lineHeight: '1.55' }}>
                  Type your email address <strong style={{ color: 'var(--text-main)' }}>{user.email}</strong> below to confirm deletion:
                </p>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={deleteConfirmInput}
                  onChange={e => { setDeleteConfirmInput(e.target.value); setDeleteError(''); }}
                  className="input-field"
                  style={{ width: '100%', marginBottom: '12px', boxSizing: 'border-box' }}
                />
                {deleteError && <p style={{ color: '#e11d48', fontSize: '0.83rem', margin: '0 0 12px', fontWeight: '600' }}>{deleteError}</p>}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setDeleteStep(1)}
                    style={{ flex: 1, padding: '12px', borderRadius: '14px', border: '1.5px solid var(--line)', background: 'transparent', color: 'var(--text-main)', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' }}
                  >Back</button>
                  <button
                    disabled={deleting}
                    onClick={async () => {
                      if (deleteConfirmInput.trim().toLowerCase() !== (user.email || '').toLowerCase()) {
                        setDeleteError('Email does not match. Please try again.');
                        return;
                      }
                      setDeleting(true);
                      setDeleteError('');
                      try {
                        await API.delete(`/api/user/account/${user._id}`);
                        localStorage.clear();
                        window.location.href = '/login';
                      } catch (err) {
                        setDeleteError(err.response?.data?.error || 'Failed to delete account. Please try again.');
                        setDeleting(false);
                      }
                    }}
                    style={{ flex: 1, padding: '12px', borderRadius: '14px', border: 'none', background: deleting ? '#9ca3af' : 'linear-gradient(135deg, #e11d48, #f43f5e)', color: '#fff', fontWeight: '700', cursor: deleting ? 'not-allowed' : 'pointer', fontSize: '0.9rem' }}
                  >{deleting ? 'Deleting...' : 'Delete Forever'}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;
