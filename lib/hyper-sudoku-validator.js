/**
 * Hyper Sudoku Validator (also known as Windoku)
 *
 * Phase 2 Month 11: Hyper Sudoku Variant
 *
 * Hyper Sudoku Rules:
 * - Standard 9x9 Sudoku rules apply (rows, columns, 3x3 boxes)
 * - PLUS: Four additional 3x3 "hyper regions" must also contain digits 1-9
 * - The hyper regions are positioned at:
 *   - Region 1 (top-left): rows 1-3, cols 1-3
 *   - Region 2 (top-right): rows 1-3, cols 5-7
 *   - Region 3 (bottom-left): rows 5-7, cols 1-3
 *   - Region 4 (bottom-right): rows 5-7, cols 5-7
 *
 * Total constraints: 9 rows + 9 cols + 9 boxes + 4 hyper regions = 31 constraints
 *
 * Usage:
 *   const { isValidHyperPlacement, validateHyperSudokuBoard } = require('./lib/hyper-sudoku-validator');
 *   const isValid = isValidHyperPlacement(board, row, col, num);
 */

/**
 * Define the 4 hyper regions
 * Each region is a 3x3 area with starting position (row, col)
 */
const HYPER_REGIONS = [
  { startRow: 1, startCol: 1 }, // Top-left
  { startRow: 1, startCol: 5 }, // Top-right
  { startRow: 5, startCol: 1 }, // Bottom-left
  { startRow: 5, startCol: 5 }  // Bottom-right
];

/**
 * Get which hyper region (if any) a cell belongs to
 *
 * @param {number} row - Row index (0-8)
 * @param {number} col - Column index (0-8)
 * @returns {Object|null} Hyper region object or null if not in any hyper region
 */
function getHyperRegion(row, col) {
  for (const region of HYPER_REGIONS) {
    if (
      row >= region.startRow &&
      row < region.startRow + 3 &&
      col >= region.startCol &&
      col < region.startCol + 3
    ) {
      return region;
    }
  }
  return null;
}

/**
 * Check if placing a number at a position violates Hyper Sudoku constraints
 *
 * @param {Array<Array<number>>} board - 9x9 Sudoku board (0 for empty cells)
 * @param {number} row - Row index (0-8)
 * @param {number} col - Column index (0-8)
 * @param {number} num - Number to place (1-9)
 * @returns {boolean} True if placement is valid (no conflicts)
 */
function isValidHyperPlacement(board, row, col, num) {
  // Check standard Sudoku constraints first

  // Check row
  for (let c = 0; c < 9; c++) {
    if (board[row][c] === num) return false;
  }

  // Check column
  for (let r = 0; r < 9; r++) {
    if (board[r][col] === num) return false;
  }

  // Check 3x3 box
  const boxStartRow = Math.floor(row / 3) * 3;
  const boxStartCol = Math.floor(col / 3) * 3;
  for (let r = boxStartRow; r < boxStartRow + 3; r++) {
    for (let c = boxStartCol; c < boxStartCol + 3; c++) {
      if (board[r][c] === num) return false;
    }
  }

  // Check hyper region constraint (if cell is in a hyper region)
  const hyperRegion = getHyperRegion(row, col);
  if (hyperRegion) {
    for (let r = hyperRegion.startRow; r < hyperRegion.startRow + 3; r++) {
      for (let c = hyperRegion.startCol; c < hyperRegion.startCol + 3; c++) {
        if (board[r][c] === num) {
          return false; // Duplicate in hyper region
        }
      }
    }
  }

  return true; // Placement is valid
}

/**
 * Validate the entire board for Hyper Sudoku constraint violations
 *
 * @param {Array<Array<number>>} board - 9x9 Sudoku board
 * @returns {boolean} True if the board is valid (no violations)
 */
function validateHyperSudokuBoard(board) {
  // 1. Validate standard Sudoku constraints

  // Check rows
  for (let row = 0; row < 9; row++) {
    const seen = new Set();
    for (let col = 0; col < 9; col++) {
      const num = board[row][col];
      if (num !== 0) {
        if (seen.has(num)) return false; // Duplicate in row
        seen.add(num);
      }
    }
  }

  // Check columns
  for (let col = 0; col < 9; col++) {
    const seen = new Set();
    for (let row = 0; row < 9; row++) {
      const num = board[row][col];
      if (num !== 0) {
        if (seen.has(num)) return false; // Duplicate in column
        seen.add(num);
      }
    }
  }

  // Check 3x3 boxes
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const seen = new Set();
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const num = board[boxRow * 3 + r][boxCol * 3 + c];
          if (num !== 0) {
            if (seen.has(num)) return false; // Duplicate in box
            seen.add(num);
          }
        }
      }
    }
  }

  // 2. Validate Hyper region constraints
  for (const region of HYPER_REGIONS) {
    const seen = new Set();
    for (let r = region.startRow; r < region.startRow + 3; r++) {
      for (let c = region.startCol; c < region.startCol + 3; c++) {
        const num = board[r][c];
        if (num !== 0) {
          if (seen.has(num)) {
            return false; // Duplicate in hyper region
          }
          seen.add(num);
        }
      }
    }
  }

  return true; // No violations
}

/**
 * Check if a completed board satisfies all Hyper Sudoku constraints
 *
 * @param {Array<Array<number>>} board - 9x9 Sudoku board (must be complete)
 * @returns {Object} {valid: boolean, errors: Array<string>}
 */
function validateHyperSudokuSolution(board) {
  const errors = [];

  // 1. Check if board is completely filled
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0 || board[row][col] < 1 || board[row][col] > 9) {
        errors.push(`Invalid value at (${row}, ${col}): ${board[row][col]}`);
      }
    }
  }

  // 2. Check standard Sudoku constraints

  // Check rows
  for (let row = 0; row < 9; row++) {
    const seen = new Set();
    for (let col = 0; col < 9; col++) {
      const num = board[row][col];
      if (seen.has(num)) {
        errors.push(`Duplicate ${num} in row ${row}`);
      }
      seen.add(num);
    }
  }

  // Check columns
  for (let col = 0; col < 9; col++) {
    const seen = new Set();
    for (let row = 0; row < 9; row++) {
      const num = board[row][col];
      if (seen.has(num)) {
        errors.push(`Duplicate ${num} in column ${col}`);
      }
      seen.add(num);
    }
  }

  // Check 3x3 boxes
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const seen = new Set();
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const row = boxRow * 3 + i;
          const col = boxCol * 3 + j;
          const num = board[row][col];
          if (seen.has(num)) {
            errors.push(`Duplicate ${num} in box (${boxRow}, ${boxCol})`);
          }
          seen.add(num);
        }
      }
    }
  }

  // 3. Check Hyper region constraints
  for (let i = 0; i < HYPER_REGIONS.length; i++) {
    const region = HYPER_REGIONS[i];
    const seen = new Set();

    for (let r = region.startRow; r < region.startRow + 3; r++) {
      for (let c = region.startCol; c < region.startCol + 3; c++) {
        const num = board[r][c];
        if (seen.has(num)) {
          errors.push(
            `Hyper constraint violation: Duplicate ${num} in hyper region ${i + 1} ` +
            `(rows ${region.startRow}-${region.startRow + 2}, cols ${region.startCol}-${region.startCol + 2})`
          );
        }
        seen.add(num);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get all valid numbers that can be placed at a position (Classic + Hyper)
 *
 * @param {Array<Array<number>>} board - 9x9 Sudoku board
 * @param {number} row - Row index (0-8)
 * @param {number} col - Column index (0-8)
 * @returns {Array<number>} Array of valid numbers (1-9)
 */
function getValidHyperNumbers(board, row, col) {
  const valid = [];

  for (let num = 1; num <= 9; num++) {
    if (isValidHyperPlacement(board, row, col, num)) {
      valid.push(num);
    }
  }

  return valid;
}

/**
 * Count how many cells are in hyper regions
 *
 * @returns {number} Number of cells in hyper regions (should be 36)
 */
function countHyperRegionCells() {
  return HYPER_REGIONS.length * 9; // 4 regions × 9 cells each = 36 cells
}

/**
 * Get all hyper region definitions
 *
 * @returns {Array<Object>} Array of hyper region objects
 */
function getHyperRegions() {
  return HYPER_REGIONS;
}

module.exports = {
  HYPER_REGIONS,
  getHyperRegion,
  isValidHyperPlacement,
  validateHyperSudokuBoard,
  validateHyperSudokuSolution,
  getValidHyperNumbers,
  countHyperRegionCells,
  getHyperRegions
};
