import React from 'react';
import { motion } from 'framer-motion';
import {
  Archive,
  Settings,
  CreditCard,
  CheckCircle,
  Clock,
  ArrowRight,
  Calendar,
  User,
  AlertCircle
} from 'lucide-react';
import { WithdrawalRequest, TimelineEvent } from '../types/withdrawalTypes';

interface HorizontalTimelineComponentProps {
  request: WithdrawalRequest;
  timeline: TimelineEvent[];
}

const HorizontalTimelineComponent: React.FC<HorizontalTimelineComponentProps> = ({
  request,
  timeline
}) => {
  // Define the 4-stage workflow with proper mapping
  const workflowStages = [
    {
      id: 'initial_review',
      name: 'Archive Team',
      shortName: 'Archive',
      description: 'Document verification and initial review',
      icon: Archive,
      color: 'blue',
      bgColor: 'bg-blue-500',
      lightBg: 'bg-blue-50',
      borderColor: 'border-blue-300',
      textColor: 'text-blue-700',
      estimatedDays: 1
    },
    {
      id: 'technical_review',
      name: 'Operations Team',
      shortName: 'Operations',
      description: 'Technical assessment and approval',
      icon: Settings,
      color: 'purple',
      bgColor: 'bg-purple-500',
      lightBg: 'bg-purple-50',
      borderColor: 'border-purple-300',
      textColor: 'text-purple-700',
      estimatedDays: 3
    },
    {
      id: 'core_banking',
      name: 'Core Banking',
      shortName: 'Banking',
      description: 'Financial processing and disbursement',
      icon: CreditCard,
      color: 'orange',
      bgColor: 'bg-orange-500',
      lightBg: 'bg-orange-50',
      borderColor: 'border-orange-300',
      textColor: 'text-orange-700',
      estimatedDays: 2
    },
    {
      id: 'disbursed',
      name: 'Loan Admin',
      shortName: 'Complete',
      description: 'Funds disbursed successfully',
      icon: CheckCircle,
      color: 'green',
      bgColor: 'bg-green-500',
      lightBg: 'bg-green-50',
      borderColor: 'border-green-300',
      textColor: 'text-green-700',
      estimatedDays: 0
    }
  ];

  // Get current stage index
  const currentStageIndex = workflowStages.findIndex(stage => stage.id === request.currentStage);
  const isCompleted = request.currentStage === 'disbursed';

  // Calculate progress percentage
  const progressPercentage = isCompleted ? 100 : ((currentStageIndex + 1) / workflowStages.length) * 100;

  const getStageStatus = (stageIndex: number) => {
    if (stageIndex < currentStageIndex) return 'completed';
    if (stageIndex === currentStageIndex) return 'current';
    return 'pending';
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get stage events from timeline
  const getStageEvents = (stageId: string) => {
    return timeline.filter(event => 
      event.metadata?.stage === stageId || 
      (stageId === 'initial_review' && event.eventType === 'created') ||
      (stageId === 'disbursed' && event.eventType === 'disbursed')
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center space-x-4">
          <motion.div
            className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-600 to-green-600 text-white shadow-lg"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ duration: 0.2 }}
          >
            <ArrowRight className="w-6 h-6" />
          </motion.div>
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-green-800 bg-clip-text text-transparent">
              Request Progress
            </h3>
            <p className="text-sm text-gray-600 font-medium">Track your request through the 4-stage workflow</p>
          </div>
        </div>

        <motion.div
          className="text-right"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent">
            {Math.round(progressPercentage)}%
          </div>
          <div className="text-sm text-gray-500 font-medium">Complete</div>
        </motion.div>
      </motion.div>

      {/* Main Progress Bar */}
      <motion.div
        className="relative bg-white rounded-3xl p-8 border-2 border-blue-200 shadow-xl overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-purple-50/50 to-green-50/50"></div>
        
        {/* Progress Track */}
        <div className="relative">
          <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full overflow-hidden shadow-inner">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 rounded-full relative"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ delay: 0.5, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Animated shine effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              />
            </motion.div>
          </div>

          {/* Stage Indicators */}
          <div className="flex justify-between items-center mt-8">
            {workflowStages.map((stage, index) => {
              const status = getStageStatus(index);
              const IconComponent = stage.icon;
              const stageEvents = getStageEvents(stage.id);
              const latestEvent = stageEvents[stageEvents.length - 1];

              return (
                <motion.div
                  key={stage.id}
                  className="flex flex-col items-center space-y-3 relative"
                  style={{ width: '22%' }}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.15, duration: 0.5 }}
                >
                  {/* Stage Icon */}
                  <motion.div
                    className={`relative flex items-center justify-center w-16 h-16 rounded-2xl border-3 shadow-lg transition-all duration-300 ${
                      status === 'completed'
                        ? 'bg-green-500 text-white border-green-500'
                        : status === 'current'
                        ? `${stage.bgColor} text-white ${stage.borderColor.replace('border-', 'border-')}`
                        : 'bg-gray-100 text-gray-400 border-gray-300'
                    }`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <IconComponent className="w-8 h-8" />

                    {/* Status indicator */}
                    {status === 'completed' && (
                      <motion.div
                        className="absolute -top-1 -right-1 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5, duration: 0.3, type: "spring" }}
                      >
                        <CheckCircle className="w-4 h-4 text-white" />
                      </motion.div>
                    )}

                    {status === 'current' && (
                      <motion.div
                        className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <Clock className="w-3 h-3 text-white" />
                      </motion.div>
                    )}

                    {/* Glow effect for current stage */}
                    {status === 'current' && (
                      <motion.div
                        className={`absolute inset-0 rounded-2xl ${stage.bgColor} opacity-30`}
                        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                    )}
                  </motion.div>

                  {/* Stage Info */}
                  <div className="text-center space-y-1">
                    <h4 className={`font-bold text-sm ${
                      status === 'completed' ? 'text-green-700' :
                      status === 'current' ? stage.textColor :
                      'text-gray-500'
                    }`}>
                      {stage.shortName}
                    </h4>
                    <p className="text-xs text-gray-600 leading-tight max-w-20">
                      {stage.description}
                    </p>
                    
                    {/* Timestamp */}
                    {latestEvent && (
                      <motion.div
                        className="text-xs text-gray-500 font-medium"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 + index * 0.1 }}
                      >
                        {formatDate(latestEvent.createdAt)}
                      </motion.div>
                    )}

                    {/* Status badge */}
                    <motion.div
                      className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                        status === 'completed' ? 'bg-green-100 text-green-700' :
                        status === 'current' ? `${stage.lightBg} ${stage.textColor}` :
                        'bg-gray-100 text-gray-500'
                      }`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.8 + index * 0.1, duration: 0.3 }}
                    >
                      {status === 'completed' && <CheckCircle className="w-3 h-3" />}
                      {status === 'current' && <Clock className="w-3 h-3" />}
                      {status === 'pending' && <AlertCircle className="w-3 h-3" />}
                      <span>
                        {status === 'completed' ? 'Done' :
                         status === 'current' ? 'Active' :
                         'Pending'}
                      </span>
                    </motion.div>
                  </div>

                  {/* Connection line */}
                  {index < workflowStages.length - 1 && (
                    <div className="absolute top-8 left-full w-full h-0.5 bg-gray-300 -z-10">
                      <motion.div
                        className={`h-full ${
                          index < currentStageIndex ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: index < currentStageIndex ? '100%' : '0%' }}
                        transition={{ delay: 1 + index * 0.2, duration: 0.5 }}
                      />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Timeline Events Summary */}
      {timeline.length > 0 && (
        <motion.div
          className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl p-6 border-2 border-blue-200 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span>Recent Activity</span>
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {timeline.slice(0, 3).map((event, index) => (
              <motion.div
                key={event.id}
                className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1, duration: 0.3 }}
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                    <p className="text-xs text-gray-600 mt-1">{event.userName}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(event.createdAt)}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default HorizontalTimelineComponent;
