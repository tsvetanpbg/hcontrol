import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { businesses } from '@/db/schema';
import { like, or, desc, asc, count } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse and validate pagination parameters
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const limit = limitParam ? Math.min(parseInt(limitParam), 200) : 50;
    const offset = offsetParam ? parseInt(offsetParam) : 0;

    if (isNaN(limit) || limit < 1) {
      return NextResponse.json({ 
        error: 'Invalid limit parameter. Must be a positive number.',
        code: 'INVALID_LIMIT' 
      }, { status: 400 });
    }

    if (isNaN(offset) || offset < 0) {
      return NextResponse.json({ 
        error: 'Invalid offset parameter. Must be a non-negative number.',
        code: 'INVALID_OFFSET' 
      }, { status: 400 });
    }

    // Parse search parameter
    const search = searchParams.get('search');

    // Parse and validate sort parameters
    const sortParam = searchParams.get('sort') || 'createdAt';
    const orderParam = searchParams.get('order') || 'desc';

    const validSortFields = [
      'id', 'name', 'type', 'city', 'address', 'phone', 'email',
      'refrigeratorCount', 'freezerCount', 'hotDisplayCount', 
      'coldDisplayCount', 'createdAt'
    ];

    if (!validSortFields.includes(sortParam)) {
      return NextResponse.json({ 
        error: `Invalid sort parameter. Must be one of: ${validSortFields.join(', ')}`,
        code: 'INVALID_SORT_FIELD' 
      }, { status: 400 });
    }

    if (orderParam !== 'asc' && orderParam !== 'desc') {
      return NextResponse.json({ 
        error: 'Invalid order parameter. Must be either "asc" or "desc".',
        code: 'INVALID_ORDER' 
      }, { status: 400 });
    }

    // Build the query
    let query = db.select().from(businesses);
    let countQuery = db.select({ count: count() }).from(businesses);

    // Apply search filter if provided
    if (search && search.trim()) {
      const searchTerm = search.trim();
      const searchCondition = or(
        like(businesses.name, `%${searchTerm}%`),
        like(businesses.city, `%${searchTerm}%`),
        like(businesses.type, `%${searchTerm}%`)
      );
      
      query = query.where(searchCondition);
      countQuery = countQuery.where(searchCondition);
    }

    // Apply sorting
    const sortField = businesses[sortParam as keyof typeof businesses];
    if (orderParam === 'desc') {
      query = query.orderBy(desc(sortField));
    } else {
      query = query.orderBy(asc(sortField));
    }

    // Apply pagination
    query = query.limit(limit).offset(offset);

    // Execute queries
    const [businessResults, totalCount] = await Promise.all([
      query,
      countQuery
    ]);

    const total = totalCount[0]?.count || 0;

    return NextResponse.json({
      businesses: businessResults,
      total: total
    }, { status: 200 });

  } catch (error) {
    console.error('GET businesses error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}