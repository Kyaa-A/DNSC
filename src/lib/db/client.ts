/**
 * Prisma Database Client
 * Provides a singleton Prisma client instance with connection management
 */

import { PrismaClient } from '@prisma/client'

// Global for Prisma client in development to prevent multiple instances
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma client with enhanced configuration
// Note: datasources.db.url is read from schema.prisma env("DATABASE_URL") automatically
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  errorFormat: 'pretty',
})

// In development, store the client globally to prevent multiple instances
// due to hot reloading in Next.js
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

/**
 * Test database connection with retry logic
 */
export async function testDatabaseConnection(retries = 3): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$connect()
      return true
    } catch (error) {
      console.warn(`Database connection attempt ${i + 1} failed:`, error)
      if (i === retries - 1) {
        console.error('All database connection attempts failed')
        return false
      }
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000))
    }
  }
  return false
}

/**
 * Graceful shutdown handler for Prisma client
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect()
}

// Handle graceful shutdown
if (typeof process !== 'undefined') {
  process.on('beforeExit', disconnectDatabase)
  process.on('SIGINT', disconnectDatabase)
  process.on('SIGTERM', disconnectDatabase)
}

export default prisma
