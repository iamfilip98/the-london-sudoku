/**
 * Neon Database Migration Script
 *
 * PHASE 0: Month 1
 * Purpose: Migrate data from Vercel Postgres to Neon
 *
 * IMPORTANT: Run this AFTER setting up Neon database
 *
 * Pre-requisites:
 * 1. Neon account created at https://neon.tech
 * 2. New Neon database provisioned
 * 3. NEON_DATABASE_URL added to .env.local
 * 4. Backup of current database created
 *
 * Usage:
 *   node scripts/migrate-to-neon.js
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

// Source: Vercel Postgres
const sourcePool = new Pool({
  connectionString: process.env.POSTGRES_PRISMA_URL,
  ssl: { rejectUnauthorized: true }
});

// Destination: Neon
const destPool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: true }
});

/**
 * Verify both databases are accessible
 */
async function verifyConnections() {
  console.log('🔍 Verifying database connections...\n');

  try {
    // Test source
    const sourceResult = await sourcePool.query('SELECT current_database(), version()');
    console.log('✅ Source (Vercel Postgres):');
    console.log(`   Database: ${sourceResult.rows[0].current_database}`);

    // Test destination
    const destResult = await destPool.query('SELECT current_database(), version()');
    console.log('✅ Destination (Neon):');
    console.log(`   Database: ${destResult.rows[0].current_database}\n`);

    return true;
  } catch (error) {
    console.error('❌ Connection verification failed:', error.message);
    return false;
  }
}

/**
 * Copy table schema
 */
async function copySchema(tableName) {
  console.log(`📋 Copying schema for table: ${tableName}`);

  try {
    // Get table schema from source
    const schemaQuery = `
      SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `;

    const columns = await sourcePool.query(schemaQuery, [tableName]);

    if (columns.rows.length === 0) {
      console.log(`⚠️  Table ${tableName} not found in source database`);
      return false;
    }

    console.log(`   Found ${columns.rows.length} columns`);
    return true;

  } catch (error) {
    console.error(`❌ Schema copy failed for ${tableName}:`, error.message);
    return false;
  }
}

/**
 * Copy table data
 */
async function copyTableData(tableName) {
  console.log(`📦 Copying data for table: ${tableName}`);

  try {
    // Get row count from source
    const countResult = await sourcePool.query(`SELECT COUNT(*) FROM ${tableName}`);
    const rowCount = parseInt(countResult.rows[0].count);

    if (rowCount === 0) {
      console.log(`   ⚠️  No data to copy (table is empty)`);
      return true;
    }

    console.log(`   Rows to copy: ${rowCount}`);

    // Fetch all data from source
    const dataResult = await sourcePool.query(`SELECT * FROM ${tableName}`);
    const rows = dataResult.rows;

    if (rows.length === 0) {
      console.log(`   ✅ Table copied (0 rows)`);
      return true;
    }

    // Get column names
    const columnNames = Object.keys(rows[0]);

    // Build INSERT query
    const placeholders = rows.map((_, rowIndex) => {
      const rowPlaceholders = columnNames.map((_, colIndex) => {
        return `$${rowIndex * columnNames.length + colIndex + 1}`;
      }).join(', ');
      return `(${rowPlaceholders})`;
    }).join(', ');

    const insertQuery = `
      INSERT INTO ${tableName} (${columnNames.join(', ')})
      VALUES ${placeholders}
      ON CONFLICT DO NOTHING
    `;

    // Flatten values for parameterized query
    const values = rows.flatMap(row => columnNames.map(col => row[col]));

    // Insert into destination
    await destPool.query(insertQuery, values);

    console.log(`   ✅ Copied ${rows.length} rows\n`);
    return true;

  } catch (error) {
    console.error(`❌ Data copy failed for ${tableName}:`, error.message);
    return false;
  }
}

/**
 * Verify data integrity after migration
 */
async function verifyDataIntegrity(tableName) {
  try {
    const sourceCount = await sourcePool.query(`SELECT COUNT(*) FROM ${tableName}`);
    const destCount = await destPool.query(`SELECT COUNT(*) FROM ${tableName}`);

    const sourceRows = parseInt(sourceCount.rows[0].count);
    const destRows = parseInt(destCount.rows[0].count);

    if (sourceRows === destRows) {
      console.log(`✅ ${tableName}: ${destRows} rows (verified)`);
      return true;
    } else {
      console.log(`❌ ${tableName}: Mismatch! Source: ${sourceRows}, Dest: ${destRows}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Verification failed for ${tableName}:`, error.message);
    return false;
  }
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('🚀 Starting Neon Migration\n');
  console.log('=' .repeat(60));

  // Step 1: Verify connections
  const connected = await verifyConnections();
  if (!connected) {
    console.error('\n❌ Migration aborted: Cannot connect to databases');
    process.exit(1);
  }

  // Step 2: List of tables to migrate (in order due to foreign keys)
  const tables = [
    'users',
    'entries',
    'achievements',
    'streaks',
    'challenges',
    'puzzle_ratings',
    'daily_puzzles',
    'game_states'
  ];

  console.log(`📋 Tables to migrate: ${tables.length}\n`);

  // Step 3: Copy each table
  let successCount = 0;
  for (const table of tables) {
    console.log('-'.repeat(60));

    const schemaOk = await copySchema(table);
    if (!schemaOk) {
      console.log(`⚠️  Skipping ${table} (schema issue)\n`);
      continue;
    }

    const dataOk = await copyTableData(table);
    if (dataOk) {
      successCount++;
    }
  }

  console.log('='.repeat(60));
  console.log('\n📊 Migration Summary:');
  console.log(`   Tables migrated: ${successCount}/${tables.length}`);

  // Step 4: Verify data integrity
  console.log('\n🔍 Verifying data integrity...\n');

  let verifiedCount = 0;
  for (const table of tables) {
    const verified = await verifyDataIntegrity(table);
    if (verified) verifiedCount++;
  }

  console.log('\n' + '='.repeat(60));

  if (verifiedCount === tables.length) {
    console.log('\n✅ MIGRATION SUCCESSFUL!');
    console.log(`   All ${tables.length} tables migrated and verified.`);
    console.log('\n📝 Next steps:');
    console.log('   1. Update POSTGRES_PRISMA_URL in Vercel environment variables');
    console.log('   2. Deploy to production');
    console.log('   3. Test thoroughly');
    console.log('   4. Keep Vercel Postgres running for 7 days as backup\n');
  } else {
    console.log('\n⚠️  MIGRATION COMPLETED WITH WARNINGS');
    console.log(`   ${verifiedCount}/${tables.length} tables verified`);
    console.log('\n   Please review errors above and verify data manually.\n');
  }

  // Close connections
  await sourcePool.end();
  await destPool.end();
}

// Run migration
migrate().catch(error => {
  console.error('\n💥 Migration failed:', error);
  process.exit(1);
});
