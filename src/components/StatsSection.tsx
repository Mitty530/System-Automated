import React from 'react';

const StatsSection: React.FC = () => {
  const stats = [
    { number: '85%', label: 'Processing Time Reduction' },
    { number: '99.9%', label: 'OCR Accuracy Rate' },
    { number: '4', label: 'Regional Operations Centers' },
    { number: '24/7', label: 'Real-Time Monitoring' },
  ];

  return (
    <section className="stats">
      <div className="container">
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-item">
              <span className="stat-number">{stat.number}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
