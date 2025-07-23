import React from 'react';

const CTASection: React.FC = () => {
  return (
    <section className="cta-section">
      <div className="container">
        <h2 className="animate-on-scroll">Ready to Transform Your Operations?</h2>
        <p className="animate-on-scroll">
          Join leading financial institutions already using our intelligent withdrawal request tracking system.
        </p>
        <div className="cta-buttons animate-on-scroll">
          <a href="#" className="btn-white">
            📅 Schedule Demo
          </a>
          <a href="#" className="btn-primary">
            🚀 Start Free Trial
          </a>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
