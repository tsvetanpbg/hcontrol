import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { temperatureReadings, diaryDevices } from '@/db/schema';
import { requireAuth } from '@/lib/authMiddleware';
import { eq, and, desc, asc } from 'drizzle-orm';

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

    const user = authResult.user;
    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid device ID is required', code: 'INVALID_DEVICE_ID' },
        { status: 400 }
      );
    }

    const deviceIdInt = parseInt(id);

    const device = await db
      .select()
      .from(diaryDevices)
      .where(eq(diaryDevices.id, deviceIdInt))
      .limit(1);

    if (device.length === 0) {
      return NextResponse.json(
        { error: 'Device not found', code: 'DEVICE_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (device[0].userId !== user.userId) {
      return NextResponse.json(
        { error: 'Access denied: Device does not belong to user', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dateFilter = searchParams.get('date');

    if (dateFilter) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateFilter)) {
        return NextResponse.json(
          { error: 'Invalid date format. Expected YYYY-MM-DD', code: 'INVALID_DATE_FORMAT' },
          { status: 400 }
        );
      }
    }

    let query = db
      .select()
      .from(temperatureReadings)
      .where(eq(temperatureReadings.deviceId, deviceIdInt));

    if (dateFilter) {
      query = db
        .select()
        .from(temperatureReadings)
        .where(
          and(
            eq(temperatureReadings.deviceId, deviceIdInt),
            eq(temperatureReadings.readingDate, dateFilter)
          )
        );
    }

    const readings = await query
      .orderBy(desc(temperatureReadings.readingDate), asc(temperatureReadings.hour));

    return NextResponse.json(readings, { status: 200 });

  } catch (error) {
    console.error('GET temperature readings error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}