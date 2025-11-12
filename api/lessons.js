/**
 * Lessons API - Tutorial System Endpoints
 * Phase 2: Tutorial System
 *
 * Endpoints:
 * - GET /api/lessons - List all lessons
 * - GET /api/lessons/:id - Get specific lesson content
 * - GET /api/lessons/progress - Get user's lesson progress
 * - GET /api/lessons/:id/progress - Get progress for specific lesson
 * - POST /api/lessons/:id/progress - Update lesson progress
 * - POST /api/lessons/:id/complete - Mark lesson as complete
 */

const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: true
    } : false
});

/**
 * Main handler
 */
module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { method, query } = req;
    const pathParts = req.url.split('?')[0].split('/').filter(Boolean);

    try {
        // GET /api/lessons - List all lessons
        if (method === 'GET' && pathParts.length === 2) {
            return await listLessons(req, res, query);
        }

        // GET /api/lessons/:id - Get specific lesson
        if (method === 'GET' && pathParts.length === 3 && !pathParts[2].includes('progress')) {
            const lessonId = pathParts[2];
            return await getLesson(req, res, lessonId);
        }

        // GET /api/lessons/progress - Get all user progress
        if (method === 'GET' && pathParts.length === 3 && pathParts[2] === 'progress') {
            return await getUserProgress(req, res);
        }

        // GET /api/lessons/:id/progress - Get progress for specific lesson
        if (method === 'GET' && pathParts.length === 4 && pathParts[3] === 'progress') {
            const lessonId = pathParts[2];
            return await getLessonProgress(req, res, lessonId);
        }

        // POST /api/lessons/:id/progress - Update progress
        if (method === 'POST' && pathParts.length === 4 && pathParts[3] === 'progress') {
            const lessonId = pathParts[2];
            return await updateProgress(req, res, lessonId);
        }

        // POST /api/lessons/:id/complete - Mark as complete
        if (method === 'POST' && pathParts.length === 4 && pathParts[3] === 'complete') {
            const lessonId = pathParts[2];
            return await completeLesson(req, res, lessonId);
        }

        // Not found
        res.status(404).json({ error: 'Endpoint not found' });

    } catch (error) {
        console.error('Lessons API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * List all lessons (optionally filtered)
 */
async function listLessons(req, res, query) {
    try {
        // In production, this would query a database
        // For now, return static list matching lesson-list.js
        const lessons = [
            // Beginner Course (FREE)
            { id: 'lesson-01-sudoku-basics', number: 1, title: 'Sudoku Basics', course: 'beginner', duration: 600, xp_reward: 25, premium: false },
            { id: 'lesson-02-naked-singles', number: 2, title: 'Naked Singles', course: 'beginner', duration: 720, xp_reward: 50, premium: false },
            { id: 'lesson-03-hidden-singles', number: 3, title: 'Hidden Singles', course: 'beginner', duration: 900, xp_reward: 50, premium: false },
            { id: 'lesson-04-scanning-techniques', number: 4, title: 'Scanning Techniques', course: 'beginner', duration: 900, xp_reward: 50, premium: false },
            { id: 'lesson-05-naked-pairs', number: 5, title: 'Naked Pairs', course: 'beginner', duration: 1200, xp_reward: 75, premium: false },
            { id: 'lesson-06-hidden-pairs', number: 6, title: 'Hidden Pairs', course: 'beginner', duration: 1200, xp_reward: 75, premium: false },

            // Intermediate Course
            { id: 'lesson-07-naked-triples', number: 7, title: 'Naked Triples', course: 'intermediate', duration: 1500, xp_reward: 100, premium: false },
            { id: 'lesson-08-hidden-triples', number: 8, title: 'Hidden Triples', course: 'intermediate', duration: 1500, xp_reward: 100, premium: false },
            { id: 'lesson-09-box-line-reduction', number: 9, title: 'Box/Line Reduction', course: 'intermediate', duration: 1200, xp_reward: 100, premium: false },
            { id: 'lesson-10-x-wing', number: 10, title: 'X-Wing', course: 'intermediate', duration: 1800, xp_reward: 150, premium: true },
            { id: 'lesson-11-swordfish', number: 11, title: 'Swordfish', course: 'intermediate', duration: 1800, xp_reward: 150, premium: true },
            { id: 'lesson-12-xy-wing', number: 12, title: 'XY-Wing', course: 'intermediate', duration: 2100, xp_reward: 150, premium: true },
            { id: 'lesson-13-xyz-wing', number: 13, title: 'XYZ-Wing', course: 'intermediate', duration: 2100, xp_reward: 150, premium: true },
            { id: 'lesson-14-simple-coloring', number: 14, title: 'Simple Coloring', course: 'intermediate', duration: 2400, xp_reward: 200, premium: true },

            // Variant Courses
            { id: 'lesson-15-x-sudoku', number: 15, title: 'X-Sudoku Strategies', course: 'variants', duration: 1500, xp_reward: 150, premium: true },
            { id: 'lesson-16-killer-sudoku', number: 16, title: 'Killer Sudoku Mastery', course: 'variants', duration: 1800, xp_reward: 150, premium: true },
            { id: 'lesson-17-anti-knight', number: 17, title: 'Anti-Knight Tactics', course: 'variants', duration: 1500, xp_reward: 150, premium: true },
            { id: 'lesson-18-thermo-sudoku', number: 18, title: 'Thermo Sudoku Techniques', course: 'variants', duration: 1500, xp_reward: 150, premium: true },
            { id: 'lesson-19-jigsaw-sudoku', number: 19, title: 'Jigsaw Sudoku Strategies', course: 'variants', duration: 1500, xp_reward: 150, premium: true },
            { id: 'lesson-20-advanced-combinations', number: 20, title: 'Advanced Combinations', course: 'variants', duration: 2400, xp_reward: 200, premium: true }
        ];

        // Filter by course if specified
        let filtered = lessons;
        if (query.course && query.course !== 'all') {
            filtered = lessons.filter(l => l.course === query.course);
        }

        res.status(200).json({ success: true, lessons: filtered });

    } catch (error) {
        console.error('Error listing lessons:', error);
        res.status(500).json({ error: 'Failed to list lessons' });
    }
}

/**
 * Get specific lesson content
 */
async function getLesson(req, res, lessonId) {
    try {
        // Determine file path based on lesson number
        let coursePath = 'beginner';
        const lessonNum = parseInt(lessonId.split('-')[1]);

        if (lessonNum >= 7 && lessonNum <= 14) {
            coursePath = 'intermediate';
        } else if (lessonNum >= 15) {
            coursePath = 'variants';
        }

        const filePath = path.join(process.cwd(), 'lessons', coursePath, `${lessonId}.json`);

        // Read lesson file
        const content = await fs.readFile(filePath, 'utf8');
        const lesson = JSON.parse(content);

        res.status(200).json(lesson);

    } catch (error) {
        console.error(`Error loading lesson ${lessonId}:`, error);

        if (error.code === 'ENOENT') {
            res.status(404).json({ error: 'Lesson not found' });
        } else {
            res.status(500).json({ error: 'Failed to load lesson' });
        }
    }
}

/**
 * Get all user progress
 */
async function getUserProgress(req, res) {
    try {
        // Get user ID from query or session
        const userId = query.userId || req.query.userId;

        if (!userId) {
            return res.status(200).json([]);
        }

        const result = await pool.query(
            `SELECT * FROM lesson_progress WHERE user_id = $1 ORDER BY lesson_id`,
            [userId]
        );

        res.status(200).json(result.rows);

    } catch (error) {
        console.error('Error getting user progress:', error);
        res.status(500).json({ error: 'Failed to get progress' });
    }
}

/**
 * Get progress for specific lesson
 */
async function getLessonProgress(req, res, lessonId) {
    try {
        const userId = req.query.userId;

        if (!userId) {
            return res.status(200).json({ status: 'not_started', current_step: 0 });
        }

        const result = await pool.query(
            `SELECT * FROM lesson_progress WHERE user_id = $1 AND lesson_id = $2`,
            [userId, lessonId]
        );

        if (result.rows.length === 0) {
            return res.status(200).json({ status: 'not_started', current_step: 0 });
        }

        res.status(200).json(result.rows[0]);

    } catch (error) {
        console.error('Error getting lesson progress:', error);
        res.status(500).json({ error: 'Failed to get progress' });
    }
}

/**
 * Update lesson progress
 */
async function updateProgress(req, res, lessonId) {
    try {
        const { userId, current_step, time_spent, hints_used, status } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID required' });
        }

        // Upsert progress
        await pool.query(
            `INSERT INTO lesson_progress (user_id, lesson_id, current_step, time_spent, hints_used, status)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (user_id, lesson_id)
             DO UPDATE SET
                current_step = $3,
                time_spent = $4,
                hints_used = $5,
                status = $6,
                updated_at = CURRENT_TIMESTAMP`,
            [userId, lessonId, current_step, time_spent, hints_used, status]
        );

        res.status(200).json({ success: true });

    } catch (error) {
        console.error('Error updating progress:', error);
        res.status(500).json({ error: 'Failed to update progress' });
    }
}

/**
 * Mark lesson as complete and award XP
 */
async function completeLesson(req, res, lessonId) {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID required' });
        }

        // Mark as complete
        await pool.query(
            `UPDATE lesson_progress
             SET status = 'completed',
                 completed_at = CURRENT_TIMESTAMP
             WHERE user_id = $1 AND lesson_id = $2`,
            [userId, lessonId]
        );

        // Get lesson details for XP
        const lessonNum = parseInt(lessonId.split('-')[1]);
        const xpReward = getXPForLesson(lessonNum);

        // Check for achievements (triggers will handle this automatically)

        res.status(200).json({
            success: true,
            xp_earned: xpReward,
            message: 'Lesson completed!'
        });

    } catch (error) {
        console.error('Error completing lesson:', error);
        res.status(500).json({ error: 'Failed to complete lesson' });
    }
}

/**
 * Helper: Get XP reward for lesson number
 */
function getXPForLesson(lessonNum) {
    const xpMap = {
        1: 25, 2: 50, 3: 50, 4: 50, 5: 75, 6: 75,
        7: 100, 8: 100, 9: 100, 10: 150, 11: 150, 12: 150, 13: 150, 14: 200,
        15: 150, 16: 150, 17: 150, 18: 150, 19: 150, 20: 200
    };
    return xpMap[lessonNum] || 50;
}
