import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { requireAdmin } from '@/lib/authMiddleware';
import { eq, and, ne } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminResult = requireAdmin(request);
    if ('error' in adminResult) {
      return NextResponse.json(
        { error: adminResult.error, code: 'UNAUTHORIZED' },
        { status: adminResult.status }
      );
    }

    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid user ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const userId = parseInt(id);

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { email, password, role } = body;

    if (!email && !password && !role) {
      return NextResponse.json(
        { error: 'At least one field must be provided for update', code: 'NO_UPDATE_FIELDS' },
        { status: 400 }
      );
    }

    const updates: any = {};

    if (email !== undefined) {
      const trimmedEmail = email.trim().toLowerCase();
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        return NextResponse.json(
          { error: 'Invalid email format', code: 'INVALID_EMAIL' },
          { status: 400 }
        );
      }

      const emailExists = await db
        .select()
        .from(users)
        .where(and(eq(users.email, trimmedEmail), ne(users.id, userId)))
        .limit(1);

      if (emailExists.length > 0) {
        return NextResponse.json(
          { error: 'Email already exists', code: 'EMAIL_EXISTS' },
          { status: 409 }
        );
      }

      updates.email = trimmedEmail;
    }

    if (password !== undefined) {
      const trimmedPassword = password.trim();
      
      if (trimmedPassword.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters long', code: 'WEAK_PASSWORD' },
          { status: 400 }
        );
      }

      const hashedPassword = await bcrypt.hash(trimmedPassword, 10);
      updates.passwordHash = hashedPassword;
    }

    if (role !== undefined) {
      const trimmedRole = role.trim();
      const validRoles = ['admin', 'moderator', 'user'];
      
      if (!validRoles.includes(trimmedRole)) {
        return NextResponse.json(
          { error: 'Role must be one of: admin, moderator, user', code: 'INVALID_ROLE' },
          { status: 400 }
        );
      }

      updates.role = trimmedRole;
    }

    const updatedUser = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();

    if (updatedUser.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update user', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    const { passwordHash, ...userWithoutPassword } = updatedUser[0];

    return NextResponse.json(userWithoutPassword, { status: 200 });
  } catch (error) {
    console.error('PUT /api/admin/users/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminResult = requireAdmin(request);
    if ('error' in adminResult) {
      return NextResponse.json(
        { error: adminResult.error, code: 'UNAUTHORIZED' },
        { status: adminResult.status }
      );
    }

    const adminUser = adminResult.user;
    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid user ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const userId = parseInt(id);

    if (userId === adminUser.userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account', code: 'CANNOT_DELETE_SELF' },
        { status: 400 }
      );
    }

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const deletedUser = await db
      .delete(users)
      .where(eq(users.id, userId))
      .returning();

    if (deletedUser.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete user', code: 'DELETE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'User deleted successfully',
        id: userId
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE /api/admin/users/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}