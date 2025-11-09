/**
 * JIGSAW SUDOKU VALIDATOR
 *
 * Validates Jigsaw Sudoku (Irregular Sudoku) constraints
 * - Standard row and column rules
 * - Irregular regions (9 cells each) must contain 1-9
 * - Regions are defined by region map, not 3x3 boxes
 *
 * Phase 2 Month 14
 */

/**
 * Check if placing a number in a cell is valid for Jigsaw Sudoku
 * @param {Array<Array<number>>} board - 9x9 Sudoku board
 * @param {Array<Array<number>>} regions - 9x9 region map (0-8)
 * @param {number} row - Row index (0-8)
 * @param {number} col - Column index (0-8)
 * @param {number} num - Number to place (1-9)
 * @returns {boolean} True if placement is valid
 */
function isValidJigsawPlacement(board, regions, row, col, num) {
    // Check row
    for (let c = 0; c < 9; c++) {
        if (c !== col && board[row][c] === num) {
            return false;
        }
    }

    // Check column
    for (let r = 0; r < 9; r++) {
        if (r !== row && board[r][col] === num) {
            return false;
        }
    }

    // Check irregular region
    const regionId = regions[row][col];
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (regions[r][c] === regionId && (r !== row || c !== col)) {
                if (board[r][c] === num) {
                    return false;
                }
            }
        }
    }

    return true;
}

/**
 * Validate entire Jigsaw Sudoku board
 * @param {Array<Array<number>>} board - 9x9 Sudoku board
 * @param {Array<Array<number>>} regions - 9x9 region map (0-8)
 * @returns {boolean} True if board is valid (may be incomplete)
 */
function validateJigsawBoard(board, regions) {
    // Check each filled cell
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const num = board[row][col];
            if (num !== 0) {
                // Temporarily clear cell to check validity
                board[row][col] = 0;
                const valid = isValidJigsawPlacement(board, regions, row, col, num);
                board[row][col] = num;
                if (!valid) {
                    return false;
                }
            }
        }
    }
    return true;
}

/**
 * Validate that solution is complete and correct
 * @param {Array<Array<number>>} solution - 9x9 Sudoku solution
 * @param {Array<Array<number>>} regions - 9x9 region map (0-8)
 * @returns {boolean} True if solution is complete and valid
 */
function validateJigsawSolution(solution, regions) {
    // Check all cells are filled
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (solution[row][col] < 1 || solution[row][col] > 9) {
                return false;
            }
        }
    }

    // Check all rows
    for (let row = 0; row < 9; row++) {
        const seen = new Set();
        for (let col = 0; col < 9; col++) {
            const num = solution[row][col];
            if (seen.has(num)) return false;
            seen.add(num);
        }
        if (seen.size !== 9) return false;
    }

    // Check all columns
    for (let col = 0; col < 9; col++) {
        const seen = new Set();
        for (let row = 0; row < 9; row++) {
            const num = solution[row][col];
            if (seen.has(num)) return false;
            seen.add(num);
        }
        if (seen.size !== 9) return false;
    }

    // Check all regions
    for (let regionId = 0; regionId < 9; regionId++) {
        const seen = new Set();
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (regions[row][col] === regionId) {
                    const num = solution[row][col];
                    if (seen.has(num)) return false;
                    seen.add(num);
                }
            }
        }
        if (seen.size !== 9) return false;
    }

    return true;
}

/**
 * Get all valid numbers for a cell (used for hint system)
 * @param {Array<Array<number>>} board - 9x9 Sudoku board
 * @param {Array<Array<number>>} regions - 9x9 region map (0-8)
 * @param {number} row - Row index (0-8)
 * @param {number} col - Column index (0-8)
 * @returns {Array<number>} Array of valid numbers (1-9)
 */
function getValidNumbers(board, regions, row, col) {
    if (board[row][col] !== 0) {
        return [];
    }

    const validNumbers = [];
    for (let num = 1; num <= 9; num++) {
        if (isValidJigsawPlacement(board, regions, row, col, num)) {
            validNumbers.push(num);
        }
    }
    return validNumbers;
}

/**
 * Get all cells in a specific region
 * @param {Array<Array<number>>} regions - 9x9 region map (0-8)
 * @param {number} regionId - Region ID (0-8)
 * @returns {Array<Array<number>>} Array of [row, col] pairs
 */
function getRegionCells(regions, regionId) {
    const cells = [];
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (regions[row][col] === regionId) {
                cells.push([row, col]);
            }
        }
    }
    return cells;
}

/**
 * Count how many cells in the board are filled
 * @param {Array<Array<number>>} board - 9x9 Sudoku board
 * @returns {number} Count of filled cells
 */
function countFilledCells(board) {
    let count = 0;
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] !== 0) {
                count++;
            }
        }
    }
    return count;
}

module.exports = {
    isValidJigsawPlacement,
    validateJigsawBoard,
    validateJigsawSolution,
    getValidNumbers,
    getRegionCells,
    countFilledCells
};
