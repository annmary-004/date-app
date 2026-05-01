import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, LogIn } from 'lucide-react';

function Landing() {
  return (
    <div className="landing">
      <div className="landing-media" aria-hidden="true">
        <div className="landing-photo" />
        <div className="landing-overlay" />
      </div>

      <div className="landing-actions-wrapper">
        <div className="landing-actions">
          <Link to="/register" className="btn-primary landing-primary">
            <span>Create account</span>
            <ArrowRight size={18} />
          </Link>
          <Link to="/login" className="btn-icon landing-secondary">
            <LogIn size={18} />
            <span>Log in</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Landing;
