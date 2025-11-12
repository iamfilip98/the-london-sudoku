-- Migration: Lesson System (Phase 2)
-- Date: 2025-11-12
-- Description: Tables for tutorial lesson tracking and progress

-- Lesson Progress Table
-- Tracks user progress through tutorial lessons
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
);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_status ON lesson_progress(status);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_completed ON lesson_progress(completed_at);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_status ON lesson_progress(user_id, status);

-- Lesson Practice Attempts Table
-- Tracks individual practice puzzle attempts
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
);

CREATE INDEX IF NOT EXISTS idx_practice_attempts_user ON lesson_practice_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_attempts_lesson ON lesson_practice_attempts(lesson_id);
CREATE INDEX IF NOT EXISTS idx_practice_attempts_user_lesson ON lesson_practice_attempts(user_id, lesson_id);

-- Lesson Quiz Attempts Table
-- Tracks quiz performance
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
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON lesson_quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_lesson ON lesson_quiz_attempts(lesson_id);

-- Lesson Achievements Table
-- Special achievements for lesson completion
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
);

CREATE INDEX IF NOT EXISTS idx_lesson_achievements_lesson ON lesson_achievements(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_achievements_course ON lesson_achievements(course);

-- User Lesson Achievements Table
-- Tracks which users have earned which lesson achievements
CREATE TABLE IF NOT EXISTS user_lesson_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id VARCHAR(50) NOT NULL REFERENCES lesson_achievements(achievement_id),
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_lesson_achievements_user ON user_lesson_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_achievements_earned ON user_lesson_achievements(earned_at);

-- Insert default lesson achievements
INSERT INTO lesson_achievements (achievement_id, name, description, course, xp_reward, icon, rarity) VALUES
    -- Beginner Course
    ('lesson_01_complete', 'First Steps', 'Complete Lesson 1: Sudoku Basics', 'beginner', 25, 'graduation-cap', 'common'),
    ('lesson_02_complete', 'Naked Single Master', 'Complete Lesson 2: Naked Singles', 'beginner', 50, 'eye', 'common'),
    ('lesson_03_complete', 'Hidden Single Hunter', 'Complete Lesson 3: Hidden Singles', 'beginner', 50, 'search', 'common'),
    ('lesson_04_complete', 'Scanning Expert', 'Complete Lesson 4: Scanning Techniques', 'beginner', 50, 'binoculars', 'common'),
    ('lesson_05_complete', 'Pair Finder', 'Complete Lesson 5: Naked Pairs', 'beginner', 75, 'link', 'common'),
    ('lesson_06_complete', 'Hidden Pattern Pro', 'Complete Lesson 6: Hidden Pairs', 'beginner', 75, 'puzzle-piece', 'common'),
    ('beginner_course_complete', 'Beginner Master', 'Complete all 6 beginner lessons', 'beginner', 100, 'star', 'rare'),

    -- Intermediate Course
    ('lesson_07_complete', 'Triple Threat', 'Complete Lesson 7: Naked Triples', 'intermediate', 100, 'gem', 'rare'),
    ('lesson_08_complete', 'Hidden Triple Master', 'Complete Lesson 8: Hidden Triples', 'intermediate', 100, 'eye-slash', 'rare'),
    ('lesson_09_complete', 'Reduction Specialist', 'Complete Lesson 9: Box/Line Reduction', 'intermediate', 100, 'compress', 'rare'),
    ('lesson_10_complete', 'Wing Master', 'Complete Lesson 10: X-Wing', 'intermediate', 150, 'dragon', 'epic'),
    ('lesson_11_complete', 'Swordfish Slayer', 'Complete Lesson 11: Swordfish', 'intermediate', 150, 'fish', 'epic'),
    ('lesson_12_complete', 'XY-Wing Expert', 'Complete Lesson 12: XY-Wing', 'intermediate', 150, 'project-diagram', 'epic'),
    ('lesson_13_complete', 'XYZ-Wing Wizard', 'Complete Lesson 13: XYZ-Wing', 'intermediate', 150, 'network-wired', 'epic'),
    ('lesson_14_complete', 'Coloring Champion', 'Complete Lesson 14: Simple Coloring', 'intermediate', 200, 'palette', 'epic'),
    ('intermediate_course_complete', 'Intermediate Expert', 'Complete all 8 intermediate lessons', 'intermediate', 200, 'medal', 'epic'),

    -- Variant Courses
    ('lesson_15_complete', 'X-Sudoku Specialist', 'Complete Lesson 15: X-Sudoku Strategies', 'variants', 150, 'times', 'epic'),
    ('lesson_16_complete', 'Killer Sudoku Master', 'Complete Lesson 16: Killer Sudoku Mastery', 'variants', 150, 'skull-crossbones', 'epic'),
    ('lesson_17_complete', 'Anti-Knight Tactician', 'Complete Lesson 17: Anti-Knight Tactics', 'variants', 150, 'chess-knight', 'epic'),
    ('lesson_18_complete', 'Thermo Expert', 'Complete Lesson 18: Thermo Sudoku Techniques', 'variants', 150, 'thermometer-half', 'epic'),
    ('lesson_19_complete', 'Jigsaw Genius', 'Complete Lesson 19: Jigsaw Sudoku Strategies', 'variants', 150, 'shapes', 'epic'),
    ('lesson_20_complete', 'Advanced Combinator', 'Complete Lesson 20: Advanced Combinations', 'variants', 200, 'crown', 'legendary'),
    ('variants_course_complete', 'Variant Master', 'Complete all 6 variant lessons', 'variants', 300, 'trophy', 'legendary'),

    -- Master Achievement
    ('all_lessons_complete', 'Sudoku Sensei', 'Complete all 20 tutorial lessons', 'master', 500, 'user-graduate', 'legendary')
ON CONFLICT (achievement_id) DO NOTHING;

-- Function to update lesson progress timestamp
CREATE OR REPLACE FUNCTION update_lesson_progress_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_update_lesson_progress_timestamp
BEFORE UPDATE ON lesson_progress
FOR EACH ROW
EXECUTE FUNCTION update_lesson_progress_timestamp();

-- Function to check lesson completion and award achievements
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
        achievement_id_to_award := 'lesson_' || LPAD(SUBSTRING(NEW.lesson_id FROM '\d+')::TEXT, 2, '0') || '_complete';

        INSERT INTO user_lesson_achievements (user_id, achievement_id)
        VALUES (NEW.user_id, achievement_id_to_award)
        ON CONFLICT (user_id, achievement_id) DO NOTHING;

        -- Check for course completion achievements
        SELECT COUNT(*) INTO beginner_count
        FROM lesson_progress
        WHERE user_id = NEW.user_id
        AND status = 'completed'
        AND lesson_id LIKE 'lesson-0_-%';

        SELECT COUNT(*) INTO intermediate_count
        FROM lesson_progress
        WHERE user_id = NEW.user_id
        AND status = 'completed'
        AND lesson_id LIKE 'lesson-__-_%'
        AND lesson_id NOT LIKE 'lesson-0_-%'
        AND lesson_id NOT LIKE 'lesson-1_-%'
        AND lesson_id NOT LIKE 'lesson-2_-%';

        SELECT COUNT(*) INTO variant_count
        FROM lesson_progress
        WHERE user_id = NEW.user_id
        AND status = 'completed'
        AND lesson_id LIKE 'lesson-1_-%'
        OR lesson_id LIKE 'lesson-2_-%';

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

-- Trigger to award achievements on lesson completion
CREATE TRIGGER trigger_check_lesson_completion
AFTER INSERT OR UPDATE ON lesson_progress
FOR EACH ROW
EXECUTE FUNCTION check_lesson_completion();

-- Comments for documentation
COMMENT ON TABLE lesson_progress IS 'Tracks user progress through tutorial lessons';
COMMENT ON TABLE lesson_practice_attempts IS 'Records individual practice puzzle attempts within lessons';
COMMENT ON TABLE lesson_quiz_attempts IS 'Tracks quiz performance for each lesson';
COMMENT ON TABLE lesson_achievements IS 'Defines available lesson achievements';
COMMENT ON TABLE user_lesson_achievements IS 'Tracks which users have earned which lesson achievements';

COMMENT ON COLUMN lesson_progress.status IS 'Current status: not_started, in_progress, completed';
COMMENT ON COLUMN lesson_progress.current_step IS 'Current step in lesson (0-5)';
COMMENT ON COLUMN lesson_progress.quiz_score IS 'Score on quiz (0-3), must be 2+ to complete';
COMMENT ON COLUMN lesson_progress.time_spent IS 'Total time spent in lesson (seconds)';
