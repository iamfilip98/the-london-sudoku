/**
 * Thermo Sudoku Generator
 * Phase 2 Month 13
 *
 * Thermo Sudoku Rules:
 * - Standard 9x9 Sudoku rules apply (rows, columns, 3x3 boxes)
 * - PLUS: Grid contains "thermometers" (lines of connected cells)
 * - Numbers along each thermometer MUST strictly increase from bulb to tip
 *
 * Generation Strategy:
 * 1. Generate complete Sudoku solution
 * 2. Create thermometer paths on the grid
 * 3. Validate thermometers have strictly increasing values
 * 4. Create puzzle by removing numbers
 */

const {
  isValidThermoPlacement,
  validateThermoBoard,
  validateThermoSolution,
  validateThermometerStructure
} = require('./thermo-sudoku-validator');

/**
 * Generate a solved Sudoku grid using backtracking
 *
 * @param {number} seed - Seed for random number generation
 * @returns {Array<Array<number>>|null} 9x9 grid or null if generation failed
 */
function generateStandardSolution(seed) {
  // Seeded random number generator
  let rng = seed;
  function random() {
    rng = (rng * 9301 + 49297) % 233280;
    return rng / 233280.0;
  }

  // Fisher-Yates shuffle with seeded random
  function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Create empty 9x9 grid
  const grid = Array.from({ length: 9 }, () => Array(9).fill(0));

  // Standard Sudoku validator
  function isValidStandard(row, col, num) {
    // Check row
    for (let c = 0; c < 9; c++) {
      if (grid[row][c] === num) return false;
    }

    // Check column
    for (let r = 0; r < 9; r++) {
      if (grid[r][col] === num) return false;
    }

    // Check 3x3 box
    const boxStartRow = Math.floor(row / 3) * 3;
    const boxStartCol = Math.floor(col / 3) * 3;
    for (let r = boxStartRow; r < boxStartRow + 3; r++) {
      for (let c = boxStartCol; c < boxStartCol + 3; c++) {
        if (grid[r][c] === num) return false;
      }
    }

    return true;
  }

  // Backtracking solver
  function solve(row, col) {
    if (col === 9) {
      row++;
      col = 0;
    }

    if (row === 9) {
      return true;
    }

    const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);

    for (const num of numbers) {
      if (isValidStandard(row, col, num)) {
        grid[row][col] = num;

        if (solve(row, col + 1)) {
          return true;
        }

        grid[row][col] = 0;
      }
    }

    return false;
  }

  const success = solve(0, 0);
  return success ? grid : null;
}

/**
 * Get orthogonally adjacent cells
 *
 * @param {number} row - Row index
 * @param {number} col - Column index
 * @returns {Array<[number, number]>} Array of adjacent cells
 */
function getAdjacentCells(row, col) {
  const adjacent = [];

  if (row > 0) adjacent.push([row - 1, col]); // Up
  if (row < 8) adjacent.push([row + 1, col]); // Down
  if (col > 0) adjacent.push([row, col - 1]); // Left
  if (col < 8) adjacent.push([row, col + 1]); // Right

  return adjacent;
}

/**
 * Check if thermometer cells have strictly increasing values
 *
 * @param {Array<Array<number>>} solution - Completed grid
 * @param {Array<Array<number>>} cells - Thermometer cells [[row, col], ...]
 * @returns {boolean} True if values strictly increase
 */
function isStrictlyIncreasing(solution, cells) {
  for (let i = 0; i < cells.length - 1; i++) {
    const [r1, c1] = cells[i];
    const [r2, c2] = cells[i + 1];

    const val1 = solution[r1][c1];
    const val2 = solution[r2][c2];

    if (val1 >= val2) {
      return false; // Not strictly increasing
    }
  }
  return true;
}

/**
 * Generate thermometers on the grid
 *
 * @param {Array<Array<number>>} solution - Completed Sudoku grid
 * @param {string} difficulty - 'easy', 'medium', or 'hard'
 * @param {number} seed - Seed for random generation
 * @returns {Array<Object>} Array of thermometer objects
 */
function generateThermometers(solution, difficulty, seed) {
  // Number of thermometers and their lengths based on difficulty
  const thermoConfig = {
    easy: { count: 6, minLength: 3, maxLength: 5 },
    medium: { count: 8, minLength: 3, maxLength: 6 },
    hard: { count: 10, minLength: 4, maxLength: 7 }
  };

  const config = thermoConfig[difficulty] || thermoConfig.medium;

  // Seeded random
  let rng = seed;
  function random() {
    rng = (rng * 9301 + 49297) % 233280;
    return rng / 233280.0;
  }

  const thermometers = [];
  const usedCells = new Set();

  // Helper to check if cell is already used
  function isCellUsed(row, col) {
    return usedCells.has(`${row},${col}`);
  }

  // Helper to mark cell as used
  function markCellUsed(row, col) {
    usedCells.add(`${row},${col}`);
  }

  // Try to generate thermometers
  let attempts = 0;
  const maxAttempts = config.count * 20; // Allow multiple attempts

  while (thermometers.length < config.count && attempts < maxAttempts) {
    attempts++;

    // Pick random starting cell (bulb)
    const startRow = Math.floor(random() * 9);
    const startCol = Math.floor(random() * 9);

    // Skip if already used
    if (isCellUsed(startRow, startCol)) continue;

    // Target length for this thermometer
    const targetLength = config.minLength + Math.floor(random() * (config.maxLength - config.minLength + 1));

    // Build thermometer path using greedy approach
    const cells = [[startRow, startCol]];
    let currentRow = startRow;
    let currentCol = startCol;

    while (cells.length < targetLength) {
      // Get adjacent cells that are not used
      const adjacent = getAdjacentCells(currentRow, currentCol)
        .filter(([r, c]) => !isCellUsed(r, c));

      if (adjacent.length === 0) break; // Can't extend further

      // Prefer cells with higher values (to maintain increasing constraint)
      const currentValue = solution[currentRow][currentCol];

      const validAdjacent = adjacent.filter(([r, c]) => {
        const value = solution[r][c];
        return value > currentValue;
      });

      if (validAdjacent.length === 0) break; // No valid cells

      // Pick random valid adjacent cell
      const nextCell = validAdjacent[Math.floor(random() * validAdjacent.length)];
      cells.push(nextCell);

      [currentRow, currentCol] = nextCell;
    }

    // Only accept thermometer if it meets minimum length and is strictly increasing
    if (cells.length >= config.minLength && isStrictlyIncreasing(solution, cells)) {
      thermometers.push({ cells });

      // Mark cells as used
      for (const [r, c] of cells) {
        markCellUsed(r, c);
      }
    }
  }

  return thermometers;
}

/**
 * Convert grid to puzzle string (81 characters)
 */
function gridToString(grid) {
  let str = '';
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      str += grid[row][col].toString();
    }
  }
  return str;
}

/**
 * Convert string to grid
 */
function stringToGrid(str) {
  const grid = [];
  for (let i = 0; i < 9; i++) {
    grid[i] = [];
    for (let j = 0; j < 9; j++) {
      grid[i][j] = parseInt(str[i * 9 + j]);
    }
  }
  return grid;
}

/**
 * Count how many solutions a puzzle has (with limit for performance)
 */
function countSolutions(puzzleGrid, thermometers, maxSolutions = 2) {
  const grid = puzzleGrid.map(row => [...row]); // Deep copy
  let solutionCount = 0;

  function solve(row, col) {
    if (solutionCount >= maxSolutions) return; // Early exit

    if (col === 9) {
      row++;
      col = 0;
    }

    if (row === 9) {
      solutionCount++;
      return;
    }

    // If cell is already filled, move to next
    if (grid[row][col] !== 0) {
      solve(row, col + 1);
      return;
    }

    // Try numbers 1-9
    for (let num = 1; num <= 9; num++) {
      if (isValidThermoPlacement(grid, thermometers, row, col, num)) {
        grid[row][col] = num;
        solve(row, col + 1);
        grid[row][col] = 0; // Backtrack
      }
    }
  }

  solve(0, 0);
  return solutionCount;
}

/**
 * Generate a Thermo Sudoku puzzle by removing numbers from solution
 *
 * @param {string} difficulty - 'easy', 'medium', or 'hard'
 * @param {number} seed - Seed for random generation
 * @returns {Object} {puzzle, solution, difficulty, variant, thermometers}
 */
function generateThermoSudoku(difficulty, seed) {
  // Target number of clues for different difficulties
  // Thermo adds constraints, so we can use slightly fewer clues
  const targetClues = {
    easy: 36,    // More clues for easier puzzle
    medium: 28,  // Moderate clues
    hard: 24     // Fewer clues for harder puzzle
  };

  const clueCount = targetClues[difficulty] || targetClues.medium;

  // 1. Generate a complete standard Sudoku solution
  const solution = generateStandardSolution(seed);

  if (!solution) {
    throw new Error('Failed to generate Thermo Sudoku solution');
  }

  // 2. Generate thermometers on the grid
  const thermometers = generateThermometers(solution, difficulty, seed + 5000);

  // Validate thermometer structure
  if (!validateThermometerStructure(thermometers)) {
    throw new Error('Generated invalid thermometer structure');
  }

  // 3. Create puzzle by removing numbers
  const puzzle = solution.map(row => [...row]); // Deep copy

  // Seeded random for consistent puzzle generation
  let rng = seed + 10000;
  function random() {
    rng = (rng * 9301 + 49297) % 233280;
    return rng / 233280.0;
  }

  // Get all cell positions
  const positions = [];
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      positions.push({ row, col });
    }
  }

  // Shuffle positions
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  // Remove numbers while maintaining unique solution
  let removedCount = 0;
  const maxRemove = 81 - clueCount;

  for (const { row, col } of positions) {
    if (removedCount >= maxRemove) break;

    const value = puzzle[row][col];
    puzzle[row][col] = 0;

    // Check if puzzle still has unique solution
    const solutions = countSolutions(puzzle, thermometers, 2);

    if (solutions !== 1) {
      // Multiple solutions or no solution - restore the number
      puzzle[row][col] = value;
    } else {
      removedCount++;
    }
  }

  // Validate the final puzzle
  if (!validateThermoBoard(puzzle, thermometers)) {
    throw new Error('Generated invalid Thermo Sudoku puzzle');
  }

  // Validate the solution
  const validationResult = validateThermoSolution(solution, thermometers);
  if (!validationResult.valid) {
    throw new Error('Generated invalid Thermo Sudoku solution: ' + validationResult.errors.join(', '));
  }

  return {
    puzzle: gridToString(puzzle),
    solution: gridToString(solution),
    difficulty,
    variant: 'thermo-sudoku',
    thermometers // Include thermometer data for frontend rendering
  };
}

/**
 * Generate Thermo Sudoku with retry logic for robustness
 *
 * @param {string} difficulty - 'easy', 'medium', or 'hard'
 * @param {number} seed - Seed for random generation
 * @param {number} maxAttempts - Maximum generation attempts
 * @returns {Object} Generated puzzle data
 */
function generateThermoSudokuWithRetry(difficulty, seed, maxAttempts = 3) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const result = generateThermoSudoku(difficulty, seed + attempt * 1000000);
      return result;
    } catch (error) {
      if (attempt === maxAttempts - 1) {
        throw error; // Rethrow on final attempt
      }
      // Continue to next attempt
    }
  }

  throw new Error('Failed to generate Thermo Sudoku after multiple attempts');
}

module.exports = {
  generateStandardSolution,
  generateThermometers,
  generateThermoSudoku,
  generateThermoSudokuWithRetry,
  gridToString,
  stringToGrid,
  countSolutions
};
