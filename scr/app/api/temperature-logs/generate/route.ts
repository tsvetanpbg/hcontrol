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

function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    
    let logDate: string;
    if (body.date) {
      if (!isValidDate(body.date)) {
        return NextResponse.json(
          { 
            error: 'Invalid date format. Please use YYYY-MM-DD format',
            code: 'INVALID_DATE_FORMAT'
          },
          { status: 400 }
        );
      }
      logDate = body.date;
    } else {
      const today = new Date();
      logDate = today.toISOString().split('T')[0];
    }

    const allBusinesses = await db.select().from(businesses);

    if (allBusinesses.length === 0) {
      return NextResponse.json(
        {
          message: 'No businesses found to generate temperature logs',
          date: logDate,
          logsGenerated: 0,
          businessesProcessed: 0
        },
        { status: 201 }
      );
    }

    const logsToInsert: TemperatureLog[] = [];
    const createdAt = new Date().toISOString();

    for (const business of allBusinesses) {
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
        message: 'Temperature logs generated successfully',
        date: logDate,
        logsGenerated: logsToInsert.length,
        businessesProcessed: allBusinesses.length
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}