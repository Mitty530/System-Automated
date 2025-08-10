import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Globe,
  FileText,
  DollarSign,
  Building,
  Upload,
  Save,
  Loader
} from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import FormField from './ui/FormField';
import FormSection from './ui/FormSection';
import DocumentUpload from './ui/DocumentUpload';
import {
  ALL_COUNTRIES,
  CURRENCY_OPTIONS,
  DEFAULT_FORM_DATA
} from '../data/formConstants';
import {
  validateField
} from '../utils/formValidation';
import { createRequestWithWorkflow } from '../utils/workflowManager';
import { uploadMultipleFiles, saveFileMetadata } from '../utils/fileUpload';
import { getRegionForCountry, getRegionalTeamForCountry } from '../utils/regionalMapping';
import { supabase } from '../lib/supabase';
import { logRequestCreation, logFileUpload, logPageView } from '../services/auditService';

const CreateRequestModal = ({ isOpen, onClose, onCreateRequest }) => {
  const [formData, setFormData] = useState({
    // Core Required Fields
    date: new Date().toISOString().split('T')[0],
    projectNumber: '',
    country: '',
    referenceNumber: '',
    beneficiaryName: '',
    amount: '',
    currency: 'USD',
    
    // Additional Sections
    projectDetails: '',
    referenceDocumentation: '',
    documents: []
  });
  
  const [validation, setValidation] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState([]);

  // Initialize form with current date when modal opens and log page view
  useEffect(() => {
    if (isOpen) {
      if (!formData.date) {
        setFormData(prev => ({
          ...prev,
          date: new Date().toISOString().split('T')[0]
        }));
      }
      // Log modal opening
      logPageView('Create Request Modal', { action: 'opened' });
    }
  }, [isOpen, formData.date]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        projectNumber: '',
        country: '',
        referenceNumber: '',
        beneficiaryName: '',
        amount: '',
        currency: 'USD',
        projectDetails: '',
        referenceDocumentation: '',
        documents: []
      });
      setValidation({});
      setIsSubmitting(false);
      setErrors([]);
    }
  }, [isOpen]);

  // Format number with commas for display
  const formatAmountDisplay = (value) => {
    if (!value) return '';
    // Remove any non-digit characters except decimal point
    const numericValue = value.toString().replace(/[^\d.]/g, '');

    // Handle multiple decimal points - keep only the first one
    const decimalIndex = numericValue.indexOf('.');
    const cleanValue = decimalIndex >= 0
      ? numericValue.substring(0, decimalIndex + 1) + numericValue.substring(decimalIndex + 1).replace(/\./g, '')
      : numericValue;

    // Split by decimal point
    const parts = cleanValue.split('.');
    // Add commas to the integer part
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    // Return formatted value (limit to 2 decimal places)
    return parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 2)}` : parts[0];
  };

  // Get numeric value without commas for storage
  const getNumericAmount = (value) => {
    if (!value) return '';
    return value.toString().replace(/[^\d.]/g, '');
  };

  // Format amount with currency for display
  const formatAmountWithCurrency = (amount, currency) => {
    if (!amount || !currency) return '';
    const numericAmount = getNumericAmount(amount);
    if (!numericAmount) return '';

    const formattedAmount = formatAmountDisplay(numericAmount);
    return `${currency} ${formattedAmount}`;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      let processedValue = value;

      // Special handling for amount field
      if (field === 'amount') {
        // Store the numeric value (without commas)
        processedValue = getNumericAmount(value);
      }

      const newFormData = { ...prev, [field]: processedValue };

      // Validate the field using the numeric value
      const fieldValidation = validateField(field, processedValue, newFormData);
      setValidation(prevValidation => ({
        ...prevValidation,
        [field]: fieldValidation
      }));

      return newFormData;
    });
  };

  const validateForm = () => {
    const requiredFields = [
      'projectNumber', 'country', 'referenceNumber', 
      'beneficiaryName', 'amount'
    ];
    
    const missingFields = requiredFields.filter(field => {
      const value = formData[field];
      return !value || value.trim().length === 0;
    });

    if (missingFields.length > 0) {
      setErrors([`Missing required fields: ${missingFields.join(', ')}`]);
      return false;
    }

    // Check for validation errors
    const hasValidationErrors = Object.values(validation).some(
      v => v && v.isValid === false
    );

    if (hasValidationErrors) {
      setErrors(['Please fix validation errors before submitting']);
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setErrors([]);

      if (!validateForm()) {
        setIsSubmitting(false);
        return;
      }

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }



      // Validate country and region
      const region = getRegionForCountry(formData.country);
      if (!region) {
        throw new Error(`Unsupported country: ${formData.country}`);
      }

      // Create request in database with workflow
      const requestData = {
        projectNumber: formData.projectNumber,
        referenceNumber: formData.referenceNumber,
        country: formData.country,
        beneficiaryName: formData.beneficiaryName,
        amount: formData.amount,
        currency: formData.currency,
        date: formData.date,
        projectDetails: formData.projectDetails,
        referenceDocumentation: formData.referenceDocumentation
      };

      const newRequest = await createRequestWithWorkflow(requestData, user.id);

      // Log request creation
      await logRequestCreation(newRequest);

      // Upload files if any

      if (formData.documents && formData.documents.length > 0) {
        const fileObjects = formData.documents.map(doc => doc.file).filter(Boolean);

        if (fileObjects.length > 0) {
          try {
            const uploadResult = await uploadMultipleFiles(fileObjects, newRequest.id);
            console.log('Upload result:', uploadResult);

            if (uploadResult.success && uploadResult.files.length > 0) {
              // Save file metadata to database and log uploads
              for (const fileMetadata of uploadResult.files) {
                try {
                  console.log('Saving metadata for file:', fileMetadata);
                  await saveFileMetadata(newRequest.id, fileMetadata, user.id);
                  await logFileUpload(newRequest.id, fileMetadata.fileName, fileMetadata.fileSize);
                  console.log('Successfully saved metadata for:', fileMetadata.fileName);
                } catch (metadataError) {
                  console.error('Failed to save metadata for file:', fileMetadata.fileName, metadataError);
                }
              }
            }

            if (uploadResult.errors.length > 0) {
              console.warn('Some files failed to upload:', uploadResult.errors);
            }
          } catch (uploadError) {
            console.error('File upload process failed:', uploadError);
          }
        }
      }

      // Get regional team info for display
      const regionalTeam = getRegionalTeamForCountry(formData.country);

      // Call the parent callback with the created request
      try {
        await onCreateRequest({
          ...newRequest,
          regionalTeam: regionalTeam?.name || 'Unknown Region'
        });

        // Close modal after short delay
        setTimeout(() => {
          onClose();
        }, 1500);
      } catch (uiError) {
        console.error('UI update error (request was created successfully):', uiError);

        // Still close the modal since the request was created
        alert('✅ Request created successfully!');
        setTimeout(() => {
          onClose();
        }, 1000);
      }

    } catch (error) {
      console.error('Form submission error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });

      // More specific error messages
      let errorMessage = 'Failed to submit request';
      if (error.message) {
        errorMessage = error.message;
      }

      setErrors([errorMessage]);
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-3xl">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Create Withdrawal Request</h2>
            <p className="text-blue-100">Enter the required information for your withdrawal request</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-white hover:text-white bg-white/20 hover:bg-white/30 p-3 rounded-2xl transition-all duration-200 flex items-center justify-center"
            title="Close"
          >
            <span className="text-xl font-bold">✕</span>
          </button>
        </div>
      </div>
      
      <div className="max-h-[80vh] overflow-y-auto">
        <div className="p-8 space-y-8">
          {/* Error display */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-6 py-4">
              <div className="flex items-start">
                <span className="text-red-600 mr-3">⚠️</span>
                <div>
                  <h4 className="text-sm font-medium text-red-800 mb-1">Please fix the following errors:</h4>
                  <ul className="text-sm text-red-700 list-disc list-inside">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Core Required Fields */}
          <FormSection 
            title="Required Information" 
            description="Essential fields for withdrawal request"
            variant="primary"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Date"
                type="date"
                value={formData.date}
                onChange={(value) => handleInputChange('date', value)}
                placeholder="YYYY-MM-DD or select date"
                required
              />

              <FormField
                label="Project Number"
                value={formData.projectNumber}
                onChange={(value) => handleInputChange('projectNumber', value)}
                placeholder="Enter project number (e.g., ADFD-2024-001)"
                required
                className="font-mono"
                suggestions={[
                  `ADFD-${new Date().getFullYear()}-001`,
                  `ADFD-${new Date().getFullYear()}-002`,
                  `ADFD-${new Date().getFullYear()}-003`
                ]}
              />

              <FormField
                label="Country"
                type="select"
                value={formData.country}
                onChange={(value) => handleInputChange('country', value)}
                options={ALL_COUNTRIES}
                placeholder="Select country"
                required
                error={validation.country && !validation.country.isValid ? validation.country.message : null}
              />

              <FormField
                label="Reference Number"
                value={formData.referenceNumber}
                onChange={(value) => handleInputChange('referenceNumber', value)}
                placeholder="Enter reference number (e.g., WR-2024-001)"
                required
                className="font-mono"
                suggestions={[
                  `WR-${new Date().getFullYear()}-001`,
                  `WR-${new Date().getFullYear()}-002`,
                  `REF-${new Date().getFullYear()}-001`
                ]}
              />

              <FormField
                label="Beneficiary Name"
                value={formData.beneficiaryName}
                onChange={(value) => handleInputChange('beneficiaryName', value)}
                placeholder="Enter beneficiary name"
                required
                error={validation.beneficiaryName && !validation.beneficiaryName.isValid ? validation.beneficiaryName.message : null}
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FormField
                    label="Amount"
                    value={formatAmountDisplay(formData.amount)}
                    onChange={(value) => handleInputChange('amount', value)}
                    placeholder="Enter amount (e.g., 1,000,000)"
                    required
                    error={validation.amount && !validation.amount.isValid ? validation.amount.message : null}
                    success={validation.amount?.isValid && validation.amount.message ? validation.amount.message : null}
                    className="font-mono text-right"
                  />
                  {formData.amount && (
                    <div className="mt-1 text-sm text-blue-600 font-medium">
                      {formatAmountWithCurrency(formData.amount, formData.currency)}
                    </div>
                  )}
                </div>

                <FormField
                  label="Currency"
                  type="select"
                  value={formData.currency}
                  onChange={(value) => handleInputChange('currency', value)}
                  options={CURRENCY_OPTIONS}
                  required
                />
              </div>
            </div>
          </FormSection>

          {/* Project Details Section */}
          <FormSection 
            title="Project Details" 
            description="Comprehensive project information"
            variant="success"
          >
            <FormField
              label="Project Details"
              type="textarea"
              value={formData.projectDetails}
              onChange={(value) => handleInputChange('projectDetails', value)}
              placeholder="Enter comprehensive project information, description, objectives, and relevant details..."
              rows={6}
            />
          </FormSection>

          {/* Reference Documentation Section */}
          <FormSection 
            title="Reference Documentation" 
            description="Internal reference details and tracking information"
            variant="warning"
          >
            <FormField
              label="Reference Documentation"
              type="textarea"
              value={formData.referenceDocumentation}
              onChange={(value) => handleInputChange('referenceDocumentation', value)}
              placeholder="Enter internal reference details, tracking information, correspondence details, and any relevant documentation notes..."
              rows={4}
            />
          </FormSection>

          {/* File Uploads Section */}
          <FormSection 
            title="Supporting Documents" 
            description="Multiple file attachment capability for supporting documents"
            variant="info"
          >
            <DocumentUpload
              documents={formData.documents}
              onDocumentsChange={(documents) => handleInputChange('documents', documents)}
              maxFileSize={10 * 1024 * 1024} // 10MB
              acceptedTypes={['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.xlsx', '.xls']}
            />
          </FormSection>
        </div>

        {/* Submit Footer */}
        <div className="bg-white px-8 py-4 flex justify-between items-center border-t border-gray-200">
          <div className="text-sm text-gray-600">
            All required fields must be completed before submission
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={onClose}
              variant="secondary"
            >
              Cancel
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              variant="success"
              className="flex items-center"
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CreateRequestModal;