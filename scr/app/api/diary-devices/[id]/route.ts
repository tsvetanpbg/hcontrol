import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { diaryDevices, temperatureReadings } from '@/db/schema';
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

    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const deviceId = parseInt(id);

    const device = await db
      .select()
      .from(diaryDevices)
      .where(eq(diaryDevices.id, deviceId))
      .limit(1);

    if (device.length === 0) {
      return NextResponse.json(
        { error: 'Device not found', code: 'DEVICE_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (device[0].userId !== authResult.user.userId) {
      return NextResponse.json(
        { error: 'Access denied', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    return NextResponse.json(device[0], { status: 200 });
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

    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const deviceId = parseInt(id);

    const existingDevice = await db
      .select()
      .from(diaryDevices)
      .where(eq(diaryDevices.id, deviceId))
      .limit(1);

    if (existingDevice.length === 0) {
      return NextResponse.json(
        { error: 'Device not found', code: 'DEVICE_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (existingDevice[0].userId !== authResult.user.userId) {
      return NextResponse.json(
        { error: 'Access denied', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const requestBody = await request.json();

    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json(
        {
          error: 'User ID cannot be provided in request body',
          code: 'USER_ID_NOT_ALLOWED',
        },
        { status: 400 }
      );
    }

    const { deviceName } = requestBody;

    if (!deviceName || typeof deviceName !== 'string' || deviceName.trim() === '') {
      return NextResponse.json(
        {
          error: 'Device name is required and cannot be empty',
          code: 'INVALID_DEVICE_NAME',
        },
        { status: 400 }
      );
    }

    const updated = await db
      .update(diaryDevices)
      .set({
        deviceName: deviceName.trim(),
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(diaryDevices.id, deviceId),
          eq(diaryDevices.userId, authResult.user.userId)
        )
      )
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update device', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

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

    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const deviceId = parseInt(id);

    const existingDevice = await db
      .select()
      .from(diaryDevices)
      .where(eq(diaryDevices.id, deviceId))
      .limit(1);

    if (existingDevice.length === 0) {
      return NextResponse.json(
        { error: 'Device not found', code: 'DEVICE_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (existingDevice[0].userId !== authResult.user.userId) {
      return NextResponse.json(
        { error: 'Access denied', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Delete associated temperature readings first
    await db
      .delete(temperatureReadings)
      .where(eq(temperatureReadings.deviceId, deviceId));

    // Delete the device
    const deleted = await db
      .delete(diaryDevices)
      .where(eq(diaryDevices.id, deviceId))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete device', code: 'DELETE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Device deleted successfully',
        id: deviceId,
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