import { db } from '@/db';
import { users, establishments, personnel } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcrypt';

async function main() {
    try {
        // Step 1: Find or create demo user
        console.log('🔍 Checking for demo user...');
        
        const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, 'demo@user.bg'))
            .limit(1);

        let demoUser;
        
        if (existingUser.length === 0) {
            console.log('➕ Creating demo user...');
            const [newUser] = await db
                .insert(users)
                .values({
                    email: 'demo@user.bg',
                    passwordHash: bcrypt.hashSync('user123', 10),
                    role: 'user',
                    managerName: 'Демо Потребител',
                    profileImageUrl: null,
                    isActive: 1,
                    createdAt: new Date().toISOString(),
                })
                .returning();
            demoUser = newUser;
            console.log('✅ Demo user created successfully');
        } else {
            demoUser = existingUser[0];
            console.log('✅ Demo user already exists');
        }

        // Step 2: Check if demo establishment already exists
        console.log('🔍 Checking for demo establishment...');
        
        const existingEstablishment = await db
            .select()
            .from(establishments)
            .where(
                and(
                    eq(establishments.userId, demoUser.id),
                    eq(establishments.companyName, 'Ресторант Под Липите ЕООД')
                )
            )
            .limit(1);

        if (existingEstablishment.length > 0) {
            console.log('ℹ️ Demo establishment already exists. Skipping creation.');
            return;
        }

        // Step 3: Create demo establishment
        console.log('➕ Creating demo establishment...');
        
        const [newEstablishment] = await db
            .insert(establishments)
            .values({
                userId: demoUser.id,
                establishmentType: 'Ресторант',
                employeeCount: 4,
                managerName: 'Иван Петров',
                managerPhone: '+359 888 123 456',
                managerEmail: 'ivan.petrov@restaurant-demo.bg',
                companyName: 'Ресторант Под Липите ЕООД',
                eik: '123456789',
                eikVerified: 1,
                eikVerificationDate: new Date().toISOString().split('T')[0],
                registrationAddress: 'гр. София, ул. Витоша 15',
                contactEmail: 'info@restaurant-demo.bg',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            })
            .returning();

        console.log('✅ Demo establishment created successfully');

        // Step 4: Create personnel records
        console.log('➕ Creating personnel records...');
        
        const personnelData = [
            {
                establishmentId: newEstablishment.id,
                fullName: 'Мария Георгиева',
                egn: '9012154321',
                position: 'Сервитьор',
                workBookImageUrl: null,
                photoUrl: null,
                workBookNumber: 'TB001234',
                workBookValidity: '2026-12-31',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            {
                establishmentId: newEstablishment.id,
                fullName: 'Георги Димитров',
                egn: '8506127890',
                position: 'Готвач',
                workBookImageUrl: null,
                photoUrl: null,
                workBookNumber: 'TB002345',
                workBookValidity: '2026-12-31',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            {
                establishmentId: newEstablishment.id,
                fullName: 'Елена Стоянова',
                egn: '9203145678',
                position: 'Барман',
                workBookImageUrl: null,
                photoUrl: null,
                workBookNumber: 'TB003456',
                workBookValidity: '2026-12-31',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            {
                establishmentId: newEstablishment.id,
                fullName: 'Стефан Николов',
                egn: '8801123456',
                position: 'Сервитьор',
                workBookImageUrl: null,
                photoUrl: null,
                workBookNumber: 'TB004567',
                workBookValidity: '2026-12-31',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        ];

        await db.insert(personnel).values(personnelData);

        console.log('✅ Personnel records created successfully');
        console.log(`✅ Demo establishment seeder completed successfully`);
        console.log(`   - User: demo@user.bg`);
        console.log(`   - Establishment: Ресторант Под Липите ЕООД`);
        console.log(`   - Personnel: ${personnelData.length} employees`);
    } catch (error) {
        console.error('❌ Seeder failed:', error);
        throw error;
    }
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
    process.exit(1);
});