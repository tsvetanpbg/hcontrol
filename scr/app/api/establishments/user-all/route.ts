import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { establishments } from '@/db/schema';
import { requireAuth } from '@/lib/authMiddleware';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = requireAuth(request);
    
    if ('error' in authResult) {
      return NextResponse.json(
        { 
          error: authResult.error,
          code: 'UNAUTHORIZED' 
        },
        { status: authResult.status }
      );
    }

    const user = authResult.user;

    // Query all establishments for the authenticated user
    const userEstablishments = await db
      .select()
      .from(establishments)
      .where(eq(establishments.userId, user.userId))
      .orderBy(desc(establishments.createdAt));

    // Return all establishments with total count
    return NextResponse.json(
      {
        establishments: userEstablishments,
        total: userEstablishments.length
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('GET establishments error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)),
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}