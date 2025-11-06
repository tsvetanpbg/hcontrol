import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { temperatureReadings, diaryDevices } from '@/db/schema';
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
        { error: authResult.error, code: 'AUTHENTICATION_REQUIRED' },
        { status: authResult.status }
      );
    }
    const userId = authResult.user.userId;

    // Validate ID parameter
    const id = params.id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }
    const readingId = parseInt(id);

    // Get the temperature reading
    const reading = await db
      .select()
      .from(temperatureReadings)
      .where(eq(temperatureReadings.id, readingId))
      .limit(1);

    if (reading.length === 0) {
      return NextResponse.json(
        { error: 'Temperature reading not found', code: 'READING_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Get the device to verify ownership
    const device = await db
      .select()
      .from(diaryDevices)
      .where(eq(diaryDevices.id, reading[0].deviceId))
      .limit(1);

    if (device.length === 0) {
      return NextResponse.json(
        { error: 'Device not found', code: 'DEVICE_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Verify device belongs to authenticated user
    if (device[0].userId !== userId) {
      return NextResponse.json(
        { 
          error: 'You do not have permission to update this reading', 
          code: 'FORBIDDEN' 
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { notes } = body;

    // Validate notes (can be null or string)
    if (notes !== null && notes !== undefined && typeof notes !== 'string') {
      return NextResponse.json(
        { error: 'Notes must be a string or null', code: 'INVALID_NOTES_TYPE' },
        { status: 400 }
      );
    }

    // Update the reading
    const updated = await db
      .update(temperatureReadings)
      .set({
        notes: notes === undefined ? reading[0].notes : notes,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(temperatureReadings.id, readingId))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update reading', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT /api/temperature-readings/[id]/notes error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}