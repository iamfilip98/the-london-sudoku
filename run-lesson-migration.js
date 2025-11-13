require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// ✅ SECURITY FIX: Proper SSL configuration
const isProduction = process.env.NODE_ENV === 'production';
const isVercel = process.env.VERCEL === '1';

async function runLessonMigration() {
    const pool = new Pool({
        connectionString: process.env.POSTGRES_PRISMA_URL,
        ssl: (isProduction || isVercel) ? {
            rejectUnauthorized: true  // ✅ SECURE: Prevents man-in-the-middle attacks
        } : false,  // Only disabled in local development
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000
    });

    try {
        console.log('🚀 Running Lesson System Migration (007)...');

        // Read migration file
        const migrationPath = path.join(__dirname, 'migrations', '007_lesson_system.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        // Execute migration
        await pool.query(migrationSQL);

        console.log('✅ Migration completed successfully!');

        // Verify tables were created
        const tableCheck = await pool.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN (
                'lesson_progress',
                'lesson_practice_attempts',
                'lesson_quiz_attempts',
                'lesson_achievements',
                'user_lesson_achievements'
            )
            ORDER BY table_name
        `);

        console.log('\n📋 Lesson System Tables:');
        tableCheck.rows.forEach(row => {
            console.log(`  ✓ ${row.table_name}`);
        });

        // Check achievements count
        const achievementCount = await pool.query(
            'SELECT COUNT(*) as count FROM lesson_achievements'
        );
        console.log(`\n🏆 Lesson Achievements: ${achievementCount.rows[0].count} created`);

        console.log('\n✨ Lesson system database ready!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runLessonMigration();
