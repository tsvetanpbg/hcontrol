import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { temperatureLogs } from '@/db/schema';
import { eq, gte, lte, and, desc, asc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const { businessId } = params;

    // Validate businessId is a valid integer
    if (!businessId || isNaN(parseInt(businessId))) {
      return NextResponse.json(
        { 
          error: 'Valid business ID is required',
          code: 'INVALID_BUSINESS_ID'
        },
        { status: 400 }
      );
    }

    const businessIdInt = parseInt(businessId);

    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const equipmentType = searchParams.get('equipmentType');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validate limit and offset
    if (isNaN(limit) || limit < 1) {
      return NextResponse.json(
        {
          error: 'Limit must be a positive integer',
          code: 'INVALID_LIMIT'
        },
        { status: 400 }
      );
    }

    if (isNaN(offset) || offset < 0) {
      return NextResponse.json(
        {
          error: 'Offset must be a non-negative integer',
          code: 'INVALID_OFFSET'
        },
        { status: 400 }
      );
    }

    // Validate equipmentType if provided
    if (equipmentType) {
      const validTypes = ['refrigerator', 'freezer', 'hot_display', 'cold_display'];
      if (!validTypes.includes(equipmentType)) {
        return NextResponse.json(
          {
            error: 'Invalid equipment type. Must be one of: refrigerator, freezer, hot_display, cold_display',
            code: 'INVALID_EQUIPMENT_TYPE'
          },
          { status: 400 }
        );
      }
    }

    // Validate date formats if provided
    if (startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      return NextResponse.json(
        {
          error: 'Start date must be in YYYY-MM-DD format',
          code: 'INVALID_START_DATE'
        },
        { status: 400 }
      );
    }

    if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      return NextResponse.json(
        {
          error: 'End date must be in YYYY-MM-DD format',
          code: 'INVALID_END_DATE'
        },
        { status: 400 }
      );
    }

    // Build WHERE conditions
    const conditions = [eq(temperatureLogs.businessId, businessIdInt)];

    if (startDate) {
      conditions.push(gte(temperatureLogs.logDate, startDate));
    }

    if (endDate) {
      conditions.push(lte(temperatureLogs.logDate, endDate));
    }

    if (equipmentType) {
      conditions.push(eq(temperatureLogs.equipmentType, equipmentType));
    }

    // Execute query with filters, ordering, and pagination
    const logs = await db
      .select()
      .from(temperatureLogs)
      .where(and(...conditions))
      .orderBy(
        desc(temperatureLogs.logDate),
        asc(temperatureLogs.equipmentType),
        asc(temperatureLogs.equipmentNumber)
      )
      .limit(limit)
      .offset(offset);

    return NextResponse.json(logs, { status: 200 });

  } catch (error) {
    console.error('GET temperature logs error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}