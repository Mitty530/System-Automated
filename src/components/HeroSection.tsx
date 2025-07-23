import React from 'react';

const HeroSection: React.FC = () => {
  return (
    <section className="hero" style={{minHeight: '50vh', maxHeight: '50vh', overflow: 'visible'}}>
      <div className="container">
        <div className="hero-content">
          <h1 className="hero-title">
            Advanced Project Tracking & Management System
          </h1>

          <p className="hero-subtitle">
            Empower your projects with cutting-edge technology.
          </p>

          <div className="hero-stats" style={{ marginTop: '4rem' }}>
            <div className="hero-stat">
              <span className="hero-stat-number" data-target="99.9">99.9%</span>
              <span className="hero-stat-label">Accuracy Rate</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-number" data-target="85">85%</span>
              <span className="hero-stat-label">Efficiency Gain</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-number" data-target="24">24/7</span>
              <span className="hero-stat-label">Real-time Tracking</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-number" data-target="100">100%</span>
              <span className="hero-stat-label">Uptime SLA</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
