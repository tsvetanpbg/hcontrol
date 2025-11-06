import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { foodTemplates, foodItems, establishments, personnel } from '@/db/schema';
import { eq, and, desc, count, inArray } from 'drizzle-orm';
import { requireAuth } from '@/lib/authMiddleware';

const VALID_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_FORMAT_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

export async function GET(request: NextRequest) {
  try {
    const authResult = requireAuth(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error, code: 'UNAUTHORIZED' }, { status: authResult.status });
    }
    const user = authResult.user;

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const establishmentIdParam = searchParams.get('establishmentId');

    let limit = 50;
    if (limitParam) {
      const parsedLimit = parseInt(limitParam);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 200) {
        return NextResponse.json({
          error: 'Limit must be between 1 and 200',
          code: 'INVALID_LIMIT'
        }, { status: 400 });
      }
      limit = parsedLimit;
    }

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

    const conditions = [eq(foodTemplates.userId, user.userId)];

    if (establishmentIdParam) {
      const establishmentId = parseInt(establishmentIdParam);
      if (isNaN(establishmentId)) {
        return NextResponse.json({
          error: 'Invalid establishment ID',
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
          error: 'Establishment not found',
          code: 'ESTABLISHMENT_NOT_FOUND'
        }, { status: 404 });
      }

      conditions.push(eq(foodTemplates.establishmentId, establishmentId));
    }

    const [{ value: total }] = await db.select({ value: count() })
      .from(foodTemplates)
      .where(and(...conditions));

    const templates = await db.select()
      .from(foodTemplates)
      .where(and(...conditions))
      .orderBy(desc(foodTemplates.createdAt))
      .limit(limit)
      .offset(offset);

    const parsedTemplates = templates.map(template => ({
      ...template,
      daysOfWeek: typeof template.daysOfWeek === 'string' 
        ? JSON.parse(template.daysOfWeek) 
        : template.daysOfWeek,
      preparationTimes: typeof template.preparationTimes === 'string'
        ? JSON.parse(template.preparationTimes)
        : template.preparationTimes,
      foodItemIds: typeof template.foodItemIds === 'string'
        ? JSON.parse(template.foodItemIds)
        : template.foodItemIds
    }));

    return NextResponse.json({
      templates: parsedTemplates,
      total
    });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = requireAuth(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error, code: 'UNAUTHORIZED' }, { status: authResult.status });
    }
    const user = authResult.user;

    const body = await request.json();

    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({
        error: 'User ID cannot be provided in request body',
        code: 'USER_ID_NOT_ALLOWED'
      }, { status: 400 });
    }

    const { name, daysOfWeek, preparationTimes, foodItemIds, establishmentId, employeeId } = body;

    if (!name) {
      return NextResponse.json({
        error: 'Name is required',
        code: 'MISSING_NAME'
      }, { status: 400 });
    }

    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      return NextResponse.json({
        error: 'Name cannot be empty',
        code: 'INVALID_NAME'
      }, { status: 400 });
    }

    if (!daysOfWeek) {
      return NextResponse.json({
        error: 'Days of week is required',
        code: 'MISSING_DAYS_OF_WEEK'
      }, { status: 400 });
    }

    if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
      return NextResponse.json({
        error: 'Days of week must be a non-empty array',
        code: 'INVALID_DAYS_OF_WEEK'
      }, { status: 400 });
    }

    for (const day of daysOfWeek) {
      if (typeof day !== 'string' || !VALID_DAYS.includes(day)) {
        return NextResponse.json({
          error: `Invalid day name: ${day}. Must be one of: ${VALID_DAYS.join(', ')}`,
          code: 'INVALID_DAY_NAME'
        }, { status: 400 });
      }
    }

    if (!preparationTimes) {
      return NextResponse.json({
        error: 'Preparation times is required',
        code: 'MISSING_PREPARATION_TIMES'
      }, { status: 400 });
    }

    if (!Array.isArray(preparationTimes) || preparationTimes.length === 0) {
      return NextResponse.json({
        error: 'Preparation times must be a non-empty array',
        code: 'INVALID_PREPARATION_TIMES'
      }, { status: 400 });
    }

    for (const time of preparationTimes) {
      if (typeof time !== 'string' || !TIME_FORMAT_REGEX.test(time)) {
        return NextResponse.json({
          error: `Invalid time format: ${time}. Must be in HH:MM format (00:00 to 23:59)`,
          code: 'INVALID_TIME_FORMAT'
        }, { status: 400 });
      }
    }

    if (!foodItemIds) {
      return NextResponse.json({
        error: 'Food item IDs is required',
        code: 'MISSING_FOOD_ITEM_IDS'
      }, { status: 400 });
    }

    if (!Array.isArray(foodItemIds) || foodItemIds.length === 0) {
      return NextResponse.json({
        error: 'Food item IDs must be a non-empty array',
        code: 'INVALID_FOOD_ITEM_IDS'
      }, { status: 400 });
    }

    const parsedFoodItemIds: number[] = [];
    for (const id of foodItemIds) {
      const parsedId = typeof id === 'number' ? id : parseInt(id);
      if (isNaN(parsedId)) {
        return NextResponse.json({
          error: `Invalid food item ID: ${id}`,
          code: 'INVALID_FOOD_ITEM_IDS'
        }, { status: 400 });
      }
      parsedFoodItemIds.push(parsedId);
    }

    const existingFoodItems = await db.select()
      .from(foodItems)
      .where(and(
        inArray(foodItems.id, parsedFoodItemIds),
        eq(foodItems.userId, user.userId)
      ));

    if (existingFoodItems.length !== parsedFoodItemIds.length) {
      const foundIds = existingFoodItems.map(item => item.id);
      const missingIds = parsedFoodItemIds.filter(id => !foundIds.includes(id));
      
      const unauthorizedItems = await db.select()
        .from(foodItems)
        .where(inArray(foodItems.id, missingIds));

      if (unauthorizedItems.length > 0) {
        return NextResponse.json({
          error: 'Access denied to one or more food items',
          code: 'FOOD_ITEM_ACCESS_DENIED'
        }, { status: 403 });
      }

      return NextResponse.json({
        error: 'One or more food items not found',
        code: 'FOOD_ITEM_NOT_FOUND'
      }, { status: 404 });
    }

    let validatedEstablishmentId = null;
    if (establishmentId !== undefined && establishmentId !== null) {
      const parsedEstablishmentId = typeof establishmentId === 'number' ? establishmentId : parseInt(establishmentId);
      if (isNaN(parsedEstablishmentId)) {
        return NextResponse.json({
          error: 'Invalid establishment ID',
          code: 'INVALID_ESTABLISHMENT_ID'
        }, { status: 400 });
      }

      const establishment = await db.select()
        .from(establishments)
        .where(and(
          eq(establishments.id, parsedEstablishmentId),
          eq(establishments.userId, user.userId)
        ))
        .limit(1);

      if (establishment.length === 0) {
        return NextResponse.json({
          error: 'Establishment not found',
          code: 'ESTABLISHMENT_NOT_FOUND'
        }, { status: 404 });
      }

      validatedEstablishmentId = parsedEstablishmentId;
    }

    let validatedEmployeeId = null;
    if (employeeId !== undefined && employeeId !== null) {
      const parsedEmployeeId = typeof employeeId === 'number' ? employeeId : parseInt(employeeId);
      if (isNaN(parsedEmployeeId)) {
        return NextResponse.json({
          error: 'Invalid employee ID',
          code: 'INVALID_EMPLOYEE_ID'
        }, { status: 400 });
      }

      const personnelRecord = await db.select()
        .from(personnel)
        .where(eq(personnel.id, parsedEmployeeId))
        .limit(1);

      if (personnelRecord.length === 0) {
        return NextResponse.json({
          error: 'Employee not found',
          code: 'EMPLOYEE_NOT_FOUND'
        }, { status: 404 });
      }

      const personnelEstablishment = await db.select()
        .from(establishments)
        .where(and(
          eq(establishments.id, personnelRecord[0].establishmentId),
          eq(establishments.userId, user.userId)
        ))
        .limit(1);

      if (personnelEstablishment.length === 0) {
        return NextResponse.json({
          error: 'Access denied to employee',
          code: 'EMPLOYEE_ACCESS_DENIED'
        }, { status: 403 });
      }

      if (validatedEstablishmentId !== null && personnelRecord[0].establishmentId !== validatedEstablishmentId) {
        return NextResponse.json({
          error: 'Employee does not belong to the specified establishment',
          code: 'EMPLOYEE_ESTABLISHMENT_MISMATCH'
        }, { status: 400 });
      }

      validatedEmployeeId = parsedEmployeeId;
    }

    const now = new Date().toISOString();
    const newTemplate = await db.insert(foodTemplates)
      .values({
        userId: user.userId,
        name: trimmedName,
        daysOfWeek: JSON.stringify(daysOfWeek),
        preparationTimes: JSON.stringify(preparationTimes),
        foodItemIds: JSON.stringify(parsedFoodItemIds),
        establishmentId: validatedEstablishmentId,
        employeeId: validatedEmployeeId,
        createdAt: now,
        updatedAt: now
      })
      .returning();

    const responseTemplate = {
      ...newTemplate[0],
      daysOfWeek: JSON.parse(newTemplate[0].daysOfWeek as string),
      preparationTimes: JSON.parse(newTemplate[0].preparationTimes as string),
      foodItemIds: JSON.parse(newTemplate[0].foodItemIds as string)
    };

    return NextResponse.json(responseTemplate, { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}