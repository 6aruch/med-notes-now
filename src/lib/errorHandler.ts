/**
 * Security-focused error handler that prevents information leakage
 * Maps technical database/auth errors to user-friendly messages
 */

const errorCodeMap: Record<string, string> = {
  // PostgreSQL error codes
  '23505': 'This record already exists',
  '23503': 'Referenced record not found',
  '23502': 'Required field is missing',
  '23514': 'Invalid data provided',
  'PGRST116': 'Record not found',
  'PGRST': 'Unable to complete request',
  
  // Auth error codes
  'auth/user-not-found': 'Invalid credentials',
  'auth/wrong-password': 'Invalid credentials',
  'auth/invalid-email': 'Invalid email address',
  'auth/weak-password': 'Password is too weak',
  'auth/email-already-in-use': 'An account with this email already exists',
  'auth/too-many-requests': 'Too many attempts. Please try again later',
  'invalid_credentials': 'Invalid credentials',
  'email_not_confirmed': 'Please verify your email address',
};

export const getUserFriendlyError = (error: any): string => {
  if (!error) return 'An error occurred. Please try again.';
  
  // Check for error code
  if (error.code && errorCodeMap[error.code]) {
    return errorCodeMap[error.code];
  }
  
  // Check for error message patterns (without exposing them)
  const message = error.message?.toLowerCase() || '';
  
  if (message.includes('row-level security') || message.includes('rls')) {
    return 'You do not have permission to perform this action';
  }
  
  if (message.includes('unique constraint') || message.includes('duplicate')) {
    return 'This record already exists';
  }
  
  if (message.includes('foreign key') || message.includes('reference')) {
    return 'Unable to complete request. Referenced data may not exist';
  }
  
  if (message.includes('not found')) {
    return 'Record not found';
  }
  
  if (message.includes('invalid') || message.includes('malformed')) {
    return 'Invalid data provided';
  }
  
  if (message.includes('timeout')) {
    return 'Request timed out. Please try again';
  }
  
  // Default generic message
  return 'An error occurred. Please try again.';
};
