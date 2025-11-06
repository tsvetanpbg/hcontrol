import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { temperatureReadings, diaryDevices } from '@/db/schema';
import { requireAuth } from '@/lib/authMiddleware';
import { eq, and, gte, lte, asc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { deviceId: string } }
) {
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

    // Validate deviceId parameter
    const deviceId = params.deviceId;
    if (!deviceId || isNaN(parseInt(deviceId))) {
      return NextResponse.json(
        { error: 'Valid device ID is required', code: 'INVALID_DEVICE_ID' },
        { status: 400 }
      );
    }

    const parsedDeviceId = parseInt(deviceId);

    // Verify device exists and belongs to authenticated user
    const device = await db
      .select()
      .from(diaryDevices)
      .where(eq(diaryDevices.id, parsedDeviceId))
      .limit(1);

    if (device.length === 0) {
      return NextResponse.json(
        { error: 'Device not found', code: 'DEVICE_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (device[0].userId !== user.userId) {
      return NextResponse.json(
        { error: 'You do not have permission to access this device', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Get and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (startDate && !dateRegex.test(startDate)) {
      return NextResponse.json(
        { error: 'Invalid startDate format. Use YYYY-MM-DD', code: 'INVALID_START_DATE' },
        { status: 400 }
      );
    }

    if (endDate && !dateRegex.test(endDate)) {
      return NextResponse.json(
        { error: 'Invalid endDate format. Use YYYY-MM-DD', code: 'INVALID_END_DATE' },
        { status: 400 }
      );
    }

    // Build query with filters
    const conditions = [eq(temperatureReadings.deviceId, parsedDeviceId)];

    if (startDate) {
      conditions.push(gte(temperatureReadings.readingDate, startDate));
    }

    if (endDate) {
      conditions.push(lte(temperatureReadings.readingDate, endDate));
    }

    const readings = await db
      .select()
      .from(temperatureReadings)
      .where(and(...conditions))
      .orderBy(asc(temperatureReadings.readingDate), asc(temperatureReadings.hour));

    // Generate CSV content
    const csvRows: string[] = [];
    
    // Header row
    csvRows.push('Date,Hour,Temperature,Notes');

    // Data rows
    for (const reading of readings) {
      const date = reading.readingDate;
      const hour = reading.hour.toString();
      const temperature = reading.temperature.toString();
      let notes = reading.notes || '';

      // Escape notes field if it contains commas or quotes
      if (notes.includes(',') || notes.includes('"') || notes.includes('\n')) {
        notes = '"' + notes.replace(/"/g, '""') + '"';
      }

      csvRows.push(`${date},${hour},${temperature},${notes}`);
    }

    const csvContent = csvRows.join('\n');

    // Add UTF-8 BOM to ensure proper encoding (fixes Cyrillic characters)
    const utf8BOM = '\uFEFF';
    const csvContentWithBOM = utf8BOM + csvContent;

    // Generate filename
    const dateRangeStart = startDate || 'all';
    const dateRangeEnd = endDate || 'all';
    const filename = `device-${parsedDeviceId}-readings-${dateRangeStart}-to-${dateRangeEnd}.csv`;

    // Return CSV response with appropriate headers
    return new NextResponse(csvContentWithBOM, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('GET export error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}