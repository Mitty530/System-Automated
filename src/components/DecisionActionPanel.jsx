import React, { useState } from 'react';
import { CheckCircle, XCircle, Send, CreditCard, ThumbsUp, ThumbsDown } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import { DecisionType, UserRole, WorkflowStage } from '../data/enums';
import { formatDecisionType } from '../utils/workflowFormatters';

const DecisionActionPanel = ({ 
  request, 
  currentUser, 
  onDecision, 
  availableActions = [] 
}) => {
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [comment, setComment] = useState('');

  const getDecisionIcon = (decision) => {
    const icons = {
      [DecisionType.APPROVE]: <ThumbsUp className="w-5 h-5" />,
      [DecisionType.REJECT]: <ThumbsDown className="w-5 h-5" />,
      [DecisionType.DISBURSED]: <CreditCard className="w-5 h-5" />,
      [DecisionType.SEND_TO_OPERATIONS]: <Send className="w-5 h-5" />,
      [DecisionType.SEND_TO_LOAN_ADMIN]: <Send className="w-5 h-5" />
    };
    return icons[decision] || <CheckCircle className="w-5 h-5" />;
  };

  const getDecisionButtonClass = (decision) => {
    const classes = {
      [DecisionType.APPROVE]: 'decisionbtnapprove',
      [DecisionType.REJECT]: 'decisionbtnreject', 
      [DecisionType.DISBURSED]: 'decisionbtndisburse',
      [DecisionType.SEND_TO_OPERATIONS]: 'decisionbtnsend',
      [DecisionType.SEND_TO_LOAN_ADMIN]: 'decisionbtnsend'
    };
    return classes[decision] || '';
  };

  const handleDecisionClick = (decision) => {
    setSelectedDecision(decision);
    setShowCommentInput(true);
    setComment('');
  };

  const handleConfirmDecision = () => {
    if (!comment.trim()) {
      alert('Please add a comment for your decision');
      return;
    }
    
    onDecision(selectedDecision, comment);
    setShowCommentInput(false);
    setSelectedDecision(null);
    setComment('');
  };

  const handleCancel = () => {
    setShowCommentInput(false);
    setSelectedDecision(null);
    setComment('');
  };

  // Get available actions based on user role and current stage
  const getAvailableActionsForUser = () => {
    if (availableActions.length > 0) return availableActions;
    
    const { role } = currentUser;
    const { currentStage } = request;

    switch (role) {
      case UserRole.LOAN_ADMIN:
        if (currentStage === WorkflowStage.INITIAL_REVIEW) {
          return [DecisionType.APPROVE, DecisionType.REJECT, DecisionType.SEND_TO_OPERATIONS];
        }
        if (currentStage === WorkflowStage.TECHNICAL_REVIEW) {
          return [DecisionType.APPROVE, DecisionType.REJECT, DecisionType.SEND_TO_OPERATIONS];
        }
        break;
      
      case UserRole.OPERATIONS_TEAM:
        if (currentStage === WorkflowStage.TECHNICAL_REVIEW) {
          return [DecisionType.APPROVE, DecisionType.REJECT, DecisionType.SEND_TO_LOAN_ADMIN];
        }
        break;
      
      case UserRole.CORE_BANKING:
        if (currentStage === WorkflowStage.CORE_BANKING) {
          return [DecisionType.DISBURSED, DecisionType.REJECT, DecisionType.SEND_TO_LOAN_ADMIN];
        }
        break;
      
      default:
        return [];
    }
    
    return [];
  };

  const userAvailableActions = getAvailableActionsForUser();

  if (userAvailableActions.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <CheckCircle className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Actions Available</h3>
          <p className="text-gray-500">You don't have permission to take actions on this request at its current stage.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center">
        <CheckCircle className="w-5 h-5 mr-2 text-blue-500" />
        Decision Required
      </h3>
      
      {!showCommentInput ? (
        <div>
          <p className="text-sm text-gray-600 mb-4">
            Select an action to proceed with this withdrawal request:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {userAvailableActions.map((decision) => (
              <Button
                key={decision}
                onClick={() => handleDecisionClick(decision)}
                className={`${getDecisionButtonClass(decision)} flex items-center justify-center space-x-2`}
                size="md"
              >
                {getDecisionIcon(decision)}
                <span>{formatDecisionType(decision)}</span>
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
              {getDecisionIcon(selectedDecision)}
              <span className="ml-2">Confirm: {formatDecisionType(selectedDecision)}</span>
            </h4>
            <p className="text-sm text-blue-700">
              Please provide a comment explaining your decision. This will be recorded in the audit trail.
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Decision Comment *
            </label>
            <Input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Enter your comment for this decision..."
              className="min-h-[100px] resize-none"
              multiline
            />
          </div>
          
          <div className="flex space-x-3">
            <Button
              onClick={handleConfirmDecision}
              variant="success"
              className="flex-1"
              disabled={!comment.trim()}
            >
              <CheckCircle className="w-4 h-4" />
              <span>Confirm Decision</span>
            </Button>
            <Button
              onClick={handleCancel}
              variant="secondary"
              className="flex-1"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancel</span>
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default DecisionActionPanel;