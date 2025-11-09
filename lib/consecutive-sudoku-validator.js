/**
 * Consecutive Sudoku Validator
 *
 * Phase 2 Month 12: Consecutive Sudoku Variant
 *
 * Consecutive Sudoku adds an additional constraint to classic Sudoku:
 * - Cells that are orthogonally adjacent (horizontally or vertically)
 * - MAY be marked with a "consecutive indicator" (white bar/dot)
 * - If marked: The two cells MUST contain consecutive numbers (differ by 1)
 * - If NOT marked: The two cells MUST NOT contain consecutive numbers
 *
 * This is a "negative constraint" variant where the ABSENCE of a marker
 * is just as constraining as its presence.
 *
 * Consecutive Markers Format:
 * Array of edges: [{ row1, col1, row2, col2 }]
 * - Each edge represents two adjacent cells that MUST be consecutive
 * - All other adjacent pairs MUST NOT be consecutive
 *
 * Usage:
 *   const { isValidConsecutivePlacement, validateConsecutiveBoard } = require('./lib/consecutive-sudoku-validator');
 *   const isValid = isValidConsecutivePlacement(board, consecutiveMarkers, row, col, num);
 */

/**
 * Check if two numbers are consecutive (differ by exactly 1)
 *
 * @param {number} num1 - First number
 * @param {number} num2 - Second number
 * @returns {boolean} True if numbers are consecutive
 */
function areConsecutive(num1, num2) {
  return Math.abs(num1 - num2) === 1;
}

/**
 * Check if an edge between two cells is marked as consecutive
 *
 * @param {Array<Object>} consecutiveMarkers - Array of consecutive edges
 * @param {number} row1 - First cell row
 * @param {number} col1 - First cell column
 * @param {number} row2 - Second cell row
 * @param {number} col2 - Second cell column
 * @returns {boolean} True if edge is marked as consecutive
 */
function isMarkedConsecutive(consecutiveMarkers, row1, col1, row2, col2) {
  for (const marker of consecutiveMarkers) {
    // Check both directions (edge can be stored either way)
    if (
      (marker.row1 === row1 && marker.col1 === col1 && marker.row2 === row2 && marker.col2 === col2) ||
      (marker.row1 === row2 && marker.col1 === col2 && marker.row2 === row1 && marker.col2 === col1)
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Get all orthogonally adjacent cells (up, down, left, right)
 *
 * @param {number} row - Row index (0-8)
 * @param {number} col - Column index (0-8)
 * @returns {Array<[number, number]>} Array of adjacent cell positions
 */
function getAdjacentCells(row, col) {
  const adjacent = [];

  // Up
  if (row > 0) adjacent.push([row - 1, col]);
  // Down
  if (row < 8) adjacent.push([row + 1, col]);
  // Left
  if (col > 0) adjacent.push([row, col - 1]);
  // Right
  if (col < 8) adjacent.push([row, col + 1]);

  return adjacent;
}

/**
 * Check if placing a number at a position violates Consecutive constraints
 *
 * @param {Array<Array<number>>} board - 9x9 Sudoku board (0 for empty cells)
 * @param {Array<Object>} consecutiveMarkers - Array of consecutive edges
 * @param {number} row - Row index (0-8)
 * @param {number} col - Column index (0-8)
 * @param {number} num - Number to place (1-9)
 * @returns {boolean} True if placement is valid (no consecutive violations)
 */
function isValidConsecutivePlacement(board, consecutiveMarkers, row, col, num) {
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

  // Check consecutive constraints with adjacent cells
  const adjacentCells = getAdjacentCells(row, col);

  for (const [adjRow, adjCol] of adjacentCells) {
    const adjNum = board[adjRow][adjCol];

    // Skip empty adjacent cells
    if (adjNum === 0) continue;

    const isMarked = isMarkedConsecutive(consecutiveMarkers, row, col, adjRow, adjCol);
    const consecutive = areConsecutive(num, adjNum);

    // If edge is marked, numbers MUST be consecutive
    if (isMarked && !consecutive) {
      return false; // Violation: marked edge but not consecutive
    }

    // If edge is NOT marked, numbers MUST NOT be consecutive
    if (!isMarked && consecutive) {
      return false; // Violation: unmarked edge but consecutive
    }
  }

  return true; // Placement is valid
}

/**
 * Validate the entire board for Consecutive constraint violations
 *
 * @param {Array<Array<number>>} board - 9x9 Sudoku board
 * @param {Array<Object>} consecutiveMarkers - Array of consecutive edges
 * @returns {boolean} True if the board is valid (no violations)
 */
function validateConsecutiveBoard(board, consecutiveMarkers) {
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

  // 2. Validate consecutive constraints
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const num = board[row][col];

      // Skip empty cells
      if (num === 0) continue;

      // Check adjacent cells
      const adjacentCells = getAdjacentCells(row, col);

      for (const [adjRow, adjCol] of adjacentCells) {
        const adjNum = board[adjRow][adjCol];

        // Skip empty adjacent cells
        if (adjNum === 0) continue;

        // Avoid checking the same edge twice
        if (adjRow < row || (adjRow === row && adjCol < col)) continue;

        const isMarked = isMarkedConsecutive(consecutiveMarkers, row, col, adjRow, adjCol);
        const consecutive = areConsecutive(num, adjNum);

        // If edge is marked, numbers MUST be consecutive
        if (isMarked && !consecutive) {
          return false; // Violation
        }

        // If edge is NOT marked, numbers MUST NOT be consecutive
        if (!isMarked && consecutive) {
          return false; // Violation
        }
      }
    }
  }

  return true; // No violations
}

/**
 * Check if a completed board satisfies all Consecutive constraints
 *
 * @param {Array<Array<number>>} board - 9x9 Sudoku board (must be complete)
 * @param {Array<Object>} consecutiveMarkers - Array of consecutive edges
 * @returns {Object} {valid: boolean, errors: Array<string>}
 */
function validateConsecutiveSolution(board, consecutiveMarkers) {
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

  // 3. Check consecutive constraints
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const num = board[row][col];
      const adjacentCells = getAdjacentCells(row, col);

      for (const [adjRow, adjCol] of adjacentCells) {
        const adjNum = board[adjRow][adjCol];

        // Avoid checking the same edge twice
        if (adjRow < row || (adjRow === row && adjCol < col)) continue;

        const isMarked = isMarkedConsecutive(consecutiveMarkers, row, col, adjRow, adjCol);
        const consecutive = areConsecutive(num, adjNum);

        if (isMarked && !consecutive) {
          errors.push(
            `Consecutive violation: Cells (${row}, ${col})=${num} and (${adjRow}, ${adjCol})=${adjNum} ` +
            `are marked consecutive but differ by ${Math.abs(num - adjNum)}`
          );
        }

        if (!isMarked && consecutive) {
          errors.push(
            `Consecutive violation: Cells (${row}, ${col})=${num} and (${adjRow}, ${adjCol})=${adjNum} ` +
            `are NOT marked but are consecutive (differ by 1)`
          );
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get all valid numbers that can be placed at a position (Classic + Consecutive)
 *
 * @param {Array<Array<number>>} board - 9x9 Sudoku board
 * @param {Array<Object>} consecutiveMarkers - Array of consecutive edges
 * @param {number} row - Row index (0-8)
 * @param {number} col - Column index (0-8)
 * @returns {Array<number>} Array of valid numbers (1-9)
 */
function getValidConsecutiveNumbers(board, consecutiveMarkers, row, col) {
  const valid = [];

  for (let num = 1; num <= 9; num++) {
    if (isValidConsecutivePlacement(board, consecutiveMarkers, row, col, num)) {
      valid.push(num);
    }
  }

  return valid;
}

/**
 * Count how many consecutive markers are present
 *
 * @param {Array<Object>} consecutiveMarkers - Array of consecutive edges
 * @returns {number} Number of consecutive markers
 */
function countConsecutiveMarkers(consecutiveMarkers) {
  return consecutiveMarkers.length;
}

/**
 * Validate marker format
 *
 * @param {Array<Object>} consecutiveMarkers - Array of consecutive edges
 * @returns {boolean} True if marker format is valid
 */
function validateMarkerFormat(consecutiveMarkers) {
  if (!Array.isArray(consecutiveMarkers)) return false;

  for (const marker of consecutiveMarkers) {
    // Check required fields
    if (
      typeof marker.row1 !== 'number' ||
      typeof marker.col1 !== 'number' ||
      typeof marker.row2 !== 'number' ||
      typeof marker.col2 !== 'number'
    ) {
      return false;
    }

    // Check bounds
    if (
      marker.row1 < 0 || marker.row1 > 8 ||
      marker.col1 < 0 || marker.col1 > 8 ||
      marker.row2 < 0 || marker.row2 > 8 ||
      marker.col2 < 0 || marker.col2 > 8
    ) {
      return false;
    }

    // Check that cells are adjacent (exactly one coordinate differs by 1)
    const rowDiff = Math.abs(marker.row1 - marker.row2);
    const colDiff = Math.abs(marker.col1 - marker.col2);

    if (!((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1))) {
      return false; // Not orthogonally adjacent
    }
  }

  return true;
}

module.exports = {
  areConsecutive,
  isMarkedConsecutive,
  getAdjacentCells,
  isValidConsecutivePlacement,
  validateConsecutiveBoard,
  validateConsecutiveSolution,
  getValidConsecutiveNumbers,
  countConsecutiveMarkers,
  validateMarkerFormat
};
