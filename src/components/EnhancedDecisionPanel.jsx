import React, { useState, useEffect } from 'react';
import { CheckCircle, Edit3, Save, X, AlertCircle, ThumbsUp, ThumbsDown, Upload, FileText } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import FormField from './ui/FormField';
import { DecisionType, UserRole, WorkflowStage } from '../data/enums';
import { formatDecisionType } from '../utils/workflowFormatters';
import { getAllowedActionsForStage } from '../utils/rolePermissions';
import { ALL_COUNTRIES, CURRENCY_OPTIONS } from '../data/formConstants';
import { supabase } from '../lib/supabase';
import { logUserAction } from '../services/auditService';
import { uploadFile, saveFileMetadata } from '../utils/fileUpload';

const EnhancedDecisionPanel = ({ 
  request, 
  currentUser, 
  onDecision,
  onRequestUpdate
}) => {
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [comment, setComment] = useState('');
  const [isModifyMode, setIsModifyMode] = useState(false);
  const [modifiedFields, setModifiedFields] = useState({});
  const [originalData, setOriginalData] = useState({});
  const [editableData, setEditableData] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileUploadError, setFileUploadError] = useState('');

  // Initialize editable data when request changes
  useEffect(() => {
    if (request) {
      const initialData = {
        project_number: request.project_number || request.projectNumber || '',
        ref_number: request.ref_number || request.refNumber || '',
        beneficiary_name: request.beneficiary_name || request.beneficiaryName || '',
        amount: request.amount || '',
        currency: request.currency || 'USD',
        country: request.country || '',
        project_details: request.project_details || request.projectDetails || '',
        reference_documentation: request.reference_documentation || request.referenceDocumentation || ''
      };
      setOriginalData(initialData);
      setEditableData(initialData);
      setModifiedFields({});
    }
  }, [request]);

  const getDecisionIcon = (decision) => {
    const icons = {
      [DecisionType.APPROVE]: <ThumbsUp className="w-5 h-5" />,
      [DecisionType.REJECT]: <ThumbsDown className="w-5 h-5" />,
      'modify_approve': <Edit3 className="w-5 h-5" />
    };
    return icons[decision] || <CheckCircle className="w-5 h-5" />;
  };

  const getDecisionButtonClass = (decision) => {
    const classes = {
      [DecisionType.APPROVE]: 'decisionbtnapprove',
      [DecisionType.REJECT]: 'decisionbtnreject',
      'modify_approve': 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white'
    };
    return classes[decision] || '';
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setFileUploadError('File size must be less than 10MB');
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];

    if (!allowedTypes.includes(file.type)) {
      setFileUploadError('Please select a PDF, DOC, DOCX, JPG, or PNG file');
      return;
    }

    setSelectedFile(file);
    setFileUploadError('');
  };

  const handleFieldChange = async (fieldName, value) => {
    const newEditableData = { ...editableData, [fieldName]: value };
    setEditableData(newEditableData);

    // Track modified fields
    const isModified = value !== originalData[fieldName];
    setModifiedFields(prev => ({
      ...prev,
      [fieldName]: isModified
    }));

    // Validate field
    validateField(fieldName, value);

    // Auto-save to database
    if (isModified && value.trim() !== '') {
      await autoSaveField(fieldName, value);
    }
  };

  const validateField = (fieldName, value) => {
    const errors = { ...validationErrors };

    switch (fieldName) {
      case 'amount':
        if (!value || isNaN(value) || parseFloat(value) <= 0) {
          errors[fieldName] = 'Amount must be a positive number';
        } else {
          delete errors[fieldName];
        }
        break;
      case 'project_number':
      case 'ref_number':
      case 'beneficiary_name':
        if (!value || value.trim().length === 0) {
          errors[fieldName] = 'This field is required';
        } else {
          delete errors[fieldName];
        }
        break;
      default:
        delete errors[fieldName];
    }

    setValidationErrors(errors);
  };

  const autoSaveField = async (fieldName, value) => {
    if (!request?.id) return;

    setIsSaving(true);
    try {
      // Update in database using secure function
      const updateData = { [fieldName]: value };
      const { error } = await supabase
        .rpc('update_withdrawal_request_secure', {
          request_id: request.id,
          user_id: currentUser.id,
          update_data: updateData
        });

      if (error) throw error;

      // Log the modification
      await logUserAction({
        actionType: 'modify',
        description: `Modified ${fieldName} in request ${request.ref_number || request.refNumber}`,
        resourceType: 'withdrawal_request',
        resourceId: request.id.toString(),
        oldValues: { [fieldName]: originalData[fieldName] },
        newValues: { [fieldName]: value }
      });

      // Notify parent component of update
      if (onRequestUpdate) {
        onRequestUpdate({ ...request, [fieldName]: value });
      }

    } catch (error) {
      console.error('Error auto-saving field:', error);
      // Revert the change on error
      setEditableData(prev => ({ ...prev, [fieldName]: originalData[fieldName] }));
      setModifiedFields(prev => ({ ...prev, [fieldName]: false }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDecisionClick = (decision) => {
    if (decision === 'modify_approve') {
      setIsModifyMode(true);
      return;
    }
    
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

  const handleModifyAndApprove = async () => {
    // Check if there are validation errors
    if (Object.keys(validationErrors).length > 0) {
      alert('Please fix all validation errors before approving');
      return;
    }

    setIsSaving(true);

    try {
      // Handle file upload if a new file is selected
      let fileUploadNote = '';
      if (selectedFile) {
        try {
          const uploadResult = await uploadFile(selectedFile, request.id);
          if (uploadResult.success) {
            await saveFileMetadata(request.id, uploadResult, currentUser.id);
            fileUploadNote = ` New document uploaded: ${selectedFile.name}.`;
          }
        } catch (fileError) {
          console.error('File upload error:', fileError);
          setFileUploadError(`Failed to upload file: ${fileError.message}`);
          setIsSaving(false);
          return;
        }
      }

      // Proceed with approval
      const modificationSummary = Object.keys(modifiedFields)
        .filter(field => modifiedFields[field])
        .map(field => `${field}: "${originalData[field]}" → "${editableData[field]}"`)
        .join(', ');

      const approvalComment = modificationSummary
        ? `Request modified and approved. Changes: ${modificationSummary}${fileUploadNote}`
        : `Request approved without modifications${fileUploadNote}`;

      onDecision(DecisionType.APPROVE, approvalComment);
      setIsModifyMode(false);
      setSelectedFile(null);
      setFileUploadError('');
    } catch (error) {
      console.error('Error in modify and approve:', error);
      alert(`Failed to process request: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelModify = () => {
    // Revert all changes
    setEditableData(originalData);
    setModifiedFields({});
    setValidationErrors({});
    setIsModifyMode(false);
  };

  const handleCancel = () => {
    setShowCommentInput(false);
    setSelectedDecision(null);
    setComment('');
  };

  // Check if user is Loan Administrator (or Admin with loan admin capabilities) and request is in Technical Review stage
  const isLoanAdminInTechnicalReview =
    (currentUser?.role === UserRole.LOAN_ADMINISTRATOR || currentUser?.role === UserRole.ADMIN) &&
    (request?.current_stage === WorkflowStage.UNDER_LOAN_REVIEW ||
     request?.currentStage === WorkflowStage.UNDER_LOAN_REVIEW);



  // Get available actions
  const getAvailableActionsForUser = () => {
    const userRole = currentUser?.role;
    const currentStage = request?.current_stage || request?.currentStage;

    if (!userRole || !currentStage) return [];

    const allowedActions = getAllowedActionsForStage(userRole, currentStage);
    const decisionActions = [];

    // Special handling for Loan Administrators in Technical Review
    if (isLoanAdminInTechnicalReview) {
      // For Loan Administrators, show only Approve and Modify & Approve (Edit)
      decisionActions.push(DecisionType.APPROVE);
      decisionActions.push('modify_approve');
      return decisionActions;
    }

    // For other users/stages, use standard permissions
    if (allowedActions.includes('approve')) {
      decisionActions.push(DecisionType.APPROVE);
    }

    if (allowedActions.includes('reject')) {
      decisionActions.push(DecisionType.REJECT);
    }

    return decisionActions;
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
        {isSaving && (
          <div className="ml-auto flex items-center text-sm text-blue-600">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
            Auto-saving...
          </div>
        )}
      </h3>
      
      {isModifyMode ? (
        <div className="space-y-6">
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <h4 className="font-semibold text-orange-900 mb-2 flex items-center">
              <Edit3 className="w-5 h-5 mr-2" />
              Modify Request Details
            </h4>
            <p className="text-sm text-orange-700">
              Edit the request details below. Changes are automatically saved. Modified fields are highlighted.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Project Number"
              value={editableData.project_number}
              onChange={(value) => handleFieldChange('project_number', value)}
              required
              error={validationErrors.project_number}
              className={`${modifiedFields.project_number ? 'ring-2 ring-orange-300 bg-orange-50' : ''}`}
            />

            <FormField
              label="Reference Number"
              value={editableData.ref_number}
              onChange={(value) => handleFieldChange('ref_number', value)}
              required
              error={validationErrors.ref_number}
              className={`${modifiedFields.ref_number ? 'ring-2 ring-orange-300 bg-orange-50' : ''}`}
            />

            <FormField
              label="Beneficiary Name"
              value={editableData.beneficiary_name}
              onChange={(value) => handleFieldChange('beneficiary_name', value)}
              required
              error={validationErrors.beneficiary_name}
              className={`${modifiedFields.beneficiary_name ? 'ring-2 ring-orange-300 bg-orange-50' : ''}`}
            />

            <FormField
              label="Country"
              type="select"
              value={editableData.country}
              onChange={(value) => handleFieldChange('country', value)}
              options={ALL_COUNTRIES}
              required
              className={`${modifiedFields.country ? 'ring-2 ring-orange-300 bg-orange-50' : ''}`}
            />

            <FormField
              label="Amount"
              value={editableData.amount}
              onChange={(value) => handleFieldChange('amount', value)}
              required
              error={validationErrors.amount}
              className={`${modifiedFields.amount ? 'ring-2 ring-orange-300 bg-orange-50' : ''}`}
            />

            <FormField
              label="Currency"
              type="select"
              value={editableData.currency}
              onChange={(value) => handleFieldChange('currency', value)}
              options={CURRENCY_OPTIONS}
              required
              className={`${modifiedFields.currency ? 'ring-2 ring-orange-300 bg-orange-50' : ''}`}
            />
          </div>

          <FormField
            label="Project Details"
            type="textarea"
            value={editableData.project_details}
            onChange={(value) => handleFieldChange('project_details', value)}
            rows={3}
            className={`${modifiedFields.project_details ? 'ring-2 ring-orange-300 bg-orange-50' : ''}`}
          />

          <FormField
            label="Reference Documentation"
            type="textarea"
            value={editableData.reference_documentation}
            onChange={(value) => handleFieldChange('reference_documentation', value)}
            rows={3}
            className={`${modifiedFields.reference_documentation ? 'ring-2 ring-orange-300 bg-orange-50' : ''}`}
          />

          {/* Optional File Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Update Supporting Document (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center justify-center space-y-2"
              >
                <Upload className="w-8 h-8 text-gray-400" />
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Click to upload a new document
                  </p>
                  <p className="text-xs text-gray-500">
                    PDF, DOC, DOCX, JPG, PNG (max 10MB)
                  </p>
                </div>
              </label>
            </div>

            {selectedFile && (
              <div className="flex items-center space-x-2 p-2 bg-blue-50 border border-blue-200 rounded">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-800">{selectedFile.name}</span>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="ml-auto text-blue-600 hover:text-blue-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {fileUploadError && (
              <p className="text-sm text-red-600">{fileUploadError}</p>
            )}

            <p className="text-xs text-gray-500">
              Note: If no new file is selected, the existing document will remain unchanged.
            </p>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={handleModifyAndApprove}
              variant="success"
              className="flex-1"
              disabled={Object.keys(validationErrors).length > 0}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve Request
            </Button>
            <Button
              onClick={handleCancelModify}
              variant="secondary"
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel Changes
            </Button>
          </div>
        </div>
      ) : !showCommentInput ? (
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
                <span>
                  {decision === 'modify_approve' ? 'Edit' : formatDecisionType(decision)}
                </span>
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
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirm Decision
            </Button>
            <Button
              onClick={handleCancel}
              variant="secondary"
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default EnhancedDecisionPanel;
