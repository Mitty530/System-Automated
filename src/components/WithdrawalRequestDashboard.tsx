import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  Bell,
  Eye,
  Upload,
  Download,
  MessageCircle,
  Search,
  Plus,
  LogOut,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Pause,
  ArrowRight,
  TrendingUp,
  Activity,
  FileText,
  Users,
  Lock,
  Shield,
  X
} from 'lucide-react';
import { withdrawalRequestService } from '../services/withdrawalRequestService';
import { permissionService } from '../services/permissionService';
import { notificationService } from '../services/notificationService';
import NotificationContainer from './NotificationContainer';
import ConfirmDialog from './ConfirmDialog';
import RequestDetailsModal from './RequestDetailsModal';
import {
  WithdrawalRequest,
  User,
  ActionType,
  DashboardStats,
  LoadingState,
  ModalState,
  FilterOptions
} from '../types/withdrawalTypes';

// Enhanced mock users for ADFD Withdrawal Request Tracker with proper typing
const mockUsers: Record<string, User> = {
  'archive001': {
    id: 'archive001',
    name: 'Ahmed Al Zaabi',
    email: 'aalzaabi@adfd.ae',
    role: 'archive_team',
    avatar: '👨‍💼',
    permissions: ['create_request', 'view']
  },
  'admin001': {
    id: 'admin001',
    name: 'Mamadou Oury Diallo',
    email: 'Mamadouourydiallo819@gmail.com',
    role: 'loan_admin',
    avatar: '👨‍💼',
    permissions: ['view']
  },
  'ops001': {
    id: 'ops001',
    name: 'Ali Al Derie',
    email: 'aalderei@adfd.ae',
    role: 'operations_team',
    avatar: '👨‍🔧',
    permissions: ['approve', 'reject', 'view']
  },
  'bank001': {
    id: 'bank001',
    name: 'Ahmed Siddique',
    email: 'asiddique@adfd.ae',
    role: 'core_banking_team',
    avatar: '👩‍💻',
    permissions: ['disburse', 'view']
  }
};





const mockDocuments = {
  1001: [
    { id: 1, filename: 'Withdrawal_Form_REF001.pdf', fileSize: '2.3 MB', uploadedAt: '2025-05-10T09:15:00Z', uploadedBy: 1 },
    { id: 2, filename: 'Invoice_Alpha_001.pdf', fileSize: '1.8 MB', uploadedAt: '2025-05-10T09:16:00Z', uploadedBy: 1 }
  ],
  1002: [
    { id: 4, filename: 'Withdrawal_Form_REF002.pdf', fileSize: '2.1 MB', uploadedAt: '2025-05-05T10:20:00Z', uploadedBy: 1 },
    { id: 5, filename: 'Invoice_Beta_001.pdf', fileSize: '1.9 MB', uploadedAt: '2025-05-05T10:21:00Z', uploadedBy: 1 }
  ]
};

const mockComments = {
  1002: [
    { id: 1, userId: 3, comment: 'Withdrawal date has expired. Requesting extension from legal team.', createdAt: '2025-05-08T14:30:00Z' },
    { id: 2, userId: 2, comment: 'Extension request documentation sent to beneficiary.', createdAt: '2025-05-08T16:20:00Z' }
  ],
  1003: [
    { id: 3, userId: 3, comment: 'Technical review in progress. Checking project eligibility requirements.', createdAt: '2025-05-12T10:15:00Z' }
  ]
};

const WithdrawalRequestDashboard: React.FC = () => {
  const { user } = useAuth();
  // Enhanced state management with proper types
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRequestDetails, setShowRequestDetails] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [actionToPerform, setActionToPerform] = useState<{action: ActionType, request?: WithdrawalRequest} | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCountry, setFilterCountry] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateRequest, setShowCreateRequest] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [animateStats, setAnimateStats] = useState(false);
  const [loadingState, setLoadingState] = useState<LoadingState>({ isLoading: false });
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
    variant?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: async () => {}
  });

  // Load data and initialize component
  useEffect(() => {
    loadRequests();
    loadCurrentUser();
    setAnimateStats(true);
    setTimeout(() => setAnimateStats(false), 1000);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showModal) setShowModal(false);
        if (showLoginModal) setShowLoginModal(false);
        if (showCreateRequest) setShowCreateRequest(false);
        if (confirmDialog.isOpen) setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        if (showRequestDetails) {
          setShowRequestDetails(false);
          setSelectedRequestId(null);
        }
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [showModal, showLoginModal, showCreateRequest, confirmDialog.isOpen, showRequestDetails]);

  // Data loading functions
  const loadRequests = useCallback(() => {
    try {
      const allRequests = withdrawalRequestService.getAllRequests();
      setRequests(allRequests);
    } catch (error) {
      console.error('Error loading requests:', error);
      notificationService.error('Error', 'Failed to load withdrawal requests');
    }
  }, []);

  const loadCurrentUser = useCallback(() => {
    const savedUser = withdrawalRequestService.getCurrentUser();
    setCurrentUser(savedUser);
  }, []);

  // Handle request details view
  const handleViewRequestDetails = useCallback((request: WithdrawalRequest) => {
    setSelectedRequestId(request.id);
    setShowRequestDetails(true);
  }, []);

  // Enhanced action handlers with proper functionality
  const handleLoginForAction = useCallback(async (action: ActionType, request?: WithdrawalRequest) => {
    // Check if user is already logged in and has permission
    if (currentUser) {
      const permissionCheck = permissionService.canPerformAction(currentUser, action, request);
      if (permissionCheck.canPerform) {
        await performAction(action, request);
        return;
      } else {
        notificationService.permissionDenied(permissionCheck.reason || 'this action');
        return;
      }
    }

    // Show login modal for action
    setActionToPerform({ action, request });
    setShowLoginModal(true);
  }, [currentUser]);

  const performAction = useCallback(async (action: ActionType, request?: WithdrawalRequest) => {
    if (!currentUser) {
      notificationService.error('Authentication Required', 'Please log in to perform this action');
      return;
    }

    // Validate permission
    const permissionCheck = permissionService.canPerformAction(currentUser, action, request);
    if (!permissionCheck.canPerform) {
      notificationService.permissionDenied(permissionCheck.reason || 'this action');
      return;
    }

    try {
      setLoadingState({ isLoading: true, operation: action });

      switch (action) {
        case 'approve':
          await handleApproveRequest(request!);
          break;
        case 'reject':
          await handleRejectRequest(request!);
          break;
        case 'disburse':
          await handleDisburseRequest(request!);
          break;
        case 'create_request':
          setShowCreateRequest(true);
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      notificationService.error('Action Failed', `Failed to ${action}. Please try again.`);
    } finally {
      setLoadingState({ isLoading: false });
    }
  }, [currentUser]);

  // Specific action handlers with confirmation dialogs
  const handleApproveRequest = useCallback(async (request: WithdrawalRequest) => {
    return new Promise<void>((resolve, reject) => {
      setConfirmDialog({
        isOpen: true,
        title: 'Approve Withdrawal Request',
        message: `Are you sure you want to approve withdrawal request ${request.refNumber}? This will move it to Core Banking stage.`,
        variant: 'info',
        onConfirm: async () => {
          try {
            const success = withdrawalRequestService.updateRequest(request.id, {
              currentStage: 'core_banking',
              status: 'Approved - Moved to Core Banking for disbursement',
              assignedTo: 'bank001'
            });

            if (success) {
              withdrawalRequestService.logAction(request.id, 'approve', currentUser!.id, 'Request approved by Operations Team');
              notificationService.requestApproved(request.refNumber);
              loadRequests();
              setConfirmDialog(prev => ({ ...prev, isOpen: false }));
              resolve();
            } else {
              throw new Error('Failed to update request');
            }
          } catch (error) {
            console.error('Error approving request:', error);
            notificationService.error('Approval Failed', 'Failed to approve the request. Please try again.');
            reject(error);
          }
        }
      });
    });
  }, [currentUser, loadRequests]);

  const handleRejectRequest = useCallback(async (request: WithdrawalRequest) => {
    return new Promise<void>((resolve, reject) => {
      setConfirmDialog({
        isOpen: true,
        title: 'Reject Withdrawal Request',
        message: `Are you sure you want to reject withdrawal request ${request.refNumber}? This will return it to Initial Review stage.`,
        variant: 'danger',
        onConfirm: async () => {
          try {
            const success = withdrawalRequestService.updateRequest(request.id, {
              currentStage: 'initial_review',
              status: 'Rejected - Returned to Initial Review for corrections',
              assignedTo: 'archive001'
            });

            if (success) {
              withdrawalRequestService.logAction(request.id, 'reject', currentUser!.id, 'Request rejected by Operations Team');
              notificationService.requestRejected(request.refNumber);
              loadRequests();
              setConfirmDialog(prev => ({ ...prev, isOpen: false }));
              resolve();
            } else {
              throw new Error('Failed to update request');
            }
          } catch (error) {
            console.error('Error rejecting request:', error);
            notificationService.error('Rejection Failed', 'Failed to reject the request. Please try again.');
            reject(error);
          }
        }
      });
    });
  }, [currentUser, loadRequests]);

  const handleDisburseRequest = useCallback(async (request: WithdrawalRequest) => {
    return new Promise<void>((resolve, reject) => {
      setConfirmDialog({
        isOpen: true,
        title: 'Disburse Withdrawal Request',
        message: `Are you sure you want to mark withdrawal request ${request.refNumber} as disbursed? This action cannot be undone.`,
        variant: 'warning',
        onConfirm: async () => {
          try {
            const success = withdrawalRequestService.updateRequest(request.id, {
              currentStage: 'disbursed',
              status: 'Successfully disbursed',
              processingDays: Math.ceil((new Date().getTime() - new Date(request.createdAt).getTime()) / (1000 * 60 * 60 * 24))
            });

            if (success) {
              withdrawalRequestService.logAction(request.id, 'disburse', currentUser!.id, 'Request disbursed by Core Banking Team');
              notificationService.requestDisbursed(request.refNumber);
              loadRequests();
              setConfirmDialog(prev => ({ ...prev, isOpen: false }));
              resolve();
            } else {
              throw new Error('Failed to update request');
            }
          } catch (error) {
            console.error('Error disbursing request:', error);
            notificationService.error('Disbursement Failed', 'Failed to disburse the request. Please try again.');
            reject(error);
          }
        }
      });
    });
  }, [currentUser, loadRequests]);

  // Authentication handlers
  const handleLogin = useCallback(async (username: string) => {
    try {
      const user = mockUsers[username];
      if (!user) {
        notificationService.loginError('Invalid user credentials');
        return;
      }

      // Validate permission for pending action
      if (actionToPerform) {
        const permissionCheck = permissionService.canPerformAction(user, actionToPerform.action, actionToPerform.request);
        if (!permissionCheck.canPerform) {
          notificationService.permissionDenied(permissionCheck.reason || 'this action');
          return;
        }
      }

      // Set current user and save to storage
      setCurrentUser(user);
      withdrawalRequestService.setCurrentUser(user);
      notificationService.loginSuccess(user.name);

      // Close login modal
      setShowLoginModal(false);

      // Perform pending action if any
      if (actionToPerform) {
        await performAction(actionToPerform.action, actionToPerform.request);
        setActionToPerform(null);
      }
    } catch (error) {
      console.error('Login error:', error);
      notificationService.loginError('An error occurred during login');
    }
  }, [actionToPerform, performAction]);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    withdrawalRequestService.clearCurrentUser();
    setActionToPerform(null);
    notificationService.info('Logged Out', 'You have been successfully logged out');
  }, []);

  // Enhanced search and filtering
  const filteredRequests = React.useMemo(() => {
    let filtered = requests;

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = withdrawalRequestService.searchRequests(searchTerm);
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(req => req.currentStage === filterStatus);
    }

    // Apply country filter
    if (filterCountry !== 'all') {
      filtered = filtered.filter(req => req.country === filterCountry);
    }

    return filtered;
  }, [requests, searchTerm, filterStatus, filterCountry]);

  // Calculate dashboard statistics
  const stats: DashboardStats = React.useMemo(() => {
    const allRequests = requests;
    const pendingRequests = allRequests.filter(req => req.currentStage !== 'disbursed');

    // Calculate average processing time
    const disbursedRequests = allRequests.filter(req => req.currentStage === 'disbursed');
    const avgProcessingTime = disbursedRequests.length > 0
      ? Math.round(disbursedRequests.reduce((sum, req) => sum + req.processingDays, 0) / disbursedRequests.length)
      : 0;

    // Calculate due soon (requests with value date within 3 days)
    const dueSoon = allRequests.filter(req => {
      const valueDate = new Date(req.valueDate);
      const today = new Date();
      const diffDays = Math.ceil((valueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 3 && req.currentStage !== 'disbursed';
    }).length;

    return {
      totalRequests: allRequests.length,
      pendingRequests: pendingRequests.length,
      avgProcessingTime,
      dueSoon,
      byStage: {
        initial_review: allRequests.filter(r => r.currentStage === 'initial_review').length,
        technical_review: allRequests.filter(r => r.currentStage === 'technical_review').length,
        core_banking: allRequests.filter(r => r.currentStage === 'core_banking').length,
        disbursed: allRequests.filter(r => r.currentStage === 'disbursed').length
      },
      byPriority: {
        low: allRequests.filter(r => r.priority === 'low').length,
        medium: allRequests.filter(r => r.priority === 'medium').length,
        high: allRequests.filter(r => r.priority === 'high').length,
        urgent: allRequests.filter(r => r.priority === 'urgent').length
      }
    };
  }, [requests]);

  useEffect(() => {
    if (showModal || showLoginModal || showCreateRequest || confirmDialog.isOpen || showRequestDetails) {
      // Scroll to top when modal opens
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Prevent background scrolling
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '15px'; // Prevent layout shift
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
      document.body.style.position = 'unset';
      document.body.style.width = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
      document.body.style.position = 'unset';
      document.body.style.width = 'unset';
    };
  }, [showModal, showLoginModal, showCreateRequest, confirmDialog.isOpen, showRequestDetails]);

  // Map ADFD user roles to withdrawal request roles
  const mapUserRole = (adfdRole: string) => {
    switch (adfdRole) {
      case 'archive_team':
        return 'archive';
      case 'regional_operations':
      case 'head_of_operations':
        return 'operations';
      case 'core_banking':
        return 'core_banking';
      case 'admin':
      case 'loan_administrator':
        return 'loan_admin';
      default:
        return 'loan_admin'; // Default to view-only
    }
  };







  const getStatusIcon = (stage: string) => {
    switch (stage) {
      case 'disbursed':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'core_banking':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'technical_review':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'initial_review':
        return <Pause className="w-5 h-5 text-orange-500" />;
      default:
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };



  const getActionButtonsForRequest = (request: WithdrawalRequest) => {
    const buttons = [];

    if (request.currentStage === 'technical_review') {
      buttons.push(
        <motion.button
          key="approve"
          onClick={() => handleLoginForAction('approve', request)}
          className="text-white p-3 rounded-2xl shadow-lg"
          style={{ backgroundColor: '#4A8B2C' }}
          title="Approve (Operations Team Only)"
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <CheckCircle className="w-5 h-5" />
        </motion.button>
      );

      buttons.push(
        <motion.button
          key="reject"
          onClick={() => handleLoginForAction('reject', request)}
          className="text-white p-3 rounded-2xl shadow-lg"
          style={{ backgroundColor: '#DC3545' }}
          title="Reject (Operations Team Only)"
          whileHover={{ scale: 1.1, rotate: -5 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <XCircle className="w-5 h-5" />
        </motion.button>
      );
    }

    if (request.currentStage === 'core_banking') {
      buttons.push(
        <motion.button
          key="disburse"
          onClick={() => handleLoginForAction('disburse', request)}
          className="text-white p-3 rounded-2xl shadow-lg"
          style={{ backgroundColor: '#007CBA' }}
          title="Mark as Disbursed (Core Banking Team Only)"
          whileHover={{ scale: 1.1, rotate: 10 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <DollarSign className="w-5 h-5" />
        </motion.button>
      );
    }

    return buttons;
  };

  // Use the enhanced memoized versions

  return (
    <div className="min-h-screen bg-white relative" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Main Content Container */}
      <div className={`relative transition-all duration-300 ${(showModal || showLoginModal || showCreateRequest || confirmDialog.isOpen || showRequestDetails) ? 'pointer-events-none opacity-30 blur-sm' : 'opacity-100'}`}>
        {/* ADFD Brand Animated Background Effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50/30 via-white to-gray-50/30"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl animate-pulse" style={{ background: 'linear-gradient(135deg, rgba(0, 124, 186, 0.08), rgba(0, 77, 113, 0.05))' }}></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl animate-pulse delay-1000" style={{ background: 'linear-gradient(135deg, rgba(74, 139, 44, 0.08), rgba(0, 124, 186, 0.05))' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl animate-pulse delay-500" style={{ background: 'linear-gradient(135deg, rgba(0, 124, 186, 0.06), rgba(74, 139, 44, 0.04))' }}></div>
        <div className="absolute top-20 left-20 w-32 h-32 rounded-full blur-2xl animate-pulse delay-700" style={{ background: 'linear-gradient(135deg, rgba(0, 77, 113, 0.06), rgba(0, 124, 186, 0.04))' }}></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 rounded-full blur-2xl animate-pulse delay-300" style={{ background: 'linear-gradient(135deg, rgba(0, 124, 186, 0.05), rgba(74, 139, 44, 0.03))' }}></div>
      </div>

      {/* ADFD Premium Header */}
      <header className="relative z-10 bg-white shadow-lg border-b" style={{ borderColor: '#DEE1E3' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <motion.div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ background: 'linear-gradient(135deg, #007CBA, #004D71)' }}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.3 }}
              >
                <DollarSign className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <motion.h1
                  className="text-2xl font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #007CBA, #004D71)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  ADFD Withdrawal Request Tracker
                </motion.h1>
                <p className="text-sm" style={{ color: '#5B6670' }}>Real-time tracking dashboard • Public viewing • Strict role-based actions</p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <motion.button
                onClick={() => handleLoginForAction('create_request')}
                className="text-white px-6 py-3 rounded-2xl flex items-center space-x-2 shadow-lg transform hover:scale-105 transition-all duration-200"
                style={{ background: 'linear-gradient(135deg, #4A8B2C, #74A855)' }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">New Request</span>
                <span className="text-xs bg-white/20 px-2 py-1 rounded-lg">Archive Only</span>
              </motion.button>

              {currentUser ? (
                <motion.div
                  className="flex items-center space-x-3 rounded-2xl px-4 py-3 shadow-lg"
                  style={{ backgroundColor: '#F9F9F9', border: '1px solid #DEE1E3' }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg text-white"
                    style={{ background: 'linear-gradient(135deg, #007CBA, #004D71)' }}
                  >
                    {currentUser.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: '#323E48' }}>{currentUser.name}</div>
                    <div className="text-xs capitalize" style={{ color: '#5B6670' }}>
                      {currentUser.role.replace('_', ' ')}
                      {currentUser.role === 'loan_admin' && <span style={{ color: '#007CBA' }} className="ml-1">(View Only)</span>}
                    </div>
                  </div>
                  <motion.button
                    onClick={handleLogout}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded-xl transition-all duration-200"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <LogOut className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              ) : (
                <motion.button
                  onClick={() => setShowLoginModal(true)}
                  className="text-white px-6 py-3 rounded-2xl flex items-center space-x-2 shadow-lg transform hover:scale-105 transition-all duration-200"
                  style={{ background: 'linear-gradient(135deg, #007CBA, #004D71)' }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Shield className="w-5 h-5" />
                  <span className="font-medium">Login for Actions</span>
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ADFD Live Process Tracking */}
        <motion.div
          className="bg-white p-6 rounded-3xl shadow-xl mb-8"
          style={{ border: '1px solid #DEE1E3' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          whileHover={{ scale: 1.01, y: -2 }}
        >
          <motion.h2
            className="text-xl font-bold mb-4 flex items-center"
            style={{ color: '#323E48' }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <Activity className="w-6 h-6 mr-2" style={{ color: '#007CBA' }} />
            Live Process Tracking
          </motion.h2>
          <div className="grid grid-cols-4 gap-6">
            {[
              { stage: 'initial_review', name: 'Initial Review', count: requests.filter(r => r.currentStage === 'initial_review').length, color: '#5B6670' },
              { stage: 'technical_review', name: 'Technical Review', count: requests.filter(r => r.currentStage === 'technical_review').length, color: '#007CBA' },
              { stage: 'core_banking', name: 'Core Banking', count: requests.filter(r => r.currentStage === 'core_banking').length, color: '#004D71' },
              { stage: 'disbursed', name: 'Disbursed', count: requests.filter(r => r.currentStage === 'disbursed').length, color: '#4A8B2C' }
            ].map((stage, index) => (
              <motion.div
                key={stage.stage}
                className="text-center"
                initial={{ opacity: 0, y: 30, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.1 * index, duration: 0.6 }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <motion.div
                  className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-3 shadow-lg"
                  style={{ backgroundColor: stage.color }}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.span
                    className="text-2xl font-bold text-white"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }}
                  >
                    {stage.count}
                  </motion.span>
                </motion.div>
                <h3 className="font-semibold" style={{ color: '#323E48' }}>{stage.name}</h3>
                <p className="text-sm" style={{ color: '#5B6670' }}>Active requests</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Premium Dashboard Stats */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {[
            { icon: DollarSign, label: 'Total Requests', value: stats.totalRequests, color: '#007CBA', desc: 'All time' },
            { icon: Clock, label: 'Pending Review', value: stats.pendingRequests, color: '#5B6670', desc: 'Awaiting action' },
            { icon: TrendingUp, label: 'Avg Processing', value: `${stats.avgProcessingTime} days`, color: '#4A8B2C', desc: 'Current efficiency' },
            { icon: AlertCircle, label: 'Due Soon', value: stats.dueSoon, color: '#004D71', desc: 'Urgent attention' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              className="bg-white p-6 rounded-3xl shadow-xl hover:shadow-2xl"
              style={{ border: '1px solid #DEE1E3' }}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.1 * index, duration: 0.6 }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: '#5B6670' }}>{stat.label}</p>
                  <motion.p
                    className="text-3xl font-bold mb-1"
                    style={{ color: '#323E48' }}
                    animate={{ scale: animateStats ? [1, 1.1, 1] : 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    {stat.value}
                  </motion.p>
                  <p className="text-xs" style={{ color: '#91A3B0' }}>{stat.desc}</p>
                </div>
                <motion.div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: stat.color }}
                  whileHover={{ scale: 1.1, rotate: 10 }}
                  transition={{ duration: 0.3 }}
                >
                  <stat.icon className="w-6 h-6 text-white" />
                </motion.div>
              </div>
              <div className="mt-4 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#F1F3F4' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: stat.color }}
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ delay: 0.2 * index, duration: 1, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ADFD Search and Filters */}
        <motion.div
          className="bg-white p-6 rounded-3xl shadow-xl mb-8"
          style={{ border: '1px solid #DEE1E3' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          whileHover={{ scale: 1.01, y: -2 }}
        >
          <div className="flex flex-wrap items-center gap-4">
            <motion.div
              className="flex items-center space-x-3 rounded-2xl px-4 py-3"
              style={{ backgroundColor: '#F9F9F9', border: '1px solid #DEE1E3' }}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Search className="w-5 h-5" style={{ color: '#007CBA' }} />
              <input
                type="text"
                placeholder="Search by reference, beneficiary, or project..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none w-72 placeholder-gray-500"
                style={{ color: '#323E48' }}
              />
            </motion.div>

            <motion.select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-2xl px-4 py-3 focus:outline-none focus:ring-2"
              style={{
                backgroundColor: '#F9F9F9',
                border: '1px solid #DEE1E3',
                color: '#323E48'
              }}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <option value="all">All Status</option>
              <option value="initial_review">Initial Review</option>
              <option value="technical_review">Technical Review</option>
              <option value="core_banking">Core Banking</option>
              <option value="disbursed">Disbursed</option>
            </motion.select>

            <motion.select
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              className="rounded-2xl px-4 py-3 focus:outline-none focus:ring-2"
              style={{
                backgroundColor: '#F9F9F9',
                border: '1px solid #DEE1E3',
                color: '#323E48'
              }}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <option value="all">All Countries</option>
              {Array.from(new Set(requests.map(r => r.country))).map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </motion.select>

            <motion.div
              className="ml-auto rounded-2xl px-4 py-3"
              style={{ backgroundColor: '#F0F8F0', border: '1px solid #4A8B2C' }}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center space-x-2">
                <motion.div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: '#4A8B2C' }}
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-sm font-medium" style={{ color: '#4A8B2C' }}>Live Tracking Active</span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* ADFD Requests Table */}
        <motion.div
          className="bg-white rounded-3xl shadow-2xl overflow-hidden"
          style={{ border: '1px solid #DEE1E3' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          whileHover={{ scale: 1.005, y: -2 }}
        >
          <div className="px-6 py-4 border-b" style={{ backgroundColor: '#F9F9F9', borderColor: '#DEE1E3' }}>
            <motion.h3
              className="font-bold flex items-center"
              style={{ color: '#323E48' }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <Users className="w-5 h-5 mr-2" style={{ color: '#007CBA' }} />
              All Withdrawal Requests - ADFD Tracking Dashboard
            </motion.h3>
            <p className="text-sm mt-1" style={{ color: '#5B6670' }}>
              🔒 Strict role controls: Archive (create) • Operations (approve/reject) • Core Banking (disburse) • Loan Admin (view only)
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Value Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Project Details</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Current Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Processing Time</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/50">
                {filteredRequests.map((request, index) => (
                  <motion.tr
                    key={request.id}
                    className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-200 group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index, duration: 0.5 }}
                    whileHover={{ scale: 1.01, x: 5 }}
                  >
                    <td className="px-6 py-6 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {new Date(request.valueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-gray-900">#{request.projectNumber}</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-lg border ${getPriorityColor(request.priority)}`}>
                            {request.priority}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">{request.country}</div>
                        <div className="text-sm font-medium text-blue-600">{request.refNumber}</div>
                        <div className="text-sm text-gray-500">{request.beneficiaryName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      <div className="text-lg font-bold text-gray-900">
                        {request.amount.toLocaleString()} {request.currency}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(request.currentStage)}
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {request.currentStage.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 max-w-xs">
                        {request.status.length > 60 ? `${request.status.substring(0, 60)}...` : request.status}
                      </div>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{request.processingDays} days</span>
                      </div>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <motion.button
                          onClick={() => handleViewRequestDetails(request)}
                          className="text-white p-3 rounded-2xl shadow-lg group-hover:shadow-xl"
                          style={{ backgroundColor: '#007CBA' }}
                          title="View Details"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Eye className="w-5 h-5" />
                        </motion.button>

                        {getActionButtonsForRequest(request).map((button, btnIndex) => (
                          <motion.div
                            key={btnIndex}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 * btnIndex, duration: 0.3 }}
                          >
                            {button}
                          </motion.div>
                        ))}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </main>
      </div>

      {/* Premium Login Modal */}
      {showLoginModal && (
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-start justify-center p-4 pt-8"
          style={{ zIndex: 9999, top: 0, left: 0 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowLoginModal(false);
            }
          }}
        >
          <motion.div
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-gray-200"
            style={{ zIndex: 10000 }}
            initial={{ scale: 0.8, opacity: 0, y: 0 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 0 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-3xl">
              <div className="flex justify-between items-center">
                <div>
                  <motion.h2
                    className="text-xl font-bold"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    🔒 Role Authentication
                  </motion.h2>
                  <motion.p
                    className="text-blue-100 text-sm"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {actionToPerform && `Required Role: ${permissionService.getActionDisplayName(actionToPerform.action)}`}
                  </motion.p>
                </div>
                <motion.button
                  onClick={() => setShowLoginModal(false)}
                  className="text-white hover:text-white bg-red-600 hover:bg-red-700 p-3 rounded-full transition-all duration-200 shadow-xl border-2 border-red-500"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  style={{ backgroundColor: '#DC2626', borderColor: '#EF4444' }}
                >
                  <X className="w-5 h-5 font-bold" />
                </motion.button>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
                <h3 className="font-bold text-red-800 mb-2">⚠️ Strict Access Control Rules</h3>
                <div className="text-sm text-red-700 space-y-1">
                  <div>🏛️ <strong>Archive Team:</strong> Can ONLY create new requests</div>
                  <div>👀 <strong>Loan Administrator:</strong> View-only access (no actions)</div>
                  <div>⚖️ <strong>Operations Team:</strong> Can ONLY approve/reject requests</div>
                  <div>🏦 <strong>Core Banking:</strong> Can ONLY mark disbursements</div>
                </div>
              </div>

              <div className="space-y-3">
                {Object.entries(mockUsers).map(([username, mockUser], index) => {
                  const canPerformCurrentAction = actionToPerform ? permissionService.canPerformAction(mockUser, actionToPerform.action, actionToPerform.request).canPerform : true;

                  return (
                    <motion.button
                      key={username}
                      onClick={() => handleLogin(username)}
                      disabled={!canPerformCurrentAction}
                      className={`w-full p-4 text-left rounded-2xl border transition-all duration-300 group ${
                        canPerformCurrentAction
                          ? 'backdrop-blur-md bg-white/80 hover:bg-white/90 border-white/20 hover:shadow-lg'
                          : 'bg-gray-100/50 border-gray-200/50 opacity-50 cursor-not-allowed'
                      }`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index, duration: 0.3 }}
                      whileHover={canPerformCurrentAction ? { scale: 1.02, x: 5 } : {}}
                      whileTap={canPerformCurrentAction ? { scale: 0.98 } : {}}
                    >
                      <div className="flex items-center space-x-4">
                        <motion.div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                            canPerformCurrentAction
                              ? 'bg-gradient-to-r from-blue-400 to-purple-500'
                              : 'bg-gray-300'
                          }`}
                          whileHover={canPerformCurrentAction ? { scale: 1.1, rotate: 5 } : {}}
                          transition={{ duration: 0.2 }}
                        >
                          {mockUser.avatar}
                        </motion.div>
                        <div className="flex-1">
                          <div className={`font-semibold ${canPerformCurrentAction ? 'text-gray-900' : 'text-gray-500'}`}>
                            {mockUser.name}
                          </div>
                          <div className={`text-sm capitalize ${canPerformCurrentAction ? 'text-gray-600' : 'text-gray-400'}`}>
                            {mockUser.role.replace('_', ' ')}
                            {mockUser.role === 'loan_admin' && ' (View Only)'}
                          </div>
                          {!canPerformCurrentAction && (
                            <motion.div
                              className="text-xs text-red-600 font-medium mt-1"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.2 }}
                            >
                              ❌ Cannot perform this action
                            </motion.div>
                          )}
                        </div>
                        {canPerformCurrentAction ? (
                          <motion.div
                            whileHover={{ x: 5 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-all" />
                          </motion.div>
                        ) : (
                          <Lock className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Premium Request Details Modal */}
      {showModal && selectedRequest && (
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-start justify-center p-4 pt-8"
          style={{ zIndex: 9999, top: 0, left: 0 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
            }
          }}
        >
          <motion.div
            className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full border border-gray-200"
            style={{ zIndex: 10000 }}
            initial={{ scale: 0.8, opacity: 0, y: 0 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 0 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-3xl z-10 shadow-lg">
              <div className="flex justify-between items-center">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h2 className="text-2xl font-bold">Request Details</h2>
                  <p className="text-blue-100">{selectedRequest.refNumber} • ADFD Tracking View</p>
                </motion.div>
                <motion.button
                  onClick={() => setShowModal(false)}
                  className="text-white hover:text-white bg-red-600 hover:bg-red-700 p-3 rounded-full transition-all duration-200 flex items-center justify-center shadow-xl border-2 border-red-500"
                  title="Close"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  style={{ backgroundColor: '#DC2626', borderColor: '#EF4444' }}
                >
                  <X className="w-6 h-6 font-bold" />
                </motion.button>
              </div>
            </div>

            <div className="max-h-[80vh] overflow-y-auto">
              <div className="p-8 space-y-8">
                <motion.div
                  className="backdrop-blur-md bg-gradient-to-r from-blue-50/80 to-purple-50/80 p-6 rounded-3xl border border-white/20"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <motion.h3
                    className="font-bold text-gray-900 mb-4 flex items-center"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    <FileText className="w-5 h-5 mr-2 text-blue-500" />
                    Project Information
                  </motion.h3>
                  <div className="grid grid-cols-2 gap-6">
                    {[
                      { label: 'Project Number', value: selectedRequest.projectNumber },
                      { label: 'Country', value: selectedRequest.country },
                      { label: 'Beneficiary', value: selectedRequest.beneficiaryName },
                      { label: 'Amount', value: `${selectedRequest.amount.toLocaleString()} ${selectedRequest.currency}` },
                      { label: 'Value Date', value: new Date(selectedRequest.valueDate).toLocaleDateString() },
                      { label: 'Processing Time', value: `${selectedRequest.processingDays} days` }
                    ].map((item, index) => (
                      <motion.div
                        key={item.label}
                        className="space-y-1"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index + 0.4, duration: 0.3 }}
                      >
                        <span className="text-sm text-gray-600 font-medium">{item.label}</span>
                        <div className="text-lg font-semibold text-gray-900">{item.value}</div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  className="backdrop-blur-md bg-gradient-to-r from-blue-50/80 to-purple-50/80 p-6 rounded-3xl border border-white/20"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <motion.h3
                    className="font-bold text-gray-900 mb-6 flex items-center"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    <Activity className="w-5 h-5 mr-2 text-blue-500" />
                    Progress Timeline
                  </motion.h3>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-6">
                      {['Initial Review', 'Technical Review', 'Core Banking', 'Disbursed'].map((stageName, index) => {
                        const stages = ['initial_review', 'technical_review', 'core_banking', 'disbursed'];
                        const currentIndex = stages.indexOf(selectedRequest.currentStage);
                        const isActive = index <= currentIndex;
                        const isCurrent = index === currentIndex;

                        return (
                          <motion.div
                            key={stageName}
                            className="flex flex-col items-center flex-1"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * index + 0.6, duration: 0.5 }}
                          >
                            <motion.div
                              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                                isActive
                                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                                  : 'bg-gray-200 text-gray-500'
                              }`}
                              animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                              transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }}
                              whileHover={{ scale: 1.1, rotate: 5 }}
                            >
                              {isActive ? '✓' : index + 1}
                            </motion.div>
                            <div className="mt-3 text-center">
                              <div className={`text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                                {stageName}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                    <motion.div
                      className="backdrop-blur-md bg-white/80 rounded-2xl p-4 space-y-2 border border-white/20"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8, duration: 0.5 }}
                    >
                      <div className="text-sm text-gray-600">
                        <strong>Current Status:</strong> {selectedRequest.status}
                      </div>
                      <div className="text-sm text-gray-600">
                        <strong>Assigned To:</strong> {mockUsers[Object.keys(mockUsers).find(k => mockUsers[k as keyof typeof mockUsers].id === selectedRequest.assignedTo) as keyof typeof mockUsers]?.name || 'Unassigned'}
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Notification Container */}
      <NotificationContainer />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        variant={confirmDialog.variant}
      />

      {/* Request Details Modal */}
      <RequestDetailsModal
        isOpen={showRequestDetails}
        requestId={selectedRequestId}
        onClose={() => {
          setShowRequestDetails(false);
          setSelectedRequestId(null);
        }}
      />
    </div>
  );
};

export default WithdrawalRequestDashboard;
