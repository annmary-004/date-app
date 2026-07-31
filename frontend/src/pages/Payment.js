import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Crown, Check, Shield, AlertTriangle, CreditCard, QrCode, Smartphone, Sparkles, X } from 'lucide-react';
import API from '../api';

const subscriptionPlans = [
  {
    key: 'weekly',
    label: 'Weekly Plan',
    price: 150,
    duration: '7 days access',
    period: '₹150 / week',
    badge: null,
    features: ['Unlimited matches', 'Unlimited chat', 'See who liked you', '7 days full access'],
    color: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)'
  },
  {
    key: 'monthly',
    label: 'Monthly Plan',
    price: 199,
    duration: '30 days access',
    period: '₹199 / month',
    badge: 'MOST POPULAR',
    features: ['Unlimited matches', 'Unlimited chat', 'See who liked you', '30 days full access', 'Priority profile placement'],
    color: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)'
  },
  {
    key: 'yearly',
    label: 'Yearly Plan',
    price: 2999,
    duration: '365 days access',
    period: '₹2999 / year',
    badge: 'BEST VALUE',
    features: ['All Monthly features', '365 days full access', 'Profile boost', 'Advanced match filters', 'Read receipts'],
    color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
  }
];

function Payment({ user, setUser }) {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi', 'gpay', 'card', 'netbanking'
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [processing, setProcessing] = useState(false);
  const [subError, setSubError] = useState('');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  if (!user || !user._id) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Please log in to view premium plans.</p>
      </div>
    );
  }

  const isPremium = user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > new Date();

  const handleOpenCheckout = (plan) => {
    setSelectedPlan(plan);
    setSubError('');
    setShowCheckoutModal(true);
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

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!selectedPlan) return;

    setProcessing(true);
    setSubError('');

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setSubError('Could not load payment SDK. Please check your internet connection.');
        setProcessing(false);
        return;
      }

      // Create Razorpay order from backend
      const res = await API.post(`/api/user/subscribe/${user._id}`, { plan: selectedPlan.key });
      const { orderId, amount, currency, key } = res.data;

      setProcessing(false); // stop spinner, Razorpay popup will open

      const options = {
        key,
        amount,
        currency,
        name: 'Dating App Premium',
        description: `${selectedPlan.label} — ${selectedPlan.duration}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            setProcessing(true);
            const verifyRes = await API.post(`/api/user/verify-payment/${user._id}`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: selectedPlan.key
            });
            setUser(verifyRes.data);
            localStorage.setItem('user', JSON.stringify(verifyRes.data));
            setProcessing(false);
            setShowCheckoutModal(false);
            navigate('/');
          } catch (verifyErr) {
            setSubError(verifyErr.response?.data?.error || 'Payment verification failed. Contact support.');
            setProcessing(false);
          }
        },
        prefill: {
          name: user.name,
          email: user.email
        },
        theme: {
          color: '#f43f5e'
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (failure) => {
        setSubError(failure.error?.description || 'Payment failed. Please try again.');
        setProcessing(false);
      });
      razorpay.open();

    } catch (err) {
      setSubError(err.response?.data?.error || err.message || 'Failed to initiate payment. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px 16px 120px' }}>

      {/* Top Header Bar */}
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
          borderRadius: '18px', padding: '18px 20px', marginBottom: '24px',
          display: 'flex', alignItems: 'center', gap: '14px'
        }}>
          <Crown size={26} color="#d97706" />
          <div>
            <p style={{ margin: 0, fontWeight: '800', color: '#b45309', fontSize: '1rem' }}>
              Active Subscription
            </p>
            <p style={{ margin: '3px 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Expires on {new Date(user.subscriptionExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      )}

      {/* Description */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', margin: 0, lineHeight: '1.6' }}>
          Select a subscription plan to unlock unlimited swiping, matches, and messaging.
        </p>
      </div>

      {/* Subscription Plan Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {subscriptionPlans.map((plan) => (
          <div key={plan.key} style={{
            position: 'relative',
            borderRadius: '22px',
            background: 'var(--surface)',
            border: plan.badge ? '2px solid #f43f5e' : '1px solid var(--line)',
            padding: '22px',
            boxShadow: 'var(--shadow)',
            transition: 'transform 0.2s ease'
          }}>
            {plan.badge && (
              <span style={{
                position: 'absolute', top: '-12px', right: '20px',
                background: '#f43f5e', color: '#ffffff',
                fontSize: '0.65rem', fontWeight: '900', letterSpacing: '0.08em',
                padding: '4px 12px', borderRadius: '12px'
              }}>
                {plan.badge}
              </span>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  {plan.label}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.83rem', color: 'var(--text-muted)' }}>
                  {plan.duration}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1.65rem', fontWeight: '900', color: 'var(--text-main)' }}>
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
                  <span style={{ fontSize: '0.88rem', color: 'var(--text-main)', fontWeight: '500' }}>
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            {/* Select Button */}
            <button
              onClick={() => handleOpenCheckout(plan)}
              style={{
                width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
                background: plan.color, color: '#ffffff',
                fontWeight: '800', fontSize: '0.95rem', cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(0,0,0,0.15)'
              }}
            >
              Select {plan.label} — ₹{plan.price}
            </button>
          </div>
        ))}
      </div>

      {/* Payment Options Footer */}
      <div style={{ marginTop: '36px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Accepted Payment Methods
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {['Google Pay', 'PhonePe', 'Paytm', 'BHIM UPI', 'Credit Card', 'Debit Card', 'Net Banking'].map((method) => (
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
            100% Encrypted & Safe Payment Checkout
          </span>
        </div>
      </div>

      {/* ── CHECKOUT MODAL ── */}
      {showCheckoutModal && selectedPlan && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            background: 'var(--surface)', width: '100%', maxWidth: '440px',
            borderRadius: '28px', border: '1px solid var(--line)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 20px', borderBottom: '1px solid var(--line)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--surface-strong)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Crown size={22} color="#f43f5e" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>
                  Complete Payment
                </h3>
              </div>
              <button
                onClick={() => !processing && setShowCheckoutModal(false)}
                disabled={processing}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleProcessPayment} style={{ padding: '20px' }}>
              {/* Order Summary */}
              <div style={{
                background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)',
                borderRadius: '16px', padding: '14px 16px', marginBottom: '20px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <p style={{ margin: 0, fontWeight: '800', fontSize: '1rem', color: 'var(--text-main)' }}>
                    {selectedPlan.label}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {selectedPlan.duration}
                  </p>
                </div>
                <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#f43f5e' }}>
                  ₹{selectedPlan.price}
                </span>
              </div>

              {/* Payment Method Selector */}
              <p style={{ margin: '0 0 10px', fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Select Payment Method
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
                {[
                  { id: 'upi', label: 'UPI / GPay', icon: <Smartphone size={16} /> },
                  { id: 'card', label: 'Credit / Debit Card', icon: <CreditCard size={16} /> }
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      padding: '12px', borderRadius: '12px',
                      border: paymentMethod === m.id ? '2px solid #f43f5e' : '1px solid var(--line)',
                      background: paymentMethod === m.id ? 'rgba(244,63,94,0.08)' : 'var(--surface-strong)',
                      color: paymentMethod === m.id ? '#f43f5e' : 'var(--text-main)',
                      fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer'
                    }}
                  >
                    {m.icon}
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>

              {/* UPI Form */}
              {paymentMethod === 'upi' && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-muted)' }}>
                    Enter VPA / UPI ID (e.g. yourname@okaxis / yourname@ybl)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. mobile@upi"
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: '12px',
                      border: '1px solid var(--line)', background: 'var(--bg)',
                      color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none'
                    }}
                  />
                  <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Or click Pay Now to authorize directly via installed UPI app
                  </p>
                </div>
              )}

              {/* Card Form */}
              {paymentMethod === 'card' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-muted)' }}>Card Number</label>
                    <input
                      type="text"
                      placeholder="4532 •••• •••• 8901"
                      value={cardNumber}
                      onChange={e => setCardNumber(e.target.value)}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: '10px',
                        border: '1px solid var(--line)', background: 'var(--bg)',
                        color: 'var(--text-main)', fontSize: '0.88rem'
                      }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-muted)' }}>Expiry (MM/YY)</label>
                      <input
                        type="text"
                        placeholder="08/28"
                        value={cardExpiry}
                        onChange={e => setCardExpiry(e.target.value)}
                        style={{
                          width: '100%', padding: '10px 12px', borderRadius: '10px',
                          border: '1px solid var(--line)', background: 'var(--bg)',
                          color: 'var(--text-main)', fontSize: '0.88rem'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-muted)' }}>CVV</label>
                      <input
                        type="password"
                        placeholder="•••"
                        maxLength={4}
                        value={cardCvv}
                        onChange={e => setCardCvv(e.target.value)}
                        style={{
                          width: '100%', padding: '10px 12px', borderRadius: '10px',
                          border: '1px solid var(--line)', background: 'var(--bg)',
                          color: 'var(--text-main)', fontSize: '0.88rem'
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {subError && (
                <div style={{
                  padding: '10px 14px', borderRadius: '10px', background: 'rgba(225,29,72,0.1)',
                  color: '#e11d48', fontSize: '0.82rem', fontWeight: '600', marginBottom: '16px'
                }}>
                  {subError}
                </div>
              )}

              {/* Submit Pay Now Button */}
              <button
                type="submit"
                disabled={processing}
                style={{
                  width: '100%', padding: '16px', borderRadius: '16px', border: 'none',
                  background: 'linear-gradient(135deg, #e11d48, #f43f5e)',
                  color: '#ffffff', fontWeight: '900', fontSize: '1.05rem',
                  cursor: processing ? 'not-allowed' : 'pointer',
                  boxShadow: '0 8px 24px rgba(225,29,72,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                }}
              >
                {processing ? (
                  <>
                    <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <span>Pay ₹{selectedPlan.price} & Activate Premium</span>
                )}
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Payment;
