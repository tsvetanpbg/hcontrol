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
    // Authenticate user
    const authResult = requireAuth(request);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error, code: 'UNAUTHORIZED' },
        { status: authResult.status }
      );
    }

    const { id } = params;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const personnelId = parseInt(id);

    // Query personnel record
    const personnelRecord = await db
      .select()
      .from(personnel)
      .where(eq(personnel.id, personnelId))
      .limit(1);

    if (personnelRecord.length === 0) {
      return NextResponse.json(
        { error: 'Personnel not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Verify establishment ownership
    const establishment = await db
      .select()
      .from(establishments)
      .where(eq(establishments.id, personnelRecord[0].establishmentId))
      .limit(1);

    if (establishment.length === 0) {
      return NextResponse.json(
        { error: 'Establishment not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (establishment[0].userId !== authResult.user.userId) {
      return NextResponse.json(
        { error: 'Access denied', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { fullName, egn, position, workBookImageUrl } = body;

    // Build update object with only provided fields
    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    if (fullName !== undefined) {
      if (typeof fullName !== 'string' || fullName.trim().length === 0) {
        return NextResponse.json(
          { error: 'Full name must be a non-empty string', code: 'INVALID_FULL_NAME' },
          { status: 400 }
        );
      }
      updates.fullName = fullName.trim();
    }

    if (egn !== undefined) {
      if (typeof egn !== 'string' || egn.trim().length === 0) {
        return NextResponse.json(
          { error: 'EGN must be a non-empty string', code: 'INVALID_EGN' },
          { status: 400 }
        );
      }
      updates.egn = egn.trim();
    }

    if (position !== undefined) {
      if (typeof position !== 'string' || position.trim().length === 0) {
        return NextResponse.json(
          { error: 'Position must be a non-empty string', code: 'INVALID_POSITION' },
          { status: 400 }
        );
      }
      updates.position = position.trim();
    }

    if (workBookImageUrl !== undefined) {
      if (workBookImageUrl !== null && typeof workBookImageUrl !== 'string') {
        return NextResponse.json(
          { error: 'Work book image URL must be a string or null', code: 'INVALID_IMAGE_URL' },
          { status: 400 }
        );
      }
      updates.workBookImageUrl = workBookImageUrl ? workBookImageUrl.trim() : null;
    }

    // Update personnel record
    const updated = await db
      .update(personnel)
      .set(updates)
      .where(eq(personnel.id, personnelId))
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
    // Authenticate user
    const authResult = requireAuth(request);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error, code: 'UNAUTHORIZED' },
        { status: authResult.status }
      );
    }

    const { id } = params;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const personnelId = parseInt(id);

    // Query personnel record
    const personnelRecord = await db
      .select()
      .from(personnel)
      .where(eq(personnel.id, personnelId))
      .limit(1);

    if (personnelRecord.length === 0) {
      return NextResponse.json(
        { error: 'Personnel not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Verify establishment ownership
    const establishment = await db
      .select()
      .from(establishments)
      .where(eq(establishments.id, personnelRecord[0].establishmentId))
      .limit(1);

    if (establishment.length === 0) {
      return NextResponse.json(
        { error: 'Establishment not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (establishment[0].userId !== authResult.user.userId) {
      return NextResponse.json(
        { error: 'Access denied', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Delete personnel record
    const deleted = await db
      .delete(personnel)
      .where(eq(personnel.id, personnelId))
      .returning();

    return NextResponse.json(
      {
        message: 'Personnel deleted successfully',
        id: deleted[0].id,
        deletedRecord: deleted[0],
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