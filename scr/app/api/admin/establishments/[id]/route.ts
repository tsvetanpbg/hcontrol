import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { establishments, personnel } from '@/db/schema';
import { requireAdmin } from '@/lib/authMiddleware';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate and verify admin role
    const authResult = requireAdmin(request);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error, code: 'UNAUTHORIZED' },
        { status: authResult.status }
      );
    }

    const { id } = params;

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        },
        { status: 400 }
      );
    }

    const establishmentId = parseInt(id);

    // Query establishment by ID
    const establishment = await db.select()
      .from(establishments)
      .where(eq(establishments.id, establishmentId))
      .limit(1);

    if (establishment.length === 0) {
      return NextResponse.json(
        { 
          error: "Establishment not found",
          code: "NOT_FOUND" 
        },
        { status: 404 }
      );
    }

    // Query all personnel for this establishment
    const personnelList = await db.select()
      .from(personnel)
      .where(eq(personnel.establishmentId, establishmentId))
      .orderBy(desc(personnel.createdAt));

    return NextResponse.json(
      {
        establishment: establishment[0],
        personnel: personnelList
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('GET establishment error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + error,
        code: "INTERNAL_ERROR"
      },
      { status: 500 }
    );
  }
}