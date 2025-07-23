import React from 'react';

const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: '📄',
      title: 'AI-Powered OCR Intelligence',
      description: 'Advanced neural networks achieve 99.9% accuracy in Arabic and English document processing.',
      gradient: 'var(--accent-gradient)'
    },
    {
      icon: '📍',
      title: 'Intelligent Regional Routing',
      description: 'Smart geographic assignment routes requests to specialized regional teams automatically.',
      gradient: 'var(--success-gradient)'
    },
    {
      icon: '🛡️',
      title: 'Zero-Exception Security Model',
      description: 'Military-grade role-based access controls with immutable permissions and zero privilege escalation.',
      gradient: 'var(--warning-gradient)'
    },
    {
      icon: '📊',
      title: 'Real-Time Process Intelligence',
      description: 'Live tracking with predictive analytics and automated bottleneck detection.',
      gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
    },
    {
      icon: '⚡',
      title: 'Intelligent Alert System',
      description: 'ML-powered priority detection with automated escalation and smart notifications.',
      gradient: 'linear-gradient(135deg, #ef4444, #dc2626)'
    },
    {
      icon: '🔍',
      title: 'Advanced Analytics Engine',
      description: 'Multi-dimensional search, predictive insights, and custom dashboards for data-driven decisions.',
      gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)'
    }
  ];

  return (
    <section id="features" className="features" style={{backgroundColor: 'red', minHeight: '300px', padding: '50px', color: 'white', fontSize: '30px'}}>
      <div className="container">
        <h1 style={{color: 'white', fontSize: '50px'}}>🚨 FEATURES SECTION IS HERE 🚨</h1>
        <div className="section-header animate-on-scroll">
          <div className="section-badge">
            ⚡ Powerful Features
          </div>
          <h2 className="section-title">Built for Enterprise Financial Operations</h2>
          <p className="section-description">
            Advanced AI capabilities, intelligent automation, and enterprise-grade security designed for the most demanding financial institutions.
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className={`feature-card animate-on-scroll delay-${(index % 4) + 1}`}>
              <div
                className="feature-icon"
                style={{ background: feature.gradient }}
              >
                {feature.icon}
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
