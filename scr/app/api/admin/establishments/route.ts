import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { establishments } from '@/db/schema';
import { requireAdmin } from '@/lib/authMiddleware';
import { like, eq, and, desc, asc, count, sql } from 'drizzle-orm';

const VALID_SORT_FIELDS = ['id', 'companyName', 'eik', 'establishmentType', 'employeeCount', 'createdAt'] as const;
const VALID_ORDERS = ['asc', 'desc'] as const;

export async function GET(request: NextRequest) {
  try {
    // Authenticate and verify admin role
    const authResult = requireAdmin(request);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error || 'Authentication required', code: 'UNAUTHORIZED' },
        { status: authResult.status }
      );
    }

    const searchParams = request.nextUrl.searchParams;

    // Parse and validate query parameters
    const companyName = searchParams.get('companyName');
    const eik = searchParams.get('eik');
    const establishmentType = searchParams.get('establishmentType');
    const limitParam = searchParams.get('limit') || '50';
    const offsetParam = searchParams.get('offset') || '0';
    const sortParam = searchParams.get('sort') || 'createdAt';
    const orderParam = searchParams.get('order') || 'desc';

    // Validate limit
    const limit = parseInt(limitParam);
    if (isNaN(limit) || limit < 1 || limit > 200) {
      return NextResponse.json(
        { error: 'Limit must be a positive integer between 1 and 200', code: 'INVALID_LIMIT' },
        { status: 400 }
      );
    }

    // Validate offset
    const offset = parseInt(offsetParam);
    if (isNaN(offset) || offset < 0) {
      return NextResponse.json(
        { error: 'Offset must be a non-negative integer', code: 'INVALID_OFFSET' },
        { status: 400 }
      );
    }

    // Validate sort field
    if (!VALID_SORT_FIELDS.includes(sortParam as any)) {
      return NextResponse.json(
        { 
          error: `Sort field must be one of: ${VALID_SORT_FIELDS.join(', ')}`, 
          code: 'INVALID_SORT_FIELD' 
        },
        { status: 400 }
      );
    }

    // Validate order
    if (!VALID_ORDERS.includes(orderParam as any)) {
      return NextResponse.json(
        { error: 'Order must be either "asc" or "desc"', code: 'INVALID_ORDER' },
        { status: 400 }
      );
    }

    // Build filter conditions
    const conditions = [];

    if (companyName) {
      conditions.push(like(establishments.companyName, `%${companyName}%`));
    }

    if (eik) {
      conditions.push(eq(establishments.eik, eik));
    }

    if (establishmentType) {
      conditions.push(eq(establishments.establishmentType, establishmentType));
    }

    // Map sort field to actual column name (handling camelCase to snake_case)
    const sortFieldMap: Record<string, any> = {
      id: establishments.id,
      companyName: establishments.companyName,
      eik: establishments.eik,
      establishmentType: establishments.establishmentType,
      employeeCount: establishments.employeeCount,
      createdAt: establishments.createdAt,
    };

    const sortColumn = sortFieldMap[sortParam];
    const orderFn = orderParam === 'asc' ? asc : desc;

    // Build query with filters
    let query = db.select().from(establishments);
    let countQuery = db.select({ count: count() }).from(establishments);

    if (conditions.length > 0) {
      const whereCondition = conditions.length === 1 ? conditions[0] : and(...conditions);
      query = query.where(whereCondition);
      countQuery = countQuery.where(whereCondition);
    }

    // Execute count query
    const totalResult = await countQuery;
    const total = totalResult[0]?.count || 0;

    // Execute main query with sorting and pagination
    const results = await query
      .orderBy(orderFn(sortColumn))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(
      {
        establishments: results,
        total: total,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('GET establishments error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}