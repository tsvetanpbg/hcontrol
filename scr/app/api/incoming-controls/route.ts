import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { incomingControls, establishments } from '@/db/schema';
import { requireAuth } from '@/lib/authMiddleware';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const authResult = requireAuth(request);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error, code: 'UNAUTHORIZED' },
        { status: authResult.status }
      );
    }

    const userId = authResult.user.userId;
    const body = await request.json();
    const { establishmentId, controlDate, imageUrl, notes } = body;

    // Validate required fields
    if (!controlDate) {
      return NextResponse.json(
        { 
          error: "Control date is required",
          code: "MISSING_CONTROL_DATE" 
        },
        { status: 400 }
      );
    }

    // Validate controlDate format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(controlDate)) {
      return NextResponse.json(
        { 
          error: "Control date must be in YYYY-MM-DD format",
          code: "INVALID_DATE_FORMAT" 
        },
        { status: 400 }
      );
    }

    if (!imageUrl || imageUrl.trim() === '') {
      return NextResponse.json(
        { 
          error: "Image URL is required",
          code: "MISSING_IMAGE_URL" 
        },
        { status: 400 }
      );
    }

    // Validate establishmentId if provided
    if (establishmentId !== undefined && establishmentId !== null) {
      // Validate it's a valid integer
      const parsedEstablishmentId = parseInt(establishmentId);
      if (isNaN(parsedEstablishmentId)) {
        return NextResponse.json(
          { 
            error: "Establishment ID must be a valid integer",
            code: "INVALID_ESTABLISHMENT_ID" 
          },
          { status: 400 }
        );
      }

      // Verify the establishment exists and belongs to the authenticated user
      const establishment = await db.select()
        .from(establishments)
        .where(
          and(
            eq(establishments.id, parsedEstablishmentId),
            eq(establishments.userId, userId)
          )
        )
        .limit(1);

      if (establishment.length === 0) {
        // Check if establishment exists at all
        const establishmentExists = await db.select()
          .from(establishments)
          .where(eq(establishments.id, parsedEstablishmentId))
          .limit(1);

        if (establishmentExists.length === 0) {
          return NextResponse.json(
            { 
              error: "Establishment not found",
              code: "ESTABLISHMENT_NOT_FOUND" 
            },
            { status: 404 }
          );
        } else {
          return NextResponse.json(
            { 
              error: "You do not have permission to access this establishment",
              code: "ESTABLISHMENT_ACCESS_DENIED" 
            },
            { status: 403 }
          );
        }
      }
    }

    // Prepare insert data
    const now = new Date().toISOString();
    const insertData: any = {
      userId,
      controlDate,
      imageUrl: imageUrl.trim(),
      createdAt: now,
      updatedAt: now,
    };

    // Add optional fields if provided
    if (establishmentId !== undefined && establishmentId !== null) {
      insertData.establishmentId = parseInt(establishmentId);
    }

    if (notes !== undefined && notes !== null) {
      insertData.notes = notes.trim();
    }

    // Insert into database
    const newControl = await db.insert(incomingControls)
      .values(insertData)
      .returning();

    return NextResponse.json(newControl[0], { status: 201 });

  } catch (error) {
    console.error('POST /api/incoming-controls error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + error
      },
      { status: 500 }
    );
  }
}