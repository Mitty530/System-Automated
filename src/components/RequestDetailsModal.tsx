import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Calendar, 
  DollarSign, 
  MapPin, 
  User, 
  Clock, 
  MessageCircle, 
  FileText, 
  Activity,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
  Pause
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { WithdrawalRequest, RequestDetails, RequestDetailsModalState } from '../types/withdrawalTypes';
import { withdrawalRequestService } from '../services/withdrawalRequestService';
import { commentService } from '../services/commentService';
import { timelineService } from '../services/timelineService';
import CommentSystem from './CommentSystem';
import TimelineComponent from './TimelineComponent';
import RequestTrackingDashboard from './RequestTrackingDashboard';
import HorizontalTimelineComponent from './HorizontalTimelineComponent';
import EnhancedOverviewSection from './EnhancedOverviewSection';
import EnhancedCommentSystem from './EnhancedCommentSystem';
import EnhancedDocumentsSection from './EnhancedDocumentsSection';

interface RequestDetailsModalProps {
  isOpen: boolean;
  requestId: string | null;
  onClose: () => void;
}

const RequestDetailsModal: React.FC<RequestDetailsModalProps> = ({
  isOpen,
  requestId,
  onClose
}) => {
  const { user } = useAuth();
  const [modalState, setModalState] = useState<RequestDetailsModalState>({
    isOpen: false,
    requestId: null,
    activeTab: 'overview',
    isLoading: false
  });
  const [requestDetails, setRequestDetails] = useState<RequestDetails | null>(null);

  // Load request details when modal opens
  useEffect(() => {
    if (isOpen && requestId) {
      setModalState(prev => ({ ...prev, isLoading: true }));
      loadRequestDetails(requestId);
    }
  }, [isOpen, requestId]);

  const loadRequestDetails = async (id: string) => {
    try {
      const request = withdrawalRequestService.getRequestById(id);
      if (!request) {
        console.error('Request not found:', id);
        return;
      }

      const comments = commentService.getCommentsByRequestId(id);
      const timeline = timelineService.getTimelineByRequestId(id);
      const timelineStats = timelineService.getTimelineStats(id);

      const details: RequestDetails = {
        ...request,
        comments,
        timeline,
        documents: [], // TODO: Implement document service
        totalComments: comments.length,
        lastActivity: timelineStats.lastActivity || request.updatedAt
      };

      setRequestDetails(details);
    } catch (error) {
      console.error('Error loading request details:', error);
    } finally {
      setModalState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleClose = () => {
    setRequestDetails(null);
    setModalState({
      isOpen: false,
      requestId: null,
      activeTab: 'overview',
      isLoading: false
    });
    onClose();
  };

  const handleTabChange = (tab: RequestDetailsModalState['activeTab']) => {
    setModalState(prev => ({ ...prev, activeTab: tab }));
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'disbursed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <Pause className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'disbursed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen || !requestDetails) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-start justify-center p-4 pt-8 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleClose();
          }
        }}
        style={{ overflow: 'hidden' }}
      >
        <motion.div
          className="bg-white rounded-3xl w-full max-w-7xl max-h-[95vh] overflow-hidden"
          style={{
            border: '1px solid #DEE1E3',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)'
          }}
          initial={{ opacity: 0, y: 60, scale: 0.9, rotateX: 15 }}
          animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
          exit={{ opacity: 0, y: 60, scale: 0.9, rotateX: 15 }}
          transition={{
            duration: 0.4,
            ease: [0.16, 1, 0.3, 1],
            staggerChildren: 0.1
          }}
        >
          {/* Header */}
          <motion.div
            className="px-6 py-5 border-b flex items-center justify-between relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              borderColor: '#e2e8f0',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
            }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-blue-500"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-green-500"></div>
            </div>

            <div className="flex items-center space-x-6 relative z-10">
              <motion.div
                className="flex items-center space-x-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <div className="p-2 rounded-xl bg-white shadow-sm border border-gray-200">
                  {getStatusIcon(requestDetails.status)}
                </div>
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Request Details
                  </h2>
                  <p className="text-sm text-gray-600 font-medium">{requestDetails.refNumber}</p>
                </div>
              </motion.div>

              <motion.div
                className={`px-4 py-2 rounded-xl text-sm font-semibold border shadow-sm ${getStatusColor(requestDetails.status)}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                whileHover={{ scale: 1.05 }}
              >
                {requestDetails.status}
              </motion.div>
            </div>
            <motion.button
              onClick={handleClose}
              className="p-2 rounded-full bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 transition-all duration-200 shadow-sm hover:shadow-md"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Close Details"
            >
              <X className="w-6 h-6 text-red-600 hover:text-red-700" />
            </motion.button>
          </motion.div>

          {/* Tab Navigation */}
          <motion.div
            className="px-6 py-4 border-b relative"
            style={{
              background: 'linear-gradient(135deg, #fafbfc 0%, #f8fafc 100%)',
              borderColor: '#e2e8f0'
            }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <div className="flex space-x-2 relative">
              {[
                { id: 'overview', label: 'Overview', icon: Eye, color: 'blue' },
                { id: 'timeline', label: 'Timeline', icon: Activity, color: 'purple' },
                { id: 'comments', label: `Comments (${requestDetails.totalComments})`, icon: MessageCircle, color: 'green' },
                { id: 'documents', label: 'Documents', icon: FileText, color: 'orange' }
              ].map((tab, index) => {
                const IconComponent = tab.icon;
                const isActive = modalState.activeTab === tab.id;

                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id as any)}
                    className={`relative flex items-center space-x-2 px-5 py-3 rounded-xl font-semibold transition-all duration-300 ${
                      isActive
                        ? 'bg-white text-gray-900 shadow-lg border border-gray-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/70'
                    }`}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1, duration: 0.3 }}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <motion.div
                        className={`absolute inset-0 rounded-xl bg-gradient-to-r opacity-10 ${
                          tab.color === 'blue' ? 'from-blue-500 to-blue-600' :
                          tab.color === 'purple' ? 'from-purple-500 to-purple-600' :
                          tab.color === 'green' ? 'from-green-500 to-green-600' :
                          'from-orange-500 to-orange-600'
                        }`}
                        layoutId="activeTab"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}

                    <IconComponent className={`w-4 h-4 relative z-10 ${
                      isActive
                        ? tab.color === 'blue' ? 'text-blue-600' :
                          tab.color === 'purple' ? 'text-purple-600' :
                          tab.color === 'green' ? 'text-green-600' :
                          'text-orange-600'
                        : ''
                    }`} />
                    <span className="relative z-10">{tab.label}</span>

                    {/* Hover glow effect */}
                    <motion.div
                      className={`absolute inset-0 rounded-xl opacity-0 ${
                        tab.color === 'blue' ? 'bg-blue-500' :
                        tab.color === 'purple' ? 'bg-purple-500' :
                        tab.color === 'green' ? 'bg-green-500' :
                        'bg-orange-500'
                      }`}
                      whileHover={{ opacity: 0.05 }}
                      transition={{ duration: 0.2 }}
                    />
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto bg-gradient-to-br from-blue-50/30 via-indigo-50/30 to-purple-50/30" style={{ maxHeight: 'calc(95vh - 200px)' }}>
            {modalState.isLoading ? (
              <div className="flex items-center justify-center h-64">
                <motion.div
                  className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              </div>
            ) : (
              <div className="p-8">
                {modalState.activeTab === 'overview' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <EnhancedOverviewSection request={requestDetails} />
                  </motion.div>
                )}

                {modalState.activeTab === 'timeline' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <HorizontalTimelineComponent
                      request={requestDetails}
                      timeline={requestDetails.timeline}
                    />
                  </motion.div>
                )}

                {modalState.activeTab === 'comments' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <EnhancedCommentSystem
                      requestId={requestDetails.id}
                      comments={requestDetails.comments}
                      onCommentAdded={() => loadRequestDetails(requestDetails.id)}
                    />
                  </motion.div>
                )}

                {modalState.activeTab === 'documents' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <EnhancedDocumentsSection
                      requestId={requestDetails.id}
                      documents={requestDetails.documents}
                      onDocumentUploaded={() => loadRequestDetails(requestDetails.id)}
                    />
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RequestDetailsModal;
