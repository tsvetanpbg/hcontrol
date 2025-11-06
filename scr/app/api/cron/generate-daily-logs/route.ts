import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { businesses, temperatureLogs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

interface TemperatureLog {
  businessId: number;
  equipmentType: string;
  equipmentNumber: number;
  temperature: number;
  logDate: string;
  createdAt: string;
}

function generateTemperature(min: number, max: number): number {
  const temp = Math.random() * (max - min) + min;
  return parseFloat(temp.toFixed(1));
}

/**
 * Cron job endpoint for automatic daily temperature log generation
 * This endpoint should be called daily (e.g., via a cron service or scheduler)
 * 
 * To set up automated execution, you can:
 * 1. Use a cron job service like cron-job.org or EasyCron
 * 2. Use Vercel Cron Jobs (add to vercel.json)
 * 3. Use GitHub Actions with scheduled workflows
 * 
 * Example Vercel cron configuration (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/generate-daily-logs",
 *     "schedule": "0 6 * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security (optional but recommended)
    const cronSecret = request.nextUrl.searchParams.get('secret');
    const expectedSecret = process.env.CRON_SECRET || 'your-cron-secret-key';
    
    if (cronSecret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid cron secret' },
        { status: 401 }
      );
    }

    const today = new Date();
    const logDate = today.toISOString().split('T')[0];

    const allBusinesses = await db.select().from(businesses);

    if (allBusinesses.length === 0) {
      return NextResponse.json(
        {
          message: 'No businesses found',
          date: logDate,
          logsGenerated: 0,
          businessesProcessed: 0
        },
        { status: 200 }
      );
    }

    const logsToInsert: TemperatureLog[] = [];
    const createdAt = new Date().toISOString();

    for (const business of allBusinesses) {
      // Generate logs for refrigerators
      for (let i = 1; i <= business.refrigeratorCount; i++) {
        const existingLog = await db.select()
          .from(temperatureLogs)
          .where(
            and(
              eq(temperatureLogs.businessId, business.id),
              eq(temperatureLogs.equipmentType, 'refrigerator'),
              eq(temperatureLogs.equipmentNumber, i),
              eq(temperatureLogs.logDate, logDate)
            )
          )
          .limit(1);

        if (existingLog.length === 0) {
          logsToInsert.push({
            businessId: business.id,
            equipmentType: 'refrigerator',
            equipmentNumber: i,
            temperature: generateTemperature(0, 4),
            logDate,
            createdAt
          });
        }
      }

      // Generate logs for freezers
      for (let i = 1; i <= business.freezerCount; i++) {
        const existingLog = await db.select()
          .from(temperatureLogs)
          .where(
            and(
              eq(temperatureLogs.businessId, business.id),
              eq(temperatureLogs.equipmentType, 'freezer'),
              eq(temperatureLogs.equipmentNumber, i),
              eq(temperatureLogs.logDate, logDate)
            )
          )
          .limit(1);

        if (existingLog.length === 0) {
          logsToInsert.push({
            businessId: business.id,
            equipmentType: 'freezer',
            equipmentNumber: i,
            temperature: generateTemperature(-36, -18),
            logDate,
            createdAt
          });
        }
      }

      // Generate logs for hot displays
      for (let i = 1; i <= business.hotDisplayCount; i++) {
        const existingLog = await db.select()
          .from(temperatureLogs)
          .where(
            and(
              eq(temperatureLogs.businessId, business.id),
              eq(temperatureLogs.equipmentType, 'hot_display'),
              eq(temperatureLogs.equipmentNumber, i),
              eq(temperatureLogs.logDate, logDate)
            )
          )
          .limit(1);

        if (existingLog.length === 0) {
          logsToInsert.push({
            businessId: business.id,
            equipmentType: 'hot_display',
            equipmentNumber: i,
            temperature: generateTemperature(63, 80),
            logDate,
            createdAt
          });
        }
      }

      // Generate logs for cold displays
      for (let i = 1; i <= business.coldDisplayCount; i++) {
        const existingLog = await db.select()
          .from(temperatureLogs)
          .where(
            and(
              eq(temperatureLogs.businessId, business.id),
              eq(temperatureLogs.equipmentType, 'cold_display'),
              eq(temperatureLogs.equipmentNumber, i),
              eq(temperatureLogs.logDate, logDate)
            )
          )
          .limit(1);

        if (existingLog.length === 0) {
          logsToInsert.push({
            businessId: business.id,
            equipmentType: 'cold_display',
            equipmentNumber: i,
            temperature: generateTemperature(0, 4),
            logDate,
            createdAt
          });
        }
      }
    }

    if (logsToInsert.length > 0) {
      await db.insert(temperatureLogs).values(logsToInsert);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Daily temperature logs generated successfully',
        date: logDate,
        logsGenerated: logsToInsert.length,
        businessesProcessed: allBusinesses.length,
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error: ' + error,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}