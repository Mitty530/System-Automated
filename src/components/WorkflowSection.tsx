import React from 'react';

const WorkflowSection: React.FC = () => {
  const steps = [
    {
      number: 1,
      title: 'Initial Review',
      description: 'Archive team creates request using OCR document upload. System auto-assigns to regional operations team.'
    },
    {
      number: 2,
      title: 'Technical Review',
      description: 'Regional operations team evaluates technical requirements and makes approval/rejection decision.'
    },
    {
      number: 3,
      title: 'Core Banking',
      description: 'Approved requests automatically move to core banking team for final disbursement processing.'
    },
    {
      number: 4,
      title: 'Disbursed',
      description: 'Request completed successfully with full audit trail and stakeholder notifications.'
    }
  ];

  return (
    <section id="workflow" className="workflow">
      <div className="container">
        <div className="section-header animate-on-scroll">
          <h2>Streamlined 4-Stage Workflow</h2>
          <p>Every request follows a proven process from creation to completion</p>
        </div>
        <div className="workflow-steps">
          {steps.map((step, index) => (
            <div key={index} className="workflow-step animate-on-scroll">
              <div className="step-number">{step.number}</div>
              <h4>{step.title}</h4>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WorkflowSection;
