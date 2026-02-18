import { NextRequest, NextResponse } from 'next/server';
import { shiftService } from '@/lib/services/shifts';
import { verifyIdToken } from '@/lib/server/firebaseAdmin';
import { adminDb } from '@/lib/server/firebaseAdmin';
import { checkRateLimit, addRateLimitHeaders } from '@/lib/middleware/rateLimit';
import { validateRequest, shiftsQuerySchema, createShiftSchema } from '@/lib/validations';
import { logger } from '@/lib/errors';
export const runtime = 'nodejs';

/**
 * GET /api/admin/shifts
 *
 * Fetches all shifts with optional filters.
 *
 * Query parameters:
 * - facilityId: Filter by facility ID
 * - status: Filter by status (open, filled, cancelled)
 * - type: Filter by shift type
 * - dateFrom: Filter by start date (ISO string)
 * - dateTo: Filter by end date (ISO string)
 *
 * Example: /api/admin/shifts?status=open&facilityId=abc123
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    const decoded = await verifyIdToken(authHeader || undefined);

    if (!decoded) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthenticated. Please provide a valid authorization token.',
          code: 'UNAUTHENTICATED',
        },
        { status: 401 }
      );
    }

    // Rate Limiting prüfen
    const rateLimitResponse = checkRateLimit(request, decoded.uid);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Query-Parameter validieren
    const validation = await validateRequest(request, shiftsQuerySchema, 'query');
    if (!validation.success) {
      return validation.response;
    }
    const queryParams = validation.data;

    // Get user data to retrieve companyId
    let companyId: string | undefined;
    if (adminDb) {
      try {
        const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          companyId = userData?.companyId as string | undefined;
        }
      } catch (userError) {
        logger.warn('Could not fetch user data for companyId', {}, { error: userError });
        // Continue without companyId filter - this might be a permission issue
        // Don't throw error, just log and continue
      }
    } else {
      logger.warn('adminDb not available, continuing without companyId filter');
    }

    // Build filters object aus validierten Query-Parametern
    const filters = {
      facilityId: queryParams.facilityId,
      status: queryParams.status,
      type: queryParams.role, // role wird als type verwendet
      dateFrom: queryParams.startDate ? new Date(queryParams.startDate) : undefined,
      dateTo: queryParams.endDate ? new Date(queryParams.endDate) : undefined,
      companyId, // Add companyId filter to restrict to user's company
    };

    // Fetch shifts from service
    // This might throw an error (e.g., database connection failure, permission denied)
    const shifts = await shiftService.getAll(filters);

    // Return successful response
    const response = NextResponse.json(
      {
        success: true,
        data: shifts,
        count: shifts.length,
      },
      { status: 200 }
    );
    return addRateLimitHeaders(response, request, decoded.uid);
  } catch (error: unknown) {
    // Log the detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error(
      'Error fetching shifts',
      error instanceof Error ? error : undefined,
      { route: '/api/admin/shifts', timestamp: new Date() },
      { component: 'GET /api/admin/shifts', message: errorMessage, stack: errorStack }
    );

    // Check for specific error types
    if (error instanceof Error) {
      // Permission denied errors
      if (errorMessage.includes('permission-denied') || errorMessage.includes('unauthenticated')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Access denied. Please check your authentication.',
            code: 'PERMISSION_DENIED',
          },
          { status: 403 }
        );
      }

      // Database connection errors
      if (errorMessage.includes('connection') || errorMessage.includes('network')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Database connection failed. Please try again later.',
            code: 'DATABASE_ERROR',
          },
          { status: 503 }
        );
      }

      // Missing index errors (Firestore)
      if (errorMessage.includes('index') || errorMessage.includes('failed-precondition')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Database index missing. Please contact support.',
            code: 'INDEX_MISSING',
          },
          { status: 500 }
        );
      }
    }

    // Generic 500 error for unexpected errors
    // We don't expose internal error details to the client for security
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred on the server. Please try again later.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/shifts
 *
 * Creates a new shift.
 *
 * Request body should contain shift data:
 * {
 *   title: string,
 *   facilityId: string,
 *   stationId?: string,
 *   date: string (ISO date),
 *   startTime: string,
 *   endTime: string,
 *   type: string,
 *   capacity: number,
 *   ...
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    const decoded = await verifyIdToken(authHeader || undefined);

    if (!decoded) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthenticated. Please provide a valid authorization token.',
          code: 'UNAUTHENTICATED',
        },
        { status: 401 }
      );
    }

    // Rate Limiting prüfen
    const rateLimitResponse = checkRateLimit(request, decoded.uid);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Request-Body validieren
    const validation = await validateRequest(request, createShiftSchema);
    if (!validation.success) {
      return validation.response;
    }
    const body = validation.data;

    // Create shift using service
    const startTime =
      typeof body.startTime === 'string'
        ? body.startTime
        : (body.startTime as Date)?.toISOString?.() || String(body.startTime);
    const endTime =
      typeof body.endTime === 'string'
        ? body.endTime
        : (body.endTime as Date)?.toISOString?.() || String(body.endTime);

    // Parse date from startTime if it's a datetime string
    const dateStr =
      body.date || (startTime.includes('T') ? startTime.split('T')[0] : startTime.split(' ')[0]);
    const startTimeStr = startTime.includes('T')
      ? startTime.split('T')[1]?.split('.')[0] || startTime
      : startTime;
    const endTimeStr = endTime.includes('T')
      ? endTime.split('T')[1]?.split('.')[0] || endTime
      : endTime;

    const shiftId = await shiftService.create({
      title: body.title || `${body.type || 'Schicht'} - ${startTimeStr}`,
      facilityId: body.facilityId,
      date: dateStr,
      startTime: startTimeStr,
      endTime: endTimeStr,
      type: body.type || 'Frühdienst',
      requiredQualifications: body.requiredQualifications || [],
      capacity: body.capacity || body.maxStaff || 1,
      maxStaff: body.maxStaff || body.capacity || 1,
      status:
        body.status === 'open' || body.status === 'filled' || body.status === 'cancelled'
          ? body.status
          : 'open',
      notes: body.notes,
      timezone: body.timezone || 'Europe/Berlin',
      color: body.color || '#005f73', // DEFAULT_SHIFT_COLOR aus lib/constants/colorPresets
      createdBy: body.createdBy || decoded.uid,
      stationId: body.stationId,
    });

    const response = NextResponse.json(
      {
        success: true,
        data: { id: shiftId },
        message: 'Shift created successfully',
      },
      { status: 201 }
    );
    return addRateLimitHeaders(response, request, decoded.uid);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error(
      'Error creating shift',
      error instanceof Error ? error : undefined,
      { route: '/api/admin/shifts', timestamp: new Date() },
      { component: 'POST /api/admin/shifts', message: errorMessage, stack: errorStack }
    );

    if (error instanceof Error) {
      if (errorMessage.includes('permission-denied') || errorMessage.includes('unauthenticated')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Access denied. Please check your authentication.',
            code: 'PERMISSION_DENIED',
          },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while creating the shift.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
