import { db } from '@/db';
import { businesses } from '@/db/schema';

async function main() {
    const sampleBusinesses = [
        {
            userId: 2,
            name: 'Демо Ресторант',
            type: 'ресторант',
            city: 'София',
            address: 'ул. Витоша 1',
            phone: '0888123456',
            email: 'demo@user.bg',
            refrigeratorCount: 2,
            freezerCount: 1,
            hotDisplayCount: 1,
            coldDisplayCount: 1,
            otherEquipment: 'Други тестови устройства',
            createdAt: new Date().toISOString(),
        },
    ];

    await db.insert(businesses).values(sampleBusinesses);
    
    console.log('✅ Businesses seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});