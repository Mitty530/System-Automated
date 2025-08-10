import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Example from './App.flowapp'
import KombaiWrapper from './KombaiWrapper'
import ErrorBoundary from '@kombai/react-error-boundary'
import SimpleErrorBoundary from './src/components/SimpleErrorBoundary'
import { AuthProvider } from './src/contexts/AuthContext'
import { NotificationProvider } from './src/contexts/NotificationContext'
import Toast from './src/components/ui/Toast'
import './index.css'

// Performance monitoring
window.appStartTime = performance.now();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SimpleErrorBoundary>
      <ErrorBoundary>
        <AuthProvider>
          <NotificationProvider>
            <KombaiWrapper>
              <Example />
            </KombaiWrapper>
            <Toast />
          </NotificationProvider>
        </AuthProvider>
      </ErrorBoundary>
    </SimpleErrorBoundary>
  </StrictMode>,
)