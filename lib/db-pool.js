/**
 * PostgreSQL Connection Pool
 *
 * SECURITY FIXES (November 2025):
 * - Removed NODE_TLS_REJECT_UNAUTHORIZED override (CRITICAL SECURITY FIX)
 * - Proper SSL configuration for production
 * - Increased connection pool size for scalability
 * - Environment-based configuration
 *
 * Usage:
 *   const pool = require('../lib/db-pool');
 *   const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

// Validate required environment variables
if (!process.env.POSTGRES_PRISMA_URL) {
  throw new Error('Missing required environment variable: POSTGRES_PRISMA_URL');
}

const isProduction = process.env.NODE_ENV === 'production';
const isVercel = process.env.VERCEL === '1';

// Create secure database connection pool
const pool = new Pool({
  connectionString: process.env.POSTGRES_PRISMA_URL,

  // ✅ SECURITY FIX: Proper SSL configuration
  // Production and Vercel deployments REQUIRE proper TLS verification
  ssl: (isProduction || isVercel) ? {
    rejectUnauthorized: true  // ✅ SECURE: Prevents man-in-the-middle attacks
  } : false,  // Only disabled in local development

  // ✅ SCALABILITY FIX: Increased connection pool
  max: isProduction ? 20 : 10,  // 20 connections for production, 10 for development
  idleTimeoutMillis: 30000,     // Keep connections alive for 30 seconds
  connectionTimeoutMillis: 10000, // Fail after 10 seconds if can't connect
});

// Log pool errors (but don't crash)
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
  // Don't process.exit() - let Vercel handle it
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing database pool...');
  await pool.end();
});

module.exports = pool;
