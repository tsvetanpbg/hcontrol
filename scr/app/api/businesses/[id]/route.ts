import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { businesses } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid ID is required',
          code: 'INVALID_ID'
        },
        { status: 400 }
      );
    }

    // Query business by ID
    const business = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, parseInt(id)))
      .limit(1);

    // Check if business exists
    if (business.length === 0) {
      return NextResponse.json(
        { 
          error: 'Business not found',
          code: 'BUSINESS_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    return NextResponse.json(business[0], { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + error
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid ID is required',
          code: 'INVALID_ID'
        },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Extract updatable fields
    const {
      name,
      type,
      city,
      address,
      phone,
      email,
      refrigeratorCount,
      freezerCount,
      hotDisplayCount,
      coldDisplayCount,
      otherEquipment
    } = body;

    // Build update object with only provided fields
    const updates: any = {};

    if (name !== undefined) updates.name = name.trim();
    if (type !== undefined) updates.type = type.trim();
    if (city !== undefined) updates.city = city.trim();
    if (address !== undefined) updates.address = address.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (email !== undefined) updates.email = email.trim().toLowerCase();
    if (refrigeratorCount !== undefined) updates.refrigeratorCount = refrigeratorCount;
    if (freezerCount !== undefined) updates.freezerCount = freezerCount;
    if (hotDisplayCount !== undefined) updates.hotDisplayCount = hotDisplayCount;
    if (coldDisplayCount !== undefined) updates.coldDisplayCount = coldDisplayCount;
    if (otherEquipment !== undefined) updates.otherEquipment = otherEquipment?.trim() || null;

    // Validate at least one field is provided
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { 
          error: 'At least one field must be provided for update',
          code: 'NO_FIELDS_PROVIDED'
        },
        { status: 400 }
      );
    }

    // Validate required fields if provided
    if (name !== undefined && !name.trim()) {
      return NextResponse.json(
        { 
          error: 'Name cannot be empty',
          code: 'INVALID_NAME'
        },
        { status: 400 }
      );
    }

    if (type !== undefined && !type.trim()) {
      return NextResponse.json(
        { 
          error: 'Type cannot be empty',
          code: 'INVALID_TYPE'
        },
        { status: 400 }
      );
    }

    if (city !== undefined && !city.trim()) {
      return NextResponse.json(
        { 
          error: 'City cannot be empty',
          code: 'INVALID_CITY'
        },
        { status: 400 }
      );
    }

    if (address !== undefined && !address.trim()) {
      return NextResponse.json(
        { 
          error: 'Address cannot be empty',
          code: 'INVALID_ADDRESS'
        },
        { status: 400 }
      );
    }

    if (phone !== undefined && !phone.trim()) {
      return NextResponse.json(
        { 
          error: 'Phone cannot be empty',
          code: 'INVALID_PHONE'
        },
        { status: 400 }
      );
    }

    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email.trim() || !emailRegex.test(email.trim())) {
        return NextResponse.json(
          { 
            error: 'Valid email is required',
            code: 'INVALID_EMAIL'
          },
          { status: 400 }
        );
      }
    }

    // Validate numeric fields
    if (refrigeratorCount !== undefined && (typeof refrigeratorCount !== 'number' || refrigeratorCount < 0)) {
      return NextResponse.json(
        { 
          error: 'Refrigerator count must be a non-negative number',
          code: 'INVALID_REFRIGERATOR_COUNT'
        },
        { status: 400 }
      );
    }

    if (freezerCount !== undefined && (typeof freezerCount !== 'number' || freezerCount < 0)) {
      return NextResponse.json(
        { 
          error: 'Freezer count must be a non-negative number',
          code: 'INVALID_FREEZER_COUNT'
        },
        { status: 400 }
      );
    }

    if (hotDisplayCount !== undefined && (typeof hotDisplayCount !== 'number' || hotDisplayCount < 0)) {
      return NextResponse.json(
        { 
          error: 'Hot display count must be a non-negative number',
          code: 'INVALID_HOT_DISPLAY_COUNT'
        },
        { status: 400 }
      );
    }

    if (coldDisplayCount !== undefined && (typeof coldDisplayCount !== 'number' || coldDisplayCount < 0)) {
      return NextResponse.json(
        { 
          error: 'Cold display count must be a non-negative number',
          code: 'INVALID_COLD_DISPLAY_COUNT'
        },
        { status: 400 }
      );
    }

    // Check if business exists
    const existingBusiness = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, parseInt(id)))
      .limit(1);

    if (existingBusiness.length === 0) {
      return NextResponse.json(
        { 
          error: 'Business not found',
          code: 'BUSINESS_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Update business
    const updatedBusiness = await db
      .update(businesses)
      .set(updates)
      .where(eq(businesses.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedBusiness[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + error
      },
      { status: 500 }
    );
  }
}