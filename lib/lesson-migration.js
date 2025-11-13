/**
 * LESSON SYSTEM DATABASE MIGRATION
 *
 * Initializes all lesson system tables and seeds achievement data
 * Run via: POST /api/admin?action=migrate-phase2-lessons
 *
 * Version: 1.0
 * Created: November 2025 (Phase 2)
 */

const pool = require('./db-pool');

/**
 * Run all lesson system migrations
 */
async function migrateLessons() {

  try {
    // Create all tables
    await createLessonTables();

    // Seed achievement data
    await seedLessonAchievements();

    // Create triggers and functions
    await createLessonTriggers();

    return { success: true };
  } catch (error) {
    throw error;
  }
}

/**
 * Create all lesson system tables
 */
async function createLessonTables() {

  // Lesson Progress Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS lesson_progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        lesson_id VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'not_started',
        current_step INTEGER DEFAULT 0,
        total_steps INTEGER DEFAULT 5,
        quiz_score INTEGER,
        practice_completed BOOLEAN DEFAULT FALSE,
        time_spent INTEGER DEFAULT 0,
        hints_used INTEGER DEFAULT 0,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, lesson_id),
        CHECK (status IN ('not_started', 'in_progress', 'completed')),
        CHECK (quiz_score IS NULL OR (quiz_score >= 0 AND quiz_score <= 3)),
        CHECK (current_step >= 0 AND current_step <= total_steps)
    )
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_lesson_progress_status ON lesson_progress(status)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_lesson_progress_completed ON lesson_progress(completed_at)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_status ON lesson_progress(user_id, status)`);

  // Lesson Practice Attempts Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS lesson_practice_attempts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        lesson_id VARCHAR(50) NOT NULL,
        puzzle_id VARCHAR(50) NOT NULL,
        attempt_number INTEGER DEFAULT 1,
        success BOOLEAN DEFAULT FALSE,
        time_taken INTEGER,
        hints_used INTEGER DEFAULT 0,
        errors_made INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_practice_attempts_user ON lesson_practice_attempts(user_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_practice_attempts_lesson ON lesson_practice_attempts(lesson_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_practice_attempts_user_lesson ON lesson_practice_attempts(user_id, lesson_id)`);

  // Lesson Quiz Attempts Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS lesson_quiz_attempts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        lesson_id VARCHAR(50) NOT NULL,
        attempt_number INTEGER DEFAULT 1,
        score INTEGER NOT NULL,
        total_questions INTEGER NOT NULL,
        passed BOOLEAN DEFAULT FALSE,
        time_taken INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CHECK (score >= 0 AND score <= total_questions)
    )
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON lesson_quiz_attempts(user_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_quiz_attempts_lesson ON lesson_quiz_attempts(lesson_id)`);

  // Lesson Achievements Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS lesson_achievements (
        id SERIAL PRIMARY KEY,
        achievement_id VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        lesson_id VARCHAR(50),
        course VARCHAR(20),
        xp_reward INTEGER DEFAULT 0,
        icon VARCHAR(50),
        rarity VARCHAR(20) DEFAULT 'common',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CHECK (course IN ('beginner', 'intermediate', 'variants', 'master')),
        CHECK (rarity IN ('common', 'rare', 'epic', 'legendary'))
    )
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_lesson_achievements_lesson ON lesson_achievements(lesson_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_lesson_achievements_course ON lesson_achievements(course)`);

  // User Lesson Achievements Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_lesson_achievements (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        achievement_id VARCHAR(50) NOT NULL REFERENCES lesson_achievements(achievement_id),
        earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, achievement_id)
    )
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_user_lesson_achievements_user ON user_lesson_achievements(user_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_user_lesson_achievements_earned ON user_lesson_achievements(earned_at)`);

}

/**
 * Seed lesson achievements data
 */
async function seedLessonAchievements() {

  const achievements = [
    // Beginner Course (Lessons 1-6)
    { id: 'lesson_01_complete', name: 'First Steps', desc: 'Complete Lesson 1: Sudoku Basics', course: 'beginner', xp: 25, icon: 'graduation-cap', rarity: 'common' },
    { id: 'lesson_02_complete', name: 'Naked Single Master', desc: 'Complete Lesson 2: Naked Singles', course: 'beginner', xp: 50, icon: 'eye', rarity: 'common' },
    { id: 'lesson_03_complete', name: 'Hidden Single Hunter', desc: 'Complete Lesson 3: Hidden Singles', course: 'beginner', xp: 50, icon: 'search', rarity: 'common' },
    { id: 'lesson_04_complete', name: 'Scanning Expert', desc: 'Complete Lesson 4: Scanning Techniques', course: 'beginner', xp: 50, icon: 'binoculars', rarity: 'common' },
    { id: 'lesson_05_complete', name: 'Pair Finder', desc: 'Complete Lesson 5: Naked Pairs', course: 'beginner', xp: 75, icon: 'link', rarity: 'common' },
    { id: 'lesson_06_complete', name: 'Hidden Pattern Pro', desc: 'Complete Lesson 6: Hidden Pairs', course: 'beginner', xp: 75, icon: 'puzzle-piece', rarity: 'common' },
    { id: 'beginner_course_complete', name: 'Beginner Master', desc: 'Complete all 6 beginner lessons', course: 'beginner', xp: 100, icon: 'star', rarity: 'rare' },

    // Intermediate Course (Lessons 7-14)
    { id: 'lesson_07_complete', name: 'Triple Threat', desc: 'Complete Lesson 7: Naked Triples', course: 'intermediate', xp: 100, icon: 'gem', rarity: 'rare' },
    { id: 'lesson_08_complete', name: 'Hidden Triple Master', desc: 'Complete Lesson 8: Hidden Triples', course: 'intermediate', xp: 100, icon: 'eye-slash', rarity: 'rare' },
    { id: 'lesson_09_complete', name: 'Reduction Specialist', desc: 'Complete Lesson 9: Box/Line Reduction', course: 'intermediate', xp: 100, icon: 'compress', rarity: 'rare' },
    { id: 'lesson_10_complete', name: 'Wing Master', desc: 'Complete Lesson 10: X-Wing', course: 'intermediate', xp: 150, icon: 'dragon', rarity: 'epic' },
    { id: 'lesson_11_complete', name: 'Swordfish Slayer', desc: 'Complete Lesson 11: Swordfish', course: 'intermediate', xp: 150, icon: 'fish', rarity: 'epic' },
    { id: 'lesson_12_complete', name: 'XY-Wing Expert', desc: 'Complete Lesson 12: XY-Wing', course: 'intermediate', xp: 150, icon: 'project-diagram', rarity: 'epic' },
    { id: 'lesson_13_complete', name: 'XYZ-Wing Wizard', desc: 'Complete Lesson 13: XYZ-Wing', course: 'intermediate', xp: 150, icon: 'network-wired', rarity: 'epic' },
    { id: 'lesson_14_complete', name: 'Coloring Champion', desc: 'Complete Lesson 14: Simple Coloring', course: 'intermediate', xp: 200, icon: 'palette', rarity: 'epic' },
    { id: 'intermediate_course_complete', name: 'Intermediate Expert', desc: 'Complete all 8 intermediate lessons', course: 'intermediate', xp: 200, icon: 'medal', rarity: 'epic' },

    // Variant Courses (Lessons 15-20)
    { id: 'lesson_15_complete', name: 'X-Sudoku Specialist', desc: 'Complete Lesson 15: X-Sudoku Strategies', course: 'variants', xp: 150, icon: 'times', rarity: 'epic' },
    { id: 'lesson_16_complete', name: 'Killer Sudoku Master', desc: 'Complete Lesson 16: Killer Sudoku Mastery', course: 'variants', xp: 150, icon: 'skull-crossbones', rarity: 'epic' },
    { id: 'lesson_17_complete', name: 'Anti-Knight Tactician', desc: 'Complete Lesson 17: Anti-Knight Tactics', course: 'variants', xp: 150, icon: 'chess-knight', rarity: 'epic' },
    { id: 'lesson_18_complete', name: 'Thermo Expert', desc: 'Complete Lesson 18: Thermo Sudoku Techniques', course: 'variants', xp: 150, icon: 'thermometer-half', rarity: 'epic' },
    { id: 'lesson_19_complete', name: 'Jigsaw Genius', desc: 'Complete Lesson 19: Jigsaw Sudoku Strategies', course: 'variants', xp: 150, icon: 'shapes', rarity: 'epic' },
    { id: 'lesson_20_complete', name: 'Advanced Combinator', desc: 'Complete Lesson 20: Advanced Combinations', course: 'variants', xp: 200, icon: 'crown', rarity: 'legendary' },
    { id: 'variants_course_complete', name: 'Variant Master', desc: 'Complete all 6 variant lessons', course: 'variants', xp: 300, icon: 'trophy', rarity: 'legendary' },

    // Master Achievement (all 20 lessons)
    { id: 'all_lessons_complete', name: 'Sudoku Sensei', desc: 'Complete all 20 tutorial lessons', course: 'master', xp: 500, icon: 'user-graduate', rarity: 'legendary' }
  ];

  for (const ach of achievements) {
    await pool.query(`
      INSERT INTO lesson_achievements (achievement_id, name, description, course, xp_reward, icon, rarity)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (achievement_id) DO NOTHING
    `, [ach.id, ach.name, ach.desc, ach.course, ach.xp, ach.icon, ach.rarity]);
  }

}

/**
 * Create PostgreSQL triggers and functions for automatic achievement awards
 */
async function createLessonTriggers() {

  // Function to update lesson progress timestamp
  await pool.query(`
    CREATE OR REPLACE FUNCTION update_lesson_progress_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Trigger to auto-update updated_at
  await pool.query(`
    DROP TRIGGER IF EXISTS trigger_update_lesson_progress_timestamp ON lesson_progress;
  `);

  await pool.query(`
    CREATE TRIGGER trigger_update_lesson_progress_timestamp
    BEFORE UPDATE ON lesson_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_lesson_progress_timestamp();
  `);

  // Function to check lesson completion and award achievements
  await pool.query(`
    CREATE OR REPLACE FUNCTION check_lesson_completion()
    RETURNS TRIGGER AS $$
    DECLARE
        achievement_id_to_award VARCHAR(50);
        beginner_count INTEGER;
        intermediate_count INTEGER;
        variant_count INTEGER;
        total_count INTEGER;
    BEGIN
        -- Only proceed if lesson was just completed
        IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN

            -- Award individual lesson achievement
            achievement_id_to_award := 'lesson_' || LPAD(SUBSTRING(NEW.lesson_id FROM '[0-9]+')::TEXT, 2, '0') || '_complete';

            INSERT INTO user_lesson_achievements (user_id, achievement_id)
            VALUES (NEW.user_id, achievement_id_to_award)
            ON CONFLICT (user_id, achievement_id) DO NOTHING;

            -- Check for course completion achievements
            -- Beginner course: lessons 1-6 (lesson-01 through lesson-06)
            SELECT COUNT(*) INTO beginner_count
            FROM lesson_progress
            WHERE user_id = NEW.user_id
            AND status = 'completed'
            AND lesson_id ~ '^lesson-0[1-6]$';

            -- Intermediate course: lessons 7-14 (lesson-07 through lesson-14)
            SELECT COUNT(*) INTO intermediate_count
            FROM lesson_progress
            WHERE user_id = NEW.user_id
            AND status = 'completed'
            AND lesson_id ~ '^lesson-(0[7-9]|1[0-4])$';

            -- Variant course: lessons 15-20 (lesson-15 through lesson-20)
            SELECT COUNT(*) INTO variant_count
            FROM lesson_progress
            WHERE user_id = NEW.user_id
            AND status = 'completed'
            AND lesson_id ~ '^lesson-(1[5-9]|20)$';

            -- Award course completion achievements
            IF beginner_count >= 6 THEN
                INSERT INTO user_lesson_achievements (user_id, achievement_id)
                VALUES (NEW.user_id, 'beginner_course_complete')
                ON CONFLICT (user_id, achievement_id) DO NOTHING;
            END IF;

            IF intermediate_count >= 8 THEN
                INSERT INTO user_lesson_achievements (user_id, achievement_id)
                VALUES (NEW.user_id, 'intermediate_course_complete')
                ON CONFLICT (user_id, achievement_id) DO NOTHING;
            END IF;

            IF variant_count >= 6 THEN
                INSERT INTO user_lesson_achievements (user_id, achievement_id)
                VALUES (NEW.user_id, 'variants_course_complete')
                ON CONFLICT (user_id, achievement_id) DO NOTHING;
            END IF;

            -- Check for master achievement (all 20 lessons)
            SELECT COUNT(*) INTO total_count
            FROM lesson_progress
            WHERE user_id = NEW.user_id
            AND status = 'completed';

            IF total_count >= 20 THEN
                INSERT INTO user_lesson_achievements (user_id, achievement_id)
                VALUES (NEW.user_id, 'all_lessons_complete')
                ON CONFLICT (user_id, achievement_id) DO NOTHING;
            END IF;
        END IF;

        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Trigger to award achievements on lesson completion
  await pool.query(`
    DROP TRIGGER IF EXISTS trigger_check_lesson_completion ON lesson_progress;
  `);

  await pool.query(`
    CREATE TRIGGER trigger_check_lesson_completion
    AFTER INSERT OR UPDATE ON lesson_progress
    FOR EACH ROW
    EXECUTE FUNCTION check_lesson_completion();
  `);

}

module.exports = {
  migrateLessons,
  createLessonTables,
  seedLessonAchievements,
  createLessonTriggers
};
