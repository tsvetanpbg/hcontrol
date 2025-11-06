import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, businesses } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      email,
      password,
      managerName,
      profileImageUrl,
      businessName,
      businessType,
      city,
      address,
      phone,
      businessEmail,
      eik,
      vatRegistered,
      vatNumber
    } = body;

    // Validate required user fields
    if (!email) {
      return NextResponse.json({
        error: 'Email is required',
        code: 'MISSING_EMAIL'
      }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({
        error: 'Password is required',
        code: 'MISSING_PASSWORD'
      }, { status: 400 });
    }

    if (!managerName) {
      return NextResponse.json({
        error: 'Manager name is required',
        code: 'MISSING_MANAGER_NAME'
      }, { status: 400 });
    }

    // Validate required business fields
    if (!businessName) {
      return NextResponse.json({
        error: 'Business name is required',
        code: 'MISSING_BUSINESS_NAME'
      }, { status: 400 });
    }

    if (!businessType) {
      return NextResponse.json({
        error: 'Business type is required',
        code: 'MISSING_BUSINESS_TYPE'
      }, { status: 400 });
    }

    if (!city) {
      return NextResponse.json({
        error: 'City is required',
        code: 'MISSING_CITY'
      }, { status: 400 });
    }

    if (!address) {
      return NextResponse.json({
        error: 'Address is required',
        code: 'MISSING_ADDRESS'
      }, { status: 400 });
    }

    if (!phone) {
      return NextResponse.json({
        error: 'Phone is required',
        code: 'MISSING_PHONE'
      }, { status: 400 });
    }

    if (!businessEmail) {
      return NextResponse.json({
        error: 'Business email is required',
        code: 'MISSING_BUSINESS_EMAIL'
      }, { status: 400 });
    }

    // Sanitize inputs
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedBusinessEmail = businessEmail.trim().toLowerCase();
    const sanitizedBusinessName = businessName.trim();
    const sanitizedBusinessType = businessType.trim();
    const sanitizedCity = city.trim();
    const sanitizedAddress = address.trim();
    const sanitizedPhone = phone.trim();
    const sanitizedManagerName = managerName.trim();
    const sanitizedProfileImageUrl = profileImageUrl ? profileImageUrl.trim() : null;
    const sanitizedEik = eik ? eik.trim() : null;
    const sanitizedVatNumber = vatNumber ? vatNumber.trim() : null;

    // Check if email already exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.email, sanitizedEmail))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json({
        error: 'Email already exists',
        code: 'EMAIL_EXISTS'
      }, { status: 400 });
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    const timestamp = new Date().toISOString();

    // Create user and business in transaction
    const newUser = await db.insert(users)
      .values({
        email: sanitizedEmail,
        passwordHash,
        role: 'user',
        managerName: sanitizedManagerName,
        profileImageUrl: sanitizedProfileImageUrl,
        isActive: 0,
        createdAt: timestamp
      })
      .returning();

    if (newUser.length === 0) {
      return NextResponse.json({
        error: 'Failed to create user',
        code: 'USER_CREATION_FAILED'
      }, { status: 500 });
    }

    const userId = newUser[0].id;

    const newBusiness = await db.insert(businesses)
      .values({
        userId,
        name: sanitizedBusinessName,
        type: sanitizedBusinessType,
        city: sanitizedCity,
        address: sanitizedAddress,
        phone: sanitizedPhone,
        email: sanitizedBusinessEmail,
        refrigeratorCount: 0,
        freezerCount: 0,
        hotDisplayCount: 0,
        coldDisplayCount: 0,
        otherEquipment: sanitizedEik ? `ЕИК: ${sanitizedEik}` : null,
        createdAt: timestamp
      })
      .returning();

    if (newBusiness.length === 0) {
      // Rollback user creation if business creation fails
      await db.delete(users).where(eq(users.id, userId));
      return NextResponse.json({
        error: 'Failed to create business',
        code: 'BUSINESS_CREATION_FAILED'
      }, { status: 500 });
    }

    // Return user without password hash
    const { passwordHash: _, ...userWithoutPassword } = newUser[0];

    return NextResponse.json({
      user: userWithoutPassword,
      business: newBusiness[0]
    }, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}