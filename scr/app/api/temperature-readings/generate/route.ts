import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { temperatureReadings, diaryDevices } from '@/db/schema';
import { requireAuth } from '@/lib/authMiddleware';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const authResult = requireAuth(request);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error, code: 'UNAUTHORIZED' },
        { status: authResult.status }
      );
    }

    const user = authResult.user;
    const body = await request.json();
    const { deviceId, date } = body;

    // Validate deviceId
    if (!deviceId) {
      return NextResponse.json(
        { error: 'deviceId is required', code: 'MISSING_DEVICE_ID' },
        { status: 400 }
      );
    }

    const parsedDeviceId = parseInt(deviceId);
    if (isNaN(parsedDeviceId)) {
      return NextResponse.json(
        { error: 'deviceId must be a valid integer', code: 'INVALID_DEVICE_ID' },
        { status: 400 }
      );
    }

    // Validate date
    if (!date) {
      return NextResponse.json(
        { error: 'date is required', code: 'MISSING_DATE' },
        { status: 400 }
      );
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: 'date must be in YYYY-MM-DD format', code: 'INVALID_DATE_FORMAT' },
        { status: 400 }
      );
    }

    // Query device with minTemp and maxTemp
    const device = await db
      .select()
      .from(diaryDevices)
      .where(eq(diaryDevices.id, parsedDeviceId))
      .limit(1);

    // Verify device exists
    if (device.length === 0) {
      return NextResponse.json(
        { error: 'Device not found', code: 'DEVICE_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Verify device belongs to authenticated user
    if (device[0].userId !== user.userId) {
      return NextResponse.json(
        { error: 'Access denied: Device does not belong to user', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const { minTemp, maxTemp } = device[0];

    // Check if readings already exist for this deviceId and date
    const existingReadings = await db
      .select()
      .from(temperatureReadings)
      .where(
        and(
          eq(temperatureReadings.deviceId, parsedDeviceId),
          eq(temperatureReadings.readingDate, date)
        )
      )
      .limit(1);

    if (existingReadings.length > 0) {
      return NextResponse.json(
        { 
          error: 'Readings already exist for this device and date', 
          code: 'READINGS_ALREADY_EXIST' 
        },
        { status: 400 }
      );
    }

    // Generate 2 daily readings (10:00 and 17:00)
    const now = new Date().toISOString();
    const readingsArray = [];
    const hours = [10, 17]; // 10:00 and 17:00

    for (const hour of hours) {
      const temperature = minTemp + (Math.random() * (maxTemp - minTemp));
      const roundedTemperature = parseFloat(temperature.toFixed(1));

      readingsArray.push({
        deviceId: parsedDeviceId,
        readingDate: date,
        hour,
        temperature: roundedTemperature,
        notes: null,
        createdAt: now,
        updatedAt: now
      });
    }

    // Insert 2 readings
    await db.insert(temperatureReadings).values(readingsArray);

    return NextResponse.json(
      {
        message: 'Temperature readings generated successfully',
        deviceId: parsedDeviceId,
        date,
        readingsGenerated: 2
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('POST /api/temperature-readings/generate error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}