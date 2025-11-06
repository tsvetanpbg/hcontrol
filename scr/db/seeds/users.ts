import { db } from '@/db';
import { users } from '@/db/schema';
import bcrypt from 'bcrypt';

async function main() {
    const sampleUsers = [
        {
            email: 'admin@hei-clone.bg',
            passwordHash: bcrypt.hashSync('admin123', 10),
            role: 'admin',
            managerName: 'Администратор',
            profileImageUrl: null,
            isActive: 1,
            createdAt: new Date().toISOString(),
        },
        {
            email: 'demo@user.bg',
            passwordHash: bcrypt.hashSync('user123', 10),
            role: 'user',
            managerName: 'Демо Потребител',
            profileImageUrl: null,
            isActive: 1,
            createdAt: new Date().toISOString(),
        },
    ];

    await db.insert(users).values(sampleUsers);
    
    console.log('✅ Users seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});