import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearSeededStudents() {
  console.log('Clearing seeded students...');
  
  // Delete all students with SEED- prefix in their ID
  const result = await prisma.student.deleteMany({
    where: {
      studentIdNumber: {
        startsWith: 'SEED-'
      }
    }
  });
  
  console.log(`Deleted ${result.count} seeded students.`);
  
  // Also show remaining student count
  const remaining = await prisma.student.count();
  console.log(`Remaining students in database: ${remaining}`);
}

clearSeededStudents()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
