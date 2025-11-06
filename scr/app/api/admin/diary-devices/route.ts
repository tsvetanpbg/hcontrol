import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { diaryDevices, users } from '@/db/schema';
import { requireAdmin } from '@/lib/authMiddleware';
import { eq, and, desc, asc, count, inArray } from 'drizzle-orm';

const VALID_DEVICE_TYPES = ['Фризери', 'Хладилници', 'Топли витрини'];
const VALID_SORT_FIELDS = ['id', 'userId', 'deviceType', 'deviceName', 'createdAt'];
const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 50;

export async function GET(request: NextRequest) {
  try {
    // Authenticate and verify admin role
    const authResult = requireAdmin(request);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error, code: 'UNAUTHORIZED' },
        { status: authResult.status }
      );
    }

    const searchParams = request.nextUrl.searchParams;

    // Parse and validate limit
    const limitParam = searchParams.get('limit');
    let limit = DEFAULT_LIMIT;
    if (limitParam) {
      const parsedLimit = parseInt(limitParam);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > MAX_LIMIT) {
        return NextResponse.json(
          { 
            error: `Invalid limit parameter. Must be a positive integer between 1 and ${MAX_LIMIT}`,
            code: 'INVALID_LIMIT'
          },
          { status: 400 }
        );
      }
      limit = parsedLimit;
    }

    // Parse and validate offset
    const offsetParam = searchParams.get('offset');
    let offset = 0;
    if (offsetParam) {
      const parsedOffset = parseInt(offsetParam);
      if (isNaN(parsedOffset) || parsedOffset < 0) {
        return NextResponse.json(
          { 
            error: 'Invalid offset parameter. Must be a non-negative integer',
            code: 'INVALID_OFFSET'
          },
          { status: 400 }
        );
      }
      offset = parsedOffset;
    }

    // Parse and validate userId
    const userIdParam = searchParams.get('userId');
    let userId: number | null = null;
    if (userIdParam) {
      const parsedUserId = parseInt(userIdParam);
      if (isNaN(parsedUserId)) {
        return NextResponse.json(
          { 
            error: 'Invalid userId parameter. Must be a valid integer',
            code: 'INVALID_USER_ID'
          },
          { status: 400 }
        );
      }
      userId = parsedUserId;
    }

    // Parse and validate deviceType
    const deviceType = searchParams.get('deviceType');
    if (deviceType && !VALID_DEVICE_TYPES.includes(deviceType)) {
      return NextResponse.json(
        { 
          error: `Invalid deviceType parameter. Must be one of: ${VALID_DEVICE_TYPES.join(', ')}`,
          code: 'INVALID_DEVICE_TYPE'
        },
        { status: 400 }
      );
    }

    // Parse and validate sort field
    const sortParam = searchParams.get('sort') || 'createdAt';
    if (!VALID_SORT_FIELDS.includes(sortParam)) {
      return NextResponse.json(
        { 
          error: `Invalid sort parameter. Must be one of: ${VALID_SORT_FIELDS.join(', ')}`,
          code: 'INVALID_SORT_FIELD'
        },
        { status: 400 }
      );
    }

    // Parse and validate order
    const orderParam = searchParams.get('order') || 'desc';
    if (orderParam !== 'asc' && orderParam !== 'desc') {
      return NextResponse.json(
        { 
          error: 'Invalid order parameter. Must be "asc" or "desc"',
          code: 'INVALID_ORDER'
        },
        { status: 400 }
      );
    }

    // Build WHERE conditions
    const conditions = [];
    if (userId !== null) {
      conditions.push(eq(diaryDevices.userId, userId));
    }
    if (deviceType) {
      conditions.push(eq(diaryDevices.deviceType, deviceType));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Determine sort order
    const sortColumn = diaryDevices[sortParam as keyof typeof diaryDevices];
    const orderFn = orderParam === 'asc' ? asc : desc;

    // Execute main query for devices
    let devicesQuery = db.select().from(diaryDevices);
    
    if (whereClause) {
      devicesQuery = devicesQuery.where(whereClause) as any;
    }

    const devices = await devicesQuery
      .orderBy(orderFn(sortColumn))
      .limit(limit)
      .offset(offset);

    // If no devices, return early
    if (devices.length === 0) {
      return NextResponse.json({
        devices: [],
        total: 0
      }, { status: 200 });
    }

    // Get unique user IDs from devices
    const userIds = [...new Set(devices.map(d => d.userId))];

    // Fetch users data
    let usersData = [];
    if (userIds.length > 0) {
      usersData = await db
        .select()
        .from(users)
        .where(inArray(users.id, userIds));
    }

    // Create a map of userId to email
    const userEmailMap = new Map(usersData.map(u => [u.id, u.email]));

    // Combine devices with user emails
    const devicesWithUsers = devices.map(device => ({
      id: device.id,
      userId: device.userId,
      userEmail: userEmailMap.get(device.userId) || null,
      deviceType: device.deviceType,
      deviceName: device.deviceName,
      minTemp: device.minTemp,
      maxTemp: device.maxTemp,
      createdAt: device.createdAt,
      updatedAt: device.updatedAt,
    }));

    // Execute count query
    let countQuery = db.select({ count: count() }).from(diaryDevices);
    
    if (whereClause) {
      countQuery = countQuery.where(whereClause) as any;
    }

    const totalResult = await countQuery;
    const total = totalResult[0]?.count || 0;

    return NextResponse.json({
      devices: devicesWithUsers,
      total
    }, { status: 200 });

  } catch (error) {
    console.error('GET /api/admin/diary-devices error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + error
      },
      { status: 500 }
    );
  }
}