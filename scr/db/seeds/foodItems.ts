import { db } from '@/db';
import { foodItems } from '@/db/schema';

async function main() {
    const sampleFoodItems = [
        {
            userId: 2,
            name: 'Готвени ястия',
            cookingTemperature: 200,
            shelfLifeHours: 3,
            establishmentId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            userId: 2,
            name: 'Аламинути',
            cookingTemperature: 100,
            shelfLifeHours: 3,
            establishmentId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            userId: 2,
            name: 'Супи',
            cookingTemperature: 100,
            shelfLifeHours: 3,
            establishmentId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            userId: 2,
            name: 'Салати',
            cookingTemperature: null,
            shelfLifeHours: 4,
            establishmentId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            userId: 2,
            name: 'Сандвичи',
            cookingTemperature: null,
            shelfLifeHours: 2,
            establishmentId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            userId: 2,
            name: 'Пица',
            cookingTemperature: 250,
            shelfLifeHours: 4,
            establishmentId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            userId: 2,
            name: 'Пилешко месо',
            cookingTemperature: 180,
            shelfLifeHours: 2,
            establishmentId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            userId: 2,
            name: 'Риба',
            cookingTemperature: 160,
            shelfLifeHours: 2,
            establishmentId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            userId: 2,
            name: 'Десерти',
            cookingTemperature: null,
            shelfLifeHours: 6,
            establishmentId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            userId: 2,
            name: 'Хляб и хлебни изделия',
            cookingTemperature: 200,
            shelfLifeHours: 24,
            establishmentId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    ];

    await db.insert(foodItems).values(sampleFoodItems);
    
    console.log('✅ Food items seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});