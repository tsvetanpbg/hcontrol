import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { incomingControls, establishments } from '@/db/schema';
import { requireAuth } from '@/lib/authMiddleware';
import { eq, and, desc } from 'drizzle-orm';

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
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        return NextResponse.json(
          { 
            error: 'Invalid date format. Expected YYYY-MM-DD',
            code: 'INVALID_DATE_FORMAT' 
          },
          { status: 400 }
        );
      }
    }

    const whereConditions = date
      ? and(
          eq(incomingControls.userId, userId),
          eq(incomingControls.controlDate, date)
        )
      : eq(incomingControls.userId, userId);

    const controls = await db
      .select({
        id: incomingControls.id,
        userId: incomingControls.userId,
        establishmentId: incomingControls.establishmentId,
        controlDate: incomingControls.controlDate,
        imageUrl: incomingControls.imageUrl,
        notes: incomingControls.notes,
        createdAt: incomingControls.createdAt,
        updatedAt: incomingControls.updatedAt,
        establishment: {
          id: establishments.id,
          companyName: establishments.companyName,
          establishmentType: establishments.establishmentType,
        },
      })
      .from(incomingControls)
      .leftJoin(
        establishments,
        eq(incomingControls.establishmentId, establishments.id)
      )
      .where(whereConditions)
      .orderBy(desc(incomingControls.controlDate), desc(incomingControls.createdAt));

    return NextResponse.json(controls, { status: 200 });
  } catch (error) {
    console.error('GET incoming controls error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}