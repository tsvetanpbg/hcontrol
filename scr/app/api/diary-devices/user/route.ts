import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { diaryDevices } from '@/db/schema';
import { requireAuth } from '@/lib/authMiddleware';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const authResult = requireAuth(request);
    
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error, code: 'UNAUTHORIZED' },
        { status: authResult.status }
      );
    }

    const userId = authResult.user.userId;

    // Parse optional establishmentId query parameter
    const { searchParams } = new URL(request.url);
    const establishmentIdParam = searchParams.get('establishmentId');

    // Build WHERE conditions
    let whereCondition = eq(diaryDevices.userId, userId);

    if (establishmentIdParam) {
      const establishmentId = parseInt(establishmentIdParam);
      
      if (isNaN(establishmentId)) {
        return NextResponse.json(
          { error: 'Invalid establishmentId parameter', code: 'INVALID_ESTABLISHMENT_ID' },
          { status: 400 }
        );
      }

      whereCondition = and(
        eq(diaryDevices.userId, userId),
        eq(diaryDevices.establishmentId, establishmentId)
      ) as any;
    }

    const userDevices = await db
      .select()
      .from(diaryDevices)
      .where(whereCondition)
      .orderBy(desc(diaryDevices.createdAt));

    return NextResponse.json(userDevices, { status: 200 });

  } catch (error) {
    console.error('GET /api/diary-devices/user error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}