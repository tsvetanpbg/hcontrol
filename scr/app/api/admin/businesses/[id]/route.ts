import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { businesses, temperatureLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

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

    const businessId = parseInt(id);

    // Check if business exists
    const existingBusiness = await db.select()
      .from(businesses)
      .where(eq(businesses.id, businessId))
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

    // Delete using transaction to ensure atomicity
    await db.transaction(async (tx) => {
      // First, delete all related temperature logs
      await tx.delete(temperatureLogs)
        .where(eq(temperatureLogs.businessId, businessId));

      // Then, delete the business
      await tx.delete(businesses)
        .where(eq(businesses.id, businessId));
    });

    return NextResponse.json(
      { 
        message: 'Business deleted successfully',
        id: businessId
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + error,
        code: 'INTERNAL_ERROR' 
      },
      { status: 500 }
    );
  }
}