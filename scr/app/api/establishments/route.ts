import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { establishments } from '@/db/schema';
import { requireAuth } from '@/lib/authMiddleware';
import { eq } from 'drizzle-orm';

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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ESTABLISHMENTS = 10;

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = requireAuth(request);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error, code: 'UNAUTHORIZED' },
        { status: authResult.status }
      );
    }

    const userId = authResult.user.userId;
    const body = await request.json();

    // Extract fields from request body
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

    // Validate required fields are present and not empty
    if (!establishmentType || establishmentType.trim() === '') {
      return NextResponse.json(
        { error: 'Establishment type is required', code: 'ESTABLISHMENT_TYPE_REQUIRED' },
        { status: 400 }
      );
    }

    if (!employeeCount && employeeCount !== 0) {
      return NextResponse.json(
        { error: 'Employee count is required', code: 'EMPLOYEE_COUNT_REQUIRED' },
        { status: 400 }
      );
    }

    if (!managerName || managerName.trim() === '') {
      return NextResponse.json(
        { error: 'Manager name is required', code: 'MANAGER_NAME_REQUIRED' },
        { status: 400 }
      );
    }

    if (!managerPhone || managerPhone.trim() === '') {
      return NextResponse.json(
        { error: 'Manager phone is required', code: 'MANAGER_PHONE_REQUIRED' },
        { status: 400 }
      );
    }

    if (!managerEmail || managerEmail.trim() === '') {
      return NextResponse.json(
        { error: 'Manager email is required', code: 'MANAGER_EMAIL_REQUIRED' },
        { status: 400 }
      );
    }

    if (!companyName || companyName.trim() === '') {
      return NextResponse.json(
        { error: 'Company name is required', code: 'COMPANY_NAME_REQUIRED' },
        { status: 400 }
      );
    }

    if (!eik || eik.trim() === '') {
      return NextResponse.json(
        { error: 'EIK is required', code: 'EIK_REQUIRED' },
        { status: 400 }
      );
    }

    if (!registrationAddress || registrationAddress.trim() === '') {
      return NextResponse.json(
        { error: 'Registration address is required', code: 'REGISTRATION_ADDRESS_REQUIRED' },
        { status: 400 }
      );
    }

    if (!contactEmail || contactEmail.trim() === '') {
      return NextResponse.json(
        { error: 'Contact email is required', code: 'CONTACT_EMAIL_REQUIRED' },
        { status: 400 }
      );
    }

    // Validate establishmentType is one of the allowed values
    if (!VALID_ESTABLISHMENT_TYPES.includes(establishmentType)) {
      return NextResponse.json(
        { 
          error: `Invalid establishment type. Must be one of: ${VALID_ESTABLISHMENT_TYPES.join(', ')}`, 
          code: 'INVALID_ESTABLISHMENT_TYPE' 
        },
        { status: 400 }
      );
    }

    // Validate employeeCount is a positive integer
    const employeeCountNum = parseInt(employeeCount);
    if (isNaN(employeeCountNum) || employeeCountNum <= 0 || !Number.isInteger(employeeCountNum)) {
      return NextResponse.json(
        { error: 'Employee count must be a positive integer', code: 'INVALID_EMPLOYEE_COUNT' },
        { status: 400 }
      );
    }

    // Validate email formats
    if (!EMAIL_REGEX.test(managerEmail.trim())) {
      return NextResponse.json(
        { error: 'Invalid manager email format', code: 'INVALID_MANAGER_EMAIL' },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(contactEmail.trim())) {
      return NextResponse.json(
        { error: 'Invalid contact email format', code: 'INVALID_CONTACT_EMAIL' },
        { status: 400 }
      );
    }

    // Check establishment count limit (changed from 1 to 10)
    const existingEstablishments = await db.select()
      .from(establishments)
      .where(eq(establishments.userId, userId));

    if (existingEstablishments.length >= MAX_ESTABLISHMENTS) {
      return NextResponse.json(
        { 
          error: `Достигнат е максималният лимит от ${MAX_ESTABLISHMENTS} заведения`, 
          code: 'MAX_ESTABLISHMENTS_REACHED' 
        },
        { status: 400 }
      );
    }

    // Prepare data for insertion
    const now = new Date().toISOString();
    const establishmentData = {
      userId,
      establishmentType: establishmentType.trim(),
      employeeCount: employeeCountNum,
      managerName: managerName.trim(),
      managerPhone: managerPhone.trim(),
      managerEmail: managerEmail.trim().toLowerCase(),
      companyName: companyName.trim(),
      eik: eik.trim(),
      registrationAddress: registrationAddress.trim(),
      contactEmail: contactEmail.trim().toLowerCase(),
      vatRegistered: vatRegistered ? 1 : 0,
      vatNumber: vatNumber ? vatNumber.trim() : null,
      createdAt: now,
      updatedAt: now
    };

    // Insert into establishments table
    const newEstablishment = await db.insert(establishments)
      .values(establishmentData)
      .returning();

    return NextResponse.json(newEstablishment[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error, code: 'INTERNAL_SERVER_ERROR' },
      { status: 500 }
    );
  }
}