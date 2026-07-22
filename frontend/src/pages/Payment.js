import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import API from '../api';

const subscriptionPlans = [
  { key: 'weekly', label: 'Weekly', price: 150, duration: '7 days' },
  { key: 'monthly', label: 'Monthly', price: 199, duration: '30 days' },
  { key: 'yearly', label: 'Yearly', price: 2999, duration: '365 days' }
];

function Payment({ user, setUser }) {
  const navigate = useNavigate();
  const [submittingPlan, setSubmittingPlan] = useState(false);
  const [subError, setSubError] = useState('');

  if (!user || !user._id) {
    return (
      <div className="screen profile-screen">
        <section className="glass-panel profile-panel edit-panel">
          <div className="edit-top">
            <button className="btn-icon" type="button" onClick={() => navigate(-1)}>
              <ArrowLeft size={18} />
              <span>Back</span>
            </button>
            <h2>Upgrade to Premium</h2>
          </div>
          <p className="form-alert">Unable to start payment. Please log in again and try.</p>
        </section>
      </div>
    );
  }

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
      setSubError('Could not load Razorpay SDK. Please try again later.');
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
            navigate('/profile');
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

  return (
    <div className="screen profile-screen">
      <section className="glass-panel profile-panel edit-panel">
        <div className="edit-top">
          <button className="btn-icon" type="button" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>
          <h2>Upgrade to Premium</h2>
        </div>

        <div className="subscription-card">
          <p style={{ marginBottom: '18px', color: 'var(--text-muted)' }}>
            Choose any plan to enable unlimited paid chat beyond 7 days. UPI payments work through Razorpay.
          </p>

          <div style={{ display: 'grid', gap: '14px' }}>
            {subscriptionPlans.map((plan) => (
              <button
                key={plan.key}
                type="button"
                onClick={() => purchasePlan(plan.key)}
                disabled={submittingPlan}
                className="btn-primary"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 18px' }}
              >
                <span>{plan.label} ₹{plan.price}</span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{plan.duration}</span>
              </button>
            ))}
          </div>

          {subError && <p className="form-alert" style={{ marginTop: '18px' }}>{subError}</p>}
        </div>
      </section>
    </div>
  );
}

export default Payment;
