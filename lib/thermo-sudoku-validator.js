/**
 * Thermo Sudoku Validator
 *
 * Phase 2 Month 13: Thermo Sudoku Variant
 *
 * Thermo Sudoku Rules:
 * - Standard 9x9 Sudoku rules apply (rows, columns, 3x3 boxes)
 * - PLUS: Grid contains "thermometers" (lines of connected cells)
 * - Numbers along each thermometer MUST strictly increase from bulb to tip
 * - The bulb is the first cell (index 0) in the thermometer array
 * - Each subsequent cell must contain a strictly greater number than the previous
 *
 * Thermometer Format:
 * Array of thermometers, where each thermometer is an array of cells: [[row, col], [row, col], ...]
 * - First cell [0] is the bulb (starting point)
 * - Remaining cells must increase in value from bulb to tip
 * - Example: [{cells: [[4,4], [4,5], [4,6]]}] - horizontal thermometer from (4,4) to (4,6)
 *
 * Usage:
 *   const { isValidThermoPlacement, validateThermoBoard } = require('./lib/thermo-sudoku-validator');
 *   const isValid = isValidThermoPlacement(board, thermometers, row, col, num);
 */

/**
 * Find which thermometer(s) a cell belongs to
 *
 * @param {Array<Object>} thermometers - Array of thermometer objects
 * @param {number} row - Row index (0-8)
 * @param {number} col - Column index (0-8)
 * @returns {Array<Object>} Array of {thermo: Object, index: number} for thermometers containing this cell
 */
function findThermometersForCell(thermometers, row, col) {
  const results = [];

  for (const thermo of thermometers) {
    for (let i = 0; i < thermo.cells.length; i++) {
      const [r, c] = thermo.cells[i];
      if (r === row && c === col) {
        results.push({ thermo, index: i });
        break;
      }
    }
  }

  return results;
}

/**
 * Check if placing a number at a position violates Thermo constraints
 *
 * @param {Array<Array<number>>} board - 9x9 Sudoku board (0 for empty cells)
 * @param {Array<Object>} thermometers - Array of thermometer objects
 * @param {number} row - Row index (0-8)
 * @param {number} col - Column index (0-8)
 * @param {number} num - Number to place (1-9)
 * @returns {boolean} True if placement is valid (no thermo violations)
 */
function isValidThermoPlacement(board, thermometers, row, col, num) {
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

  // Check thermometer constraints
  const thermoMatches = findThermometersForCell(thermometers, row, col);

  for (const { thermo, index } of thermoMatches) {
    // Check previous cell (must be less than current)
    if (index > 0) {
      const [prevRow, prevCol] = thermo.cells[index - 1];
      const prevNum = board[prevRow][prevCol];

      if (prevNum !== 0 && prevNum >= num) {
        return false; // Previous cell must be strictly less
      }
    }

    // Check next cell (must be greater than current)
    if (index < thermo.cells.length - 1) {
      const [nextRow, nextCol] = thermo.cells[index + 1];
      const nextNum = board[nextRow][nextCol];

      if (nextNum !== 0 && nextNum <= num) {
        return false; // Next cell must be strictly greater
      }
    }
  }

  return true; // Placement is valid
}

/**
 * Validate the entire board for Thermo constraint violations
 *
 * @param {Array<Array<number>>} board - 9x9 Sudoku board
 * @param {Array<Object>} thermometers - Array of thermometer objects
 * @returns {boolean} True if the board is valid (no violations)
 */
function validateThermoBoard(board, thermometers) {
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

  // 2. Validate thermometer constraints
  for (const thermo of thermometers) {
    for (let i = 0; i < thermo.cells.length - 1; i++) {
      const [r1, c1] = thermo.cells[i];
      const [r2, c2] = thermo.cells[i + 1];

      const num1 = board[r1][c1];
      const num2 = board[r2][c2];

      // Skip if either cell is empty
      if (num1 === 0 || num2 === 0) continue;

      // Check strict increase
      if (num1 >= num2) {
        return false; // Violation: not strictly increasing
      }
    }
  }

  return true; // No violations
}

/**
 * Check if a completed board satisfies all Thermo constraints
 *
 * @param {Array<Array<number>>} board - 9x9 Sudoku board (must be complete)
 * @param {Array<Object>} thermometers - Array of thermometer objects
 * @returns {Object} {valid: boolean, errors: Array<string>}
 */
function validateThermoSolution(board, thermometers) {
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

  // 3. Check thermometer constraints
  for (let t = 0; t < thermometers.length; t++) {
    const thermo = thermometers[t];

    for (let i = 0; i < thermo.cells.length - 1; i++) {
      const [r1, c1] = thermo.cells[i];
      const [r2, c2] = thermo.cells[i + 1];

      const num1 = board[r1][c1];
      const num2 = board[r2][c2];

      if (num1 >= num2) {
        errors.push(
          `Thermo violation in thermometer ${t + 1}: ` +
          `Cell (${r1}, ${c1})=${num1} must be < (${r2}, ${c2})=${num2}`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get all valid numbers that can be placed at a position (Classic + Thermo)
 *
 * @param {Array<Array<number>>} board - 9x9 Sudoku board
 * @param {Array<Object>} thermometers - Array of thermometer objects
 * @param {number} row - Row index (0-8)
 * @param {number} col - Column index (0-8)
 * @returns {Array<number>} Array of valid numbers (1-9)
 */
function getValidThermoNumbers(board, thermometers, row, col) {
  const valid = [];

  for (let num = 1; num <= 9; num++) {
    if (isValidThermoPlacement(board, thermometers, row, col, num)) {
      valid.push(num);
    }
  }

  return valid;
}

/**
 * Validate thermometer structure
 *
 * @param {Array<Object>} thermometers - Array of thermometer objects
 * @returns {boolean} True if thermometer format is valid
 */
function validateThermometerStructure(thermometers) {
  if (!Array.isArray(thermometers)) return false;

  for (const thermo of thermometers) {
    // Check required fields
    if (!thermo.cells || !Array.isArray(thermo.cells)) return false;

    // Thermometer must have at least 2 cells
    if (thermo.cells.length < 2) return false;

    // Check each cell
    for (const cell of thermo.cells) {
      if (!Array.isArray(cell) || cell.length !== 2) return false;

      const [row, col] = cell;

      // Check bounds
      if (
        typeof row !== 'number' || typeof col !== 'number' ||
        row < 0 || row > 8 || col < 0 || col > 8
      ) {
        return false;
      }
    }

    // Check connectivity (each cell should be adjacent to the next)
    for (let i = 0; i < thermo.cells.length - 1; i++) {
      const [r1, c1] = thermo.cells[i];
      const [r2, c2] = thermo.cells[i + 1];

      const rowDiff = Math.abs(r1 - r2);
      const colDiff = Math.abs(c1 - c2);

      // Cells should be orthogonally adjacent
      if (!((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1))) {
        return false; // Not adjacent
      }
    }
  }

  return true;
}

/**
 * Count total number of cells in all thermometers
 *
 * @param {Array<Object>} thermometers - Array of thermometer objects
 * @returns {number} Total number of thermometer cells
 */
function countThermometerCells(thermometers) {
  let count = 0;
  for (const thermo of thermometers) {
    count += thermo.cells.length;
  }
  return count;
}

module.exports = {
  findThermometersForCell,
  isValidThermoPlacement,
  validateThermoBoard,
  validateThermoSolution,
  getValidThermoNumbers,
  validateThermometerStructure,
  countThermometerCells
};
