import React from 'react';

const DemoSection: React.FC = () => {
  const openDemo = (role: string) => {
    let message = '';
    switch(role) {
      case 'archive':
        message = 'Opening Archive Team demo - Create new requests with OCR document upload!';
        break;
      case 'operations':
        message = 'Opening Operations Team demo - Approve/reject requests in your region!';
        break;
      case 'banking':
        message = 'Opening Core Banking demo - Process urgent disbursements!';
        break;
    }
    
    alert(message);
  };

  return (
    <section id="demo" className="demo">
      <div className="container">
        <div className="section-header animate-on-scroll">
          <h2>See It In Action</h2>
          <p>Experience the power of intelligent withdrawal request tracking</p>
        </div>
        <div className="demo-container animate-on-scroll">
          <div className="demo-preview">
            <div className="demo-header">
              <div className="demo-status">
                ✅ Live System Status
              </div>
              <div style={{ marginLeft: 'auto', color: '#10b981' }}>
                📊 Real-Time Tracking Active
              </div>
            </div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '1rem', 
              textAlign: 'center' 
            }}>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>8</div>
                <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Total Requests</div>
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>3</div>
                <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Pending Review</div>
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>2</div>
                <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Ready to Disburse</div>
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>3</div>
                <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Disbursed</div>
              </div>
            </div>
          </div>
          <div style={{ margin: '2rem 0' }}>
            <h3 style={{ marginBottom: '1rem', color: '#1f2937' }}>Try Different User Roles:</h3>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={() => openDemo('archive')}>
                ⬆️ Archive Team
              </button>
              <button className="btn-primary" onClick={() => openDemo('operations')}>
                ☑️ Operations
              </button>
              <button className="btn-primary" onClick={() => openDemo('banking')}>
                💰 Core Banking
              </button>
            </div>
          </div>
          <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
            Click any role above to experience the system from different perspectives. 
            Each user sees only what they need to see, with actions restricted to their permissions.
          </p>
        </div>
      </div>
    </section>
  );
};

export default DemoSection;
