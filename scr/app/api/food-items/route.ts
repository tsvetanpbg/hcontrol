import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { foodItems, establishments } from '@/db/schema';
import { eq, and, desc, count } from 'drizzle-orm';
import { requireAuth } from '@/lib/authMiddleware';

export async function GET(request: NextRequest) {
  try {
    const authResult = requireAuth(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const user = authResult.user;
    const searchParams = request.nextUrl.searchParams;
    
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const establishmentId = searchParams.get('establishmentId');

    let whereCondition = eq(foodItems.userId, user.userId);
    
    if (establishmentId) {
      const estId = parseInt(establishmentId);
      if (isNaN(estId)) {
        return NextResponse.json({ 
          error: 'Invalid establishment ID',
          code: 'INVALID_ESTABLISHMENT_ID' 
        }, { status: 400 });
      }
      whereCondition = and(
        eq(foodItems.userId, user.userId),
        eq(foodItems.establishmentId, estId)
      ) as any;
    }

    const [items, totalCount] = await Promise.all([
      db.select()
        .from(foodItems)
        .where(whereCondition)
        .orderBy(desc(foodItems.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() })
        .from(foodItems)
        .where(whereCondition)
    ]);

    return NextResponse.json({
      items,
      total: totalCount[0].count,
      limit,
      offset
    }, { status: 200 });

  } catch (error: any) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = requireAuth(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const user = authResult.user;
    const body = await request.json();

    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const { name, shelfLifeHours, cookingTemperature, establishmentId } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ 
        error: 'Name is required and must be a non-empty string',
        code: 'INVALID_NAME' 
      }, { status: 400 });
    }

    if (!shelfLifeHours || typeof shelfLifeHours !== 'number' || !Number.isInteger(shelfLifeHours) || shelfLifeHours <= 0) {
      return NextResponse.json({ 
        error: 'Shelf life hours is required and must be a positive integer',
        code: 'INVALID_SHELF_LIFE' 
      }, { status: 400 });
    }

    if (cookingTemperature !== undefined && cookingTemperature !== null) {
      if (typeof cookingTemperature !== 'number' || !Number.isInteger(cookingTemperature)) {
        return NextResponse.json({ 
          error: 'Cooking temperature must be an integer',
          code: 'INVALID_COOKING_TEMPERATURE' 
        }, { status: 400 });
      }
    }

    if (establishmentId !== undefined && establishmentId !== null) {
      if (typeof establishmentId !== 'number' || !Number.isInteger(establishmentId)) {
        return NextResponse.json({ 
          error: 'Establishment ID must be an integer',
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
    }

    const now = new Date().toISOString();
    const insertData: any = {
      userId: user.userId,
      name: name.trim(),
      shelfLifeHours,
      createdAt: now,
      updatedAt: now
    };

    if (cookingTemperature !== undefined && cookingTemperature !== null) {
      insertData.cookingTemperature = cookingTemperature;
    }

    if (establishmentId !== undefined && establishmentId !== null) {
      insertData.establishmentId = establishmentId;
    }

    const newFoodItem = await db.insert(foodItems)
      .values(insertData)
      .returning();

    return NextResponse.json(newFoodItem[0], { status: 201 });

  } catch (error: any) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}