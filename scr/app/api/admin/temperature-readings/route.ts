import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { temperatureReadings } from '@/db/schema';
import { requireAdmin } from '@/lib/authMiddleware';
import { eq, and, gte, lte, desc, asc, count, SQL } from 'drizzle-orm';

const VALID_SORT_FIELDS = ['id', 'deviceId', 'readingDate', 'hour', 'temperature', 'createdAt'] as const;
type ValidSortField = typeof VALID_SORT_FIELDS[number];

export async function GET(request: NextRequest) {
  try {
    // Authenticate admin
    const adminCheck = await requireAdmin(request);
    if (adminCheck) {
      return adminCheck;
    }

    const searchParams = request.nextUrl.searchParams;

    // Parse and validate query parameters
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const deviceIdParam = searchParams.get('deviceId');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const sortParam = searchParams.get('sort') || 'readingDate';
    const orderParam = searchParams.get('order') || 'desc';

    // Validate limit
    let limit = 100;
    if (limitParam) {
      const parsedLimit = parseInt(limitParam);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 200) {
        return NextResponse.json({
          error: 'Limit must be a positive integer between 1 and 200',
          code: 'INVALID_LIMIT'
        }, { status: 400 });
      }
      limit = parsedLimit;
    }

    // Validate offset
    let offset = 0;
    if (offsetParam) {
      const parsedOffset = parseInt(offsetParam);
      if (isNaN(parsedOffset) || parsedOffset < 0) {
        return NextResponse.json({
          error: 'Offset must be a non-negative integer',
          code: 'INVALID_OFFSET'
        }, { status: 400 });
      }
      offset = parsedOffset;
    }

    // Validate deviceId
    let deviceId: number | null = null;
    if (deviceIdParam) {
      const parsedDeviceId = parseInt(deviceIdParam);
      if (isNaN(parsedDeviceId)) {
        return NextResponse.json({
          error: 'Device ID must be a valid integer',
          code: 'INVALID_DEVICE_ID'
        }, { status: 400 });
      }
      deviceId = parsedDeviceId;
    }

    // Validate startDate
    let startDate: string | null = null;
    if (startDateParam) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(startDateParam)) {
        return NextResponse.json({
          error: 'Start date must be in YYYY-MM-DD format',
          code: 'INVALID_START_DATE'
        }, { status: 400 });
      }
      startDate = startDateParam;
    }

    // Validate endDate
    let endDate: string | null = null;
    if (endDateParam) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(endDateParam)) {
        return NextResponse.json({
          error: 'End date must be in YYYY-MM-DD format',
          code: 'INVALID_END_DATE'
        }, { status: 400 });
      }
      endDate = endDateParam;
    }

    // Validate sort field
    if (!VALID_SORT_FIELDS.includes(sortParam as ValidSortField)) {
      return NextResponse.json({
        error: `Sort field must be one of: ${VALID_SORT_FIELDS.join(', ')}`,
        code: 'INVALID_SORT_FIELD'
      }, { status: 400 });
    }

    // Validate order
    if (orderParam !== 'asc' && orderParam !== 'desc') {
      return NextResponse.json({
        error: 'Order must be either "asc" or "desc"',
        code: 'INVALID_ORDER'
      }, { status: 400 });
    }

    // Build WHERE conditions
    const conditions: SQL[] = [];

    if (deviceId !== null) {
      conditions.push(eq(temperatureReadings.deviceId, deviceId));
    }

    if (startDate !== null) {
      conditions.push(gte(temperatureReadings.readingDate, startDate));
    }

    if (endDate !== null) {
      conditions.push(lte(temperatureReadings.readingDate, endDate));
    }

    // Build WHERE clause
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Map sort field to column
    const sortColumnMap: Record<ValidSortField, any> = {
      id: temperatureReadings.id,
      deviceId: temperatureReadings.deviceId,
      readingDate: temperatureReadings.readingDate,
      hour: temperatureReadings.hour,
      temperature: temperatureReadings.temperature,
      createdAt: temperatureReadings.createdAt,
    };

    const sortColumn = sortColumnMap[sortParam as ValidSortField];
    const orderFunction = orderParam === 'asc' ? asc : desc;

    // Execute count query
    const countQuery = whereClause
      ? db.select({ count: count() }).from(temperatureReadings).where(whereClause)
      : db.select({ count: count() }).from(temperatureReadings);

    const countResult = await countQuery;
    const total = countResult[0]?.count || 0;

    // Execute main query
    let query = db.select().from(temperatureReadings);

    if (whereClause) {
      query = query.where(whereClause) as any;
    }

    const readings = await query
      .orderBy(orderFunction(sortColumn))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      readings,
      total
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}