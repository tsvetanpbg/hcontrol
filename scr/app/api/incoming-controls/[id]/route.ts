import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { incomingControls, establishments } from '@/db/schema';
import { requireAuth } from '@/lib/authMiddleware';
import { eq, and } from 'drizzle-orm';

export async function GET(
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

    const id = params.id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const control = await db
      .select({
        id: incomingControls.id,
        userId: incomingControls.userId,
        establishmentId: incomingControls.establishmentId,
        controlDate: incomingControls.controlDate,
        imageUrl: incomingControls.imageUrl,
        notes: incomingControls.notes,
        createdAt: incomingControls.createdAt,
        updatedAt: incomingControls.updatedAt,
        companyName: establishments.companyName,
        establishmentType: establishments.establishmentType,
      })
      .from(incomingControls)
      .leftJoin(establishments, eq(incomingControls.establishmentId, establishments.id))
      .where(eq(incomingControls.id, parseInt(id)))
      .limit(1);

    if (control.length === 0) {
      return NextResponse.json(
        { error: 'Incoming control not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (control[0].userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    return NextResponse.json(control[0], { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

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

    const id = params.id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const existingControl = await db
      .select()
      .from(incomingControls)
      .where(eq(incomingControls.id, parseInt(id)))
      .limit(1);

    if (existingControl.length === 0) {
      return NextResponse.json(
        { error: 'Incoming control not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (existingControl[0].userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const requestBody = await request.json();
    const { establishmentId, controlDate, imageUrl, notes } = requestBody;

    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json(
        { error: 'User ID cannot be provided in request body', code: 'USER_ID_NOT_ALLOWED' },
        { status: 400 }
      );
    }

    if (controlDate !== undefined) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(controlDate)) {
        return NextResponse.json(
          { error: 'Control date must be in YYYY-MM-DD format', code: 'INVALID_DATE_FORMAT' },
          { status: 400 }
        );
      }
    }

    if (imageUrl !== undefined && (!imageUrl || imageUrl.trim() === '')) {
      return NextResponse.json(
        { error: 'Image URL cannot be empty', code: 'INVALID_IMAGE_URL' },
        { status: 400 }
      );
    }

    if (establishmentId !== undefined && establishmentId !== null) {
      const establishment = await db
        .select()
        .from(establishments)
        .where(
          and(
            eq(establishments.id, establishmentId),
            eq(establishments.userId, userId)
          )
        )
        .limit(1);

      if (establishment.length === 0) {
        return NextResponse.json(
          { error: 'Establishment not found or does not belong to user', code: 'INVALID_ESTABLISHMENT' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (establishmentId !== undefined) {
      updateData.establishmentId = establishmentId;
    }

    if (controlDate !== undefined) {
      updateData.controlDate = controlDate;
    }

    if (imageUrl !== undefined) {
      updateData.imageUrl = imageUrl.trim();
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const updated = await db
      .update(incomingControls)
      .set(updateData)
      .where(eq(incomingControls.id, parseInt(id)))
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

    const id = params.id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const existingControl = await db
      .select()
      .from(incomingControls)
      .where(eq(incomingControls.id, parseInt(id)))
      .limit(1);

    if (existingControl.length === 0) {
      return NextResponse.json(
        { error: 'Incoming control not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (existingControl[0].userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const deleted = await db
      .delete(incomingControls)
      .where(eq(incomingControls.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Incoming control deleted successfully',
        id: deleted[0].id,
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