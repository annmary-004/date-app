import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Crown, Zap, Shield, Star, Check, Sparkles } from 'lucide-react';
import API from '../api';

const subscriptionPlans = [
  {
    key: 'weekly',
    label: 'Weekly',
    price: 150,
    duration: '7 days',
    period: '/week',
    badge: null,
    features: ['Unlimited matches', 'Unlimited chat', 'See who liked you'],
    color: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
    glow: 'rgba(244,63,94,0.35)'
  },
  {
    key: 'monthly',
    label: 'Monthly',
    price: 199,
    duration: '30 days',
    period: '/month',
    badge: 'MOST POPULAR',
    features: ['Unlimited matches', 'Unlimited chat', 'See who liked you', 'Priority in discovery'],
    color: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
    glow: 'rgba(139,92,246,0.35)'
  },
  {
    key: 'yearly',
    label: 'Yearly',
    price: 2999,
    duration: '365 days',
    period: '/year',
    badge: 'BEST VALUE',
    features: ['All Monthly features', 'Profile boost', 'Advanced filters', 'Read receipts'],
    color: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    glow: 'rgba(245,158,11,0.35)'
  }
];

function Payment({ user, setUser }) {
  const navigate = useNavigate();
  const [submittingPlan, setSubmittingPlan] = useState(null);
  const [subError, setSubError] = useState('');

  if (!user || !user._id) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Please log in to continue.</p>
      </div>
    );
  }

  const isPremium = user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > new Date();

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
    setSubmittingPlan(plan.key);

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setSubError('Could not load payment SDK. Please try again.');
      setSubmittingPlan(null);
      return;
    }

    try {
      const res = await API.post(`/api/user/subscribe/${user._id}`, { plan: plan.key });
      const { orderId, amount, currency, key } = res.data;

      const options = {
        key,
        amount,
        currency,
        name: 'Heartly Premium',
        description: `${plan.label} Plan — ${plan.duration}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            const verifyRes = await API.post(`/api/user/verify-payment/${user._id}`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: plan.key
            });
            setUser(verifyRes.data);
            localStorage.setItem('user', JSON.stringify(verifyRes.data));
            navigate('/');
          } catch (verifyErr) {
            setSubError(verifyErr.response?.data?.error || 'Payment verification failed. Contact support.');
          }
        },
        prefill: {
          name: user.name || '',
          email: user.email || '',
          contact: user.phone || ''
        },
        theme: { color: '#e11d48' },
        modal: { ondismiss: () => setSubmittingPlan(null) }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (failure) => {
        setSubError(failure.error?.description || 'Payment failed. Please try again.');
        setSubmittingPlan(null);
      });
      razorpay.open();
    } catch (err) {
      setSubError(err.response?.data?.error || err.message || 'Failed to initiate payment. Please try again.');
      setSubmittingPlan(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: '1px solid var(--line)',
        background: 'var(--surface)',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <button onClick={() => navigate(-1)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px',
          fontSize: '0.9rem', fontWeight: '600', padding: '4px'
        }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Crown size={22} color="#f59e0b" fill="#f59e0b" />
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>Upgrade to Premium</h2>
        </div>
      </div>

      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '24px 16px' }}>

        {/* Already Premium Banner */}
        {isPremium && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(239,68,68,0.1))',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: '16px', padding: '16px 20px', marginBottom: '24px',
            display: 'flex', alignItems: 'center', gap: '12px'
          }}>
            <Crown size={24} color="#f59e0b" fill="#f59e0b" />
            <div>
              <p style={{ margin: 0, fontWeight: '700', color: '#f59e0b' }}>You're Premium! ✨</p>
              <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Expires: {new Date(user.subscriptionExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        )}

        {/* Hero section */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '22px',
            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', boxShadow: '0 12px 32px rgba(245,158,11,0.4)'
          }}>
            <Crown size={36} color="#fff" fill="#fff" />
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '900', margin: '0 0 8px' }}>
            Heartly Premium
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.93rem', margin: 0, lineHeight: '1.6' }}>
            Unlock unlimited matches, chat forever, and find your perfect match faster
          </p>
        </div>

        {/* Plans */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {subscriptionPlans.map((plan) => (
            <div key={plan.key} style={{ position: 'relative' }}>
              {/* Badge */}
              {plan.badge && (
                <div style={{
                  position: 'absolute', top: '-10px', right: '16px', zIndex: 2,
                  background: plan.key === 'monthly'
                    ? 'linear-gradient(135deg, #ec4899, #8b5cf6)'
                    : 'linear-gradient(135deg, #f59e0b, #ef4444)',
                  color: '#fff', fontSize: '0.62rem', fontWeight: '900',
                  letterSpacing: '0.08em', padding: '3px 10px', borderRadius: '20px'
                }}>
                  {plan.badge}
                </div>
              )}

              <button
                onClick={() => purchasePlan(plan)}
                disabled={submittingPlan !== null}
                style={{
                  width: '100%', border: plan.badge ? '2px solid transparent' : '1.5px solid var(--line)',
                  borderRadius: '20px', overflow: 'hidden', cursor: submittingPlan ? 'not-allowed' : 'pointer',
                  background: 'var(--surface)', padding: 0, textAlign: 'left',
                  boxShadow: plan.badge ? `0 8px 32px ${plan.glow}` : '0 2px 12px rgba(0,0,0,0.05)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  opacity: submittingPlan && submittingPlan !== plan.key ? 0.6 : 1,
                  backgroundImage: plan.badge ? plan.color : undefined
                }}
                onMouseEnter={e => { if (!submittingPlan) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {/* Color top bar */}
                <div style={{ height: '4px', background: plan.color }} />

                <div style={{ padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div>
                      <p style={{
                        margin: 0, fontWeight: '900', fontSize: '1.15rem',
                        color: plan.badge ? '#fff' : 'var(--text-main)'
                      }}>
                        {plan.label}
                      </p>
                      <p style={{
                        margin: '2px 0 0', fontSize: '0.8rem',
                        color: plan.badge ? 'rgba(255,255,255,0.75)' : 'var(--text-muted)'
                      }}>
                        {plan.duration} access
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{
                        margin: 0, fontWeight: '900', fontSize: '1.5rem',
                        color: plan.badge ? '#fff' : 'var(--text-main)'
                      }}>
                        ₹{plan.price}
                      </p>
                      <p style={{
                        margin: 0, fontSize: '0.75rem',
                        color: plan.badge ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)'
                      }}>
                        {plan.period}
                      </p>
                    </div>
                  </div>

                  {/* Features */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                    {plan.features.map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '18px', height: '18px', borderRadius: '50%',
                          background: plan.badge ? 'rgba(255,255,255,0.25)' : 'rgba(244,63,94,0.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          <Check size={10} color={plan.badge ? '#fff' : '#f43f5e'} strokeWidth={3} />
                        </div>
                        <span style={{
                          fontSize: '0.83rem', fontWeight: '500',
                          color: plan.badge ? 'rgba(255,255,255,0.9)' : 'var(--text-main)'
                        }}>{f}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <div style={{
                    background: plan.badge ? 'rgba(255,255,255,0.2)' : plan.color,
                    borderRadius: '12px', padding: '12px',
                    textAlign: 'center',
                    border: plan.badge ? '1px solid rgba(255,255,255,0.3)' : 'none'
                  }}>
                    {submittingPlan === plan.key ? (
                      <span style={{ color: '#fff', fontWeight: '700', fontSize: '0.9rem' }}>
                        Opening payment...
                      </span>
                    ) : (
                      <span style={{ color: '#fff', fontWeight: '800', fontSize: '0.92rem' }}>
                        Get {plan.label} — ₹{plan.price}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </div>
          ))}
        </div>

        {/* Error */}
        {subError && (
          <div style={{
            marginTop: '20px', padding: '14px 16px', borderRadius: '14px',
            background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)',
            color: '#f43f5e', fontSize: '0.88rem', fontWeight: '500'
          }}>
            ⚠️ {subError}
          </div>
        )}

        {/* Payment methods */}
        <div style={{ marginTop: '28px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Secure Payment via
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            {['UPI', 'GPay', 'PhonePe', 'Amazon Pay', 'Credit Card', 'Debit Card', 'NetBanking'].map(m => (
              <span key={m} style={{
                padding: '5px 12px', borderRadius: '20px',
                background: 'var(--surface)', border: '1px solid var(--line)',
                fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)'
              }}>{m}</span>
            ))}
          </div>
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Shield size={13} color="#22c55e" />
            <span style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: '600' }}>
              100% Secure • Powered by Razorpay
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Payment;
