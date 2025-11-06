import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { incomingControls, users, establishments } from '@/db/schema';
import { requireAdmin } from '@/lib/authMiddleware';
import { eq, and, desc, count } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    const adminCheck = requireAdmin(request);
    if ('error' in adminCheck) {
      return NextResponse.json(
        { error: adminCheck.error, code: 'UNAUTHORIZED' },
        { status: adminCheck.status }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    
    // Get and validate query parameters
    const dateParam = searchParams.get('date');
    const userIdParam = searchParams.get('userId');
    const limitParam = searchParams.get('limit') || '50';
    const offsetParam = searchParams.get('offset') || '0';

    // Validate date format (YYYY-MM-DD)
    if (dateParam) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateParam)) {
        return NextResponse.json({ 
          error: 'Invalid date format. Expected YYYY-MM-DD',
          code: 'INVALID_DATE_FORMAT'
        }, { status: 400 });
      }
      
      // Additional validation: check if date is valid
      const dateParts = dateParam.split('-');
      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]);
      const day = parseInt(dateParts[2]);
      const dateObj = new Date(year, month - 1, day);
      
      if (dateObj.getFullYear() !== year || 
          dateObj.getMonth() !== month - 1 || 
          dateObj.getDate() !== day) {
        return NextResponse.json({ 
          error: 'Invalid date value',
          code: 'INVALID_DATE_VALUE'
        }, { status: 400 });
      }
    }

    // Validate userId
    let userId: number | null = null;
    if (userIdParam) {
      userId = parseInt(userIdParam);
      if (isNaN(userId) || userId <= 0) {
        return NextResponse.json({ 
          error: 'Invalid userId. Must be a positive integer',
          code: 'INVALID_USER_ID'
        }, { status: 400 });
      }
    }

    // Validate limit
    const limit = parseInt(limitParam);
    if (isNaN(limit) || limit < 1 || limit > 200) {
      return NextResponse.json({ 
        error: 'Invalid limit. Must be between 1 and 200',
        code: 'INVALID_LIMIT'
      }, { status: 400 });
    }

    // Validate offset
    const offset = parseInt(offsetParam);
    if (isNaN(offset) || offset < 0) {
      return NextResponse.json({ 
        error: 'Invalid offset. Must be a non-negative integer',
        code: 'INVALID_OFFSET'
      }, { status: 400 });
    }

    // Build WHERE conditions
    const conditions = [];
    
    if (dateParam) {
      conditions.push(eq(incomingControls.controlDate, dateParam));
    }
    
    if (userId) {
      conditions.push(eq(incomingControls.userId, userId));
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    // Execute query with LEFT JOINs
    const controlsQuery = db
      .select({
        id: incomingControls.id,
        userId: incomingControls.userId,
        establishmentId: incomingControls.establishmentId,
        controlDate: incomingControls.controlDate,
        imageUrl: incomingControls.imageUrl,
        notes: incomingControls.notes,
        createdAt: incomingControls.createdAt,
        updatedAt: incomingControls.updatedAt,
        userEmail: users.email,
        companyName: establishments.companyName,
        establishmentType: establishments.establishmentType,
      })
      .from(incomingControls)
      .leftJoin(users, eq(incomingControls.userId, users.id))
      .leftJoin(establishments, eq(incomingControls.establishmentId, establishments.id))
      .orderBy(desc(incomingControls.controlDate), desc(incomingControls.createdAt))
      .limit(limit)
      .offset(offset);

    // Apply WHERE condition if filters exist
    const controls = whereCondition 
      ? await controlsQuery.where(whereCondition)
      : await controlsQuery;

    // Get total count with same filters
    const countQuery = db
      .select({ count: count() })
      .from(incomingControls);

    const totalResult = whereCondition
      ? await countQuery.where(whereCondition)
      : await countQuery;

    const total = totalResult[0]?.count || 0;

    return NextResponse.json({
      controls,
      total
    }, { status: 200 });

  } catch (error) {
    console.error('GET admin incoming controls error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error,
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}