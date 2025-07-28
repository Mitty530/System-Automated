import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../../contexts/AuthContext';
import MainLayout from '../MainLayout';

// Mock the audit trail service
jest.mock('../../../lib/auditTrail', () => ({
  AuditTrailService: {
    logNavigation: jest.fn(),
    logDataAccess: jest.fn(),
    logUserActivity: jest.fn(),
  }
}));

// Mock the database service
jest.mock('../../../lib/database', () => ({
  DatabaseService: {
    createUserSession: jest.fn(),
    endUserSession: jest.fn(),
  }
}));

// Mock Supabase
jest.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      })),
      signOut: jest.fn(() => Promise.resolve({ error: null })),
      signInWithOtp: jest.fn(() => Promise.resolve({ error: null })),
      resetPasswordForEmail: jest.fn(() => Promise.resolve({ error: null })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      }))
    }))
  }
}));

const MockedMainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MainLayout>{children}</MainLayout>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('MainLayout', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('renders main layout structure', () => {
    render(
      <MockedMainLayout>
        <div data-testid="test-content">Test Content</div>
      </MockedMainLayout>
    );

    // Check if the main layout elements are present
    expect(screen.getByText('ADFD Tracking System')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  test('renders footer with correct information', () => {
    render(
      <MockedMainLayout>
        <div>Test Content</div>
      </MockedMainLayout>
    );

    // Check footer elements
    expect(screen.getByText('© 2024 ADFD Tracking System')).toBeInTheDocument();
    expect(screen.getByText('Version 1.0.0')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  test('renders sidebar and header components', () => {
    render(
      <MockedMainLayout>
        <div>Test Content</div>
      </MockedMainLayout>
    );

    // Check if sidebar navigation elements are present
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    
    // Check if header elements are present
    expect(screen.getByPlaceholderText(/search requests/i)).toBeInTheDocument();
  });
});
