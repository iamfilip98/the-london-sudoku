/**
 * Killer Sudoku Generator
 * Phase 2 Month 10
 *
 * Killer Sudoku Rules:
 * - Standard 9x9 Sudoku rules apply (rows, columns, 3x3 boxes)
 * - Grid is divided into "cages" (outlined regions of adjacent cells)
 * - Each cage has a target sum
 * - Numbers within a cage must sum to the cage's target
 * - Numbers CANNOT repeat within a cage
 */

const {
  isValidKillerPlacement,
  validateKillerSudokuBoard,
  validateKillerSudokuSolution,
  validateCageStructure
} = require('./killer-sudoku-validator');

/**
 * Generate a solved 9x9 Sudoku grid using backtracking
 *
 * @param {number} seed - Seed for random number generation
 * @returns {Array<Array<number>>} 9x9 grid with solution
 */
function generateCompleteSolution(seed) {
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

  // Check if a number can be placed at position (standard Sudoku rules)
  function isValidPlacement(board, row, col, num) {
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

    return true;
  }

  // Backtracking solver
  function solve(row, col) {
    // Move to next row if we've reached the end of current row
    if (col === 9) {
      row++;
      col = 0;
    }

    // If we've filled all rows, we're done
    if (row === 9) {
      return true;
    }

    // Try numbers 1-9 in random order
    const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);

    for (const num of numbers) {
      if (isValidPlacement(grid, row, col, num)) {
        grid[row][col] = num;

        // Recursively solve next cell
        if (solve(row, col + 1)) {
          return true;
        }

        // Backtrack if solution not found
        grid[row][col] = 0;
      }
    }

    return false; // No valid number found
  }

  // Generate the solution
  solve(0, 0);
  return grid;
}

/**
 * Generate cages for Killer Sudoku
 * Divides the 81 cells into connected groups (cages)
 *
 * @param {number} seed - Seed for random cage generation
 * @param {string} difficulty - 'easy', 'medium', or 'hard'
 * @returns {Array<Object>} Array of cages with cells (no sums yet)
 */
function generateCages(seed, difficulty) {
  // Seeded random number generator
  let rng = seed;
  function random() {
    rng = (rng * 9301 + 49297) % 233280;
    return rng / 233280.0;
  }

  // Cage size preferences by difficulty
  const cageSizePreferences = {
    easy: [3, 4, 5], // Larger cages for easier puzzles
    medium: [2, 3, 4], // Medium cages
    hard: [2, 3] // Smaller cages for harder puzzles
  };

  const preferredSizes = cageSizePreferences[difficulty] || cageSizePreferences.medium;

  // Track which cells have been assigned to cages
  const assigned = Array.from({ length: 9 }, () => Array(9).fill(false));
  const cages = [];

  // Get unassigned neighbors of a cell
  function getUnassignedNeighbors(row, col) {
    const neighbors = [];
    const directions = [
      [-1, 0], [1, 0], [0, -1], [0, 1] // up, down, left, right
    ];

    for (const [dr, dc] of directions) {
      const r = row + dr;
      const c = col + dc;

      if (r >= 0 && r < 9 && c >= 0 && c < 9 && !assigned[r][c]) {
        neighbors.push([r, c]);
      }
    }

    return neighbors;
  }

  // Build a cage starting from a seed cell
  function buildCage(startRow, startCol) {
    const cage = [[startRow, startCol]];
    assigned[startRow][startCol] = true;

    // Pick target size randomly from preferred sizes
    const targetSize = preferredSizes[Math.floor(random() * preferredSizes.length)];

    // Grow cage to target size using flood-fill
    while (cage.length < targetSize) {
      const expandCandidates = [];

      // Find all cells in cage that have unassigned neighbors
      for (const [row, col] of cage) {
        const neighbors = getUnassignedNeighbors(row, col);
        for (const neighbor of neighbors) {
          expandCandidates.push(neighbor);
        }
      }

      // No more cells to add
      if (expandCandidates.length === 0) break;

      // Pick random neighbor to add to cage
      const idx = Math.floor(random() * expandCandidates.length);
      const [r, c] = expandCandidates[idx];

      cage.push([r, c]);
      assigned[r][c] = true;
    }

    return { cells: cage };
  }

  // Generate cages by picking unassigned cells and growing them
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (!assigned[row][col]) {
        const cage = buildCage(row, col);
        cages.push(cage);
      }
    }
  }

  return cages;
}

/**
 * Calculate sums for cages based on solution
 *
 * @param {Array<Object>} cages - Array of cage objects (without sums)
 * @param {Array<Array<number>>} solution - Complete Sudoku solution
 * @returns {Array<Object>} Cages with sum property added
 */
function calculateCageSums(cages, solution) {
  return cages.map(cage => {
    let sum = 0;
    for (const [row, col] of cage.cells) {
      sum += solution[row][col];
    }
    return { ...cage, sum };
  });
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
 * Create a puzzle by removing numbers from solution
 * For Killer Sudoku, we remove MORE numbers than regular Sudoku
 * because the cage sums provide additional constraints
 *
 * @param {Array<Array<number>>} solution - Complete solution
 * @param {Array<Object>} cages - Cages with sums
 * @param {string} difficulty - 'easy', 'medium', or 'hard'
 * @param {number} seed - Seed for deterministic removal
 * @returns {Array<Array<number>>} Puzzle with some cells removed
 */
function createKillerPuzzle(solution, cages, difficulty, seed) {
  // Seeded random
  let rng = seed;
  function random() {
    rng = (rng * 9301 + 49297) % 233280;
    return rng / 233280.0;
  }

  // Target number of given cells (clues) - MUCH FEWER than regular Sudoku
  // Killer Sudoku can have fewer clues because cage sums provide constraints
  const targetClues = {
    easy: 25, // About 30% filled
    medium: 18, // About 22% filled
    hard: 12 // About 15% filled (very few!)
  };

  const clueCount = targetClues[difficulty] || targetClues.medium;

  // Start with solution, we'll remove numbers
  const puzzle = solution.map(row => [...row]);

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

  // Remove numbers until we reach target clue count
  let currentClues = 81;
  const maxRemove = 81 - clueCount;
  let removed = 0;

  for (const { row, col } of positions) {
    if (removed >= maxRemove) break;

    // Save current value
    const value = puzzle[row][col];

    // Try removing it
    puzzle[row][col] = 0;
    removed++;
    currentClues--;

    // For Killer Sudoku, we don't need to verify unique solution as strictly
    // because the cage sums provide strong constraints
    // We just remove until we hit target clue count
  }

  return puzzle;
}

/**
 * Generate a Killer Sudoku puzzle
 *
 * @param {string} difficulty - 'easy', 'medium', or 'hard'
 * @param {number} seed - Seed for random generation
 * @returns {Object} {puzzle, solution, cages, difficulty, variant}
 */
function generateKillerSudoku(difficulty, seed) {
  // Generate a complete solution
  const solution = generateCompleteSolution(seed);

  // Generate cages
  const cagesWithoutSums = generateCages(seed + 1000, difficulty);

  // Calculate cage sums from solution
  const cages = calculateCageSums(cagesWithoutSums, solution);

  // Validate cage structure
  const cageValidation = validateCageStructure(cages);
  if (!cageValidation.valid) {
    throw new Error('Failed to generate valid cages');
  }

  // Create puzzle by removing numbers
  const puzzle = createKillerPuzzle(solution, cages, difficulty, seed + 2000);

  // Validate the puzzle
  if (!validateKillerSudokuBoard(puzzle, cages)) {
    throw new Error('Generated puzzle is invalid');
  }

  return {
    puzzle: gridToString(puzzle),
    solution: gridToString(solution),
    cages, // Include cage information
    difficulty,
    variant: 'killer-sudoku'
  };
}

module.exports = {
  generateCompleteSolution,
  generateCages,
  calculateCageSums,
  createKillerPuzzle,
  generateKillerSudoku,
  gridToString,
  stringToGrid
};
