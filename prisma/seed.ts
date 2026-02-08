import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Seed Admin User
  console.log('Seeding admin user...');
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    const passwordHash = await hash(adminPassword, 12);
    await prisma.user.upsert({
      where: { email: adminEmail.toLowerCase() },
      update: { passwordHash, role: 'admin', isActive: true },
      create: {
        email: adminEmail.toLowerCase(),
        passwordHash,
        name: 'Admin',
        role: 'admin',
        isActive: true,
      },
    });

    // Also create/update the organizer record for the admin
    await prisma.organizer.upsert({
      where: { email: adminEmail.toLowerCase() },
      update: { role: 'admin', isActive: true },
      create: {
        email: adminEmail.toLowerCase(),
        fullName: 'Admin',
        role: 'admin',
        isActive: true,
      },
    });

    console.log('Admin user seeded successfully.');
  } else {
    console.warn('ADMIN_EMAIL or ADMIN_PASSWORD not set. Skipping admin user seeding.');
  }

  // Seed Programs
  console.log('Seeding programs...');
  const programs = [
    {
      name: 'BSIT',
      displayName: 'Bachelor of Science in Information Technology',
      description:
        'A program focused on the study of computer systems, networks, and software development.',
    },
    {
      name: 'BSCPE',
      displayName: 'Bachelor of Science in Computer Engineering',
      description:
        'A program that combines principles of electrical engineering and computer science.',
    },
  ];

  for (const program of programs) {
    await prisma.program.upsert({
      where: { name: program.name },
      update: {},
      create: program,
    });
  }
  console.log('Programs seeded successfully.');

  // Note: Student seeding removed - students should be registered through the app
  // If you need test students for development, uncomment the section below

  console.log('Database seeding finished.');
}

main()
  .catch((e) => {
    console.error('Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
