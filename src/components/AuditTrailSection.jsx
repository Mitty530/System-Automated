import React from 'react';
import { Clock, User, FileText } from 'lucide-react';
import Card from './ui/Card';
import Badge from './ui/Badge';
import { formatTimeAgo, formatUserRole } from '../utils/workflowFormatters';
import { formatDateTime } from '../utils/formatters';

const AuditTrailSection = ({ auditEntries = [], isLoading = false }) => {
  const getActionIcon = (action) => {
    if (action.toLowerCase().includes('created')) return <FileText className="w-4 h-4" />;
    if (action.toLowerCase().includes('approved')) return <div className="w-4 h-4 rounded-full bg-green-500"></div>;
    if (action.toLowerCase().includes('rejected')) return <div className="w-4 h-4 rounded-full bg-red-500"></div>;
    if (action.toLowerCase().includes('sent')) return <div className="w-4 h-4 rounded-full bg-blue-500"></div>;
    if (action.toLowerCase().includes('returned')) return <div className="w-4 h-4 rounded-full bg-orange-500"></div>;
    return <Clock className="w-4 h-4" />;
  };

  const getActionBadgeVariant = (action) => {
    if (action.toLowerCase().includes('approved')) return 'success';
    if (action.toLowerCase().includes('rejected')) return 'urgent';
    if (action.toLowerCase().includes('sent')) return 'medium';
    if (action.toLowerCase().includes('returned')) return 'warning';
    return 'default';
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
            const action = entry.decision_type || entry.action || 'Unknown Action';
            const timestamp = entry.created_at || entry.timestamp;
            const userName = entry.user_profiles?.full_name || entry.userName || 'Unknown User';
            const userRole = entry.user_profiles?.role || entry.userRole || 'User';
            const comment = entry.comment || entry.details || '';
            const fromStage = entry.from_stage;
            const toStage = entry.to_stage;

            // Create a more descriptive action text for decisions
            let displayAction = action;
            if (entry.decision_type) {
              displayAction = `${action.charAt(0).toUpperCase() + action.slice(1)}`;
              if (fromStage && toStage && fromStage !== toStage) {
                displayAction += ` (${fromStage.replace('_', ' ')} → ${toStage.replace('_', ' ')})`;
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
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white flex-shrink-0">
                    {getActionIcon(displayAction)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant={getActionBadgeVariant(displayAction)}>
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

                    <div className="flex items-center space-x-2 mb-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{userName}</span>
                      <Badge variant="default" className="text-xs">
                        {formatUserRole(userRole)}
                      </Badge>
                    </div>

                    {comment && (
                      <div className="bg-gray-50 rounded-lg p-3 mt-2">
                        <p className="text-sm text-gray-700">{comment}</p>
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