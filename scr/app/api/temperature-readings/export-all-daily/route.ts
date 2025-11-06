import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { temperatureReadings, diaryDevices } from '@/db/schema';
import { requireAuth } from '@/lib/authMiddleware';
import { eq, and, asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const authResult = requireAuth(request);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error, code: 'UNAUTHORIZED' },
        { status: authResult.status }
      );
    }
    const user = authResult.user;

    // Get date parameter
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required', code: 'MISSING_DATE' },
        { status: 400 }
      );
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD', code: 'INVALID_DATE' },
        { status: 400 }
      );
    }

    // Get all user's devices
    const devices = await db
      .select()
      .from(diaryDevices)
      .where(eq(diaryDevices.userId, user.userId))
      .orderBy(asc(diaryDevices.deviceType), asc(diaryDevices.deviceName));

    if (devices.length === 0) {
      return NextResponse.json(
        { error: 'No devices found', code: 'NO_DEVICES' },
        { status: 404 }
      );
    }

    // Get all readings for the date
    const allData = await Promise.all(
      devices.map(async (device) => {
        const readings = await db
          .select()
          .from(temperatureReadings)
          .where(
            and(
              eq(temperatureReadings.deviceId, device.id),
              eq(temperatureReadings.readingDate, date)
            )
          )
          .orderBy(asc(temperatureReadings.hour));

        return {
          device,
          readings
        };
      })
    );

    // Filter out devices with no readings
    const dataWithReadings = allData.filter(item => item.readings.length > 0);

    if (dataWithReadings.length === 0) {
      return NextResponse.json(
        { error: 'No readings found for this date', code: 'NO_READINGS' },
        { status: 404 }
      );
    }

    // Return structured data
    return NextResponse.json({
      date,
      devices: dataWithReadings
    });

  } catch (error) {
    console.error('GET export-all-daily error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}