// Authorized users configuration for ADFD Tracking System
// This matches the existing Supabase auth configuration

// Authorized email domains
const AUTHORIZED_DOMAINS = [
  'adfd.ae'
]

// Specific authorized email addresses (exceptions to domain rule)
const AUTHORIZED_EMAILS = [
  // Admin exceptions
  'Mamadouourydiallo819@gmail.com',
  'mamadouourydiallo819@gmail.com', // Case variation
  'alomran303@gmail.com'
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
 * Note: User roles are now retrieved from the Supabase database only.
 * No fallback role assignment is performed.
 */

export { AUTHORIZED_DOMAINS, AUTHORIZED_EMAILS }
