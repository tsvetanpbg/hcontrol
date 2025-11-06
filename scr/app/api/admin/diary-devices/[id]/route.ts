import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { diaryDevices, users, temperatureReadings } from '@/db/schema';
import { requireAdmin } from '@/lib/authMiddleware';
import { eq, desc, asc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Admin authentication check
    const adminCheck = requireAdmin(request);
    if ('error' in adminCheck) {
      return NextResponse.json(
        { error: adminCheck.error, code: 'UNAUTHORIZED' },
        { status: adminCheck.status }
      );
    }

    const id = params.id;

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        {
          error: 'Valid ID is required',
          code: 'INVALID_ID',
        },
        { status: 400 }
      );
    }

    const deviceId = parseInt(id);

    // Query device by ID
    const device = await db
      .select()
      .from(diaryDevices)
      .where(eq(diaryDevices.id, deviceId))
      .limit(1);

    // Check if device exists
    if (device.length === 0) {
      return NextResponse.json(
        {
          error: 'Device not found',
          code: 'DEVICE_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Fetch user information
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, device[0].userId))
      .limit(1);

    // Query all temperature readings for this device, ordered by date DESC and hour ASC
    const readings = await db
      .select()
      .from(temperatureReadings)
      .where(eq(temperatureReadings.deviceId, deviceId))
      .orderBy(desc(temperatureReadings.readingDate), asc(temperatureReadings.hour));

    // Combine device with user email
    const deviceWithUser = {
      id: device[0].id,
      userId: device[0].userId,
      userEmail: user.length > 0 ? user[0].email : null,
      deviceType: device[0].deviceType,
      deviceName: device[0].deviceName,
      minTemp: device[0].minTemp,
      maxTemp: device[0].maxTemp,
      createdAt: device[0].createdAt,
      updatedAt: device[0].updatedAt,
    };

    // Return device with all readings
    return NextResponse.json(
      {
        device: deviceWithUser,
        readings: readings,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + error,
      },
      { status: 500 }
    );
  }
}