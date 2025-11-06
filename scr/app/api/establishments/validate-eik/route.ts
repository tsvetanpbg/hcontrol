import { NextRequest, NextResponse } from 'next/server';

function validateEIK9(eik: string): boolean {
  const digits = eik.split('').map(Number);
  const weights1 = [1, 2, 3, 4, 5, 6, 7, 8];
  const weights2 = [3, 4, 5, 6, 7, 8, 9, 10];

  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += digits[i] * weights1[i];
  }

  let checksum = sum % 11;

  if (checksum === 10) {
    sum = 0;
    for (let i = 0; i < 8; i++) {
      sum += digits[i] * weights2[i];
    }
    checksum = sum % 11;
    
    if (checksum === 10) {
      checksum = 0;
    }
  }

  return digits[8] === checksum;
}

function validateEIK13(eik: string): boolean {
  // First validate the first 9 digits
  const first9 = eik.substring(0, 9);
  if (!validateEIK9(first9)) {
    return false;
  }

  // Then validate the 13th digit
  const digits = eik.split('').map(Number);
  const weights1 = [2, 7, 3, 5];
  const weights2 = [4, 9, 5, 7];

  let sum = 0;
  for (let i = 8; i < 12; i++) {
    sum += digits[i] * weights1[i - 8];
  }

  let checksum = sum % 11;

  if (checksum === 10) {
    sum = 0;
    for (let i = 8; i < 12; i++) {
      sum += digits[i] * weights2[i - 8];
    }
    checksum = sum % 11;
    
    if (checksum === 10) {
      checksum = 0;
    }
  }

  return digits[12] === checksum;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eik } = body;

    console.log('EIK validation attempt:', { eik });

    // Validate required field
    if (!eik) {
      console.log('Validation failed: EIK is missing');
      return NextResponse.json(
        {
          valid: false,
          message: 'EIK is required',
          code: 'MISSING_EIK',
        },
        { status: 400 }
      );
    }

    // Trim whitespace
    const trimmedEik = eik.trim();

    // Check if contains only digits
    if (!/^\d+$/.test(trimmedEik)) {
      console.log('Validation failed: EIK contains non-digit characters');
      return NextResponse.json(
        {
          valid: false,
          message: 'EIK must contain only digits',
          code: 'INVALID_FORMAT',
        },
        { status: 400 }
      );
    }

    // Check length
    if (trimmedEik.length !== 9 && trimmedEik.length !== 13) {
      console.log('Validation failed: Invalid EIK length', { length: trimmedEik.length });
      return NextResponse.json(
        {
          valid: false,
          message: 'EIK must be 9 or 13 digits',
          code: 'INVALID_LENGTH',
        },
        { status: 400 }
      );
    }

    // Validate checksum based on length
    let isValid = false;
    if (trimmedEik.length === 9) {
      isValid = validateEIK9(trimmedEik);
    } else {
      isValid = validateEIK13(trimmedEik);
    }

    if (!isValid) {
      console.log('Validation failed: Invalid checksum');
      return NextResponse.json(
        {
          valid: false,
          message: 'Invalid EIK checksum',
        },
        { status: 200 }
      );
    }

    console.log('Validation successful:', { eik: trimmedEik });
    return NextResponse.json(
      {
        valid: true,
        message: 'EIK is valid',
        companyName: null,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('EIK validation error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + error,
      },
      { status: 500 }
    );
  }
}