import React from 'react';
import { Calendar, Clock, Eye, Users } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';
import StatusIcon from './StatusIcon';
import { formatCurrency, formatDate, formatProcessingDays } from '../utils/formatters';

const RequestRow = ({ request, onViewDetails }) => {
  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'urgent',
      high: 'high',
      medium: 'medium',
      low: 'low'
    };
    return colors[priority] || 'default';
  };

  const canViewDetails = true; // Everyone can view details for testing

  return (
    <tr className="hover:bg-white/60 transition-all duration-200 group">
      <td className="px-6 py-6 whitespace-nowrap">
        <div className="flex items-center">
          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
          <span className="text-sm font-medium text-gray-900">
            {formatDate(request.valueDate)}
          </span>
        </div>
      </td>
      <td className="px-6 py-6">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold text-gray-900">#{request.projectNumber}</span>
            <Badge variant={getPriorityColor(request.priority)}>
              {request.priority}
            </Badge>
          </div>
          <div className="text-sm text-gray-600">{request.country}</div>
          <div className="text-sm font-medium text-blue-600">{request.refNumber}</div>
          <div className="text-sm text-gray-500">{request.beneficiaryName}</div>
        </div>
      </td>
      <td className="px-6 py-6 whitespace-nowrap">
        <div className="text-lg font-bold text-gray-900">
          {formatCurrency(request.amount, request.currency)}
        </div>
      </td>
      <td className="px-6 py-6">
        <div className="flex items-center space-x-3 mb-2">
          <StatusIcon stage={request.currentStage} />
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
          <span className="text-sm font-medium text-gray-900">{formatProcessingDays(request.processingDays)}</span>
        </div>
      </td>
      <td className="px-6 py-6 whitespace-nowrap">
        <div className="flex items-center space-x-2">
          {canViewDetails && (
            <Button
              onClick={() => onViewDetails(request)}
              variant="primary"
              size="sm"
              title="View Details & Actions"
              className="group-hover:shadow-xl flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>View Details</span>
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
};

const RequestsTable = ({ requests, onViewDetails, onAction, currentUser }) => {
  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-md px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900 flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-500" />
              All Withdrawal Requests - Full Access Mode
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              ✅ Full access mode: All actions available for testing • View details to perform operations
            </p>
          </div>
          <div className="text-sm text-gray-600 bg-green-100 px-3 py-1 rounded-lg">
            Full Access Mode
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-md">
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
            {requests.map((request) => (
              <RequestRow 
                key={request.id} 
                request={request}
                onViewDetails={onViewDetails}
                onAction={onAction}
                currentUser={currentUser}
              />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default RequestsTable;