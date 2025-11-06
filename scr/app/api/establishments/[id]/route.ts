import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { establishments } from '@/db/schema';
import { requireAuth } from '@/lib/authMiddleware';
import { eq, and } from 'drizzle-orm';

const VALID_ESTABLISHMENT_TYPES = [
  "Ресторант",
  "Бирария",
  "Механа",
  "Кафе-аператив",
  "Закусвалня",
  "Фаст-Фууд",
  "Павилион ТХ",
  "Павилион",
  "Пекарна",
  "Баничарница",
  "Стол",
  "Бюфет",
  "Бар",
  "Бийч-бар",
  "Пуул-бар",
  "Кафене",
  "Пицария",
  "Магазин",
  "Магазин за месо",
  "Магазин за риба",
  "Магазин за пак. стоки",
  "Кулинарен магазин",
  "Супермаркет",
  "Дискотека",
  "Нощен-бар",
  "Цех за производство",
  "Снек-бар",
  "Кухня-майка",
  "Гостилница",
  "Коктейл-бар",
  "Склад за хр. продукти",
  "Каравана",
  "Винарна",
  "Пивница",
  "Кафетерия",
  "Кафе-сладкарница",
  "Сладкарница",
  "Сладоледен салон",
  "Чайна",
  "Пиано-бар",
  "Магазин за зеленчуци",
  "Казино",
  "Разливочна",
  "Детска млечна кухня",
  "Друг вид обект"
];

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = requireAuth(request);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error, code: 'UNAUTHORIZED' },
        { status: authResult.status }
      );
    }

    const userId = authResult.user.userId;
    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const establishmentId = parseInt(id);

    const existingEstablishment = await db
      .select()
      .from(establishments)
      .where(eq(establishments.id, establishmentId))
      .limit(1);

    if (existingEstablishment.length === 0) {
      return NextResponse.json(
        { error: 'Establishment not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (existingEstablishment[0].userId !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to update this establishment', code: 'FORBIDDEN' },
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
      establishmentType,
      employeeCount,
      managerName,
      managerPhone,
      managerEmail,
      companyName,
      eik,
      registrationAddress,
      contactEmail,
      vatRegistered,
      vatNumber
    } = body;

    if (establishmentType !== undefined) {
      if (typeof establishmentType !== 'string' || !VALID_ESTABLISHMENT_TYPES.includes(establishmentType)) {
        return NextResponse.json(
          { 
            error: `Invalid establishment type. Must be one of: ${VALID_ESTABLISHMENT_TYPES.join(', ')}`, 
            code: 'INVALID_ESTABLISHMENT_TYPE' 
          },
          { status: 400 }
        );
      }
    }

    if (employeeCount !== undefined) {
      if (typeof employeeCount !== 'number' || employeeCount < 0 || !Number.isInteger(employeeCount)) {
        return NextResponse.json(
          { error: 'Employee count must be a positive integer', code: 'INVALID_EMPLOYEE_COUNT' },
          { status: 400 }
        );
      }
    }

    if (managerEmail !== undefined) {
      if (typeof managerEmail !== 'string' || !validateEmail(managerEmail)) {
        return NextResponse.json(
          { error: 'Invalid manager email format', code: 'INVALID_MANAGER_EMAIL' },
          { status: 400 }
        );
      }
    }

    if (contactEmail !== undefined) {
      if (typeof contactEmail !== 'string' || !validateEmail(contactEmail)) {
        return NextResponse.json(
          { error: 'Invalid contact email format', code: 'INVALID_CONTACT_EMAIL' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    if (establishmentType !== undefined) updateData.establishmentType = establishmentType;
    if (employeeCount !== undefined) updateData.employeeCount = employeeCount;
    if (managerName !== undefined) updateData.managerName = typeof managerName === 'string' ? managerName.trim() : managerName;
    if (managerPhone !== undefined) updateData.managerPhone = typeof managerPhone === 'string' ? managerPhone.trim() : managerPhone;
    if (managerEmail !== undefined) updateData.managerEmail = typeof managerEmail === 'string' ? managerEmail.toLowerCase().trim() : managerEmail;
    if (companyName !== undefined) updateData.companyName = typeof companyName === 'string' ? companyName.trim() : companyName;
    if (eik !== undefined) updateData.eik = typeof eik === 'string' ? eik.trim() : eik;
    if (registrationAddress !== undefined) updateData.registrationAddress = typeof registrationAddress === 'string' ? registrationAddress.trim() : registrationAddress;
    if (contactEmail !== undefined) updateData.contactEmail = typeof contactEmail === 'string' ? contactEmail.toLowerCase().trim() : contactEmail;
    if (vatRegistered !== undefined) updateData.vatRegistered = vatRegistered ? 1 : 0;
    if (vatNumber !== undefined) updateData.vatNumber = vatNumber ? (typeof vatNumber === 'string' ? vatNumber.trim() : vatNumber) : null;

    const updated = await db
      .update(establishments)
      .set(updateData)
      .where(and(eq(establishments.id, establishmentId), eq(establishments.userId, userId)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update establishment', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
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
    const authResult = requireAuth(request);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error, code: 'UNAUTHORIZED' },
        { status: authResult.status }
      );
    }

    const userId = authResult.user.userId;
    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const establishmentId = parseInt(id);

    const existingEstablishment = await db
      .select()
      .from(establishments)
      .where(eq(establishments.id, establishmentId))
      .limit(1);

    if (existingEstablishment.length === 0) {
      return NextResponse.json(
        { error: 'Establishment not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (existingEstablishment[0].userId !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this establishment', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const deleted = await db
      .delete(establishments)
      .where(and(eq(establishments.id, establishmentId), eq(establishments.userId, userId)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete establishment', code: 'DELETE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Establishment deleted successfully', 
        id: establishmentId,
        deleted: deleted[0]
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}