// Authorized users configuration for ADFD Tracking System
// This matches the existing Supabase auth configuration

// Authorized email domains
const AUTHORIZED_DOMAINS = [
  'adfd.ae',
  'company.com' // For testing with mock data emails
]

// Specific authorized email addresses (exceptions to domain rule)
const AUTHORIZED_EMAILS = [
  // Test users for development
  'sarah@company.com',
  'john@company.com', 
  'mike@company.com',
  'lisa@company.com',
  // Add specific ADFD team members here
  'admin@adfd.ae',
  'operations@adfd.ae',
  'banking@adfd.ae',
  'archive@adfd.ae'
]

/**
 * Check if an email is authorized to access the system
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if authorized, false otherwise
 */
export const isAuthorizedUser = (email) => {
  if (!email || typeof email !== 'string') {
    return false
  }

  const normalizedEmail = email.toLowerCase().trim()

  // Check if email is in the specific authorized list
  if (AUTHORIZED_EMAILS.includes(normalizedEmail)) {
    return true
  }

  // Check if email domain is authorized
  const domain = normalizedEmail.split('@')[1]
  return AUTHORIZED_DOMAINS.includes(domain)
}

/**
 * Validate email domain against authorized domains
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if domain is authorized, false otherwise
 */
export const validateEmailDomain = (email) => {
  if (!email || typeof email !== 'string') {
    return false
  }

  const domain = email.toLowerCase().trim().split('@')[1]
  return AUTHORIZED_DOMAINS.includes(domain)
}

/**
 * Get the user's role based on their email
 * This is a temporary mapping until we have proper user profiles
 * @param {string} email - Email address
 * @returns {string} - User role
 */
export const getUserRoleFromEmail = (email) => {
  const normalizedEmail = email.toLowerCase().trim()
  
  // Map specific emails to roles (for testing)
  const emailRoleMap = {
    'sarah@company.com': 'archive_team',
    'john@company.com': 'loan_admin', 
    'mike@company.com': 'operations_team',
    'lisa@company.com': 'core_banking'
  }

  // Check specific mapping first
  if (emailRoleMap[normalizedEmail]) {
    return emailRoleMap[normalizedEmail]
  }

  // Default role assignment based on email patterns
  if (normalizedEmail.includes('admin')) {
    return 'loan_admin'
  } else if (normalizedEmail.includes('operations') || normalizedEmail.includes('ops')) {
    return 'operations_team'
  } else if (normalizedEmail.includes('banking') || normalizedEmail.includes('bank')) {
    return 'core_banking'
  } else if (normalizedEmail.includes('archive')) {
    return 'archive_team'
  }

  // Default to observer role for unknown users
  return 'observer'
}

export { AUTHORIZED_DOMAINS, AUTHORIZED_EMAILS }
