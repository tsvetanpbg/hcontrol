import { db } from '@/db';
import { temperatureLogs } from '@/db/schema';

async function main() {
    const sampleTemperatureLogs = [];
    const currentDate = new Date();
    const createdAt = currentDate.toISOString();
    
    // Equipment configuration for demo business (businessId = 1)
    const equipmentConfig = [
        { type: 'refrigerator', number: 1, minTemp: 0, maxTemp: 4 },
        { type: 'refrigerator', number: 2, minTemp: 0, maxTemp: 4 },
        { type: 'freezer', number: 1, minTemp: -36, maxTemp: -18 },
        { type: 'hot_display', number: 1, minTemp: 63, maxTemp: 80 },
        { type: 'cold_display', number: 1, minTemp: 0, maxTemp: 4 },
    ];

    // Generate logs for the last 30 days
    for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
        const logDate = new Date(currentDate);
        logDate.setDate(logDate.getDate() - dayOffset);
        const logDateString = logDate.toISOString().split('T')[0];

        // Generate log for each equipment
        for (const equipment of equipmentConfig) {
            const tempRange = equipment.maxTemp - equipment.minTemp;
            const randomTemp = equipment.minTemp + (Math.random() * tempRange);
            const temperature = parseFloat(randomTemp.toFixed(1));

            sampleTemperatureLogs.push({
                businessId: 1,
                equipmentType: equipment.type,
                equipmentNumber: equipment.number,
                temperature: temperature,
                logDate: logDateString,
                createdAt: createdAt,
            });
        }
    }

    await db.insert(temperatureLogs).values(sampleTemperatureLogs);
    
    console.log('✅ Temperature logs seeder completed successfully');
    console.log(`📊 Generated ${sampleTemperatureLogs.length} temperature log records`);
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});