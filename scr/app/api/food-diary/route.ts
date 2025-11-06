import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { foodDiary, foodItems } from '@/db/schema';
import { eq, and, gte, lte, desc, asc, count } from 'drizzle-orm';
import { requireAuth } from '@/lib/authMiddleware';

export async function GET(request: NextRequest) {
  try {
    const authResult = requireAuth(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error, code: 'AUTH_REQUIRED' }, { status: authResult.status });
    }

    const userId = authResult.user.userId;
    const searchParams = request.nextUrl.searchParams;

    // Parse and validate limit
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : 50;
    if (isNaN(limit) || limit < 1) {
      return NextResponse.json({ 
        error: 'Invalid limit parameter. Must be a positive integer.',
        code: 'INVALID_LIMIT' 
      }, { status: 400 });
    }
    const validatedLimit = Math.min(limit, 200);

    // Parse and validate offset
    const offsetParam = searchParams.get('offset');
    const offset = offsetParam ? parseInt(offsetParam) : 0;
    if (isNaN(offset) || offset < 0) {
      return NextResponse.json({ 
        error: 'Invalid offset parameter. Must be a non-negative integer.',
        code: 'INVALID_OFFSET' 
      }, { status: 400 });
    }

    // Parse and validate optional filters
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const establishmentIdParam = searchParams.get('establishmentId');
    const foodItemIdParam = searchParams.get('foodItemId');

    // Validate date formats (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (startDate && !dateRegex.test(startDate)) {
      return NextResponse.json({ 
        error: 'Invalid startDate format. Use YYYY-MM-DD.',
        code: 'INVALID_START_DATE' 
      }, { status: 400 });
    }
    if (endDate && !dateRegex.test(endDate)) {
      return NextResponse.json({ 
        error: 'Invalid endDate format. Use YYYY-MM-DD.',
        code: 'INVALID_END_DATE' 
      }, { status: 400 });
    }

    // Validate optional integer filters
    let establishmentId: number | undefined;
    let foodItemId: number | undefined;

    if (establishmentIdParam) {
      establishmentId = parseInt(establishmentIdParam);
      if (isNaN(establishmentId)) {
        return NextResponse.json({ 
          error: 'Invalid establishmentId parameter. Must be an integer.',
          code: 'INVALID_ESTABLISHMENT_ID' 
        }, { status: 400 });
      }
    }

    if (foodItemIdParam) {
      foodItemId = parseInt(foodItemIdParam);
      if (isNaN(foodItemId)) {
        return NextResponse.json({ 
          error: 'Invalid foodItemId parameter. Must be an integer.',
          code: 'INVALID_FOOD_ITEM_ID' 
        }, { status: 400 });
      }
    }

    // Build WHERE conditions
    const conditions = [eq(foodDiary.userId, userId)];

    if (startDate) {
      conditions.push(gte(foodDiary.date, startDate));
    }

    if (endDate) {
      conditions.push(lte(foodDiary.date, endDate));
    }

    if (establishmentId !== undefined) {
      conditions.push(eq(foodDiary.establishmentId, establishmentId));
    }

    if (foodItemId !== undefined) {
      conditions.push(eq(foodDiary.foodItemId, foodItemId));
    }

    const whereCondition = conditions.length > 1 ? and(...conditions) : conditions[0];

    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(foodDiary)
      .where(whereCondition);

    const total = totalResult[0]?.count ?? 0;

    // Get entries with food item details
    const entries = await db
      .select({
        id: foodDiary.id,
        userId: foodDiary.userId,
        foodItemId: foodDiary.foodItemId,
        foodItemName: foodItems.name,
        date: foodDiary.date,
        time: foodDiary.time,
        quantity: foodDiary.quantity,
        temperature: foodDiary.temperature,
        shelfLifeHours: foodDiary.shelfLifeHours,
        notes: foodDiary.notes,
        establishmentId: foodDiary.establishmentId,
        createdAt: foodDiary.createdAt,
        updatedAt: foodDiary.updatedAt,
      })
      .from(foodDiary)
      .leftJoin(foodItems, eq(foodDiary.foodItemId, foodItems.id))
      .where(whereCondition)
      .orderBy(desc(foodDiary.date), asc(foodDiary.time))
      .limit(validatedLimit)
      .offset(offset);

    return NextResponse.json({
      entries,
      total,
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}