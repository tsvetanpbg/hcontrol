import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { establishments } from '@/db/schema';
import { requireAuth } from '@/lib/authMiddleware';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user using JWT from Authorization header
    const authResult = requireAuth(request);
    
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error, code: 'UNAUTHORIZED' },
        { status: authResult.status }
      );
    }

    const userId = authResult.user.userId;

    // Query establishments table where userId equals authenticated user's ID - return FIRST establishment only for backward compatibility
    const userEstablishments = await db
      .select()
      .from(establishments)
      .where(eq(establishments.userId, userId))
      .limit(1);

    // If no establishments found, return empty array with 200
    if (userEstablishments.length === 0) {
      return NextResponse.json(
        { establishments: [] },
        { status: 200 }
      );
    }

    // Return 200 with first establishment in array (backward compatibility)
    return NextResponse.json({ establishments: userEstablishments }, { status: 200 });

  } catch (error) {
    console.error('GET establishment error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}