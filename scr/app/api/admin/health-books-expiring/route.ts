import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { personnel, establishments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication and admin role
    const authResult = verifyAuth(request);
    if (!authResult.valid || authResult.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all personnel
    const allPersonnel = await db.select().from(personnel);

    // Get current date
    const now = new Date();
    const tenDaysFromNow = new Date();
    tenDaysFromNow.setDate(now.getDate() + 10);

    // Filter personnel with health books expiring in next 10 days
    const expiringPersonnel = [];

    for (const person of allPersonnel) {
      const validityDate = new Date(person.healthBookValidity);
      
      // Check if validity date is between now and 10 days from now
      if (validityDate >= now && validityDate <= tenDaysFromNow) {
        // Calculate days until expiry
        const daysUntilExpiry = Math.ceil((validityDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // Get establishment details
        const establishment = await db.select()
          .from(establishments)
          .where(eq(establishments.id, person.establishmentId))
          .limit(1);

        expiringPersonnel.push({
          id: person.id,
          fullName: person.fullName,
          position: person.position,
          healthBookNumber: person.healthBookNumber,
          healthBookValidity: person.healthBookValidity,
          daysUntilExpiry,
          establishmentId: person.establishmentId,
          establishmentName: establishment[0]?.companyName || 'N/A',
          contactEmail: establishment[0]?.contactEmail || null,
        });
      }
    }

    // Sort by days until expiry (soonest first)
    expiringPersonnel.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

    return NextResponse.json({ 
      personnel: expiringPersonnel,
      total: expiringPersonnel.length 
    });
  } catch (error) {
    console.error('Error fetching expiring health books:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
