// Mock data for the complete application flow
import { USER_ROLES } from '../utils/rolePermissions';

// Data for global state store
export const mockStore = {
  currentUser: null,
  isAuthenticated: false,
  currentRoute: 'landing'
};

// Data returned by API queries  
export const mockQuery = {
  users: {
    'archive001': { 
      id: 1, 
      username: 'archive001', 
      name: 'Sarah Archive', 
      role: 'archive_team', 
      email: 'sarah@company.com', 
      avatar: '👩‍💼' 
    },
    'admin001': { 
      id: 2, 
      username: 'admin001', 
      name: 'John Administrator', 
      role: 'loan_admin', 
      email: 'john@company.com', 
      avatar: '👨‍💼' 
    },
    'ops001': { 
      id: 3, 
      username: 'ops001', 
      name: 'Mike Operations', 
      role: 'operations_team', 
      email: 'mike@company.com', 
      avatar: '👨‍🔧' 
    },
    'bank001': { 
      id: 4, 
      username: 'bank001', 
      name: 'Lisa Banking', 
      role: 'core_banking', 
      email: 'lisa@company.com', 
      avatar: '👩‍💻' 
    }
  },
  requests: [
    {
      id: 1001,
      projectNumber: '1001',
      country: 'Country A',
      refNumber: 'REF/001',
      beneficiaryName: 'Company Alpha',
      amount: 1200000,
      currency: 'USD',
      valueDate: '2025-05-12',
      status: 'Disbursed',
      currentStage: 'disbursed',
      assignedTo: 4,
      createdBy: 1,
      createdAt: '2025-05-10T09:00:00Z',
      updatedAt: '2025-05-15T14:30:00Z',
      processingDays: 5,
      priority: 'high'
    },
    {
      id: 1002,
      projectNumber: '1002',
      country: 'Country B',
      refNumber: 'REF/002',
      beneficiaryName: 'Company Beta',
      amount: 850000,
      currency: 'EUR',
      valueDate: '2025-05-07',
      status: 'Pending due to expired withdrawal date; extension request sent to legal for review',
      currentStage: 'technical_review',
      assignedTo: 3,
      createdBy: 1,
      createdAt: '2025-05-05T10:15:00Z',
      updatedAt: '2025-05-08T16:20:00Z',
      processingDays: 15,
      priority: 'urgent'
    },

    {
      id: 1003,
      projectNumber: '1003',
      country: 'Country C',
      refNumber: 'REF/003',
      beneficiaryName: 'Company Gamma',
      amount: 550000,
      currency: 'USD',
      valueDate: '2025-05-13',
      status: 'Pending with Operations for technical approval',
      currentStage: 'technical_review',
      assignedTo: 3,
      createdBy: 1,
      createdAt: '2025-05-11T11:30:00Z',
      updatedAt: '2025-05-12T09:45:00Z',
      processingDays: 8,
      priority: 'medium'
    },
    {
      id: 1004,
      projectNumber: '1004',
      country: 'Country D',
      refNumber: 'REF/004',
      beneficiaryName: 'Company Delta',
      amount: 980000,
      currency: 'USD',
      valueDate: '2025-05-15',
      status: 'Awaiting authorized signature verification from beneficiary',
      currentStage: 'core_banking',
      assignedTo: 4,
      createdBy: 1,
      createdAt: '2025-05-13T14:20:00Z',
      updatedAt: '2025-05-14T11:10:00Z',
      processingDays: 6,
      priority: 'high'
    }
  ],
  documents: {
    1001: [
      { 
        id: 1, 
        filename: 'Withdrawal_Form_REF001.pdf', 
        fileSize: '2.3 MB', 
        uploadedAt: '2025-05-10T09:15:00Z', 
        uploadedBy: 1 
      }
    ]
  },
  comments: {
    1002: [
      { 
        id: 1, 
        userId: 3, 
        comment: 'Withdrawal date has expired. Requesting extension from legal team.', 
        createdAt: '2025-05-08T14:30:00Z' 
      }
    ]
  },
  auditLog: {
    1002: [
      { 
        id: 1, 
        userId: 1, 
        action: 'Request created', 
        timestamp: '2025-05-05T10:15:00Z' 
      }
    ]
  }
};

// Data passed as props to the root component
export const mockRootProps = {
  initialRoute: 'landing'
};