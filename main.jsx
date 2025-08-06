import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Example from './App.flowapp'
import KombaiWrapper from './KombaiWrapper'
import ErrorBoundary from '@kombai/react-error-boundary'
import SimpleErrorBoundary from './src/components/SimpleErrorBoundary'
import { AuthProvider } from './src/contexts/AuthContext'
import './index.css'

// Performance monitoring
window.appStartTime = performance.now();
console.log('🚀 ADFD System starting...');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SimpleErrorBoundary>
      <ErrorBoundary>
        <AuthProvider>
          <KombaiWrapper>
            <Example />
          </KombaiWrapper>
        </AuthProvider>
      </ErrorBoundary>
    </SimpleErrorBoundary>
  </StrictMode>,
)