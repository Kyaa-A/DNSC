#!/usr/bin/env node

/**
 * Test database connection with detailed error reporting
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Testing database connection with detailed error reporting...');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

// Test Prisma connection with detailed error handling
async function testDatabaseConnection() {
  try {
    const { PrismaClient } = require('@prisma/client');
    
    console.log('📊 Initializing Prisma client...');
    const prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
    
    console.log('🔌 Attempting to connect to database...');
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful!');
    console.log('📈 Test query result:', result);
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    
    if (error.code) {
      console.error('Error code:', error.code);
    }
    
    if (error.meta) {
      console.error('Error meta:', error.meta);
    }
    
    // Check if it's a connection error
    if (error.message.includes('Can\'t reach database server')) {
      console.error('\n🔧 Troubleshooting suggestions:');
      console.error('1. Check if the Supabase project is still active');
      console.error('2. Verify the database credentials in Supabase dashboard');
      console.error('3. Check if the connection string format is correct');
      console.error('4. Ensure the database is not paused (common with free tier)');
    }
  }
}

testDatabaseConnection();
