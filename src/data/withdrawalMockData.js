import { WorkflowStage, DecisionType, UserRole, CommentType, NotificationType } from './enums.js';

// Data for global state store
export const mockStore = {
  currentUser: {
    id: 2,
    username: 'admin001', 
    name: 'John Administrator',
    role: UserRole.LOAN_ADMIN,
    email: 'john@company.com',
    avatar: '👨‍💼'
  },
  isAuthenticated: true,
  notifications: [
    {
      id: 1,
      type: NotificationType.NEW_REQUEST,
      requestId: 1005,
      message: 'New withdrawal request REF/005 requires your review',
      timestamp: '2025-01-15T10:30:00Z',
      read: false
    }
  ]
};

// Data returned by API queries
export const mockQuery = {
  requestDetails: {
    id: 1002,
    projectNumber: '1002',
    country: 'Country B', 
    refNumber: 'REF/002',
    beneficiaryName: 'Company Beta',
    amount: 850000,
    currency: 'EUR',
    valueDate: '2025-05-07',
    status: 'Pending due to expired withdrawal date; extension request sent to legal for review',
    currentStage: WorkflowStage.TECHNICAL_REVIEW,
    assignedTo: 3,
    createdBy: 1,
    createdAt: '2025-05-05T10:15:00Z',
    updatedAt: '2025-05-08T16:20:00Z', 
    processingDays: 15,
    priority: 'urgent',
    projectDetails: 'Infrastructure development project for renewable energy systems. This project involves the installation of solar panels and wind turbines across multiple locations in Country B. The project aims to provide sustainable energy solutions for rural communities.',
    referenceDocumentation: 'Project approval reference: PA-2025-002\nBudget allocation: EUR 850,000\nExpected completion: Q3 2025\nEnvironmental impact assessment completed.',
    documents: [
      {
        id: 1,
        name: 'Withdrawal_Form_REF002.pdf',
        size: 2457600,
        uploadedAt: '2025-05-05T10:20:00Z',
        uploadedBy: 1
      },
      {
        id: 2, 
        name: 'Environmental_Impact_Assessment.pdf',
        size: 5242880,
        uploadedAt: '2025-05-05T11:15:00Z',
        uploadedBy: 1
      },
      {
        id: 3,
        name: 'Budget_Breakdown.xlsx', 
        size: 1048576,
        uploadedAt: '2025-05-06T09:30:00Z',
        uploadedBy: 2
      }
    ]
  },
  auditTrail: [
    {
      id: 1,
      requestId: 1002,
      userId: 1,
      userName: 'Sarah Archive',
      userRole: UserRole.ARCHIVE_TEAM,
      action: 'Request created',
      comment: 'Initial withdrawal request submitted for Company Beta project',
      timestamp: '2025-05-05T10:15:00Z'
    },
    {
      id: 2,
      requestId: 1002, 
      userId: 2,
      userName: 'John Administrator',
      userRole: UserRole.LOAN_ADMIN,
      action: 'Sent to Operations',
      comment: 'All documentation verified. Forwarding to operations team for technical review.',
      timestamp: '2025-05-06T14:20:00Z'
    },
    {
      id: 3,
      requestId: 1002,
      userId: 3,
      userName: 'Mike Operations', 
      userRole: UserRole.OPERATIONS_TEAM,
      action: 'Returned for revision',
      comment: 'Withdrawal date has expired. Requesting extension from legal team before proceeding.',
      timestamp: '2025-05-08T16:20:00Z'
    }
  ],
  comments: [
    {
      id: 1,
      requestId: 1002,
      userId: 3,
      userName: 'Mike Operations',
      userRole: UserRole.OPERATIONS_TEAM,
      type: CommentType.DECISION,
      comment: 'The withdrawal date specified in the original request has expired. We need legal clearance for the extension before we can proceed with the disbursement.',
      timestamp: '2025-05-08T16:20:00Z'
    },
    {
      id: 2,
      requestId: 1002,
      userId: 2, 
      userName: 'John Administrator',
      userRole: UserRole.LOAN_ADMIN,
      type: CommentType.GENERAL,
      comment: 'I will coordinate with the legal team to expedite the extension approval. Expected timeline is 2-3 business days.',
      timestamp: '2025-05-09T09:15:00Z'
    }
  ]
};

// Data passed as props to the root component
export const mockRootProps = {
  requestId: 1002,
  isOpen: true,
  onClose: () => console.log('Modal closed'),
  onDecisionMade: (decision, comment) => console.log('Decision made:', decision, comment)
};