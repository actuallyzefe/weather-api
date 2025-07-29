import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Check if admin user exists
  const existingAdmin = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN },
  });

  if (existingAdmin) {
    console.log('Admin user already exists, skipping seed.');
    return;
  }

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@weather.com',
      username: 'admin',
      password: hashedPassword,
      role: UserRole.ADMIN,
    },
  });

  console.log('Admin user created:', {
    id: admin.id,
    email: admin.email,
    username: admin.username,
    role: admin.role,
  });

  // Create a test regular user
  const testUserPassword = await bcrypt.hash('user123', 12);

  const testUser = await prisma.user.create({
    data: {
      email: 'user@weather.com',
      username: 'testuser',
      password: testUserPassword,
      role: UserRole.USER,
      createdById: admin.id,
    },
  });

  console.log('Test user created:', {
    id: testUser.id,
    email: testUser.email,
    username: testUser.username,
    role: testUser.role,
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
