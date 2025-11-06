import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, establishments, personnel } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    // Demo user data
    const demoEmail = 'demo@user.bg';
    const demoPassword = 'user123';

    // Check if demo user exists
    let demoUser = await db.select()
      .from(users)
      .where(eq(users.email, demoEmail))
      .limit(1);

    // Create demo user if doesn't exist
    if (demoUser.length === 0) {
      const passwordHash = bcrypt.hashSync(demoPassword, 10);
      const newUser = await db.insert(users)
        .values({
          email: demoEmail,
          passwordHash,
          role: 'user',
          managerName: 'Демо Потребител',
          isActive: 1,
          createdAt: new Date().toISOString(),
        })
        .returning();
      
      demoUser = newUser;
    }

    const userId = demoUser[0].id;

    // Check if demo establishment exists
    const existingEstablishment = await db.select()
      .from(establishments)
      .where(eq(establishments.companyName, 'Ресторант Под Липите ЕООД'))
      .limit(1);

    if (existingEstablishment.length > 0) {
      return NextResponse.json({
        message: 'Demo establishment already exists',
        data: {
          establishment: {
            id: existingEstablishment[0].id,
            companyName: existingEstablishment[0].companyName,
          }
        }
      }, { status: 200 });
    }

    // Get current date in YYYY-MM-DD format
    const currentDate = new Date().toISOString().split('T')[0];
    const currentTimestamp = new Date().toISOString();

    // Create demo establishment
    const newEstablishment = await db.insert(establishments)
      .values({
        userId,
        establishmentType: 'Ресторант',
        employeeCount: 4,
        managerName: 'Иван Петров',
        managerPhone: '+359 888 123 456',
        managerEmail: 'ivan.petrov@restaurant-demo.bg',
        companyName: 'Ресторант Под Липите ЕООД',
        eik: '123456789',
        eikVerified: 1,
        eikVerificationDate: currentDate,
        registrationAddress: 'гр. София, ул. Витоша 15',
        contactEmail: 'info@restaurant-demo.bg',
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp,
      })
      .returning();

    const establishmentId = newEstablishment[0].id;

    // Create 4 demo personnel records
    const personnelData = [
      {
        establishmentId,
        fullName: 'Мария Георгиева',
        egn: '9012154321',
        position: 'Сервитьор',
        workBookNumber: 'TB001234',
        workBookValidity: '2026-12-31',
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp,
      },
      {
        establishmentId,
        fullName: 'Георги Димитров',
        egn: '8506127890',
        position: 'Готвач',
        workBookNumber: 'TB002345',
        workBookValidity: '2026-12-31',
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp,
      },
      {
        establishmentId,
        fullName: 'Елена Стоянова',
        egn: '9203145678',
        position: 'Барман',
        workBookNumber: 'TB003456',
        workBookValidity: '2026-12-31',
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp,
      },
      {
        establishmentId,
        fullName: 'Стефан Николов',
        egn: '8801123456',
        position: 'Сервитьор',
        workBookNumber: 'TB004567',
        workBookValidity: '2026-12-31',
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp,
      },
    ];

    await db.insert(personnel).values(personnelData);

    return NextResponse.json({
      message: 'Demo establishment and personnel seeded successfully',
      data: {
        user: {
          id: demoUser[0].id,
          email: demoUser[0].email,
        },
        establishment: {
          id: newEstablishment[0].id,
          companyName: newEstablishment[0].companyName,
        },
        personnelCount: 4,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({
      error: 'Failed to seed demo establishment: ' + (error instanceof Error ? error.message : 'Unknown error'),
      code: 'SEEDING_FAILED'
    }, { status: 500 });
  }
}