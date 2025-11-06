import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { personnel, establishments } from '@/db/schema';
import { requireAuth } from '@/lib/authMiddleware';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
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

    // Get all personnel for user's establishments
    const userPersonnel = await db
      .select({
        id: personnel.id,
        establishmentId: personnel.establishmentId,
        fullName: personnel.fullName,
        egn: personnel.egn,
        position: personnel.position,
        healthBookImageUrl: personnel.healthBookImageUrl,
        photoUrl: personnel.photoUrl,
        healthBookNumber: personnel.healthBookNumber,
        healthBookValidity: personnel.healthBookValidity,
        createdAt: personnel.createdAt,
        updatedAt: personnel.updatedAt,
      })
      .from(personnel)
      .innerJoin(establishments, eq(personnel.establishmentId, establishments.id))
      .where(eq(establishments.userId, userId));

    // Return personnel array
    return NextResponse.json({ personnel: userPersonnel }, { status: 200 });

  } catch (error) {
    console.error('GET personnel error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { establishmentId, fullName, egn, position, healthBookImageUrl, photoUrl, healthBookNumber, healthBookValidity } = body;

    // Validate required fields
    if (!establishmentId) {
      return NextResponse.json(
        { error: 'Establishment ID is required', code: 'MISSING_ESTABLISHMENT_ID' },
        { status: 400 }
      );
    }

    if (!fullName) {
      return NextResponse.json(
        { error: 'Full name is required', code: 'MISSING_FULL_NAME' },
        { status: 400 }
      );
    }

    if (!egn) {
      return NextResponse.json(
        { error: 'EGN is required', code: 'MISSING_EGN' },
        { status: 400 }
      );
    }

    if (!position) {
      return NextResponse.json(
        { error: 'Position is required', code: 'MISSING_POSITION' },
        { status: 400 }
      );
    }

    if (!healthBookNumber) {
      return NextResponse.json(
        { error: 'Health book number is required', code: 'MISSING_HEALTH_BOOK_NUMBER' },
        { status: 400 }
      );
    }

    if (!healthBookValidity) {
      return NextResponse.json(
        { error: 'Health book validity is required', code: 'MISSING_HEALTH_BOOK_VALIDITY' },
        { status: 400 }
      );
    }

    // Validate health book validity date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(healthBookValidity)) {
      return NextResponse.json(
        { error: 'Health book validity must be in YYYY-MM-DD format', code: 'INVALID_DATE_FORMAT' },
        { status: 400 }
      );
    }

    // Validate establishmentId is a valid integer
    const parsedEstablishmentId = parseInt(establishmentId);
    if (isNaN(parsedEstablishmentId)) {
      return NextResponse.json(
        { error: 'Valid establishment ID is required', code: 'INVALID_ESTABLISHMENT_ID' },
        { status: 400 }
      );
    }

    // Check if establishment exists
    const establishment = await db
      .select()
      .from(establishments)
      .where(eq(establishments.id, parsedEstablishmentId))
      .limit(1);

    if (establishment.length === 0) {
      return NextResponse.json(
        { error: 'Establishment not found', code: 'ESTABLISHMENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Verify establishment belongs to authenticated user
    if (establishment[0].userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Trim and sanitize text inputs
    const sanitizedFullName = fullName.trim();
    const sanitizedEgn = egn.trim();
    const sanitizedPosition = position.trim();
    const sanitizedHealthBookImageUrl = healthBookImageUrl ? healthBookImageUrl.trim() : null;
    const sanitizedPhotoUrl = photoUrl ? photoUrl.trim() : null;
    const sanitizedHealthBookNumber = healthBookNumber.trim();
    const sanitizedHealthBookValidity = healthBookValidity.trim();

    // Validate sanitized inputs are not empty
    if (!sanitizedFullName) {
      return NextResponse.json(
        { error: 'Full name cannot be empty', code: 'EMPTY_FULL_NAME' },
        { status: 400 }
      );
    }

    if (!sanitizedEgn) {
      return NextResponse.json(
        { error: 'EGN cannot be empty', code: 'EMPTY_EGN' },
        { status: 400 }
      );
    }

    if (!sanitizedPosition) {
      return NextResponse.json(
        { error: 'Position cannot be empty', code: 'EMPTY_POSITION' },
        { status: 400 }
      );
    }

    if (!sanitizedHealthBookNumber) {
      return NextResponse.json(
        { error: 'Health book number cannot be empty', code: 'EMPTY_HEALTH_BOOK_NUMBER' },
        { status: 400 }
      );
    }

    // Auto-generate timestamps
    const now = new Date().toISOString();

    // Insert into personnel table
    const newPersonnel = await db
      .insert(personnel)
      .values({
        establishmentId: parsedEstablishmentId,
        fullName: sanitizedFullName,
        egn: sanitizedEgn,
        position: sanitizedPosition,
        healthBookImageUrl: sanitizedHealthBookImageUrl,
        photoUrl: sanitizedPhotoUrl,
        healthBookNumber: sanitizedHealthBookNumber,
        healthBookValidity: sanitizedHealthBookValidity,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Return created personnel record with 201 status
    return NextResponse.json(newPersonnel[0], { status: 201 });
  } catch (error) {
    console.error('POST personnel error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}