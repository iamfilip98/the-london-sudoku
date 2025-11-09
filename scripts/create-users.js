#!/usr/bin/env node
/**
 * Create initial users in Neon database
 * Run this once to set up Filip and Faidao accounts
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.POSTGRES_PRISMA_URL || process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: true }
});

async function createInitialUsers() {
  console.log('🚀 Creating initial users in Neon database...\n');

  try {
    // Test connection
    const testResult = await pool.query('SELECT current_database()');
    console.log(`✅ Connected to database: ${testResult.rows[0].current_database}\n`);

    // Default password
    const defaultPassword = 'sudoku2024';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Create users
    const users = [
      {
        username: 'filip',
        password_hash: hashedPassword,
        display_name: 'Filip - The Champion',
        subscription_tier: 'founder'
      },
      {
        username: 'faidao',
        password_hash: hashedPassword,
        display_name: 'Faidao - The Queen',
        subscription_tier: 'founder'
      }
    ];

    for (const user of users) {
      try {
        const result = await pool.query(
          `INSERT INTO users (username, password_hash, display_name, subscription_tier, created_at, last_active_at)
           VALUES ($1, $2, $3, $4, NOW(), NOW())
           ON CONFLICT (username) DO UPDATE
           SET password_hash = EXCLUDED.password_hash,
               display_name = EXCLUDED.display_name,
               subscription_tier = EXCLUDED.subscription_tier
           RETURNING id, username, display_name, subscription_tier`,
          [user.username, user.password_hash, user.display_name, user.subscription_tier]
        );

        console.log(`✅ Created user: ${result.rows[0].username} (ID: ${result.rows[0].id})`);
        console.log(`   Display Name: ${result.rows[0].display_name}`);
        console.log(`   Tier: ${result.rows[0].subscription_tier}`);
        console.log(`   Password: ${defaultPassword}\n`);
      } catch (error) {
        if (error.code === '23505') {
          console.log(`ℹ️  User ${user.username} already exists, updating...\n`);
        } else {
          throw error;
        }
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Initial users created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📝 Login credentials:');
    console.log('   Username: filip    | Password: sudoku2024');
    console.log('   Username: faidao   | Password: sudoku2024');
    console.log('\n🌐 Login at: https://the-london-sudoku.vercel.app/auth.html');
    console.log('\n⚠️  NOTE: These credentials are temporary.');
    console.log('   We will migrate to Clerk authentication in Phase 0 Month 2.\n');

  } catch (error) {
    console.error('❌ Error creating users:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

createInitialUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
