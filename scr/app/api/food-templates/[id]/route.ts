import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { foodTemplates, foodItems, establishments, personnel } from '@/db/schema';
import { requireAuth } from '@/lib/authMiddleware';
import { eq, and, inArray } from 'drizzle-orm';

const VALID_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_FORMAT_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = requireAuth(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error, code: 'UNAUTHORIZED' }, { status: authResult.status });
    }
    const userId = authResult.user.userId;

    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const template = await db
      .select()
      .from(foodTemplates)
      .where(eq(foodTemplates.id, parseInt(id)))
      .limit(1);

    if (template.length === 0) {
      return NextResponse.json(
        { error: 'Template not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (template[0].userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied to this template', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const responseTemplate = {
      ...template[0],
      daysOfWeek: typeof template[0].daysOfWeek === 'string' 
        ? JSON.parse(template[0].daysOfWeek) 
        : template[0].daysOfWeek,
      preparationTimes: typeof template[0].preparationTimes === 'string'
        ? JSON.parse(template[0].preparationTimes)
        : template[0].preparationTimes,
      foodItemIds: typeof template[0].foodItemIds === 'string'
        ? JSON.parse(template[0].foodItemIds)
        : template[0].foodItemIds
    };

    return NextResponse.json(responseTemplate, { status: 200 });
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
    const authResult = requireAuth(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error, code: 'UNAUTHORIZED' }, { status: authResult.status });
    }
    const userId = authResult.user.userId;

    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const requestBody = await request.json();

    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json(
        {
          error: 'User ID cannot be provided in request body',
          code: 'USER_ID_NOT_ALLOWED',
        },
        { status: 400 }
      );
    }

    const template = await db
      .select()
      .from(foodTemplates)
      .where(eq(foodTemplates.id, parseInt(id)))
      .limit(1);

    if (template.length === 0) {
      return NextResponse.json(
        { error: 'Template not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (template[0].userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied to this template', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const {
      name,
      daysOfWeek,
      preparationTimes,
      foodItemIds,
      establishmentId,
      employeeId,
    } = requestBody;

    const updates: any = {};

    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return NextResponse.json(
          { error: 'Name cannot be empty', code: 'INVALID_NAME' },
          { status: 400 }
        );
      }
      updates.name = trimmedName;
    }

    if (daysOfWeek !== undefined) {
      if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
        return NextResponse.json(
          {
            error: 'Days of week must be a non-empty array',
            code: 'INVALID_DAYS_OF_WEEK',
          },
          { status: 400 }
        );
      }

      for (const day of daysOfWeek) {
        if (!VALID_DAYS.includes(day)) {
          return NextResponse.json(
            {
              error: `Invalid day name: ${day}. Must be one of: ${VALID_DAYS.join(', ')}`,
              code: 'INVALID_DAY_NAME',
            },
            { status: 400 }
          );
        }
      }
      updates.daysOfWeek = JSON.stringify(daysOfWeek);
    }

    if (preparationTimes !== undefined) {
      if (!Array.isArray(preparationTimes) || preparationTimes.length === 0) {
        return NextResponse.json(
          {
            error: 'Preparation times must be a non-empty array',
            code: 'INVALID_PREPARATION_TIMES',
          },
          { status: 400 }
        );
      }

      for (const time of preparationTimes) {
        if (!TIME_FORMAT_REGEX.test(time)) {
          return NextResponse.json(
            {
              error: `Invalid time format: ${time}. Must be in HH:MM format`,
              code: 'INVALID_TIME_FORMAT',
            },
            { status: 400 }
          );
        }
      }
      updates.preparationTimes = JSON.stringify(preparationTimes);
    }

    if (foodItemIds !== undefined) {
      if (!Array.isArray(foodItemIds) || foodItemIds.length === 0) {
        return NextResponse.json(
          {
            error: 'Food item IDs must be a non-empty array',
            code: 'INVALID_FOOD_ITEM_IDS',
          },
          { status: 400 }
        );
      }

      for (const itemId of foodItemIds) {
        if (!Number.isInteger(itemId)) {
          return NextResponse.json(
            {
              error: 'All food item IDs must be integers',
              code: 'INVALID_FOOD_ITEM_IDS',
            },
            { status: 400 }
          );
        }
      }

      const existingFoodItems = await db
        .select()
        .from(foodItems)
        .where(inArray(foodItems.id, foodItemIds));

      if (existingFoodItems.length !== foodItemIds.length) {
        return NextResponse.json(
          {
            error: 'One or more food items not found',
            code: 'FOOD_ITEM_NOT_FOUND',
          },
          { status: 400 }
        );
      }

      for (const item of existingFoodItems) {
        if (item.userId !== userId) {
          return NextResponse.json(
            {
              error: 'Access denied to one or more food items',
              code: 'FOOD_ITEM_ACCESS_DENIED',
            },
            { status: 400 }
          );
        }
      }

      updates.foodItemIds = JSON.stringify(foodItemIds);
    }

    if (establishmentId !== undefined) {
      if (establishmentId !== null) {
        if (!Number.isInteger(establishmentId)) {
          return NextResponse.json(
            {
              error: 'Establishment ID must be an integer',
              code: 'INVALID_ESTABLISHMENT_ID',
            },
            { status: 400 }
          );
        }

        const establishment = await db
          .select()
          .from(establishments)
          .where(eq(establishments.id, establishmentId))
          .limit(1);

        if (establishment.length === 0) {
          return NextResponse.json(
            {
              error: 'Establishment not found',
              code: 'ESTABLISHMENT_NOT_FOUND',
            },
            { status: 400 }
          );
        }

        if (establishment[0].userId !== userId) {
          return NextResponse.json(
            {
              error: 'Access denied to this establishment',
              code: 'FORBIDDEN',
            },
            { status: 400 }
          );
        }
      }
      updates.establishmentId = establishmentId;
    }

    if (employeeId !== undefined) {
      if (employeeId !== null) {
        if (!Number.isInteger(employeeId)) {
          return NextResponse.json(
            {
              error: 'Employee ID must be an integer',
              code: 'INVALID_EMPLOYEE_ID',
            },
            { status: 400 }
          );
        }

        const employee = await db
          .select()
          .from(personnel)
          .where(eq(personnel.id, employeeId))
          .limit(1);

        if (employee.length === 0) {
          return NextResponse.json(
            {
              error: 'Employee not found',
              code: 'EMPLOYEE_NOT_FOUND',
            },
            { status: 400 }
          );
        }

        const employeeEstablishment = await db
          .select()
          .from(establishments)
          .where(eq(establishments.id, employee[0].establishmentId))
          .limit(1);

        if (employeeEstablishment.length === 0 || employeeEstablishment[0].userId !== userId) {
          return NextResponse.json(
            {
              error: 'Access denied to this employee',
              code: 'EMPLOYEE_ACCESS_DENIED',
            },
            { status: 400 }
          );
        }

        const finalEstablishmentId = establishmentId !== undefined 
          ? establishmentId 
          : template[0].establishmentId;

        if (finalEstablishmentId !== null && employee[0].establishmentId !== finalEstablishmentId) {
          return NextResponse.json(
            {
              error: 'Employee does not belong to the specified establishment',
              code: 'EMPLOYEE_ESTABLISHMENT_MISMATCH',
            },
            { status: 400 }
          );
        }
      }
      updates.employeeId = employeeId;
    }

    if (Object.keys(updates).length === 0) {
      const responseTemplate = {
        ...template[0],
        daysOfWeek: typeof template[0].daysOfWeek === 'string' 
          ? JSON.parse(template[0].daysOfWeek) 
          : template[0].daysOfWeek,
        preparationTimes: typeof template[0].preparationTimes === 'string'
          ? JSON.parse(template[0].preparationTimes)
          : template[0].preparationTimes,
        foodItemIds: typeof template[0].foodItemIds === 'string'
          ? JSON.parse(template[0].foodItemIds)
          : template[0].foodItemIds
      };
      return NextResponse.json(responseTemplate, { status: 200 });
    }

    updates.updatedAt = new Date().toISOString();

    const updated = await db
      .update(foodTemplates)
      .set(updates)
      .where(and(eq(foodTemplates.id, parseInt(id)), eq(foodTemplates.userId, userId)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update template', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    const responseTemplate = {
      ...updated[0],
      daysOfWeek: typeof updated[0].daysOfWeek === 'string' 
        ? JSON.parse(updated[0].daysOfWeek) 
        : updated[0].daysOfWeek,
      preparationTimes: typeof updated[0].preparationTimes === 'string'
        ? JSON.parse(updated[0].preparationTimes)
        : updated[0].preparationTimes,
      foodItemIds: typeof updated[0].foodItemIds === 'string'
        ? JSON.parse(updated[0].foodItemIds)
        : updated[0].foodItemIds
    };

    return NextResponse.json(responseTemplate, { status: 200 });
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
    const authResult = requireAuth(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error, code: 'UNAUTHORIZED' }, { status: authResult.status });
    }
    const userId = authResult.user.userId;

    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const template = await db
      .select()
      .from(foodTemplates)
      .where(eq(foodTemplates.id, parseInt(id)))
      .limit(1);

    if (template.length === 0) {
      return NextResponse.json(
        { error: 'Template not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (template[0].userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied to this template', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const deleted = await db
      .delete(foodTemplates)
      .where(and(eq(foodTemplates.id, parseInt(id)), eq(foodTemplates.userId, userId)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete template', code: 'DELETE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Template deleted successfully',
        id: parseInt(id),
      },
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