import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { requireAdmin } from '@/lib/authMiddleware';
import { eq, like, and, desc, count } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export async function GET(request: NextRequest) {
  try {
    const adminCheck = requireAdmin(request);
    if ('error' in adminCheck) {
      return NextResponse.json(
        { error: adminCheck.error, code: 'UNAUTHORIZED' },
        { status: adminCheck.status }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const roleParam = searchParams.get('role');
    const searchParam = searchParams.get('search');
    const isActiveParam = searchParams.get('isActive');

    let limit = 50;
    if (limitParam) {
      limit = parseInt(limitParam);
      if (isNaN(limit) || limit < 1 || limit > 200) {
        return NextResponse.json({
          error: 'Limit must be between 1 and 200',
          code: 'INVALID_LIMIT'
        }, { status: 400 });
      }
    }

    let offset = 0;
    if (offsetParam) {
      offset = parseInt(offsetParam);
      if (isNaN(offset) || offset < 0) {
        return NextResponse.json({
          error: 'Offset must be non-negative',
          code: 'INVALID_OFFSET'
        }, { status: 400 });
      }
    }

    if (roleParam && !['admin', 'moderator', 'user'].includes(roleParam)) {
      return NextResponse.json({
        error: 'Role must be one of: admin, moderator, user',
        code: 'INVALID_ROLE'
      }, { status: 400 });
    }

    const conditions = [];
    
    if (roleParam) {
      conditions.push(eq(users.role, roleParam));
    }

    if (searchParam) {
      conditions.push(like(users.email, `%${searchParam}%`));
    }

    if (isActiveParam !== null) {
      const isActiveValue = parseInt(isActiveParam);
      if (isActiveValue === 0 || isActiveValue === 1) {
        conditions.push(eq(users.isActive, isActiveValue));
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [usersList, totalCount] = await Promise.all([
      db.select({
        id: users.id,
        email: users.email,
        role: users.role,
        managerName: users.managerName,
        profileImageUrl: users.profileImageUrl,
        isActive: users.isActive,
        createdAt: users.createdAt
      })
        .from(users)
        .where(whereClause)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset),
      
      db.select({ count: count() })
        .from(users)
        .where(whereClause)
    ]);

    return NextResponse.json({
      users: usersList,
      total: totalCount[0].count
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminCheck = requireAdmin(request);
    if ('error' in adminCheck) {
      return NextResponse.json(
        { error: adminCheck.error, code: 'UNAUTHORIZED' },
        { status: adminCheck.status }
      );
    }

    const body = await request.json();
    const { email, password, role } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({
        error: 'Email is required',
        code: 'MISSING_EMAIL'
      }, { status: 400 });
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json({
        error: 'Password is required',
        code: 'MISSING_PASSWORD'
      }, { status: 400 });
    }

    if (!role || typeof role !== 'string') {
      return NextResponse.json({
        error: 'Role is required',
        code: 'MISSING_ROLE'
      }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json({
        error: 'Invalid email format',
        code: 'INVALID_EMAIL_FORMAT'
      }, { status: 400 });
    }

    if (!['admin', 'moderator', 'user'].includes(role)) {
      return NextResponse.json({
        error: 'Role must be one of: admin, moderator, user',
        code: 'INVALID_ROLE'
      }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({
        error: 'Password must be at least 6 characters long',
        code: 'PASSWORD_TOO_SHORT'
      }, { status: 400 });
    }

    const existingUser = await db.select()
      .from(users)
      .where(eq(users.email, trimmedEmail))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json({
        error: 'Email already exists',
        code: 'EMAIL_EXISTS'
      }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await db.insert(users)
      .values({
        email: trimmedEmail,
        passwordHash,
        role,
        createdAt: new Date().toISOString()
      })
      .returning({
        id: users.id,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt
      });

    return NextResponse.json(newUser[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}