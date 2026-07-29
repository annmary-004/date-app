import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Crown, Check, Shield, AlertTriangle } from 'lucide-react';
import API from '../api';

const subscriptionPlans = [
  {
    key: 'weekly',
    label: 'Weekly Plan',
    price: 150,
    duration: '7 days access',
    period: '₹150 / week',
    badge: null,
    features: ['Unlimited matches', 'Unlimited chat', 'See who liked you'],
    color: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)'
  },
  {
    key: 'monthly',
    label: 'Monthly Plan',
    price: 199,
    duration: '30 days access',
    period: '₹199 / month',
    badge: 'POPULAR',
    features: ['Unlimited matches', 'Unlimited chat', 'See who liked you', 'Priority profile placement'],
    color: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)'
  },
  {
    key: 'yearly',
    label: 'Yearly Plan',
    price: 2999,
    duration: '365 days access',
    period: '₹2999 / year',
    badge: 'BEST VALUE',
    features: ['All Monthly features', 'Profile boost', 'Advanced match filters', 'Read receipts'],
    color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
  }
];

function Payment({ user, setUser }) {
  const navigate = useNavigate();
  const [submittingPlan, setSubmittingPlan] = useState(null);
  const [subError, setSubError] = useState('');

  if (!user || !user._id) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Please log in to view premium plans.</p>
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
      setSubError('Could not load payment gateway. Please try again.');
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
        description: `${plan.label} - ${plan.duration}`,
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
            setSubError(verifyErr.response?.data?.error || 'Payment verification failed. Please contact support.');
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
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px 16px 100px' }}>

      {/* Header Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '14px',
        marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--line)'
      }}>
        <button onClick={() => navigate(-1)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px',
          fontSize: '0.92rem', fontWeight: '700', padding: '4px'
        }}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '900', color: 'var(--text-main)' }}>
          Upgrade to Premium
        </h2>
      </div>

      {/* Active Premium Banner */}
      {isPremium && (
        <div style={{
          background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: '16px', padding: '16px 20px', marginBottom: '24px',
          display: 'flex', alignItems: 'center', gap: '12px'
        }}>
          <Crown size={22} color="#d97706" />
          <div>
            <p style={{ margin: 0, fontWeight: '800', color: '#b45309', fontSize: '0.95rem' }}>
              Active Subscription
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Expires on {new Date(user.subscriptionExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      )}

      {/* Description */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.93rem', margin: 0, lineHeight: '1.6' }}>
          Select a subscription plan to unlock unlimited matches and continuous messaging.
        </p>
      </div>

      {/* Subscription Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {subscriptionPlans.map((plan) => (
          <div key={plan.key} style={{
            position: 'relative',
            borderRadius: '20px',
            background: 'var(--surface)',
            border: plan.badge ? '2px solid #f43f5e' : '1px solid var(--line)',
            padding: '20px',
            boxShadow: 'var(--shadow)',
            transition: 'transform 0.2s ease'
          }}>
            {plan.badge && (
              <span style={{
                position: 'absolute', top: '-11px', right: '20px',
                background: '#f43f5e', color: '#ffffff',
                fontSize: '0.65rem', fontWeight: '900', letterSpacing: '0.08em',
                padding: '3px 10px', borderRadius: '12px'
              }}>
                {plan.badge}
              </span>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  {plan.label}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {plan.duration}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--text-main)' }}>
                  ₹{plan.price}
                </span>
              </div>
            </div>

            {/* Features List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {plan.features.map((feature, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '50%',
                    background: 'rgba(34, 197, 94, 0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <Check size={11} color="#16a34a" strokeWidth={3} />
                  </div>
                  <span style={{ fontSize: '0.86rem', color: 'var(--text-main)', fontWeight: '500' }}>
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            {/* Action Button */}
            <button
              onClick={() => purchasePlan(plan)}
              disabled={submittingPlan !== null}
              style={{
                width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
                background: plan.color, color: '#ffffff',
                fontWeight: '800', fontSize: '0.95rem', cursor: submittingPlan ? 'not-allowed' : 'pointer',
                boxShadow: '0 6px 18px rgba(0,0,0,0.15)',
                opacity: submittingPlan && submittingPlan !== plan.key ? 0.6 : 1
              }}
            >
              {submittingPlan === plan.key ? 'Opening Payment Gateway...' : `Select ${plan.label} — ₹${plan.price}`}
            </button>
          </div>
        ))}
      </div>

      {/* Error Alert */}
      {subError && (
        <div style={{
          marginTop: '20px', padding: '14px 16px', borderRadius: '14px',
          background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)',
          color: '#f43f5e', fontSize: '0.88rem', fontWeight: '600',
          display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <AlertTriangle size={18} flexShrink={0} />
          <span>{subError}</span>
        </div>
      )}

      {/* Supported Payment Methods Footer */}
      <div style={{ marginTop: '32px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Accepted Payment Options
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {['UPI', 'Google Pay', 'PhonePe', 'Amazon Pay', 'Credit Card', 'Debit Card', 'Net Banking'].map((method) => (
            <span key={method} style={{
              padding: '6px 14px', borderRadius: '20px',
              background: 'var(--surface)', border: '1px solid var(--line)',
              fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-muted)'
            }}>
              {method}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Shield size={14} color="#16a34a" />
          <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: '700' }}>
            Encrypted & Secure Payment via Razorpay
          </span>
        </div>
      </div>

    </div>
  );
}

export default Payment;
