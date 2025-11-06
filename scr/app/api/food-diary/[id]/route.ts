import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { foodDiary, foodItems } from '@/db/schema';
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
    const user = authResult.user;

    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const diaryEntryId = parseInt(id);

    const result = await db
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
      .where(eq(foodDiary.id, diaryEntryId))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ 
        error: 'Diary entry not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    const diaryEntry = result[0];

    if (diaryEntry.userId !== user.userId) {
      return NextResponse.json({ 
        error: 'Access denied: This diary entry does not belong to you',
        code: 'ACCESS_DENIED' 
      }, { status: 403 });
    }

    return NextResponse.json(diaryEntry, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
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
    const user = authResult.user;

    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const diaryEntryId = parseInt(id);

    const requestBody = await request.json();

    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        error: 'User ID cannot be provided in request body',
        code: 'USER_ID_NOT_ALLOWED' 
      }, { status: 400 });
    }

    if ('date' in requestBody || 'foodItemId' in requestBody || 'temperature' in requestBody || 'shelfLifeHours' in requestBody) {
      return NextResponse.json({ 
        error: 'Cannot update system fields: date, foodItemId, temperature, shelfLifeHours',
        code: 'SYSTEM_FIELDS_NOT_ALLOWED' 
      }, { status: 400 });
    }

    const existingEntry = await db
      .select()
      .from(foodDiary)
      .where(eq(foodDiary.id, diaryEntryId))
      .limit(1);

    if (existingEntry.length === 0) {
      return NextResponse.json({ 
        error: 'Diary entry not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    if (existingEntry[0].userId !== user.userId) {
      return NextResponse.json({ 
        error: 'Access denied: This diary entry does not belong to you',
        code: 'ACCESS_DENIED' 
      }, { status: 403 });
    }

    const { quantity, notes, time } = requestBody;

    if (time !== undefined) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(time)) {
        return NextResponse.json({ 
          error: 'Invalid time format. Expected HH:MM format',
          code: 'INVALID_TIME_FORMAT' 
        }, { status: 400 });
      }
    }

    const updates: any = {
      updatedAt: new Date().toISOString()
    };

    if (quantity !== undefined) {
      updates.quantity = quantity;
    }

    if (notes !== undefined) {
      updates.notes = notes;
    }

    if (time !== undefined) {
      updates.time = time;
    }

    const updated = await db
      .update(foodDiary)
      .set(updates)
      .where(and(
        eq(foodDiary.id, diaryEntryId),
        eq(foodDiary.userId, user.userId)
      ))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to update diary entry',
        code: 'UPDATE_FAILED' 
      }, { status: 500 });
    }

    return NextResponse.json(updated[0], { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
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
    const user = authResult.user;

    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const diaryEntryId = parseInt(id);

    const existingEntry = await db
      .select()
      .from(foodDiary)
      .where(eq(foodDiary.id, diaryEntryId))
      .limit(1);

    if (existingEntry.length === 0) {
      return NextResponse.json({ 
        error: 'Diary entry not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    if (existingEntry[0].userId !== user.userId) {
      return NextResponse.json({ 
        error: 'Access denied: This diary entry does not belong to you',
        code: 'ACCESS_DENIED' 
      }, { status: 403 });
    }

    const deleted = await db
      .delete(foodDiary)
      .where(and(
        eq(foodDiary.id, diaryEntryId),
        eq(foodDiary.userId, user.userId)
      ))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to delete diary entry',
        code: 'DELETE_FAILED' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Diary entry deleted successfully',
      deletedId: diaryEntryId,
      deletedEntry: deleted[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}