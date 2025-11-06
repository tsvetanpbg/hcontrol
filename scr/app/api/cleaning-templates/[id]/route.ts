import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { cleaningTemplates, establishments, personnel } from '@/db/schema';
import { requireAuth } from '@/lib/authMiddleware';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const id = params.id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const template = await db
      .select()
      .from(cleaningTemplates)
      .where(eq(cleaningTemplates.id, parseInt(id)))
      .limit(1);

    if (template.length === 0) {
      return NextResponse.json(
        { error: 'Template not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (template[0].userId !== authResult.user.userId) {
      return NextResponse.json(
        { error: 'You do not have permission to access this template', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    return NextResponse.json(template[0], { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const id = params.id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json(
        { error: 'User ID cannot be provided in request body', code: 'USER_ID_NOT_ALLOWED' },
        { status: 400 }
      );
    }

    const existingTemplate = await db
      .select()
      .from(cleaningTemplates)
      .where(eq(cleaningTemplates.id, parseInt(id)))
      .limit(1);

    if (existingTemplate.length === 0) {
      return NextResponse.json(
        { error: 'Template not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (existingTemplate[0].userId !== authResult.user.userId) {
      return NextResponse.json(
        { error: 'You do not have permission to update this template', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const {
      name,
      daysOfWeek,
      cleaningHours,
      duration,
      products,
      cleaningAreas,
      establishmentId,
      employeeId,
    } = body;

    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json(
        { error: 'Name must be a non-empty string', code: 'INVALID_NAME' },
        { status: 400 }
      );
    }

    if (daysOfWeek !== undefined) {
      if (!Array.isArray(daysOfWeek)) {
        return NextResponse.json(
          { error: 'Days of week must be an array', code: 'INVALID_DAYS_OF_WEEK' },
          { status: 400 }
        );
      }
      const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      for (const day of daysOfWeek) {
        if (!validDays.includes(day)) {
          return NextResponse.json(
            { error: `Invalid day: ${day}. Must be one of: ${validDays.join(', ')}`, code: 'INVALID_DAY_NAME' },
            { status: 400 }
          );
        }
      }
    }

    if (cleaningHours !== undefined) {
      if (!Array.isArray(cleaningHours)) {
        return NextResponse.json(
          { error: 'Cleaning hours must be an array', code: 'INVALID_CLEANING_HOURS' },
          { status: 400 }
        );
      }
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      for (const hour of cleaningHours) {
        if (!timeRegex.test(hour)) {
          return NextResponse.json(
            { error: `Invalid time format: ${hour}. Must be HH:MM format`, code: 'INVALID_TIME_FORMAT' },
            { status: 400 }
          );
        }
      }
    }

    if (duration !== undefined) {
      if (typeof duration !== 'number' || duration <= 0 || !Number.isInteger(duration)) {
        return NextResponse.json(
          { error: 'Duration must be a positive integer', code: 'INVALID_DURATION' },
          { status: 400 }
        );
      }
    }

    if (products !== undefined) {
      if (!Array.isArray(products) || products.length === 0) {
        return NextResponse.json(
          { error: 'Products must be a non-empty array', code: 'INVALID_PRODUCTS' },
          { status: 400 }
        );
      }
    }

    if (cleaningAreas !== undefined) {
      if (!Array.isArray(cleaningAreas) || cleaningAreas.length === 0) {
        return NextResponse.json(
          { error: 'Cleaning areas must be a non-empty array', code: 'INVALID_CLEANING_AREAS' },
          { status: 400 }
        );
      }
    }

    if (establishmentId !== undefined && establishmentId !== null) {
      const establishment = await db
        .select()
        .from(establishments)
        .where(
          and(
            eq(establishments.id, establishmentId),
            eq(establishments.userId, authResult.user.userId)
          )
        )
        .limit(1);

      if (establishment.length === 0) {
        return NextResponse.json(
          { error: 'Establishment not found or does not belong to you', code: 'INVALID_ESTABLISHMENT' },
          { status: 400 }
        );
      }
    }

    if (employeeId !== undefined && employeeId !== null) {
      const employee = await db
        .select({
          id: personnel.id,
          establishmentId: personnel.establishmentId,
          userId: establishments.userId,
        })
        .from(personnel)
        .innerJoin(establishments, eq(personnel.establishmentId, establishments.id))
        .where(eq(personnel.id, employeeId))
        .limit(1);

      if (employee.length === 0) {
        return NextResponse.json(
          { error: 'Employee not found', code: 'INVALID_EMPLOYEE' },
          { status: 400 }
        );
      }

      if (employee[0].userId !== authResult.user.userId) {
        return NextResponse.json(
          { error: 'Employee does not belong to your establishment', code: 'EMPLOYEE_NOT_OWNED' },
          { status: 400 }
        );
      }
    }

    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updates.name = name.trim();
    if (daysOfWeek !== undefined) updates.daysOfWeek = daysOfWeek;
    if (cleaningHours !== undefined) updates.cleaningHours = cleaningHours;
    if (duration !== undefined) updates.duration = duration;
    if (products !== undefined) updates.products = products;
    if (cleaningAreas !== undefined) updates.cleaningAreas = cleaningAreas;
    if (establishmentId !== undefined) updates.establishmentId = establishmentId;
    if (employeeId !== undefined) updates.employeeId = employeeId;

    const updated = await db
      .update(cleaningTemplates)
      .set(updates)
      .where(
        and(
          eq(cleaningTemplates.id, parseInt(id)),
          eq(cleaningTemplates.userId, authResult.user.userId)
        )
      )
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update template', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const id = params.id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const existingTemplate = await db
      .select()
      .from(cleaningTemplates)
      .where(eq(cleaningTemplates.id, parseInt(id)))
      .limit(1);

    if (existingTemplate.length === 0) {
      return NextResponse.json(
        { error: 'Template not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (existingTemplate[0].userId !== authResult.user.userId) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this template', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const deleted = await db
      .delete(cleaningTemplates)
      .where(
        and(
          eq(cleaningTemplates.id, parseInt(id)),
          eq(cleaningTemplates.userId, authResult.user.userId)
        )
      )
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete template', code: 'DELETE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Template deleted successfully', id: parseInt(id) },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}