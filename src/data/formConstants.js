// Form step configuration
export const FORM_STEPS = [
  {
    id: 'country',
    title: 'Country',
    description: 'Select country',
    icon: 'Globe'
  },
  {
    id: 'project',
    title: 'Project',
    description: 'Project details',
    icon: 'FileText'
  },
  {
    id: 'financial',
    title: 'Financial',
    description: 'Amount & currency',
    icon: 'DollarSign'
  },
  {
    id: 'beneficiary',
    title: 'Beneficiary',
    description: 'Banking details',
    icon: 'Building'
  },
  {
    id: 'authorization',
    title: 'Authorization',
    description: 'Representatives',
    icon: 'Users'
  },
  {
    id: 'documents',
    title: 'Documents',
    description: 'Upload files',
    icon: 'Upload'
  },
  {
    id: 'review',
    title: 'Review',
    description: 'Final review',
    icon: 'Eye'
  }
];

// Import world countries
import { WORLD_COUNTRIES, POPULAR_COUNTRIES } from './worldCountries';

// Country options - use popular countries for display, but allow search through all
export const COUNTRIES = POPULAR_COUNTRIES;
export const ALL_COUNTRIES = WORLD_COUNTRIES;

// Currency options
export const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'AED', label: 'AED - UAE Dirham' },
  { value: 'SAR', label: 'SAR - Saudi Riyal' }
];

// VAT Status options
export const VAT_STATUS_OPTIONS = [
  { value: 'inclusive', label: 'VAT Inclusive' },
  { value: 'exclusive', label: 'VAT Exclusive' },
  { value: 'exempt', label: 'VAT Exempt' },
  { value: 'not-applicable', label: 'Not Applicable' }
];

// Default form data
export const DEFAULT_FORM_DATA = {
  // Country & Project
  country: '',
  projectNumber: '',
  referenceNumber: '',
  projectName: '',
  contractReference: '',
  agreementDate: '',
  agreementParty: '',
  projectDescription: '',
  
  // Financial
  requestedAmount: '',
  currency: 'USD',
  vatStatus: 'not-applicable',
  valueDate: '',
  paymentPurpose: '',
  
  // Beneficiary & Banking
  beneficiaryName: '',
  beneficiaryAddress: '',
  bankName: '',
  swiftCode: '',
  bankAddress: '',
  accountNumber: '',
  iban: '',
  correspondenceBankName: '',
  correspondenceSwiftCode: '',
  correspondenceBankAddress: '',
  
  // Authorization
  authorizedRepresentative1: '',
  authorizedRepresentative1Title: '',
  authorizedRepresentative2: '',
  authorizedRepresentative2Title: '',
  signatureDate: '',
  
  // Additional
  additionalNotes: '',
  requestDate: new Date().toISOString().split('T')[0],
  
  // Documents
  documents: []
};