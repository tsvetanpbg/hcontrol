import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { cleaningLogs, establishments, personnel } from '@/db/schema';
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

    const logId = parseInt(id);

    const log = await db
      .select()
      .from(cleaningLogs)
      .where(eq(cleaningLogs.id, logId))
      .limit(1);

    if (log.length === 0) {
      return NextResponse.json(
        { error: 'Cleaning log not found', code: 'LOG_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (log[0].userId !== authResult.user.userId) {
      return NextResponse.json(
        { error: 'You do not have permission to access this cleaning log', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    return NextResponse.json(log[0], { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
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

    const logId = parseInt(id);

    const existingLog = await db
      .select()
      .from(cleaningLogs)
      .where(eq(cleaningLogs.id, logId))
      .limit(1);

    if (existingLog.length === 0) {
      return NextResponse.json(
        { error: 'Cleaning log not found', code: 'LOG_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (existingLog[0].userId !== authResult.user.userId) {
      return NextResponse.json(
        { error: 'You do not have permission to update this cleaning log', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const body = await request.json();

    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json(
        { error: 'User ID cannot be provided in request body', code: 'USER_ID_NOT_ALLOWED' },
        { status: 400 }
      );
    }

    const {
      startTime,
      endTime,
      cleaningAreas,
      products,
      establishmentId,
      employeeId,
      employeeName,
      notes,
      logDate,
    } = body;

    const timeRegex = /^\d{2}:\d{2}$/;
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (startTime !== undefined) {
      if (!timeRegex.test(startTime)) {
        return NextResponse.json(
          { error: 'Start time must be in HH:MM format', code: 'INVALID_START_TIME' },
          { status: 400 }
        );
      }
    }

    if (endTime !== undefined) {
      if (!timeRegex.test(endTime)) {
        return NextResponse.json(
          { error: 'End time must be in HH:MM format', code: 'INVALID_END_TIME' },
          { status: 400 }
        );
      }
    }

    const finalStartTime = startTime !== undefined ? startTime : existingLog[0].startTime;
    const finalEndTime = endTime !== undefined ? endTime : existingLog[0].endTime;

    if (finalStartTime && finalEndTime) {
      const [startHour, startMin] = finalStartTime.split(':').map(Number);
      const [endHour, endMin] = finalEndTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (endMinutes <= startMinutes) {
        return NextResponse.json(
          { error: 'End time must be after start time', code: 'INVALID_TIME_RANGE' },
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

    if (products !== undefined) {
      if (!Array.isArray(products) || products.length === 0) {
        return NextResponse.json(
          { error: 'Products must be a non-empty array', code: 'INVALID_PRODUCTS' },
          { status: 400 }
        );
      }
    }

    if (logDate !== undefined) {
      if (!dateRegex.test(logDate)) {
        return NextResponse.json(
          { error: 'Log date must be in YYYY-MM-DD format', code: 'INVALID_LOG_DATE' },
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
          { error: 'Establishment not found or does not belong to user', code: 'INVALID_ESTABLISHMENT' },
          { status: 400 }
        );
      }
    }

    let finalEmployeeName = employeeName;

    if (employeeId !== undefined && employeeId !== null) {
      const employee = await db
        .select({
          id: personnel.id,
          fullName: personnel.fullName,
          establishmentId: personnel.establishmentId,
        })
        .from(personnel)
        .where(eq(personnel.id, employeeId))
        .limit(1);

      if (employee.length === 0) {
        return NextResponse.json(
          { error: 'Employee not found', code: 'INVALID_EMPLOYEE' },
          { status: 400 }
        );
      }

      const employeeEstablishment = await db
        .select()
        .from(establishments)
        .where(
          and(
            eq(establishments.id, employee[0].establishmentId),
            eq(establishments.userId, authResult.user.userId)
          )
        )
        .limit(1);

      if (employeeEstablishment.length === 0) {
        return NextResponse.json(
          { error: 'Employee does not belong to your establishment', code: 'INVALID_EMPLOYEE_ESTABLISHMENT' },
          { status: 400 }
        );
      }

      finalEmployeeName = employee[0].fullName;
    }

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (startTime !== undefined) updateData.startTime = startTime;
    if (endTime !== undefined) updateData.endTime = endTime;
    if (cleaningAreas !== undefined) updateData.cleaningAreas = JSON.stringify(cleaningAreas);
    if (products !== undefined) updateData.products = JSON.stringify(products);
    if (establishmentId !== undefined) updateData.establishmentId = establishmentId;
    if (employeeId !== undefined) updateData.employeeId = employeeId;
    if (finalEmployeeName !== undefined) updateData.employeeName = finalEmployeeName;
    if (notes !== undefined) updateData.notes = notes;
    if (logDate !== undefined) updateData.logDate = logDate;

    const updated = await db
      .update(cleaningLogs)
      .set(updateData)
      .where(eq(cleaningLogs.id, logId))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update cleaning log', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
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

    const logId = parseInt(id);

    const existingLog = await db
      .select()
      .from(cleaningLogs)
      .where(eq(cleaningLogs.id, logId))
      .limit(1);

    if (existingLog.length === 0) {
      return NextResponse.json(
        { error: 'Cleaning log not found', code: 'LOG_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (existingLog[0].userId !== authResult.user.userId) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this cleaning log', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const deleted = await db
      .delete(cleaningLogs)
      .where(eq(cleaningLogs.id, logId))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete cleaning log', code: 'DELETE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Cleaning log deleted successfully', id: logId },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}