/**
 * Killer Sudoku Validator
 *
 * Phase 2 Month 10: Killer Sudoku Variant
 *
 * Killer Sudoku combines classic Sudoku with sum constraints:
 * - Standard 9x9 Sudoku rules apply (rows, columns, 3x3 boxes)
 * - Grid is divided into "cages" (outlined regions)
 * - Each cage has a target sum
 * - Numbers within a cage must sum to the cage's target
 * - Numbers CANNOT repeat within a cage (even if Sudoku rules would allow it)
 *
 * Cage Format:
 * {
 *   cells: [[row, col], [row, col], ...],  // Array of cell positions
 *   sum: number                              // Target sum for this cage
 * }
 *
 * Usage:
 *   const { validateKillerSudoku, isValidKillerPlacement } = require('./lib/killer-sudoku-validator');
 *   const isValid = validateKillerSudoku(board, cages);
 */

/**
 * Find which cage a cell belongs to
 *
 * @param {Array<Object>} cages - Array of cage objects
 * @param {number} row - Row index (0-8)
 * @param {number} col - Column index (0-8)
 * @returns {Object|null} Cage object or null if not in any cage
 */
function findCageForCell(cages, row, col) {
  for (const cage of cages) {
    for (const [r, c] of cage.cells) {
      if (r === row && c === col) {
        return cage;
      }
    }
  }
  return null;
}

/**
 * Check if placing a number at a position violates Killer Sudoku constraints
 *
 * @param {Array<Array<number>>} board - 9x9 Sudoku board (0 for empty cells)
 * @param {Array<Object>} cages - Array of cage objects with cells and sum
 * @param {number} row - Row index (0-8)
 * @param {number} col - Column index (0-8)
 * @param {number} num - Number to place (1-9)
 * @returns {boolean} True if placement is valid (no conflicts)
 */
function isValidKillerPlacement(board, cages, row, col, num) {
  // First check standard Sudoku constraints (row, column, box)

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

  // Check Killer Sudoku cage constraints
  const cage = findCageForCell(cages, row, col);
  if (!cage) {
    // Cell not in any cage - this shouldn't happen in valid Killer Sudoku
    console.warn(`Cell (${row}, ${col}) not in any cage`);
    return true; // Allow placement if cage not found
  }

  // Check if number already exists in the same cage (no duplicates in cage)
  for (const [r, c] of cage.cells) {
    if (r === row && c === col) continue; // Skip the cell we're checking
    if (board[r][c] === num) {
      return false; // Duplicate in cage
    }
  }

  // Check if cage sum would be exceeded
  let currentSum = 0;
  let emptyCells = 0;

  for (const [r, c] of cage.cells) {
    if (r === row && c === col) {
      // This is the cell we're placing the number in
      currentSum += num;
    } else if (board[r][c] !== 0) {
      currentSum += board[r][c];
    } else {
      emptyCells++;
    }
  }

  // If sum already exceeds target, placement is invalid
  if (currentSum > cage.sum) {
    return false;
  }

  // If cage is complete, sum must match exactly
  if (emptyCells === 0 && currentSum !== cage.sum) {
    return false;
  }

  return true; // Placement is valid
}

/**
 * Validate the entire board for Killer Sudoku constraint violations
 *
 * @param {Array<Array<number>>} board - 9x9 Sudoku board
 * @param {Array<Object>} cages - Array of cage objects
 * @returns {boolean} True if the board is valid (no violations)
 */
function validateKillerSudokuBoard(board, cages) {
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

  // 2. Validate Killer Sudoku cage constraints
  for (const cage of cages) {
    const seen = new Set();
    let currentSum = 0;
    let hasEmpty = false;

    for (const [row, col] of cage.cells) {
      const num = board[row][col];

      if (num === 0) {
        hasEmpty = true;
      } else {
        // Check for duplicates within cage
        if (seen.has(num)) {
          return false; // Duplicate number in cage
        }
        seen.add(num);
        currentSum += num;
      }
    }

    // If cage is complete, sum must match exactly
    if (!hasEmpty && currentSum !== cage.sum) {
      return false; // Incorrect sum
    }

    // If cage is partial, sum must not exceed target
    if (hasEmpty && currentSum > cage.sum) {
      return false; // Sum already exceeds target
    }
  }

  return true; // No violations
}

/**
 * Check if a completed board satisfies all Killer Sudoku constraints
 *
 * @param {Array<Array<number>>} board - 9x9 Sudoku board (must be complete)
 * @param {Array<Object>} cages - Array of cage objects
 * @returns {Object} {valid: boolean, errors: Array<string>}
 */
function validateKillerSudokuSolution(board, cages) {
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

  // 3. Check Killer Sudoku cage constraints
  for (let i = 0; i < cages.length; i++) {
    const cage = cages[i];
    const seen = new Set();
    let currentSum = 0;

    for (const [row, col] of cage.cells) {
      const num = board[row][col];

      // Check for duplicates within cage
      if (seen.has(num)) {
        errors.push(`Killer constraint violation: Duplicate ${num} in cage ${i} (sum=${cage.sum})`);
      }
      seen.add(num);

      currentSum += num;
    }

    // Check if sum matches target
    if (currentSum !== cage.sum) {
      errors.push(`Killer constraint violation: Cage ${i} sum is ${currentSum}, expected ${cage.sum}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get all valid numbers that can be placed at a position (Classic + Killer)
 *
 * @param {Array<Array<number>>} board - 9x9 Sudoku board
 * @param {Array<Object>} cages - Array of cage objects
 * @param {number} row - Row index (0-8)
 * @param {number} col - Column index (0-8)
 * @returns {Array<number>} Array of valid numbers (1-9)
 */
function getValidKillerNumbers(board, cages, row, col) {
  const valid = [];

  for (let num = 1; num <= 9; num++) {
    if (isValidKillerPlacement(board, cages, row, col, num)) {
      valid.push(num);
    }
  }

  return valid;
}

/**
 * Validate cage structure
 *
 * @param {Array<Object>} cages - Array of cage objects
 * @returns {Object} {valid: boolean, errors: Array<string>}
 */
function validateCageStructure(cages) {
  const errors = [];
  const allCells = new Set();

  // Check each cage
  for (let i = 0; i < cages.length; i++) {
    const cage = cages[i];

    // Check cage has cells
    if (!cage.cells || cage.cells.length === 0) {
      errors.push(`Cage ${i} has no cells`);
      continue;
    }

    // Check cage has valid sum
    if (!cage.sum || cage.sum < 1) {
      errors.push(`Cage ${i} has invalid sum: ${cage.sum}`);
    }

    // Check cells are within bounds
    for (const [row, col] of cage.cells) {
      if (row < 0 || row > 8 || col < 0 || col > 8) {
        errors.push(`Cage ${i} has out-of-bounds cell: (${row}, ${col})`);
      }

      // Check for duplicate cells across cages
      const cellKey = `${row},${col}`;
      if (allCells.has(cellKey)) {
        errors.push(`Cell (${row}, ${col}) appears in multiple cages`);
      }
      allCells.add(cellKey);
    }

    // Check cage sum is possible (min and max possible sums)
    const cageSize = cage.cells.length;
    const minPossibleSum = (cageSize * (cageSize + 1)) / 2; // 1+2+3+...+n
    const maxPossibleSum = (cageSize * (19 - cageSize)) / 2; // 9+8+7+...+(10-n)

    if (cage.sum < minPossibleSum) {
      errors.push(`Cage ${i} sum ${cage.sum} is too small for ${cageSize} cells (min: ${minPossibleSum})`);
    }

    if (cage.sum > maxPossibleSum) {
      errors.push(`Cage ${i} sum ${cage.sum} is too large for ${cageSize} cells (max: ${maxPossibleSum})`);
    }
  }

  // Check all 81 cells are covered
  if (allCells.size !== 81) {
    errors.push(`Only ${allCells.size} cells covered by cages (expected 81)`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  findCageForCell,
  isValidKillerPlacement,
  validateKillerSudokuBoard,
  validateKillerSudokuSolution,
  getValidKillerNumbers,
  validateCageStructure
};
