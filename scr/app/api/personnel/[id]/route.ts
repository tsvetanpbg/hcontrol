import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { personnel, establishments } from '@/db/schema';
import { requireAuth } from '@/lib/authMiddleware';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = requireAuth(request);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error, code: 'UNAUTHORIZED' },
        { status: authResult.status }
      );
    }

    const userId = authResult.user.userId;
    const personnelId = params.id;

    if (!personnelId || isNaN(parseInt(personnelId))) {
      return NextResponse.json(
        { error: 'Valid personnel ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const personnelRecord = await db
      .select()
      .from(personnel)
      .where(eq(personnel.id, parseInt(personnelId)))
      .limit(1);

    if (personnelRecord.length === 0) {
      return NextResponse.json(
        { error: 'Personnel not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const establishment = await db
      .select()
      .from(establishments)
      .where(eq(establishments.id, personnelRecord[0].establishmentId))
      .limit(1);

    if (establishment.length === 0 || establishment[0].userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { fullName, egn, position, healthBookImageUrl, photoUrl, healthBookNumber, healthBookValidity } = body;

    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    if (fullName !== undefined) {
      const trimmedFullName = typeof fullName === 'string' ? fullName.trim() : fullName;
      if (!trimmedFullName) {
        return NextResponse.json(
          { error: 'Full name cannot be empty', code: 'INVALID_FULL_NAME' },
          { status: 400 }
        );
      }
      updates.fullName = trimmedFullName;
    }

    if (egn !== undefined) {
      const trimmedEgn = typeof egn === 'string' ? egn.trim() : egn;
      if (!trimmedEgn) {
        return NextResponse.json(
          { error: 'EGN cannot be empty', code: 'INVALID_EGN' },
          { status: 400 }
        );
      }
      updates.egn = trimmedEgn;
    }

    if (position !== undefined) {
      const trimmedPosition = typeof position === 'string' ? position.trim() : position;
      if (!trimmedPosition) {
        return NextResponse.json(
          { error: 'Position cannot be empty', code: 'INVALID_POSITION' },
          { status: 400 }
        );
      }
      updates.position = trimmedPosition;
    }

    if (healthBookImageUrl !== undefined) {
      updates.healthBookImageUrl = healthBookImageUrl === null ? null : 
        (typeof healthBookImageUrl === 'string' ? healthBookImageUrl.trim() : healthBookImageUrl);
    }

    if (photoUrl !== undefined) {
      updates.photoUrl = photoUrl === null ? null : 
        (typeof photoUrl === 'string' ? photoUrl.trim() : photoUrl);
    }

    if (healthBookNumber !== undefined) {
      const trimmedHealthBookNumber = typeof healthBookNumber === 'string' ? healthBookNumber.trim() : healthBookNumber;
      if (!trimmedHealthBookNumber) {
        return NextResponse.json(
          { error: 'Health book number cannot be empty', code: 'INVALID_HEALTH_BOOK_NUMBER' },
          { status: 400 }
        );
      }
      updates.healthBookNumber = trimmedHealthBookNumber;
    }

    if (healthBookValidity !== undefined) {
      const trimmedHealthBookValidity = typeof healthBookValidity === 'string' ? healthBookValidity.trim() : healthBookValidity;
      
      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(trimmedHealthBookValidity)) {
        return NextResponse.json(
          { error: 'Health book validity must be in YYYY-MM-DD format', code: 'INVALID_DATE_FORMAT' },
          { status: 400 }
        );
      }
      
      updates.healthBookValidity = trimmedHealthBookValidity;
    }

    const updated = await db
      .update(personnel)
      .set(updates)
      .where(eq(personnel.id, parseInt(personnelId)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = requireAuth(request);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error, code: 'UNAUTHORIZED' },
        { status: authResult.status }
      );
    }

    const userId = authResult.user.userId;
    const personnelId = params.id;

    if (!personnelId || isNaN(parseInt(personnelId))) {
      return NextResponse.json(
        { error: 'Valid personnel ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const personnelRecord = await db
      .select()
      .from(personnel)
      .where(eq(personnel.id, parseInt(personnelId)))
      .limit(1);

    if (personnelRecord.length === 0) {
      return NextResponse.json(
        { error: 'Personnel not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const establishment = await db
      .select()
      .from(establishments)
      .where(eq(establishments.id, personnelRecord[0].establishmentId))
      .limit(1);

    if (establishment.length === 0 || establishment[0].userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    await db
      .delete(personnel)
      .where(eq(personnel.id, parseInt(personnelId)));

    return NextResponse.json(
      {
        message: 'Personnel deleted successfully',
        deletedId: parseInt(personnelId),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}