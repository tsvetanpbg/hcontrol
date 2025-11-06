import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { cleaningLogs, establishments, personnel } from '@/db/schema';
import { requireAuth } from '@/lib/authMiddleware';
import { eq, and, gte, lte, desc, count } from 'drizzle-orm';

// GET - List all cleaning logs for authenticated user
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user } = authResult;

    const searchParams = request.nextUrl.searchParams;
    const establishmentIdParam = searchParams.get('establishmentId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const logDate = searchParams.get('logDate');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    // Validate date formats
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (startDate && !dateRegex.test(startDate)) {
      return NextResponse.json({
        error: 'Invalid startDate format. Expected YYYY-MM-DD',
        code: 'INVALID_START_DATE'
      }, { status: 400 });
    }
    if (endDate && !dateRegex.test(endDate)) {
      return NextResponse.json({
        error: 'Invalid endDate format. Expected YYYY-MM-DD',
        code: 'INVALID_END_DATE'
      }, { status: 400 });
    }
    if (logDate && !dateRegex.test(logDate)) {
      return NextResponse.json({
        error: 'Invalid logDate format. Expected YYYY-MM-DD',
        code: 'INVALID_LOG_DATE'
      }, { status: 400 });
    }

    // Parse pagination parameters
    const limit = Math.min(parseInt(limitParam ?? '50'), 200);
    const offset = parseInt(offsetParam ?? '0');

    if (isNaN(limit) || limit < 1) {
      return NextResponse.json({
        error: 'Invalid limit parameter',
        code: 'INVALID_LIMIT'
      }, { status: 400 });
    }
    if (isNaN(offset) || offset < 0) {
      return NextResponse.json({
        error: 'Invalid offset parameter',
        code: 'INVALID_OFFSET'
      }, { status: 400 });
    }

    // Build where conditions
    const conditions = [eq(cleaningLogs.userId, user.userId)];

    // Filter by establishmentId if provided
    if (establishmentIdParam) {
      const establishmentId = parseInt(establishmentIdParam);
      if (isNaN(establishmentId)) {
        return NextResponse.json({
          error: 'Invalid establishmentId parameter',
          code: 'INVALID_ESTABLISHMENT_ID'
        }, { status: 400 });
      }
      conditions.push(eq(cleaningLogs.establishmentId, establishmentId));
    }

    // Filter by date range
    if (startDate) {
      conditions.push(gte(cleaningLogs.logDate, startDate));
    }
    if (endDate) {
      conditions.push(lte(cleaningLogs.logDate, endDate));
    }
    if (logDate) {
      conditions.push(eq(cleaningLogs.logDate, logDate));
    }

    const whereClause = and(...conditions);

    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(cleaningLogs)
      .where(whereClause);
    const total = totalResult[0]?.count ?? 0;

    // Get logs with pagination and ordering
    const logs = await db
      .select()
      .from(cleaningLogs)
      .where(whereClause)
      .orderBy(desc(cleaningLogs.logDate), desc(cleaningLogs.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      logs,
      total
    }, { status: 200 });

  } catch (error) {
    console.error('GET /api/cleaning-logs error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}

// POST - Create new cleaning log
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user } = authResult;

    const body = await request.json();

    // Security check: reject if userId provided in body
    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({
        error: 'User ID cannot be provided in request body',
        code: 'USER_ID_NOT_ALLOWED'
      }, { status: 400 });
    }

    const {
      startTime,
      endTime,
      cleaningAreas,
      products,
      logDate,
      establishmentId,
      employeeId,
      employeeName,
      notes
    } = body;

    // Validate required fields
    if (!startTime) {
      return NextResponse.json({
        error: 'startTime is required',
        code: 'MISSING_START_TIME'
      }, { status: 400 });
    }
    if (!endTime) {
      return NextResponse.json({
        error: 'endTime is required',
        code: 'MISSING_END_TIME'
      }, { status: 400 });
    }
    if (!cleaningAreas) {
      return NextResponse.json({
        error: 'cleaningAreas is required',
        code: 'MISSING_CLEANING_AREAS'
      }, { status: 400 });
    }
    if (!products) {
      return NextResponse.json({
        error: 'products is required',
        code: 'MISSING_PRODUCTS'
      }, { status: 400 });
    }
    if (!logDate) {
      return NextResponse.json({
        error: 'logDate is required',
        code: 'MISSING_LOG_DATE'
      }, { status: 400 });
    }

    // Validate time formats (HH:MM)
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(startTime)) {
      return NextResponse.json({
        error: 'Invalid startTime format. Expected HH:MM',
        code: 'INVALID_START_TIME_FORMAT'
      }, { status: 400 });
    }
    if (!timeRegex.test(endTime)) {
      return NextResponse.json({
        error: 'Invalid endTime format. Expected HH:MM',
        code: 'INVALID_END_TIME_FORMAT'
      }, { status: 400 });
    }

    // Validate endTime is after startTime
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    if (endMinutes <= startMinutes) {
      return NextResponse.json({
        error: 'endTime must be after startTime',
        code: 'INVALID_TIME_RANGE'
      }, { status: 400 });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(logDate)) {
      return NextResponse.json({
        error: 'Invalid logDate format. Expected YYYY-MM-DD',
        code: 'INVALID_LOG_DATE_FORMAT'
      }, { status: 400 });
    }

    // Validate cleaningAreas is non-empty array
    if (!Array.isArray(cleaningAreas) || cleaningAreas.length === 0) {
      return NextResponse.json({
        error: 'cleaningAreas must be a non-empty array',
        code: 'INVALID_CLEANING_AREAS'
      }, { status: 400 });
    }

    // Validate products is non-empty array
    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({
        error: 'products must be a non-empty array',
        code: 'INVALID_PRODUCTS'
      }, { status: 400 });
    }

    // Validate establishmentId if provided
    if (establishmentId !== undefined && establishmentId !== null) {
      const establishmentIdNum = parseInt(establishmentId as string);
      if (isNaN(establishmentIdNum)) {
        return NextResponse.json({
          error: 'Invalid establishmentId',
          code: 'INVALID_ESTABLISHMENT_ID'
        }, { status: 400 });
      }

      // Verify establishment belongs to authenticated user
      const establishment = await db
        .select()
        .from(establishments)
        .where(
          and(
            eq(establishments.id, establishmentIdNum),
            eq(establishments.userId, user.userId)
          )
        )
        .limit(1);

      if (establishment.length === 0) {
        return NextResponse.json({
          error: 'Establishment not found or access forbidden',
          code: 'ESTABLISHMENT_NOT_FOUND'
        }, { status: 403 });
      }
    }

    // Handle employeeId and auto-populate employeeName
    let finalEmployeeName = employeeName;
    if (employeeId !== undefined && employeeId !== null) {
      const employeeIdNum = parseInt(employeeId as string);
      if (isNaN(employeeIdNum)) {
        return NextResponse.json({
          error: 'Invalid employeeId',
          code: 'INVALID_EMPLOYEE_ID'
        }, { status: 400 });
      }

      // Verify employee exists and belongs to user's establishment
      const employee = await db
        .select({
          id: personnel.id,
          fullName: personnel.fullName,
          establishmentId: personnel.establishmentId
        })
        .from(personnel)
        .where(eq(personnel.id, employeeIdNum))
        .limit(1);

      if (employee.length === 0) {
        return NextResponse.json({
          error: 'Employee not found',
          code: 'EMPLOYEE_NOT_FOUND'
        }, { status: 404 });
      }

      // Verify the employee's establishment belongs to the user
      const employeeEstablishment = await db
        .select()
        .from(establishments)
        .where(
          and(
            eq(establishments.id, employee[0].establishmentId),
            eq(establishments.userId, user.userId)
          )
        )
        .limit(1);

      if (employeeEstablishment.length === 0) {
        return NextResponse.json({
          error: 'Employee does not belong to your establishment',
          code: 'EMPLOYEE_ACCESS_FORBIDDEN'
        }, { status: 403 });
      }

      // Auto-populate employeeName from personnel table
      finalEmployeeName = employee[0].fullName;
    }

    // Prepare insert data
    const now = new Date().toISOString();
    const insertData: any = {
      userId: user.userId,
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      cleaningAreas: JSON.stringify(cleaningAreas),
      products: JSON.stringify(products),
      logDate: logDate.trim(),
      createdAt: now,
      updatedAt: now
    };

    // Add optional fields if provided
    if (establishmentId !== undefined && establishmentId !== null) {
      insertData.establishmentId = parseInt(establishmentId as string);
    }
    if (employeeId !== undefined && employeeId !== null) {
      insertData.employeeId = parseInt(employeeId as string);
    }
    if (finalEmployeeName) {
      insertData.employeeName = finalEmployeeName.trim();
    }
    if (notes) {
      insertData.notes = notes.trim();
    }

    // Insert cleaning log
    const newLog = await db
      .insert(cleaningLogs)
      .values(insertData)
      .returning();

    return NextResponse.json(newLog[0], { status: 201 });

  } catch (error) {
    console.error('POST /api/cleaning-logs error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}