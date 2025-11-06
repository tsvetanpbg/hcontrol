import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { cleaningTemplates, establishments, personnel } from '@/db/schema';
import { requireAuth } from '@/lib/authMiddleware';
import { eq, and, desc, count } from 'drizzle-orm';

const VALID_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const TIME_REGEX = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;
    const { searchParams } = new URL(request.url);

    const establishmentIdParam = searchParams.get('establishmentId');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    const limit = limitParam ? Math.min(parseInt(limitParam), 200) : 50;
    const offset = offsetParam ? parseInt(offsetParam) : 0;

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

    let whereConditions = eq(cleaningTemplates.userId, user.userId);

    if (establishmentIdParam) {
      const establishmentId = parseInt(establishmentIdParam);
      if (isNaN(establishmentId)) {
        return NextResponse.json({ 
          error: 'Invalid establishmentId parameter',
          code: 'INVALID_ESTABLISHMENT_ID' 
        }, { status: 400 });
      }

      const establishment = await db.select()
        .from(establishments)
        .where(and(
          eq(establishments.id, establishmentId),
          eq(establishments.userId, user.userId)
        ))
        .limit(1);

      if (establishment.length === 0) {
        return NextResponse.json({ 
          error: 'Establishment not found or access denied',
          code: 'ESTABLISHMENT_NOT_FOUND' 
        }, { status: 404 });
      }

      whereConditions = and(
        eq(cleaningTemplates.userId, user.userId),
        eq(cleaningTemplates.establishmentId, establishmentId)
      );
    }

    const templates = await db.select()
      .from(cleaningTemplates)
      .where(whereConditions)
      .orderBy(desc(cleaningTemplates.createdAt))
      .limit(limit)
      .offset(offset);

    const totalCount = await db.select({ count: count() })
      .from(cleaningTemplates)
      .where(whereConditions);

    return NextResponse.json({
      templates,
      total: totalCount[0].count
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;
    const body = await request.json();

    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: 'User ID cannot be provided in request body',
        code: 'USER_ID_NOT_ALLOWED' 
      }, { status: 400 });
    }

    const { 
      name, 
      daysOfWeek, 
      cleaningHours, 
      duration, 
      products, 
      cleaningAreas,
      establishmentId,
      employeeId 
    } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Name is required and must be a non-empty string',
        code: 'INVALID_NAME' 
      }, { status: 400 });
    }

    if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
      return NextResponse.json({ 
        error: 'daysOfWeek must be a non-empty array',
        code: 'INVALID_DAYS_OF_WEEK' 
      }, { status: 400 });
    }

    for (const day of daysOfWeek) {
      if (!VALID_DAYS.includes(day.toLowerCase())) {
        return NextResponse.json({ 
          error: `Invalid day: ${day}. Must be one of: ${VALID_DAYS.join(', ')}`,
          code: 'INVALID_DAY_NAME' 
        }, { status: 400 });
      }
    }

    if (!Array.isArray(cleaningHours) || cleaningHours.length === 0) {
      return NextResponse.json({ 
        error: 'cleaningHours must be a non-empty array',
        code: 'INVALID_CLEANING_HOURS' 
      }, { status: 400 });
    }

    for (const hour of cleaningHours) {
      if (!TIME_REGEX.test(hour)) {
        return NextResponse.json({ 
          error: `Invalid time format: ${hour}. Must be HH:MM format (e.g., 09:30, 14:00)`,
          code: 'INVALID_TIME_FORMAT' 
        }, { status: 400 });
      }
    }

    if (!duration || typeof duration !== 'number' || duration <= 0) {
      return NextResponse.json({ 
        error: 'Duration must be a positive integer',
        code: 'INVALID_DURATION' 
      }, { status: 400 });
    }

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ 
        error: 'Products must be a non-empty array',
        code: 'INVALID_PRODUCTS' 
      }, { status: 400 });
    }

    if (!Array.isArray(cleaningAreas) || cleaningAreas.length === 0) {
      return NextResponse.json({ 
        error: 'cleaningAreas must be a non-empty array',
        code: 'INVALID_CLEANING_AREAS' 
      }, { status: 400 });
    }

    if (establishmentId !== undefined && establishmentId !== null) {
      if (typeof establishmentId !== 'number' || isNaN(establishmentId)) {
        return NextResponse.json({ 
          error: 'establishmentId must be a valid integer',
          code: 'INVALID_ESTABLISHMENT_ID' 
        }, { status: 400 });
      }

      const establishment = await db.select()
        .from(establishments)
        .where(and(
          eq(establishments.id, establishmentId),
          eq(establishments.userId, user.userId)
        ))
        .limit(1);

      if (establishment.length === 0) {
        return NextResponse.json({ 
          error: 'Establishment not found or you do not have access to it',
          code: 'ESTABLISHMENT_NOT_FOUND' 
        }, { status: 404 });
      }
    }

    if (employeeId !== undefined && employeeId !== null) {
      if (typeof employeeId !== 'number' || isNaN(employeeId)) {
        return NextResponse.json({ 
          error: 'employeeId must be a valid integer',
          code: 'INVALID_EMPLOYEE_ID' 
        }, { status: 400 });
      }

      const employee = await db.select({ 
        id: personnel.id, 
        establishmentId: personnel.establishmentId 
      })
        .from(personnel)
        .innerJoin(establishments, eq(personnel.establishmentId, establishments.id))
        .where(and(
          eq(personnel.id, employeeId),
          eq(establishments.userId, user.userId)
        ))
        .limit(1);

      if (employee.length === 0) {
        return NextResponse.json({ 
          error: 'Employee not found or does not belong to your establishment',
          code: 'EMPLOYEE_NOT_FOUND' 
        }, { status: 404 });
      }

      if (establishmentId && employee[0].establishmentId !== establishmentId) {
        return NextResponse.json({ 
          error: 'Employee does not belong to the specified establishment',
          code: 'EMPLOYEE_ESTABLISHMENT_MISMATCH' 
        }, { status: 403 });
      }
    }

    const now = new Date().toISOString();

    const insertData: any = {
      userId: user.userId,
      name: name.trim(),
      daysOfWeek: JSON.stringify(daysOfWeek),
      cleaningHours: JSON.stringify(cleaningHours),
      duration,
      products: JSON.stringify(products),
      cleaningAreas: JSON.stringify(cleaningAreas),
      createdAt: now,
      updatedAt: now
    };

    if (establishmentId !== undefined && establishmentId !== null) {
      insertData.establishmentId = establishmentId;
    }

    if (employeeId !== undefined && employeeId !== null) {
      insertData.employeeId = employeeId;
    }

    const newTemplate = await db.insert(cleaningTemplates)
      .values(insertData)
      .returning();

    return NextResponse.json(newTemplate[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 });
  }
}