import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdmin } from '@/lib/authMiddleware';

/**
 * Test endpoint to verify authentication middleware
 * GET /api/test-auth - Requires any authenticated user
 * GET /api/test-auth?admin=true - Requires admin role
 */
export async function GET(request: NextRequest) {
  const isAdminTest = request.nextUrl.searchParams.get('admin') === 'true';

  if (isAdminTest) {
    const authResult = requireAdmin(request);
    
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    return NextResponse.json({
      message: 'Admin authentication successful',
      user: authResult.user,
      timestamp: new Date().toISOString()
    });
  } else {
    const authResult = requireAuth(request);
    
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    return NextResponse.json({
      message: 'Authentication successful',
      user: authResult.user,
      timestamp: new Date().toISOString()
    });
  }
}