import React from 'react';

const SecuritySection: React.FC = () => {
  const securityFeatures = [
    {
      icon: '🔐',
      title: 'Bank-Level Encryption',
      description: 'AES-256 encryption for all data at rest and in transit, meeting international banking security standards.',
      gradient: 'linear-gradient(135deg, #ef4444, #dc2626)'
    },
    {
      icon: '🛡️',
      title: 'Multi-Factor Authentication',
      description: 'Advanced MFA with biometric verification, hardware tokens, and time-based one-time passwords.',
      gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)'
    },
    {
      icon: '👥',
      title: 'Role-Based Access Control',
      description: 'Granular permissions with zero-trust architecture ensuring users access only authorized resources.',
      gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
    },
    {
      icon: '📋',
      title: 'Comprehensive Audit Logs',
      description: 'Immutable audit trails with real-time monitoring and automated compliance reporting.',
      gradient: 'linear-gradient(135deg, #10b981, #059669)'
    },
    {
      icon: '🔍',
      title: 'Real-Time Threat Detection',
      description: 'AI-powered security monitoring with automated threat response and incident management.',
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)'
    },
    {
      icon: '📜',
      title: 'Regulatory Compliance',
      description: 'Full compliance with PCI DSS, SOX, GDPR, and regional financial regulations.',
      gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)'
    }
  ];

  return (
    <section id="security" className="security" style={{backgroundColor: 'blue', minHeight: '300px', padding: '50px', color: 'white', fontSize: '30px'}}>
      <div className="container">
        <h1 style={{color: 'white', fontSize: '50px'}}>🚨 SECURITY SECTION IS HERE 🚨</h1>
        <div className="section-header animate-on-scroll">
          <div className="section-badge">
            🔒 Enterprise Security
          </div>
          <h2 className="section-title">Enterprise Security</h2>
          <p className="section-description">
            Built with the highest security standards to protect sensitive financial data and ensure regulatory compliance across all operations.
          </p>
        </div>

        <div className="security-grid">
          {securityFeatures.map((feature, index) => (
            <div key={index} className={`security-card animate-on-scroll delay-${(index % 3) + 1}`}>
              <div
                className="security-icon"
                style={{ background: feature.gradient }}
              >
                {feature.icon}
              </div>
              <h3 className="security-title">{feature.title}</h3>
              <p className="security-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;
