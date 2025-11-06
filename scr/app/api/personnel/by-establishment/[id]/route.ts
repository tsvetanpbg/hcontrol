import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { personnel, establishments } from '@/db/schema';
import { requireAuth } from '@/lib/authMiddleware';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user using JWT from Authorization header
    const authResult = requireAuth(request);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error, code: 'UNAUTHORIZED' },
        { status: authResult.status }
      );
    }

    const userId = authResult.user.userId;
    const establishmentId = params.id;

    // Validate establishmentId is a valid integer
    if (!establishmentId || isNaN(parseInt(establishmentId))) {
      return NextResponse.json(
        { error: 'Valid establishment ID is required', code: 'INVALID_ESTABLISHMENT_ID' },
        { status: 400 }
      );
    }

    const parsedEstablishmentId = parseInt(establishmentId);

    // Check if establishment exists and belongs to authenticated user
    const establishment = await db
      .select()
      .from(establishments)
      .where(
        and(
          eq(establishments.id, parsedEstablishmentId),
          eq(establishments.userId, userId)
        )
      )
      .limit(1);

    if (establishment.length === 0) {
      // Check if establishment exists at all to differentiate between 404 and 403
      const establishmentExists = await db
        .select()
        .from(establishments)
        .where(eq(establishments.id, parsedEstablishmentId))
        .limit(1);

      if (establishmentExists.length === 0) {
        return NextResponse.json(
          { error: 'Establishment not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      // Establishment exists but doesn't belong to user
      return NextResponse.json(
        { error: 'Access denied', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Query all personnel for the establishment
    const personnelRecords = await db
      .select()
      .from(personnel)
      .where(eq(personnel.establishmentId, parsedEstablishmentId))
      .orderBy(desc(personnel.createdAt));

    return NextResponse.json(personnelRecords, { status: 200 });
  } catch (error) {
    console.error('GET personnel error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}