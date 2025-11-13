/**
 * JIGSAW SUDOKU GENERATOR
 *
 * Generates complete Jigsaw Sudoku puzzles with irregular regions
 * - Creates irregular regions (9 connected groups of 9 cells)
 * - Generates valid solution
 * - Removes cells to create puzzle with unique solution
 *
 * Phase 2 Month 14
 */

const { generateJigsawRegions, validateRegions } = require('./jigsaw-region-generator');
const {
    isValidJigsawPlacement,
    validateJigsawSolution,
    countFilledCells
} = require('./jigsaw-sudoku-validator');

/**
 * Target clue counts for each difficulty
 */
const CLUE_COUNTS = {
    easy: 36,    // More clues for easier solving
    medium: 30,  // Moderate clues
    hard: 26     // Fewer clues for challenge
};

/**
 * Generate a complete Jigsaw Sudoku puzzle
 * @param {string} difficulty - 'easy', 'medium', or 'hard'
 * @param {number} seed - Random seed for deterministic generation
 * @returns {Object} { puzzle, solution, regions }
 */
function generateJigsawSudoku(difficulty = 'medium', seed = Date.now()) {
    // Seeded random number generator
    let randomSeed = seed;
    function random() {
        randomSeed = (randomSeed * 9301 + 49297) % 233280;
        return randomSeed / 233280;
    }

    // Generate irregular regions
    const regions = generateJigsawRegions(seed);

    // Generate solution
    const solution = generateJigsawSolution(regions, random);

    if (!solution) {
        // Error occurred
        return null;
    }

    // Validate solution
    if (!validateJigsawSolution(solution, regions)) {
        return null;
    }

    // Create puzzle by removing cells
    const targetClues = CLUE_COUNTS[difficulty] || CLUE_COUNTS.medium;
    const puzzle = createPuzzle(solution, regions, targetClues, random);

    return {
        puzzle,
        solution,
        regions
    };
}

/**
 * Generate Jigsaw Sudoku with retry logic
 */
function generateJigsawSudokuWithRetry(difficulty = 'medium', seed = Date.now()) {
    const maxAttempts = 10;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            const attemptSeed = seed + attempt;
            const result = generateJigsawSudoku(difficulty, attemptSeed);

            if (result && result.puzzle && result.solution && result.regions) {
                const clueCount = countFilledCells(result.puzzle);
                const targetClues = CLUE_COUNTS[difficulty];

                // Accept if within reasonable range
                if (Math.abs(clueCount - targetClues) <= 3) {
                    return result;
                }
            }
        } catch (error) {
        }
    }

    throw new Error(`Failed to generate Jigsaw Sudoku after ${maxAttempts} attempts`);
}

/**
 * Generate a valid Jigsaw Sudoku solution using backtracking
 */
function generateJigsawSolution(regions, random) {
    const board = Array(9).fill(null).map(() => Array(9).fill(0));

    // Fill board using backtracking
    if (fillBoardRecursive(board, regions, 0, 0, random)) {
        return board;
    }

    return null;
}

/**
 * Recursive backtracking to fill the board
 */
function fillBoardRecursive(board, regions, row, col, random) {
    // Move to next cell
    if (col === 9) {
        row++;
        col = 0;
    }

    // All cells filled
    if (row === 9) {
        return true;
    }

    // Try numbers in random order
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    shuffleArray(numbers, random);

    for (const num of numbers) {
        if (isValidJigsawPlacement(board, regions, row, col, num)) {
            board[row][col] = num;

            if (fillBoardRecursive(board, regions, row, col + 1, random)) {
                return true;
            }

            board[row][col] = 0;
        }
    }

    return false;
}

/**
 * Create puzzle by removing cells while maintaining unique solution
 */
function createPuzzle(solution, regions, targetClues, random) {
    const puzzle = solution.map(row => [...row]);
    let currentClues = 81;

    // Create list of all cell positions
    const positions = [];
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            positions.push([row, col]);
        }
    }

    // Shuffle positions
    shuffleArray(positions, random);

    // Try to remove cells
    for (const [row, col] of positions) {
        if (currentClues <= targetClues) {
            break;
        }

        const original = puzzle[row][col];
        puzzle[row][col] = 0;

        // Check if puzzle still has unique solution
        if (!hasUniqueSolution(puzzle, regions)) {
            // Restore cell
            puzzle[row][col] = original;
        } else {
            currentClues--;
        }
    }

    return puzzle;
}

/**
 * Check if puzzle has a unique solution (simplified check)
 */
function hasUniqueSolution(puzzle, regions) {
    const solutions = [];
    const testBoard = puzzle.map(row => [...row]);

    // Try to find solutions (stop after finding 2)
    findSolutions(testBoard, regions, 0, 0, solutions, 2);

    return solutions.length === 1;
}

/**
 * Find all solutions (up to maxSolutions)
 */
function findSolutions(board, regions, row, col, solutions, maxSolutions) {
    if (solutions.length >= maxSolutions) {
        return;
    }

    // Move to next cell
    if (col === 9) {
        row++;
        col = 0;
    }

    // All cells filled - found a solution
    if (row === 9) {
        solutions.push(board.map(row => [...row]));
        return;
    }

    // Skip filled cells
    if (board[row][col] !== 0) {
        findSolutions(board, regions, row, col + 1, solutions, maxSolutions);
        return;
    }

    // Try each number
    for (let num = 1; num <= 9; num++) {
        if (isValidJigsawPlacement(board, regions, row, col, num)) {
            board[row][col] = num;
            findSolutions(board, regions, row, col + 1, solutions, maxSolutions);
            board[row][col] = 0;

            if (solutions.length >= maxSolutions) {
                return;
            }
        }
    }
}

/**
 * Shuffle array in place using Fisher-Yates algorithm
 */
function shuffleArray(array, random) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

module.exports = {
    generateJigsawSudoku,
    generateJigsawSudokuWithRetry,
    CLUE_COUNTS
};
