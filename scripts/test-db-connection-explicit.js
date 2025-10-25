#!/usr/bin/env node

/**
 * Test database connection with explicit environment variable loading
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Testing database connection...');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set');

// Test Prisma connection
async function testDatabaseConnection() {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    console.log('📊 Testing database queries...');
    
    // Test basic queries that the stats API uses
    const [
      totalEvents,
      activeEvents,
      totalSessions,
      totalOrganizers,
    ] = await Promise.all([
      prisma.event.count(),
      prisma.event.count({ where: { isActive: true } }),
      prisma.session.count(),
      prisma.organizer.count({ where: { isActive: true } }),
    ]);
    
    console.log('✅ Database connection successful!');
    console.log('📈 Test results:');
    console.log(`  - Total events: ${totalEvents}`);
    console.log(`  - Active events: ${activeEvents}`);
    console.log(`  - Total sessions: ${totalSessions}`);
    console.log(`  - Total organizers: ${totalOrganizers}`);
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Error details:', error);
  }
}

testDatabaseConnection();
