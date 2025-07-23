import React from 'react';

const TechnologySection: React.FC = () => {
  const techFeatures = [
    {
      icon: '🧠',
      title: 'Machine Learning OCR',
      description: 'Advanced neural networks trained specifically for Arabic and English financial documents, achieving 99.9% accuracy in data extraction.'
    },
    {
      icon: '💾',
      title: 'Real-Time Database',
      description: 'Lightning-fast updates across all users with conflict resolution, ensuring everyone sees the latest status immediately.'
    },
    {
      icon: '🔒',
      title: 'Enterprise Security',
      description: 'Bank-level encryption, multi-factor authentication, and comprehensive audit logging meeting international financial standards.'
    },
    {
      icon: '📱',
      title: 'Mobile-First Design',
      description: 'Responsive interface works seamlessly across desktop, tablet, and mobile devices for on-the-go access.'
    },
    {
      icon: '🌐',
      title: 'Multi-Currency Support',
      description: 'Handle USD, EUR, AED, and other currencies with real-time exchange rates and proper financial formatting.'
    },
    {
      icon: '📈',
      title: 'Analytics & Reporting',
      description: 'Comprehensive dashboards, performance metrics, and custom reports for data-driven decision making.'
    }
  ];

  return (
    <section id="technology" className="technology">
      <div className="container">
        <div className="section-header animate-on-scroll">
          <h2>Advanced Technology Stack</h2>
          <p>Built with cutting-edge technology for reliability and performance</p>
        </div>
        <div className="tech-features">
          {techFeatures.map((feature, index) => (
            <div key={index} className="tech-feature animate-on-scroll">
              <div className="tech-icon">
                {feature.icon}
              </div>
              <div className="tech-content">
                <h4>{feature.title}</h4>
                <p>{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TechnologySection;
