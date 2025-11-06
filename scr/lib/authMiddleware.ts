import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export interface AuthUser {
  userId: number;
  email: string;
  role: string;
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, jwtSecret) as AuthUser;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function getAuthUserFromRequest(request: NextRequest): AuthUser | null {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  return verifyToken(token);
}

export function requireAuth(request: NextRequest): { user: AuthUser } | { error: string; status: number } {
  const user = getAuthUserFromRequest(request);
  
  if (!user) {
    return { 
      error: 'Unauthorized - Invalid or missing token',
      status: 401
    };
  }

  return { user };
}

export function requireAdmin(request: NextRequest): { user: AuthUser } | { error: string; status: number } {
  const authResult = requireAuth(request);
  
  if ('error' in authResult) {
    return authResult;
  }

  if (authResult.user.role !== 'admin') {
    return { 
      error: 'Forbidden - Admin access required',
      status: 403
    };
  }

  return authResult;
}