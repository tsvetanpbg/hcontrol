import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { foodItems, establishments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '@/lib/authMiddleware';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = requireAuth(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const foodItem = await db.select()
      .from(foodItems)
      .where(eq(foodItems.id, parseInt(id)))
      .limit(1);

    if (foodItem.length === 0) {
      return NextResponse.json({ 
        error: 'Food item not found',
        code: 'FOOD_ITEM_NOT_FOUND' 
      }, { status: 404 });
    }

    if (foodItem[0].userId !== authResult.user.userId) {
      return NextResponse.json({ 
        error: 'Access denied',
        code: 'ACCESS_DENIED' 
      }, { status: 403 });
    }

    return NextResponse.json(foodItem[0], { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = requireAuth(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const requestBody = await request.json();

    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        error: 'User ID cannot be provided in request body',
        code: 'USER_ID_NOT_ALLOWED' 
      }, { status: 400 });
    }

    const existingFoodItem = await db.select()
      .from(foodItems)
      .where(eq(foodItems.id, parseInt(id)))
      .limit(1);

    if (existingFoodItem.length === 0) {
      return NextResponse.json({ 
        error: 'Food item not found',
        code: 'FOOD_ITEM_NOT_FOUND' 
      }, { status: 404 });
    }

    if (existingFoodItem[0].userId !== authResult.user.userId) {
      return NextResponse.json({ 
        error: 'Access denied',
        code: 'ACCESS_DENIED' 
      }, { status: 403 });
    }

    const { name, cookingTemperature, shelfLifeHours, establishmentId } = requestBody;

    if (name !== undefined && (!name || name.trim() === '')) {
      return NextResponse.json({ 
        error: 'Name cannot be empty',
        code: 'INVALID_NAME' 
      }, { status: 400 });
    }

    if (shelfLifeHours !== undefined) {
      if (!Number.isInteger(shelfLifeHours) || shelfLifeHours <= 0) {
        return NextResponse.json({ 
          error: 'Shelf life hours must be a positive integer',
          code: 'INVALID_SHELF_LIFE' 
        }, { status: 400 });
      }
    }

    if (establishmentId !== undefined && establishmentId !== null) {
      const establishment = await db.select()
        .from(establishments)
        .where(and(
          eq(establishments.id, establishmentId),
          eq(establishments.userId, authResult.user.userId)
        ))
        .limit(1);

      if (establishment.length === 0) {
        return NextResponse.json({ 
          error: 'Establishment not found or access denied',
          code: 'ESTABLISHMENT_NOT_FOUND' 
        }, { status: 404 });
      }
    }

    const updates: any = {
      updatedAt: new Date().toISOString()
    };

    if (name !== undefined) updates.name = name.trim();
    if (cookingTemperature !== undefined) updates.cookingTemperature = cookingTemperature;
    if (shelfLifeHours !== undefined) updates.shelfLifeHours = shelfLifeHours;
    if (establishmentId !== undefined) updates.establishmentId = establishmentId;

    const updated = await db.update(foodItems)
      .set(updates)
      .where(and(
        eq(foodItems.id, parseInt(id)),
        eq(foodItems.userId, authResult.user.userId)
      ))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ 
        error: 'Food item not found',
        code: 'FOOD_ITEM_NOT_FOUND' 
      }, { status: 404 });
    }

    return NextResponse.json(updated[0], { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = requireAuth(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const existingFoodItem = await db.select()
      .from(foodItems)
      .where(eq(foodItems.id, parseInt(id)))
      .limit(1);

    if (existingFoodItem.length === 0) {
      return NextResponse.json({ 
        error: 'Food item not found',
        code: 'FOOD_ITEM_NOT_FOUND' 
      }, { status: 404 });
    }

    if (existingFoodItem[0].userId !== authResult.user.userId) {
      return NextResponse.json({ 
        error: 'Access denied',
        code: 'ACCESS_DENIED' 
      }, { status: 403 });
    }

    const deleted = await db.delete(foodItems)
      .where(and(
        eq(foodItems.id, parseInt(id)),
        eq(foodItems.userId, authResult.user.userId)
      ))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ 
        error: 'Food item not found',
        code: 'FOOD_ITEM_NOT_FOUND' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Food item deleted successfully',
      deletedId: parseInt(id),
      deletedRecord: deleted[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}