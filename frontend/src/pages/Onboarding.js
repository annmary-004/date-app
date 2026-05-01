import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import API from '../api';

const STEPS = [
  { key: 'gender', label: 'I am a', type: 'select', options: ['Woman', 'Man', 'Non-binary'] },
  {
    key: 'sexualOrientation',
    label: 'Sexual orientation',
    type: 'select',
    options: ['Straight', 'Gay', 'Lesbian', 'Bisexual', 'Pansexual', 'Asexual', 'Queer', 'Questioning', 'Prefer not to say']
  },
  { key: 'showMe', label: 'Who do you want to date?', type: 'select', options: ['Women', 'Men', 'Everyone', 'Non-binary people'] },
  { key: 'age', label: 'Your age', type: 'number', min: 18, max: 120, placeholder: '18+' },
  { key: 'lookingFor', label: 'What are you looking for?', type: 'select', options: ['Long-term relationship', 'Short-term, open to long', 'Short-term fun', 'New friends', 'Still figuring it out'] },
  { key: 'city', label: 'Where do you live?', type: 'text', placeholder: 'City' },
  { key: 'occupation', label: 'What do you do?', type: 'text', placeholder: 'Job / role' },
  { key: 'education', label: 'Education', type: 'text', placeholder: 'School or field' },
  { key: 'interests', label: 'Interests', type: 'text', placeholder: 'travel, music, coffee (comma separated)' },
  { key: 'bio', label: 'Write a short bio', type: 'textarea', placeholder: 'Tell a bit about yourself' }
];

function Onboarding({ user, setUser }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [form, setForm] = useState({
    gender: user.gender || '',
    sexualOrientation: user.sexualOrientation || '',
    showMe: user.showMe || '',
    age: user.age || '',
    lookingFor: user.lookingFor || '',
    city: user.city || '',
    occupation: user.occupation || '',
    education: user.education || '',
    interests: Array.isArray(user.interests) ? user.interests.join(', ') : user.interests || '',
    bio: user.bio || ''
  });

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const progress = useMemo(() => Math.round(((step + 1) / STEPS.length) * 100), [step]);

  const setValue = (value) => setForm((prev) => ({ ...prev, [current.key]: value }));

  const validateStep = () => {
    const value = form[current.key];
    if (['gender', 'sexualOrientation', 'showMe', 'age'].includes(current.key) && !String(value).trim()) {
      setError('Please fill this field to continue.');
      return false;
    }

    if (current.key === 'age') {
      const ageNum = parseInt(value, 10);
      if (!Number.isFinite(ageNum) || ageNum < 18) {
        setError('Age should be 18 or above.');
        return false;
      }
    }

    setError('');
    return true;
  };

  const goNext = async () => {
    if (!validateStep()) return;
    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }

    try {
      setSaving(true);
      const payload = { ...form, age: parseInt(form.age, 10) };
      const res = await API.put(`/api/user/profile/${user._id}`, payload);
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      navigate('/');
    } catch (e) {
      setError(e.response?.data?.error || 'Could not save profile details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="onboarding-wrap">
      <section className="glass-panel onboarding-card">
        <div className="onboarding-progress">
          <div className="onboarding-progress-bar" style={{ width: `${progress}%` }} />
        </div>
        <p className="onboarding-step">Step {step + 1} of {STEPS.length}</p>
        <h2>{current.label}</h2>

        <div className="onboarding-field">
          {current.type === 'select' && (
            <select className="input-field input-select" value={form[current.key]} onChange={(e) => setValue(e.target.value)}>
              <option value="">Select</option>
              {current.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          )}
          {current.type === 'text' && (
            <input
              className="input-field"
              type="text"
              placeholder={current.placeholder}
              value={form[current.key]}
              onChange={(e) => setValue(e.target.value)}
            />
          )}
          {current.type === 'number' && (
            <input
              className="input-field"
              type="number"
              min={current.min}
              max={current.max}
              placeholder={current.placeholder}
              value={form[current.key]}
              onChange={(e) => setValue(e.target.value)}
            />
          )}
          {current.type === 'textarea' && (
            <textarea
              className="input-field input-area"
              placeholder={current.placeholder}
              value={form[current.key]}
              onChange={(e) => setValue(e.target.value)}
            />
          )}
        </div>

        {error && <p className="form-alert">{error}</p>}

        <div className="onboarding-actions">
          <button className="btn-icon" type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || saving}>
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>
          <button className="btn-primary" type="button" onClick={goNext} disabled={saving}>
            <span>{isLast ? (saving ? 'Saving...' : 'Finish') : 'Next'}</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </div>
  );
}

export default Onboarding;
