import React, { useState } from 'react';
import { MessageCircle, Send, User } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Badge from './ui/Badge';
import { CommentType } from '../data/enums';
import { formatTimeAgo, formatUserRole } from '../utils/workflowFormatters';
import { formatDateTime } from '../utils/formatters';

const CommentsSection = ({ 
  comments = [], 
  onAddComment, 
  currentUser 
}) => {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onAddComment(newComment.trim(), CommentType.GENERAL);
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCommentTypeClass = (type) => {
    switch (type) {
      case CommentType.DECISION:
        return 'commentitemdecision';
      case CommentType.GENERAL:
        return 'commentitemgeneral';
      case CommentType.SYSTEM:
        return 'bg-gray-100 border-l-4 border-gray-400';
      default:
        return 'commentitemgeneral';
    }
  };

  const getCommentTypeBadge = (type) => {
    switch (type) {
      case CommentType.DECISION:
        return { variant: 'warning', label: 'Decision' };
      case CommentType.GENERAL:
        return { variant: 'medium', label: 'Comment' };
      case CommentType.SYSTEM:
        return { variant: 'default', label: 'System' };
      default:
        return { variant: 'default', label: 'Comment' };
    }
  };

  return (
    <Card className="p-6">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center">
        <MessageCircle className="w-5 h-5 mr-2 text-blue-500" />
        Comments
        {comments.length > 0 && (
          <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            {comments.length}
          </span>
        )}
      </h3>
      
      {/* Add new comment */}
      <div className="mb-6 p-4 bg-gray-50 rounded-xl">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white flex-shrink-0">
            <span className="text-sm font-medium">
              {currentUser?.name?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment to this request..."
                className="min-h-[80px] resize-none"
                multiline
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    handleSubmitComment();
                  }
                }}
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">
                Ctrl+Enter to submit
              </span>
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
                size="sm"
                variant="primary"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Posting...' : 'Add Comment'}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments list */}
      {comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p>No comments yet</p>
          <p className="text-sm">Be the first to add a comment to this request.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => {
            const typeBadge = getCommentTypeBadge(comment.type);
            
            return (
              <div 
                key={comment.id} 
                className={`p-4 rounded-xl ${getCommentTypeClass(comment.type)}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white flex-shrink-0">
                      <span className="text-sm font-medium">
                        {comment.userName?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          {comment.userName}
                        </span>
                        <Badge variant="default" className="text-xs">
                          {formatUserRole(comment.userRole)}
                        </Badge>
                        <Badge variant={typeBadge.variant} className="text-xs">
                          {typeBadge.label}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                        <span>{formatTimeAgo(comment.timestamp)}</span>
                        <span>•</span>
                        <span>{formatDateTime(comment.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="ml-11">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {comment.comment}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default CommentsSection;