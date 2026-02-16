/**
 * Einheitliches API-Error-Response-Format und HTTP-Status-Mapping
 */

import { NextResponse } from 'next/server';
import type { AppError } from './ErrorTypes';
import { ErrorCode, createAppError } from './ErrorTypes';

export interface ApiErrorResponseBody {
  success: false;
  error: {
    code: string;
    message: string;
    userMessage: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Mappt ErrorCode auf HTTP-Status
 */
export function getHttpStatusFromError(error: AppError): number {
  const statusMap: Partial<Record<ErrorCode, number>> = {
    [ErrorCode.AUTH_REQUIRED]: 401,
    [ErrorCode.AUTH_INVALID_TOKEN]: 401,
    [ErrorCode.AUTH_SESSION_EXPIRED]: 401,
    [ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS]: 403,
    [ErrorCode.VALIDATION_REQUIRED_FIELD]: 400,
    [ErrorCode.VALIDATION_INVALID_FORMAT]: 400,
    [ErrorCode.VALIDATION_OUT_OF_RANGE]: 400,
    [ErrorCode.VALIDATION_DUPLICATE_VALUE]: 409,
    [ErrorCode.FIREBASE_NOT_FOUND]: 404,
    [ErrorCode.FIREBASE_ALREADY_EXISTS]: 409,
    [ErrorCode.FIREBASE_PERMISSION_DENIED]: 403,
    [ErrorCode.FIREBASE_QUOTA_EXCEEDED]: 429,
    [ErrorCode.FIREBASE_MISSING_INDEX]: 400,
    [ErrorCode.NETWORK_TIMEOUT]: 504,
    [ErrorCode.NETWORK_CONNECTION_FAILED]: 503,
    [ErrorCode.SERVICE_UNAVAILABLE]: 503,
    [ErrorCode.SERVICE_RATE_LIMITED]: 429,
    [ErrorCode.SHIFT_CONFLICT]: 409,
    [ErrorCode.SHIFT_FULL]: 409,
    [ErrorCode.TIMESHEET_INVALID]: 400,
    [ErrorCode.INVITATION_EXPIRED]: 410,
    [ErrorCode.INTERNAL_ERROR]: 500,
  };
  return statusMap[error.code] ?? 500;
}

/**
 * Erstellt eine NextResponse mit einheitlichem Error-Format
 */
export function createErrorResponse(error: AppError): NextResponse<ApiErrorResponseBody> {
  const status = getHttpStatusFromError(error);
  return NextResponse.json(
    {
      success: false,
      error: {
        code: error.code,
        message: error.technicalMessage,
        userMessage: error.userMessage,
        details: error.metadata?.originalError
          ? undefined
          : (error.context?.additionalData as Record<string, unknown> | undefined),
      },
    } satisfies ApiErrorResponseBody,
    { status }
  );
}

/** Helper: 401 Unauthenticated oder 403 Unauthorized für API-Routes */
export function createAuthErrorResponse(
  kind: 'UNAUTHENTICATED' | 'UNAUTHORIZED',
  route?: string
): NextResponse<ApiErrorResponseBody> {
  const code = kind === 'UNAUTHENTICATED' ? ErrorCode.AUTH_REQUIRED : ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS;
  const message = kind === 'UNAUTHENTICATED' ? 'Unauthenticated' : 'Unauthorized';
  const appError = createAppError(new Error(message), code, { route });
  return createErrorResponse(appError);
}

/** Helper: 400 Validation für API-Routes */
export function createValidationErrorResponse(
  message: string,
  code: ErrorCode = ErrorCode.VALIDATION_REQUIRED_FIELD,
  route?: string
): NextResponse<ApiErrorResponseBody> {
  const appError = createAppError(new Error(message), code, { route });
  return createErrorResponse(appError);
}

/** Helper: 404 Not Found für API-Routes */
export function createNotFoundErrorResponse(message: string, route?: string): NextResponse<ApiErrorResponseBody> {
  const appError = createAppError(new Error(message), ErrorCode.FIREBASE_NOT_FOUND, { route });
  return createErrorResponse(appError);
}
