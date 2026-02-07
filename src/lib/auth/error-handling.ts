// Custom error types for authentication
export enum AuthErrorType {
  INVALID_CREDENTIALS = 'invalid_credentials',
  USER_NOT_FOUND = 'user_not_found',
  EMAIL_NOT_CONFIRMED = 'email_not_confirmed',
  WEAK_PASSWORD = 'weak_password',
  EMAIL_ALREADY_EXISTS = 'email_already_exists',
  NETWORK_ERROR = 'network_error',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SESSION_EXPIRED = 'session_expired',
  INSUFFICIENT_PERMISSIONS = 'insufficient_permissions',
  ACCOUNT_DISABLED = 'account_disabled',
  UNKNOWN_ERROR = 'unknown_error',
}

// User-friendly error messages
export const AUTH_ERROR_MESSAGES = {
  [AuthErrorType.INVALID_CREDENTIALS]: 'Invalid email or password. Please check your credentials and try again.',
  [AuthErrorType.USER_NOT_FOUND]: 'No account found with this email address.',
  [AuthErrorType.EMAIL_NOT_CONFIRMED]: 'Please check your email and click the confirmation link before signing in.',
  [AuthErrorType.WEAK_PASSWORD]: 'Password must be at least 8 characters long and contain uppercase, lowercase, and numbers.',
  [AuthErrorType.EMAIL_ALREADY_EXISTS]: 'An account with this email address already exists.',
  [AuthErrorType.NETWORK_ERROR]: 'Network error. Please check your connection and try again.',
  [AuthErrorType.RATE_LIMIT_EXCEEDED]: 'Too many attempts. Please wait a few minutes before trying again.',
  [AuthErrorType.SESSION_EXPIRED]: 'Your session has expired. Please sign in again.',
  [AuthErrorType.INSUFFICIENT_PERMISSIONS]: 'You do not have permission to access this resource.',
  [AuthErrorType.ACCOUNT_DISABLED]: 'Your account has been disabled. Please contact support.',
  [AuthErrorType.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
} as const;

// Error details interface
export interface AuthErrorDetails {
  type: AuthErrorType;
  message: string;
  originalError?: string;
  code?: string;
  retryAfter?: number;
}

/**
 * Parse auth error and return user-friendly error details
 */
export function parseAuthError(error: Error | unknown): AuthErrorDetails {
  if (error && typeof error === 'object' && 'message' in error) {
    const err = error as Error & { status?: number; code?: string };
    const message = err.message.toLowerCase();

    if (message.includes('invalid login credentials') || message.includes('invalid credentials') || message.includes('credentialssignin')) {
      return {
        type: AuthErrorType.INVALID_CREDENTIALS,
        message: AUTH_ERROR_MESSAGES[AuthErrorType.INVALID_CREDENTIALS],
        originalError: err.message,
        code: err.code,
      };
    }

    if (message.includes('user not found')) {
      return {
        type: AuthErrorType.USER_NOT_FOUND,
        message: AUTH_ERROR_MESSAGES[AuthErrorType.USER_NOT_FOUND],
        originalError: err.message,
        code: err.code,
      };
    }

    if (message.includes('password') && message.includes('weak')) {
      return {
        type: AuthErrorType.WEAK_PASSWORD,
        message: AUTH_ERROR_MESSAGES[AuthErrorType.WEAK_PASSWORD],
        originalError: err.message,
        code: err.code,
      };
    }

    if (message.includes('already registered') || message.includes('already exists')) {
      return {
        type: AuthErrorType.EMAIL_ALREADY_EXISTS,
        message: AUTH_ERROR_MESSAGES[AuthErrorType.EMAIL_ALREADY_EXISTS],
        originalError: err.message,
        code: err.code,
      };
    }

    if (message.includes('network') || message.includes('connection')) {
      return {
        type: AuthErrorType.NETWORK_ERROR,
        message: AUTH_ERROR_MESSAGES[AuthErrorType.NETWORK_ERROR],
        originalError: err.message,
        code: err.code,
      };
    }

    if (message.includes('rate limit') || message.includes('too many')) {
      return {
        type: AuthErrorType.RATE_LIMIT_EXCEEDED,
        message: AUTH_ERROR_MESSAGES[AuthErrorType.RATE_LIMIT_EXCEEDED],
        originalError: err.message,
        code: err.code,
      };
    }

    if (message.includes('session') && message.includes('expired')) {
      return {
        type: AuthErrorType.SESSION_EXPIRED,
        message: AUTH_ERROR_MESSAGES[AuthErrorType.SESSION_EXPIRED],
        originalError: err.message,
        code: err.code,
      };
    }

    if (message.includes('permission') || message.includes('unauthorized')) {
      return {
        type: AuthErrorType.INSUFFICIENT_PERMISSIONS,
        message: AUTH_ERROR_MESSAGES[AuthErrorType.INSUFFICIENT_PERMISSIONS],
        originalError: err.message,
        code: err.code,
      };
    }

    if (message.includes('disabled') || message.includes('suspended')) {
      return {
        type: AuthErrorType.ACCOUNT_DISABLED,
        message: AUTH_ERROR_MESSAGES[AuthErrorType.ACCOUNT_DISABLED],
        originalError: err.message,
        code: err.code,
      };
    }
  }

  if (error instanceof Error) {
    return {
      type: AuthErrorType.UNKNOWN_ERROR,
      message: AUTH_ERROR_MESSAGES[AuthErrorType.UNKNOWN_ERROR],
      originalError: error.message,
    };
  }

  return {
    type: AuthErrorType.UNKNOWN_ERROR,
    message: AUTH_ERROR_MESSAGES[AuthErrorType.UNKNOWN_ERROR],
    originalError: String(error),
  };
}

/**
 * Get user-friendly error message for display
 */
export function getAuthErrorMessage(error: Error | unknown): string {
  const errorDetails = parseAuthError(error);
  return errorDetails.message;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: Error | unknown): boolean {
  const errorDetails = parseAuthError(error);

  return [
    AuthErrorType.NETWORK_ERROR,
    AuthErrorType.UNKNOWN_ERROR,
  ].includes(errorDetails.type);
}

/**
 * Get retry delay in milliseconds
 */
export function getRetryDelay(error: Error | unknown): number {
  const errorDetails = parseAuthError(error);

  switch (errorDetails.type) {
    case AuthErrorType.RATE_LIMIT_EXCEEDED:
      return errorDetails.retryAfter ? errorDetails.retryAfter * 1000 : 60000;
    case AuthErrorType.NETWORK_ERROR:
      return 5000;
    case AuthErrorType.UNKNOWN_ERROR:
      return 10000;
    default:
      return 0;
  }
}

/**
 * Log authentication errors for monitoring
 */
export function logAuthError(
  error: Error | unknown,
  context: {
    action: string;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
  }
): void {
  const errorDetails = parseAuthError(error);

  const logData = {
    timestamp: new Date().toISOString(),
    errorType: errorDetails.type,
    errorMessage: errorDetails.message,
    originalError: errorDetails.originalError,
    errorCode: errorDetails.code,
    context,
  };

  if (process.env.NODE_ENV === 'development') {
    console.error('Auth Error:', logData);
  }
}

/**
 * Create standardized error response for API routes
 */
export function createAuthErrorResponse(
  error: Error | unknown,
  statusCode: number = 400
): Response {
  const errorDetails = parseAuthError(error);

  return new Response(
    JSON.stringify({
      error: errorDetails.type,
      message: errorDetails.message,
      code: errorDetails.code,
      retryAfter: errorDetails.retryAfter,
    }),
    {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'X-Error-Type': errorDetails.type,
        ...(errorDetails.retryAfter && {
          'Retry-After': errorDetails.retryAfter.toString(),
        }),
      },
    }
  );
}

/**
 * Error boundary helper for React components
 */
export function handleAuthError(
  error: Error | unknown,
  setError: (message: string) => void,
  setLoading: (loading: boolean) => void
): void {
  const errorDetails = parseAuthError(error);

  setError(errorDetails.message);
  setLoading(false);

  logAuthError(error, {
    action: 'component_error',
  });
}

/**
 * Validation error formatter
 */
export function formatValidationErrors(errors: Array<{ path: string; message: string }>): string {
  if (errors.length === 0) return 'Validation failed';

  if (errors.length === 1) {
    return errors[0].message;
  }

  return `Multiple validation errors: ${errors.map(e => e.message).join(', ')}`;
}
