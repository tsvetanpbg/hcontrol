import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '@/lib/authMiddleware';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication
    const adminCheck = requireAdmin(request);
    if ('error' in adminCheck) {
      return NextResponse.json(
        { error: adminCheck.error, code: 'UNAUTHORIZED' },
        { status: adminCheck.status }
      );
    }

    const { id } = params;

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        {
          error: 'Valid user ID is required',
          code: 'INVALID_ID'
        },
        { status: 400 }
      );
    }

    const userId = parseInt(id);

    // Get request body
    const body = await request.json();
    const { isActive } = body;

    // Validate isActive parameter
    if (isActive === undefined || (isActive !== 0 && isActive !== 1)) {
      return NextResponse.json(
        {
          error: 'Valid isActive status is required (0 or 1)',
          code: 'INVALID_STATUS'
        },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        {
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Update user isActive status
    const updatedUser = await db
      .update(users)
      .set({
        isActive: isActive
      })
      .where(eq(users.id, userId))
      .returning();

    if (updatedUser.length === 0) {
      return NextResponse.json(
        {
          error: 'Failed to update user status',
          code: 'UPDATE_FAILED'
        },
        { status: 500 }
      );
    }

    // Exclude passwordHash from response
    const { passwordHash, ...userResponse } = updatedUser[0];

    return NextResponse.json(userResponse, { status: 200 });
  } catch (error) {
    console.error('PUT /api/admin/users/[id]/activate error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + error,
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}