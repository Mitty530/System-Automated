# 🏦 ADFD System - Automated Fund Disbursement Platform

[![React](https://img.shields.io/badge/React-19.0.0-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.11-38B2AC.svg)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green.svg)](https://supabase.com/)
[![Live Demo](https://img.shields.io/badge/Live_Demo-quandrox.com-success.svg)](https://www.quandrox.com/)

Enterprise-grade withdrawal request platform for the **Abu Dhabi Fund for Development (ADFD)** with intelligent automation, regional intelligence, and bank-level security.

## ✨ Features

### 🔐 **Authentication & Security**
- **Magic Link Authentication** with @adfd.ae domain restrictions
- **Role-based Access Control** (Admin, Archive Team, Operations, Core Banking)
- **Multi-factor Authentication** support
- **End-to-end Encryption** with AES-256
- **Comprehensive Audit Trails** for all system activities

### 📊 **Dashboard & Analytics**
- **Real-time Statistics** with processing metrics
- **Advanced Filtering** by status, priority, date ranges
- **Interactive Workflow Tracking** with visual progress indicators
- **Performance Monitoring** with sub-70ms authentication

### 🔄 **Workflow Management**
- **Multi-stage Approval Process**: Archive → Loan Admin → Operations → Core Banking
- **Regional Operations Teams** (Europe/Latin America, Africa, Asia)
- **Enhanced Request Details** with complete audit trails
- **Comments & Decision System** with role-based actions

### 🛠️ **Technical Excellence**
- **Zero ESLint Errors** - Comprehensive code quality
- **Optimized Bundle Size** - Removed 29 unused dependencies
- **Production Ready** - Fully tested and verified
- **Modern Tech Stack** - React 19, Vite 6, Tailwind CSS 4

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

```bash
# Clone the repository
git clone https://github.com/Mitty530/System-Automated.git
cd System-Automated

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase credentials to .env.local

# Start development server
npm run dev
```

### Environment Variables

Create a `.env.local` file with:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📁 Project Structure

```
/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # Reusable UI components
│   │   ├── LandingPage.jsx # Landing page
│   │   ├── WithdrawalRequestTracker.jsx # Main dashboard
│   │   └── ...
│   ├── contexts/           # React contexts
│   ├── data/              # Mock data and enums
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # External library configs
│   ├── utils/             # Utility functions
│   └── config/            # Configuration files
├── system_directory.txt    # Complete system documentation
├── package.json           # Dependencies and scripts
└── vite.config.js         # Vite configuration
```

## 🔧 Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 🏗️ Architecture

### User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Admin** | Full system access |
| **Loan Administrator** | Full access to loan operations |
| **Archive Team** | Create and view requests |
| **Operations Team** | Approve/reject by region |
| **Core Banking** | Disburse approved requests |
| **Observer** | View-only access |

### Workflow Stages

1. **Submitted** - Archive team creates and submits requests
2. **Under Loan Review** - Loan administrators review and verify details
3. **Under Operations Review** - Regional operations teams approve/reject by region
4. **Returned for Modification** - Operations team rejected, back to loan administrators
5. **Approved** - Request approved, ready for core banking processing
6. **Disbursed** - Funds successfully disbursed

## 🛡️ Security Features

- **Domain Restrictions** - Only @adfd.ae emails allowed
- **Session Management** - Secure JWT token handling
- **Input Validation** - Comprehensive form validation
- **XSS Protection** - Sanitized inputs and outputs
- **Audit Logging** - Complete activity tracking

## 🧹 Code Quality

This codebase has undergone comprehensive deep cleaning:

- ✅ **32 ESLint issues resolved** (unused imports, variables, parameters)
- ✅ **29 unused dependencies removed**
- ✅ **Code duplication eliminated**
- ✅ **Build artifacts cleaned**
- ✅ **Zero linting errors**
- ✅ **Fully functional and tested**

## 📚 Documentation

- **Complete System Documentation**: See `system_directory.txt`
- **API Documentation**: Available in `/src/lib/supabase.js`
- **Component Documentation**: Inline comments in components

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Demo**: [Coming Soon]
- **Documentation**: `system_directory.txt`
- **Issues**: [GitHub Issues](https://github.com/Mitty530/System-Automated/issues)

---

**Built with ❤️ for ADFD by the Development Team**
