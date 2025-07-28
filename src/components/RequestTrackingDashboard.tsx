import React from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  Target,
  Zap,
  BarChart3,
  Timer,
  ArrowRight
} from 'lucide-react';
import { WithdrawalRequest } from '../types/withdrawalTypes';

interface RequestTrackingDashboardProps {
  request: WithdrawalRequest;
}

const RequestTrackingDashboard: React.FC<RequestTrackingDashboardProps> = ({ request }) => {
  // Define the 4-stage workflow
  const workflowStages = [
    {
      id: 'initial_review',
      name: 'Initial Review',
      description: 'Document verification and basic validation',
      icon: Clock,
      color: 'blue',
      estimatedDays: 1
    },
    {
      id: 'technical_review',
      name: 'Technical Review',
      description: 'Detailed technical assessment and approval',
      icon: Target,
      color: 'purple',
      estimatedDays: 3
    },
    {
      id: 'core_banking',
      name: 'Core Banking',
      description: 'Financial processing and disbursement preparation',
      icon: BarChart3,
      color: 'orange',
      estimatedDays: 2
    },
    {
      id: 'disbursed',
      name: 'Disbursed',
      description: 'Funds successfully transferred to beneficiary',
      icon: CheckCircle,
      color: 'green',
      estimatedDays: 0
    }
  ];

  // Get current stage index
  const currentStageIndex = workflowStages.findIndex(stage => stage.id === request.currentStage);
  const isCompleted = request.currentStage === 'disbursed';

  // Calculate progress percentage
  const progressPercentage = isCompleted ? 100 : ((currentStageIndex + 1) / workflowStages.length) * 100;

  // Calculate estimated completion
  const remainingDays = workflowStages
    .slice(currentStageIndex + 1)
    .reduce((total, stage) => total + stage.estimatedDays, 0);

  // Calculate if overdue
  const createdDate = new Date(request.createdAt);
  const currentDate = new Date();
  const daysSinceCreated = Math.floor((currentDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  const totalEstimatedDays = workflowStages.reduce((total, stage) => total + stage.estimatedDays, 0);
  const isOverdue = daysSinceCreated > totalEstimatedDays && !isCompleted;

  const getStageStatus = (stageIndex: number) => {
    if (stageIndex < currentStageIndex) return 'completed';
    if (stageIndex === currentStageIndex) return 'current';
    return 'pending';
  };

  const getStageColor = (stage: any, status: string) => {
    if (status === 'completed') return 'bg-green-500 text-white border-green-500';
    if (status === 'current') {
      switch (stage.color) {
        case 'blue': return 'bg-blue-500 text-white border-blue-500';
        case 'purple': return 'bg-purple-500 text-white border-purple-500';
        case 'orange': return 'bg-orange-500 text-white border-orange-500';
        case 'green': return 'bg-green-500 text-white border-green-500';
        default: return 'bg-gray-500 text-white border-gray-500';
      }
    }
    return 'bg-gray-100 text-gray-500 border-gray-300';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-green-500/5 rounded-2xl"></div>

        <div className="flex items-center space-x-4 relative z-10">
          <motion.div
            className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 text-white shadow-lg"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ duration: 0.2 }}
          >
            <TrendingUp className="w-6 h-6" />
          </motion.div>
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
              Request Tracking
            </h3>
            <p className="text-sm text-gray-600 font-medium">Monitor progress through the 4-stage workflow</p>
          </div>
        </div>

        <motion.div
          className="text-right relative z-10"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <div className="relative">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent">
              {Math.round(progressPercentage)}%
            </div>
            <div className="text-sm text-gray-500 font-medium">Complete</div>
            {/* Animated background circle */}
            <motion.div
              className="absolute -inset-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Progress Bar */}
      <motion.div
        className="relative"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <div className="relative h-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full overflow-hidden shadow-inner">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

          {/* Main progress bar */}
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 via-indigo-600 to-green-500 rounded-full relative overflow-hidden"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ delay: 0.5, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Animated shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            />

            {/* Pulsing glow effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-blue-400/50 via-purple-400/50 to-green-400/50 rounded-full blur-sm"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>

          {/* Progress markers */}
          {[25, 50, 75].map((marker, index) => (
            <motion.div
              key={marker}
              className="absolute top-0 bottom-0 w-0.5 bg-white/40"
              style={{ left: `${marker}%` }}
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ delay: 0.8 + index * 0.1, duration: 0.3 }}
            />
          ))}
        </div>

        {/* Progress percentage indicator */}
        <motion.div
          className="absolute -top-8 bg-white px-3 py-1 rounded-lg shadow-lg border border-gray-200"
          style={{ left: `${Math.max(10, Math.min(90, progressPercentage))}%` }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.3 }}
        >
          <div className="text-xs font-bold text-gray-700">{Math.round(progressPercentage)}%</div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-white"></div>
        </motion.div>
      </motion.div>

      {/* Workflow Stages */}
      <div className="space-y-4">
        {workflowStages.map((stage, index) => {
          const status = getStageStatus(index);
          const IconComponent = stage.icon;
          
          return (
            <motion.div
              key={stage.id}
              className={`relative flex items-center space-x-4 p-6 rounded-3xl border-2 transition-all duration-500 overflow-hidden ${
                status === 'completed'
                  ? 'bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 border-green-300 shadow-lg' :
                status === 'current'
                  ? 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-blue-300 shadow-xl' :
                'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300'
              }`}
              initial={{ opacity: 0, x: -30, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ scale: 1.03, y: -4, rotateY: 2 }}
            >
              {/* Background decoration */}
              {status === 'current' && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-indigo-500/5 rounded-3xl"></div>
              )}

              {/* Stage Icon */}
              <motion.div
                className={`relative flex items-center justify-center w-16 h-16 rounded-2xl border-3 shadow-lg ${getStageColor(stage, status)}`}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.2 }}
              >
                <IconComponent className="w-8 h-8" />

                {/* Icon glow effect for current stage */}
                {status === 'current' && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/20 to-purple-400/20"
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}

                {/* Completion checkmark overlay */}
                {status === 'completed' && (
                  <motion.div
                    className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.3, type: "spring" }}
                  >
                    <CheckCircle className="w-4 h-4 text-white" />
                  </motion.div>
                )}
              </motion.div>

              {/* Stage Content */}
              <div className="flex-1 relative z-10">
                <div className="flex items-center space-x-3 mb-2">
                  <h4 className="text-lg font-bold text-gray-900">{stage.name}</h4>

                  {status === 'current' && (
                    <motion.div
                      className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <motion.div
                        className="w-2 h-2 bg-blue-500 rounded-full"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                      <span>In Progress</span>
                    </motion.div>
                  )}

                  {status === 'completed' && (
                    <motion.div
                      className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3, duration: 0.3 }}
                    >
                      <CheckCircle className="w-3 h-3" />
                      <span>Completed</span>
                    </motion.div>
                  )}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{stage.description}</p>
              </div>

              {/* Estimated Time */}
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {stage.estimatedDays > 0 ? `${stage.estimatedDays} day${stage.estimatedDays > 1 ? 's' : ''}` : 'Complete'}
                </div>
                <div className="text-xs text-gray-500">
                  {status === 'completed' ? 'Completed' :
                   status === 'current' ? 'In Progress' :
                   'Pending'}
                </div>
              </div>

              {/* Connection Line */}
              {index < workflowStages.length - 1 && (
                <div className="absolute left-6 top-16 w-0.5 h-6 bg-gray-300"></div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* SLA Tracking */}
      <motion.div
        className={`relative p-6 rounded-3xl border-2 overflow-hidden ${
          isOverdue
            ? 'bg-gradient-to-br from-red-50 via-rose-50 to-red-100 border-red-300'
            : 'bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 border-green-300'
        }`}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ scale: 1.02, y: -2 }}
      >
        {/* Background pattern */}
        <div className={`absolute inset-0 ${
          isOverdue
            ? 'bg-gradient-to-r from-red-500/5 to-rose-500/5'
            : 'bg-gradient-to-r from-green-500/5 to-emerald-500/5'
        }`}></div>

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-4">
            <motion.div
              className={`p-3 rounded-2xl ${
                isOverdue
                  ? 'bg-gradient-to-br from-red-500 to-rose-600'
                  : 'bg-gradient-to-br from-green-500 to-emerald-600'
              } text-white shadow-lg`}
              whileHover={{ scale: 1.1, rotate: isOverdue ? -5 : 5 }}
              transition={{ duration: 0.2 }}
            >
              {isOverdue ? <AlertTriangle className="w-6 h-6" /> : <Timer className="w-6 h-6" />}

              {/* Pulsing effect for overdue */}
              {isOverdue && (
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-red-400/30"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </motion.div>

            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-1">SLA Status</h4>
              <p className={`text-sm font-medium ${
                isOverdue ? 'text-red-700' : 'text-green-700'
              }`}>
                {isOverdue
                  ? `⚠️ Overdue by ${daysSinceCreated - totalEstimatedDays} day(s)`
                  : isCompleted
                    ? '✅ Completed within SLA'
                    : `⏱️ ${remainingDays} day(s) remaining`
                }
              </p>
            </div>
          </div>

          <motion.div
            className="text-right"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.3 }}
          >
            <div className={`text-2xl font-bold ${
              isOverdue ? 'text-red-700' : 'text-green-700'
            }`}>
              {daysSinceCreated}
            </div>
            <div className="text-sm text-gray-600 font-medium">Days Active</div>

            {/* Progress ring indicator */}
            <motion.div
              className="mt-2 w-12 h-12 mx-auto relative"
              initial={{ rotate: -90 }}
              animate={{ rotate: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-gray-300"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <motion.path
                  className={isOverdue ? 'text-red-500' : 'text-green-500'}
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  initial={{ strokeDasharray: "0 100" }}
                  animate={{ strokeDasharray: `${Math.min(100, (daysSinceCreated / totalEstimatedDays) * 100)} 100` }}
                  transition={{ delay: 1.2, duration: 1, ease: "easeOut" }}
                />
              </svg>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        className="grid grid-cols-3 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.3 }}
      >
        {[
          {
            icon: Calendar,
            value: daysSinceCreated,
            label: 'Days Active',
            color: 'blue',
            gradient: 'from-blue-500 to-blue-600',
            bgGradient: 'from-blue-50 to-blue-100'
          },
          {
            icon: Zap,
            value: `${currentStageIndex + 1}/4`,
            label: 'Stages Complete',
            color: 'purple',
            gradient: 'from-purple-500 to-purple-600',
            bgGradient: 'from-purple-50 to-purple-100'
          },
          {
            icon: Target,
            value: remainingDays,
            label: 'Days Remaining',
            color: 'green',
            gradient: 'from-green-500 to-green-600',
            bgGradient: 'from-green-50 to-green-100'
          }
        ].map((stat, index) => {
          const IconComponent = stat.icon;

          return (
            <motion.div
              key={stat.label}
              className={`relative bg-gradient-to-br ${stat.bgGradient} p-6 rounded-2xl border-2 border-white shadow-lg text-center overflow-hidden`}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.8 + index * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ scale: 1.05, y: -5, rotateY: 5 }}
            >
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>

              {/* Icon */}
              <motion.div
                className={`w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-br ${stat.gradient} text-white flex items-center justify-center shadow-lg`}
                whileHover={{ scale: 1.1, rotate: 10 }}
                transition={{ duration: 0.2 }}
              >
                <IconComponent className="w-6 h-6" />
              </motion.div>

              {/* Value */}
              <motion.div
                className="text-2xl font-bold text-gray-900 mb-1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1 + index * 0.1, duration: 0.3, type: "spring" }}
              >
                {stat.value}
              </motion.div>

              {/* Label */}
              <div className="text-sm font-medium text-gray-600">{stat.label}</div>

              {/* Animated progress indicator */}
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-white/30 to-white/60"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1.2 + index * 0.1, duration: 0.5 }}
              />
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default RequestTrackingDashboard;
