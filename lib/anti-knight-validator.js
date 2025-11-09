/**
 * Anti-Knight Sudoku Validator
 *
 * Phase 2 Month 9: Anti-Knight Sudoku Variant
 *
 * Anti-Knight Sudoku adds an additional constraint to classic Sudoku:
 * Cells that are a knight's move apart (like in chess) cannot contain the same digit.
 *
 * A knight's move is 2 squares in one direction and 1 square perpendicular.
 * From any cell (row, col), the knight can move to 8 positions:
 * - (row - 2, col - 1), (row - 2, col + 1)
 * - (row - 1, col - 2), (row - 1, col + 2)
 * - (row + 1, col - 2), (row + 1, col + 2)
 * - (row + 2, col - 1), (row + 2, col + 1)
 *
 * Usage:
 *   const { isValidAntiKnightPlacement, validateAntiKnightBoard } = require('./lib/anti-knight-validator');
 *   const isValid = isValidAntiKnightPlacement(board, row, col, num);
 *   const boardIsValid = validateAntiKnightBoard(board);
 */

/**
 * Get all knight's move positions from a given cell
 *
 * @param {number} row - Row index (0-8)
 * @param {number} col - Column index (0-8)
 * @returns {Array<[number, number]>} Array of valid knight's move positions
 */
function getKnightMoves(row, col) {
  const moves = [
    [row - 2, col - 1], [row - 2, col + 1],
    [row - 1, col - 2], [row - 1, col + 2],
    [row + 1, col - 2], [row + 1, col + 2],
    [row + 2, col - 1], [row + 2, col + 1]
  ];

  // Filter out moves that are outside the 9x9 board
  return moves.filter(([r, c]) => r >= 0 && r < 9 && c >= 0 && c < 9);
}

/**
 * Check if placing a number at a position violates the Anti-Knight constraint
 *
 * @param {Array<Array<number>>} board - 9x9 Sudoku board (0 for empty cells)
 * @param {number} row - Row index (0-8)
 * @param {number} col - Column index (0-8)
 * @param {number} num - Number to place (1-9)
 * @returns {boolean} True if placement is valid (doesn't conflict with knight's moves)
 */
function isValidAntiKnightPlacement(board, row, col, num) {
  const knightMoves = getKnightMoves(row, col);

  for (const [r, c] of knightMoves) {
    if (board[r][c] === num) {
      return false; // Conflict found - same number at knight's move distance
    }
  }

  return true; // No conflicts
}

/**
 * Validate the entire board for Anti-Knight constraint violations
 *
 * @param {Array<Array<number>>} board - 9x9 Sudoku board
 * @returns {boolean} True if the board is valid (no Anti-Knight violations)
 */
function validateAntiKnightBoard(board) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const num = board[row][col];

      // Skip empty cells
      if (num === 0) continue;

      // Check knight's moves from this cell
      const knightMoves = getKnightMoves(row, col);

      for (const [r, c] of knightMoves) {
        if (board[r][c] === num) {
          return false; // Violation found
        }
      }
    }
  }

  return true; // No violations
}

/**
 * Get all Anti-Knight constraint violations on the board
 *
 * @param {Array<Array<number>>} board - 9x9 Sudoku board
 * @returns {Array<Object>} Array of violations: [{row, col, num, conflictRow, conflictCol}]
 */
function getAntiKnightViolations(board) {
  const violations = [];

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const num = board[row][col];

      // Skip empty cells
      if (num === 0) continue;

      // Check knight's moves from this cell
      const knightMoves = getKnightMoves(row, col);

      for (const [r, c] of knightMoves) {
        if (board[r][c] === num) {
          // Only add violation once (from the cell with smaller coordinates)
          if (row < r || (row === r && col < c)) {
            violations.push({
              row,
              col,
              num,
              conflictRow: r,
              conflictCol: c
            });
          }
        }
      }
    }
  }

  return violations;
}

/**
 * Check if a completed board satisfies both Classic Sudoku and Anti-Knight constraints
 *
 * @param {Array<Array<number>>} board - 9x9 Sudoku board
 * @returns {Object} {valid: boolean, errors: Array<string>}
 */
function validateAntiKnightSolution(board) {
  const errors = [];

  // 1. Check if board is completely filled
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0 || board[row][col] < 1 || board[row][col] > 9) {
        errors.push(`Invalid value at (${row}, ${col}): ${board[row][col]}`);
      }
    }
  }

  // 2. Check classic Sudoku constraints (rows, columns, boxes)

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

  // 3. Check Anti-Knight constraints
  const violations = getAntiKnightViolations(board);
  for (const v of violations) {
    errors.push(
      `Anti-Knight violation: ${v.num} at (${v.row}, ${v.col}) and (${v.conflictRow}, ${v.conflictCol})`
    );
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Count how many cells have Anti-Knight conflicts
 *
 * @param {Array<Array<number>>} board - 9x9 Sudoku board
 * @returns {number} Number of cells with Anti-Knight conflicts
 */
function countAntiKnightConflicts(board) {
  let conflictCount = 0;

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const num = board[row][col];

      // Skip empty cells
      if (num === 0) continue;

      // Check if this cell has any knight's move conflicts
      if (!isValidAntiKnightPlacement(board, row, col, num)) {
        conflictCount++;
      }
    }
  }

  return conflictCount;
}

/**
 * Get all valid numbers that can be placed at a position (Classic + Anti-Knight)
 *
 * @param {Array<Array<number>>} board - 9x9 Sudoku board
 * @param {number} row - Row index (0-8)
 * @param {number} col - Column index (0-8)
 * @returns {Array<number>} Array of valid numbers (1-9)
 */
function getValidNumbers(board, row, col) {
  const valid = [];

  for (let num = 1; num <= 9; num++) {
    // Check classic Sudoku constraints
    let isValidClassic = true;

    // Check row
    for (let c = 0; c < 9; c++) {
      if (board[row][c] === num) {
        isValidClassic = false;
        break;
      }
    }

    if (!isValidClassic) continue;

    // Check column
    for (let r = 0; r < 9; r++) {
      if (board[r][col] === num) {
        isValidClassic = false;
        break;
      }
    }

    if (!isValidClassic) continue;

    // Check 3x3 box
    const boxStartRow = Math.floor(row / 3) * 3;
    const boxStartCol = Math.floor(col / 3) * 3;
    for (let r = boxStartRow; r < boxStartRow + 3; r++) {
      for (let c = boxStartCol; c < boxStartCol + 3; c++) {
        if (board[r][c] === num) {
          isValidClassic = false;
          break;
        }
      }
      if (!isValidClassic) break;
    }

    if (!isValidClassic) continue;

    // Check Anti-Knight constraint
    if (!isValidAntiKnightPlacement(board, row, col, num)) {
      continue;
    }

    // Passed all checks
    valid.push(num);
  }

  return valid;
}

module.exports = {
  getKnightMoves,
  isValidAntiKnightPlacement,
  validateAntiKnightBoard,
  getAntiKnightViolations,
  validateAntiKnightSolution,
  countAntiKnightConflicts,
  getValidNumbers
};
