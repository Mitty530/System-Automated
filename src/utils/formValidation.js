// Form validation utilities
export const validateField = (field, value) => {
  switch (field) {
    case 'projectName':
      if (!value || value.trim().length < 3) {
        return { isValid: false, message: 'Project name must be at least 3 characters' };
      }
      return { isValid: true };

    case 'contractReference':
      if (!value || value.trim().length < 2) {
        return { isValid: false, message: 'Contract reference is required' };
      }
      return { isValid: true };

    case 'requestedAmount': {
      if (!value || value.trim() === '') {
        return { isValid: false, message: 'Amount is required' };
      }
      const numericValue = parseFloat(value.replace(/[,\s]/g, ''));
      if (isNaN(numericValue) || numericValue <= 0) {
        return { isValid: false, message: 'Please enter a valid amount' };
      }
      if (numericValue > 10000000) {
        return { isValid: false, message: 'Amount cannot exceed 10,000,000' };
      }
      return { isValid: true, message: `Formatted: ${formatAmount(value)}` };
    }

    case 'valueDate': {
      if (!value) {
        return { isValid: false, message: 'Value date is required' };
      }
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        return { isValid: false, message: 'Value date cannot be in the past' };
      }
      return { isValid: true };
    }

    case 'paymentPurpose':
      if (!value || value.trim().length < 10) {
        return { isValid: false, message: 'Payment purpose must be at least 10 characters' };
      }
      return { isValid: true };

    case 'amount': {
      if (!value || value.trim() === '') {
        return { isValid: false, message: 'Amount is required' };
      }
      const numericValue = parseFloat(value.replace(/[,\s]/g, ''));
      if (isNaN(numericValue) || numericValue <= 0) {
        return { isValid: false, message: 'Please enter a valid amount' };
      }
      if (numericValue > 100000000) { // 100 million limit
        return { isValid: false, message: 'Amount cannot exceed 100,000,000' };
      }
      return { isValid: true, message: `✓ Valid amount` };
    }

    case 'beneficiaryName':
      if (!value || value.trim().length < 2) {
        return { isValid: false, message: 'Beneficiary name is required' };
      }
      return { isValid: true };

    case 'bankName':
      if (!value || value.trim().length < 2) {
        return { isValid: false, message: 'Bank name is required' };
      }
      return { isValid: true };

    case 'swiftCode':
    case 'correspondenceSwiftCode':
      if (value && value.length > 0) {
        const swiftRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
        if (!swiftRegex.test(value)) {
          return { isValid: false, message: 'Invalid SWIFT code format' };
        }
        return { isValid: true, message: 'Valid SWIFT code' };
      }
      if (field === 'swiftCode') {
        return { isValid: false, message: 'SWIFT code is required' };
      }
      return { isValid: true };

    case 'iban': {
      if (!value || value.trim() === '') {
        return { isValid: false, message: 'IBAN is required' };
      }
      const cleanIban = value.replace(/\s/g, '');
      if (cleanIban.length < 15 || cleanIban.length > 34) {
        return { isValid: false, message: 'IBAN length should be between 15-34 characters' };
      }
      const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/;
      if (!ibanRegex.test(cleanIban)) {
        return { isValid: false, message: 'Invalid IBAN format' };
      }
      return { isValid: true, message: 'Valid IBAN format' };
    }

    case 'authorizedRepresentative1':
      if (!value || value.trim().length < 2) {
        return { isValid: false, message: 'Authorized representative name is required' };
      }
      return { isValid: true };

    case 'signatureDate':
      if (!value) {
        return { isValid: false, message: 'Signature date is required' };
      }
      return { isValid: true };

    default:
      return { isValid: true };
  }
};

// Format amount with commas
export const formatAmount = (amount) => {
  if (!amount) return '';
  const numericValue = parseFloat(amount.replace(/[,\s]/g, ''));
  if (isNaN(numericValue)) return amount;
  return numericValue.toLocaleString();
};

// Format IBAN with spaces
export const formatIBAN = (iban) => {
  if (!iban) return '';
  const cleanIban = iban.replace(/\s/g, '');
  return cleanIban.replace(/(.{4})/g, '$1 ').trim();
};

// Generate sequential numbers
export const generateSequentialNumbers = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  
  return {
    projectNumber: `ADFD-${timestamp.toString().slice(-6)}-${random.toString().padStart(3, '0')}`,
    referenceNumber: `REF-${new Date().getFullYear()}-${timestamp.toString().slice(-4)}`
  };
};