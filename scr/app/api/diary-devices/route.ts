import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { diaryDevices, temperatureReadings } from '@/db/schema';
import { requireAuth } from '@/lib/authMiddleware';

const VALID_DEVICE_TYPES = ['Фризери', 'Хладилници', 'Топли витрини', 'Фритюрници'] as const;

const TEMPERATURE_RANGES = {
  'Фризери': { minTemp: -36, maxTemp: -18 },
  'Хладилници': { minTemp: 0, maxTemp: 4 },
  'Топли витрини': { minTemp: 63, maxTemp: 80 },
  'Фритюрници': { minTemp: 160, maxTemp: 180 }
} as const;

export async function POST(request: NextRequest) {
  try {
    const authResult = requireAuth(request);
    
    if ('error' in authResult) {
      return NextResponse.json(
        { 
          error: authResult.error,
          code: 'AUTHENTICATION_REQUIRED' 
        },
        { status: authResult.status }
      );
    }

    const userId = authResult.user.userId;

    const body = await request.json();

    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json(
        { 
          error: 'User ID cannot be provided in request body',
          code: 'USER_ID_NOT_ALLOWED' 
        },
        { status: 400 }
      );
    }

    const { deviceType, deviceName, establishmentId } = body;

    // CRITICAL: establishmentId is now REQUIRED
    if (!establishmentId || typeof establishmentId !== 'number') {
      return NextResponse.json(
        { 
          error: 'Establishment ID is required',
          code: 'MISSING_ESTABLISHMENT_ID' 
        },
        { status: 400 }
      );
    }

    if (!deviceType) {
      return NextResponse.json(
        { 
          error: 'Device type is required',
          code: 'MISSING_DEVICE_TYPE' 
        },
        { status: 400 }
      );
    }

    if (!VALID_DEVICE_TYPES.includes(deviceType)) {
      return NextResponse.json(
        { 
          error: `Device type must be one of: ${VALID_DEVICE_TYPES.join(', ')}`,
          code: 'INVALID_DEVICE_TYPE' 
        },
        { status: 400 }
      );
    }

    if (!deviceName || typeof deviceName !== 'string') {
      return NextResponse.json(
        { 
          error: 'Device name is required',
          code: 'MISSING_DEVICE_NAME' 
        },
        { status: 400 }
      );
    }

    const trimmedDeviceName = deviceName.trim();
    if (trimmedDeviceName.length === 0) {
      return NextResponse.json(
        { 
          error: 'Device name cannot be empty',
          code: 'EMPTY_DEVICE_NAME' 
        },
        { status: 400 }
      );
    }

    const temperatureRange = TEMPERATURE_RANGES[deviceType as keyof typeof TEMPERATURE_RANGES];

    const now = new Date().toISOString();

    const newDevice = await db.insert(diaryDevices)
      .values({
        userId: userId,
        deviceType: deviceType,
        deviceName: trimmedDeviceName,
        minTemp: temperatureRange.minTemp,
        maxTemp: temperatureRange.maxTemp,
        establishmentId: establishmentId,
        createdAt: now,
        updatedAt: now
      })
      .returning();

    // Auto-generate temperature readings for last 15 days (10:00 and 17:00 only)
    try {
      const readingsArray = [];
      const hours = [10, 17]; // 10:00 and 17:00

      // Generate for last 15 days
      for (let daysAgo = 0; daysAgo < 15; daysAgo++) {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        const dateStr = date.toISOString().split('T')[0];

        for (const hour of hours) {
          const temperature = temperatureRange.minTemp + (Math.random() * (temperatureRange.maxTemp - temperatureRange.minTemp));
          const roundedTemperature = parseFloat(temperature.toFixed(1));

          readingsArray.push({
            deviceId: newDevice[0].id,
            readingDate: dateStr,
            hour,
            temperature: roundedTemperature,
            notes: null,
            createdAt: now,
            updatedAt: now
          });
        }
      }

      await db.insert(temperatureReadings).values(readingsArray);
    } catch (error) {
      console.error('Failed to auto-generate readings:', error);
      // Continue even if readings generation fails
    }

    return NextResponse.json(newDevice[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + error 
      },
      { status: 500 }
    );
  }
}