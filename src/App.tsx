import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import SecuritySection from './components/SecuritySection';
import Footer from './components/Footer';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  region?: string;
  permissions: string[];
}

const AppContent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoginPage = location.pathname === '/login';
  const isForgotPasswordPage = location.pathname === '/forgot-password';
  const isAuthPage = isLoginPage || isForgotPasswordPage;
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (userData: User) => {
    setUser(userData);
    // Store user data in localStorage for persistence
    localStorage.setItem('quandrox_user', JSON.stringify(userData));
    // Redirect to dashboard or main page
    navigate('/');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('quandrox_user');
    navigate('/login');
  };

  // Check for existing user session on app load
  useEffect(() => {
    const storedUser = localStorage.getItem('quandrox_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem('quandrox_user');
      }
    }
  }, []);

  return (
    <div className="App">
      {/* Background Elements */}
      <div className="animated-bg"></div>
      <div className="floating-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      {!isAuthPage && <Navigation user={user} onLogout={handleLogout} />}
      <Routes>
        <Route path="/" element={
          <main>
            <HeroSection />
            <FeaturesSection />
            <SecuritySection />
          </main>
        } />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>
      {!isAuthPage && <Footer />}
    </div>
  );
};

function App() {
  useEffect(() => {
    // Smooth scrolling for anchor links
    const handleSmoothScroll = (e: Event) => {
      const target = e.target as HTMLAnchorElement;
      if (target.hash) {
        e.preventDefault();
        const element = document.querySelector(target.hash);
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      }
    };

    // Add event listeners for smooth scrolling
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
      link.addEventListener('click', handleSmoothScroll);
    });

    // Scroll-based animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
      observer.observe(el);
    });

    // Cleanup
    return () => {
      links.forEach(link => {
        link.removeEventListener('click', handleSmoothScroll);
      });
      observer.disconnect();
    };
  }, []);

  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
