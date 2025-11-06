import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { foodItems, foodDiary } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '@/lib/authMiddleware';

export async function POST(request: NextRequest) {
  try {
    const authResult = requireAuth(request);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error, code: 'UNAUTHORIZED' },
        { status: authResult.status }
      );
    }

    const userId = authResult.user.userId;

    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      requestBody = {};
    }

    const daysToGenerate = requestBody.daysToGenerate ?? 20;

    if (typeof daysToGenerate !== 'number' || daysToGenerate < 0 || daysToGenerate > 365) {
      return NextResponse.json(
        { 
          error: 'daysToGenerate must be a number between 0 and 365',
          code: 'INVALID_DAYS_TO_GENERATE' 
        },
        { status: 400 }
      );
    }

    const userFoodItems = await db
      .select()
      .from(foodItems)
      .where(eq(foodItems.userId, userId));

    if (userFoodItems.length === 0) {
      return NextResponse.json({
        message: 'No food items found for user. Please add food items first.',
        entriesGenerated: 0,
        daysCovered: 0,
        foodItemsProcessed: 0,
        startDate: '',
        endDate: ''
      });
    }

    const today = new Date();
    const endDate = new Date(today);
    endDate.setHours(0, 0, 0, 0);
    
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - daysToGenerate);

    const timeSlots = ['08:00', '17:00'];
    const entriesToInsert: Array<{
      userId: number;
      foodItemId: number;
      date: string;
      time: string;
      quantity: null;
      temperature: number | null;
      shelfLifeHours: number;
      notes: null;
      establishmentId: number | null;
      createdAt: string;
      updatedAt: string;
    }> = [];

    const currentDate = new Date(startDate);
    const dates: string[] = [];
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dates.push(dateStr);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const existingEntries = await db
      .select()
      .from(foodDiary)
      .where(eq(foodDiary.userId, userId));

    const existingEntriesSet = new Set(
      existingEntries.map(entry => 
        `${entry.userId}-${entry.foodItemId}-${entry.date}-${entry.time}`
      )
    );

    const currentTimestamp = new Date().toISOString();

    for (const date of dates) {
      for (const foodItem of userFoodItems) {
        for (const time of timeSlots) {
          const entryKey = `${userId}-${foodItem.id}-${date}-${time}`;
          
          if (existingEntriesSet.has(entryKey)) {
            continue;
          }

          entriesToInsert.push({
            userId,
            foodItemId: foodItem.id,
            date,
            time,
            quantity: null,
            temperature: foodItem.cookingTemperature,
            shelfLifeHours: foodItem.shelfLifeHours,
            notes: null,
            establishmentId: foodItem.establishmentId,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp
          });
        }
      }
    }

    let insertedCount = 0;
    if (entriesToInsert.length > 0) {
      const inserted = await db
        .insert(foodDiary)
        .values(entriesToInsert)
        .returning();
      insertedCount = inserted.length;
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    return NextResponse.json({
      message: `Successfully generated ${insertedCount} food diary entries`,
      entriesGenerated: insertedCount,
      daysCovered: dates.length,
      foodItemsProcessed: userFoodItems.length,
      startDate: startDateStr,
      endDate: endDateStr
    });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}