import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { subDays } from 'date-fns';

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

  // Seed Students for development with varied registration dates
  console.log('Seeding development students...');
  const bsitProgram = await prisma.program.findUnique({
    where: { name: 'BSIT' },
  });
  const bscpeProgram = await prisma.program.findUnique({
    where: { name: 'BSCPE' },
  });

  if (bsitProgram && bscpeProgram) {
    const studentsToSeed = [];
    const today = new Date();

    console.log('Generating 25 new sample students with recent registration dates...');
    for (let i = 0; i < 25; i++) {
      const studentId = `SEED-${String(i).padStart(4, '0')}`;
      const createdAt = subDays(today, Math.floor(Math.random() * 80) + 1);
      const program = i % 2 === 0 ? bsitProgram : bscpeProgram;

      studentsToSeed.push({
        studentIdNumber: studentId,
        firstName: `Sample`,
        lastName: `Student ${i}`,
        email: `seed.student.${i}@example.com`,
        year: Math.ceil(Math.random() * 4),
        programId: program.id,
        createdAt: createdAt,
        registrationSource: 'admin',
      });
    }

    let createdCount = 0;
    for (const studentData of studentsToSeed) {
      const existingStudent = await prisma.student.findUnique({
        where: { studentIdNumber: studentData.studentIdNumber },
      });

      if (!existingStudent) {
        await prisma.student.create({
          data: studentData,
        });
        createdCount++;
      }
    }

    if (createdCount > 0) {
      console.log(`Added ${createdCount} new sample students to the database.`);
    } else {
      console.log('Sample students already exist. No new students were added.');
    }
  } else {
    console.warn(
      'Could not find BSIT or BSCPE programs. Skipping student seeding.',
    );
  }

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
