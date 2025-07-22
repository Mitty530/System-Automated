import React from 'react';

const RolesSection: React.FC = () => {
  const roles = [
    {
      avatar: '👩‍💼',
      name: 'Sarah Archive',
      title: 'Archive Team',
      permissions: [
        'Create new withdrawal requests',
        'Upload documents with OCR processing',
        'Add comments to all requests'
      ]
    },
    {
      avatar: '👨‍💼',
      name: 'John Administrator',
      title: 'Loan Administrator',
      permissions: [
        'View-only access to all requests',
        'Add comments for tracking',
        'Generate reports and analytics'
      ]
    },
    {
      avatar: '👨‍🔧',
      name: 'Operations Teams',
      title: 'Regional Specialists',
      permissions: [
        'Approve/reject regional requests only',
        'North Africa, Central Africa, SEA, Central Asia',
        'Cannot access other regions'
      ]
    },
    {
      avatar: '👩‍💻',
      name: 'Lisa Banking',
      title: 'Core Banking Team',
      permissions: [
        'Process final disbursements',
        'Mark requests as completed',
        'Handle urgent disbursement alerts'
      ]
    }
  ];

  return (
    <section id="roles" className="roles">
      <div className="container">
        <div className="section-header animate-on-scroll">
          <h2>User Roles & Permissions</h2>
          <p>Each role has specific responsibilities and strict access controls</p>
        </div>
        <div className="roles-grid">
          {roles.map((role, index) => (
            <div key={index} className="role-card animate-on-scroll">
              <div className="role-avatar">{role.avatar}</div>
              <h4>{role.name}</h4>
              <div className="role-title">{role.title}</div>
              <ul className="role-permissions">
                {role.permissions.map((permission, permIndex) => (
                  <li key={permIndex}>{permission}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RolesSection;
