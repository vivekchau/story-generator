import { PrismaClient } from '@prisma/client'

// This prevents PrismaClient from being instantiated in a browser environment
if (typeof window !== 'undefined') {
  throw new Error('PrismaClient cannot be instantiated in a browser environment')
}

// Define the type for our global object
declare global {
  var prisma: PrismaClient | undefined
}

// Initialize Prisma Client with specific options based on environment
function getPrismaClient(): PrismaClient {
  // For test environment, we want to log errors only
  if (process.env.NODE_ENV === 'test') {
    return new PrismaClient({
      log: ['error'],
    })
  }
  
  // For development, we want more detailed logging
  if (process.env.NODE_ENV === 'development') {
    return new PrismaClient({
      log: ['query', 'error', 'warn'],
    })
  }
  
  // For production, minimal logging
  return new PrismaClient({
    log: ['error'],
  })
}

// Initialize or reuse the Prisma Client instance
const prisma = global.prisma || getPrismaClient()

// In non-production environments, attach the client to the global object
// This prevents multiple instances during development/testing
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

export { prisma } 