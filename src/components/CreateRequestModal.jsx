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
  validateField,
  generateSequentialNumbers
} from '../utils/formValidation';

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

  // Auto-generate project and reference numbers when modal opens
  useEffect(() => {
    if (isOpen && !formData.projectNumber) {
      const { projectNumber, referenceNumber } = generateSequentialNumbers();
      setFormData(prev => ({
        ...prev,
        projectNumber,
        referenceNumber
      }));
    }
  }, [isOpen]);

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

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newFormData = { ...prev, [field]: value };
      
      // Validate the field
      const fieldValidation = validateField(field, value, newFormData);
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

      // Convert form data to request format
      const requestData = {
        // Core fields
        date: formData.date,
        projectNumber: formData.projectNumber,
        country: formData.country,
        referenceNumber: formData.referenceNumber,
        beneficiaryName: formData.beneficiaryName,
        requestedAmount: formData.amount,
        currency: formData.currency,
        
        // Additional sections
        projectName: formData.projectDetails.split('\n')[0] || 'New Project', // Use first line as project name
        projectDescription: formData.projectDetails,
        paymentPurpose: formData.referenceDocumentation,
        documents: formData.documents,
        
        // Auto-populated fields for system compatibility
        valueDate: formData.date,
        contractReference: formData.referenceNumber
      };

      await onCreateRequest(requestData);
      
      // Close modal after short delay
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error) {
      console.error('Form submission error:', error);
      setErrors([error instanceof Error ? error.message : 'Failed to submit request']);
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
                required
                className="bg-gray-50"
                readOnly
              />

              <FormField
                label="Project Number"
                value={formData.projectNumber}
                onChange={(value) => handleInputChange('projectNumber', value)}
                placeholder="Auto-generated project number"
                required
                className="bg-gray-50 font-mono"
                readOnly
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
                placeholder="Auto-generated reference"
                required
                className="bg-gray-50 font-mono"
                readOnly
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
                <FormField
                  label="Amount"
                  value={formData.amount}
                  onChange={(value) => handleInputChange('amount', value)}
                  placeholder="Enter amount"
                  required
                  error={validation.amount && !validation.amount.isValid ? validation.amount.message : null}
                  success={validation.amount?.isValid && validation.amount.message ? validation.amount.message : null}
                />

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