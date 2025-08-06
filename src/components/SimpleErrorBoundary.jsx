import React from 'react';

class SimpleErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 React Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-50">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl text-white">⚠️</span>
              </div>
              
              <h1 className="text-2xl font-bold text-gray-800 mb-2">🏛️ ADFD Tracking System</h1>
              <p className="text-gray-600 text-sm mb-6">Application Error</p>
              
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <h2 className="font-bold text-red-800 mb-2">Something went wrong</h2>
                <p className="text-red-600 text-sm">
                  The application encountered an error. Please try refreshing the page.
                </p>
              </div>
              
              <div className="space-y-3">
                <button 
                  onClick={() => window.location.reload()} 
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200"
                >
                  🔄 Reload Page
                </button>
                
                <button 
                  onClick={() => {
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.href = '/';
                  }}
                  className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200"
                >
                  🗑️ Clear Data & Restart
                </button>
              </div>
              
              <div className="mt-6 text-xs text-gray-500">
                <p>If the problem persists, contact: admin@adfd.ae</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SimpleErrorBoundary;
