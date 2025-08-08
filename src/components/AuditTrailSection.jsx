import React from 'react';
import { Clock, User, FileText, ArrowRight, CheckCircle, XCircle, AlertCircle, Send } from 'lucide-react';
import Card from './ui/Card';
import Badge from './ui/Badge';
import { formatTimeAgo, formatUserRole, formatWorkflowStage } from '../utils/workflowFormatters';
import { formatDateTime } from '../utils/formatters';

const AuditTrailSection = ({ auditEntries = [], isLoading = false }) => {
  const getActionIcon = (action, decisionType) => {
    const actionLower = action.toLowerCase();

    if (actionLower.includes('created') || actionLower.includes('submitted')) {
      return <FileText className="w-4 h-4 text-white" />;
    }
    if (actionLower.includes('approved') || decisionType === 'approve') {
      return <CheckCircle className="w-4 h-4 text-white" />;
    }
    if (actionLower.includes('rejected') || decisionType === 'reject') {
      return <XCircle className="w-4 h-4 text-white" />;
    }
    if (actionLower.includes('sent') || actionLower.includes('forwarded')) {
      return <Send className="w-4 h-4 text-white" />;
    }
    if (actionLower.includes('returned') || actionLower.includes('modification')) {
      return <AlertCircle className="w-4 h-4 text-white" />;
    }
    if (actionLower.includes('disbursed')) {
      return <CheckCircle className="w-4 h-4 text-white" />;
    }
    return <Clock className="w-4 h-4 text-white" />;
  };

  const getActionBadgeVariant = (action, decisionType) => {
    const actionLower = action.toLowerCase();

    if (actionLower.includes('approved') || decisionType === 'approve') return 'success';
    if (actionLower.includes('rejected') || decisionType === 'reject') return 'urgent';
    if (actionLower.includes('sent') || actionLower.includes('forwarded')) return 'medium';
    if (actionLower.includes('returned') || actionLower.includes('modification')) return 'warning';
    if (actionLower.includes('disbursed')) return 'success';
    if (actionLower.includes('created') || actionLower.includes('submitted')) return 'default';
    return 'default';
  };

  const getTimelineDotColor = (action, decisionType) => {
    const actionLower = action.toLowerCase();

    if (actionLower.includes('approved') || decisionType === 'approve') {
      return 'from-green-500 to-emerald-600';
    }
    if (actionLower.includes('rejected') || decisionType === 'reject') {
      return 'from-red-500 to-red-600';
    }
    if (actionLower.includes('returned') || actionLower.includes('modification')) {
      return 'from-orange-500 to-orange-600';
    }
    if (actionLower.includes('disbursed')) {
      return 'from-emerald-500 to-green-600';
    }
    if (actionLower.includes('created') || actionLower.includes('submitted')) {
      return 'from-blue-500 to-blue-600';
    }
    return 'from-gray-500 to-gray-600';
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-blue-500" />
          Audit Trail
        </h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="audit-timeline-item animate-pulse">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center">
        <Clock className="w-5 h-5 mr-2 text-blue-500" />
        Audit Trail
        {auditEntries.length > 0 && (
          <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            {auditEntries.length}
          </span>
        )}
      </h3>
      
      {auditEntries.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p>No audit entries available</p>
        </div>
      ) : (
        <div className="space-y-4">
          {auditEntries.map((entry, index) => {
            // Handle both old format and new database format
            const decisionType = entry.decision_type;
            const action = entry.decision_type || entry.action || 'Unknown Action';
            const timestamp = entry.created_at || entry.timestamp;
            const userName = entry.user_profiles?.full_name || entry.userName || 'Unknown User';
            const userRole = entry.user_profiles?.role || entry.userRole || 'User';
            const comment = entry.comment || entry.details || '';
            const fromStage = entry.from_stage;
            const toStage = entry.to_stage;

            // Create a more descriptive action text for decisions
            let displayAction = action;
            let stageTransition = null;

            if (entry.decision_type) {
              displayAction = `${action.charAt(0).toUpperCase() + action.slice(1)}`;
              if (fromStage && toStage && fromStage !== toStage) {
                stageTransition = {
                  from: formatWorkflowStage(fromStage),
                  to: formatWorkflowStage(toStage)
                };
              }
            }

            return (
              <div key={entry.id || index} className="audittimelineitem relative">
                {/* Timeline connector */}
                {index < auditEntries.length - 1 && (
                  <div className="absolute left-4 top-12 w-0.5 h-8 bg-gray-200"></div>
                )}

                <div className="flex items-start space-x-4">
                  {/* Timeline dot */}
                  <div className={`w-8 h-8 bg-gradient-to-r ${getTimelineDotColor(displayAction, decisionType)} rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-lg`}>
                    {getActionIcon(displayAction, decisionType)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant={getActionBadgeVariant(displayAction, decisionType)}>
                          {displayAction}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {formatTimeAgo(timestamp)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatDateTime(timestamp)}
                      </div>
                    </div>

                    {/* Stage transition display */}
                    {stageTransition && (
                      <div className="flex items-center space-x-2 mb-2 text-sm">
                        <span className="px-2 py-1 bg-gray-100 rounded text-gray-700">
                          {stageTransition.from}
                        </span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          {stageTransition.to}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center space-x-2 mb-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{userName}</span>
                      <Badge variant="default" className="text-xs">
                        {formatUserRole(userRole)}
                      </Badge>
                    </div>

                    {comment && (
                      <div className="bg-gray-50 rounded-lg p-3 mt-2 border-l-4 border-blue-200">
                        <p className="text-sm text-gray-700 italic">"{comment}"</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default AuditTrailSection;