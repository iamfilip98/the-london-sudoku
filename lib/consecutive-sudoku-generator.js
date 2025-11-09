/**
 * Consecutive Sudoku Generator
 * Phase 2 Month 12
 *
 * Consecutive Sudoku Rules:
 * - Standard 9x9 Sudoku rules apply (rows, columns, 3x3 boxes)
 * - PLUS: Orthogonally adjacent cells may be marked with consecutive indicators
 * - If marked: Cells MUST contain consecutive numbers (differ by 1)
 * - If NOT marked: Cells MUST NOT contain consecutive numbers
 *
 * Generation Strategy:
 * 1. Generate complete solution
 * 2. Identify ALL consecutive pairs in solution
 * 3. Select subset to mark (based on difficulty)
 * 4. Create puzzle by removing numbers
 */

const {
  isValidConsecutivePlacement,
  validateConsecutiveBoard,
  validateConsecutiveSolution,
  getAdjacentCells,
  areConsecutive
} = require('./consecutive-sudoku-validator');

/**
 * Generate a solved Sudoku grid using backtracking
 * (Standard Sudoku generation, no consecutive constraints yet)
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

  // Standard Sudoku validator (no consecutive constraints)
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
 * Find all consecutive pairs in a completed grid
 *
 * @param {Array<Array<number>>} grid - Completed 9x9 Sudoku grid
 * @returns {Array<Object>} Array of consecutive edges [{row1, col1, row2, col2}]
 */
function findAllConsecutivePairs(grid) {
  const consecutivePairs = [];

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const num = grid[row][col];
      const adjacentCells = getAdjacentCells(row, col);

      for (const [adjRow, adjCol] of adjacentCells) {
        // Only add each edge once (avoid duplicates)
        if (adjRow < row || (adjRow === row && adjCol < col)) continue;

        const adjNum = grid[adjRow][adjCol];

        if (areConsecutive(num, adjNum)) {
          consecutivePairs.push({
            row1: row,
            col1: col,
            row2: adjRow,
            col2: adjCol
          });
        }
      }
    }
  }

  return consecutivePairs;
}

/**
 * Select which consecutive pairs to mark (based on difficulty)
 *
 * @param {Array<Object>} allConsecutivePairs - All consecutive pairs in solution
 * @param {string} difficulty - 'easy', 'medium', or 'hard'
 * @param {number} seed - Seed for random selection
 * @returns {Array<Object>} Selected consecutive markers
 */
function selectConsecutiveMarkers(allConsecutivePairs, difficulty, seed) {
  // Percentage of consecutive pairs to mark
  const markingRatios = {
    easy: 0.65,    // Mark 65% of consecutive pairs (more information = easier)
    medium: 0.45,  // Mark 45% of consecutive pairs (balanced)
    hard: 0.30     // Mark 30% of consecutive pairs (less information = harder)
  };

  const ratio = markingRatios[difficulty] || markingRatios.medium;
  const targetCount = Math.floor(allConsecutivePairs.length * ratio);

  // Seeded random for consistent selection
  let rng = seed;
  function random() {
    rng = (rng * 9301 + 49297) % 233280;
    return rng / 233280.0;
  }

  // Shuffle pairs
  const shuffled = [...allConsecutivePairs];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Select first targetCount pairs
  return shuffled.slice(0, targetCount);
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
function countSolutions(puzzleGrid, consecutiveMarkers, maxSolutions = 2) {
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
      if (isValidConsecutivePlacement(grid, consecutiveMarkers, row, col, num)) {
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
 * Generate a Consecutive Sudoku puzzle by removing numbers from solution
 *
 * @param {string} difficulty - 'easy', 'medium', or 'hard'
 * @param {number} seed - Seed for random generation
 * @returns {Object} {puzzle, solution, difficulty, variant, consecutiveMarkers}
 */
function generateConsecutiveSudoku(difficulty, seed) {
  // Target number of clues for different difficulties
  // Consecutive adds constraints, so we can use slightly fewer clues than classic
  const targetClues = {
    easy: 38,    // More clues for easier puzzle
    medium: 28,  // Moderate clues
    hard: 25     // Fewer clues for harder puzzle
  };

  const clueCount = targetClues[difficulty] || targetClues.medium;

  // 1. Generate a complete standard Sudoku solution
  const solution = generateStandardSolution(seed);

  if (!solution) {
    throw new Error('Failed to generate Consecutive Sudoku solution');
  }

  // 2. Find all consecutive pairs in the solution
  const allConsecutivePairs = findAllConsecutivePairs(solution);

  // 3. Select which pairs to mark (based on difficulty)
  const consecutiveMarkers = selectConsecutiveMarkers(allConsecutivePairs, difficulty, seed + 5000);

  // 4. Create puzzle by removing numbers
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
    const solutions = countSolutions(puzzle, consecutiveMarkers, 2);

    if (solutions !== 1) {
      // Multiple solutions or no solution - restore the number
      puzzle[row][col] = value;
    } else {
      removedCount++;
    }
  }

  // Validate the final puzzle
  if (!validateConsecutiveBoard(puzzle, consecutiveMarkers)) {
    throw new Error('Generated invalid Consecutive Sudoku puzzle');
  }

  // Validate the solution
  const validationResult = validateConsecutiveSolution(solution, consecutiveMarkers);
  if (!validationResult.valid) {
    throw new Error('Generated invalid Consecutive Sudoku solution: ' + validationResult.errors.join(', '));
  }

  return {
    puzzle: gridToString(puzzle),
    solution: gridToString(solution),
    difficulty,
    variant: 'consecutive-sudoku',
    consecutiveMarkers // Include markers for frontend rendering
  };
}

/**
 * Generate Consecutive Sudoku with retry logic for robustness
 *
 * @param {string} difficulty - 'easy', 'medium', or 'hard'
 * @param {number} seed - Seed for random generation
 * @param {number} maxAttempts - Maximum generation attempts
 * @returns {Object} Generated puzzle data
 */
function generateConsecutiveSudokuWithRetry(difficulty, seed, maxAttempts = 3) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const result = generateConsecutiveSudoku(difficulty, seed + attempt * 1000000);
      return result;
    } catch (error) {
      if (attempt === maxAttempts - 1) {
        throw error; // Rethrow on final attempt
      }
      // Continue to next attempt
    }
  }

  throw new Error('Failed to generate Consecutive Sudoku after multiple attempts');
}

module.exports = {
  generateStandardSolution,
  findAllConsecutivePairs,
  selectConsecutiveMarkers,
  generateConsecutiveSudoku,
  generateConsecutiveSudokuWithRetry,
  gridToString,
  stringToGrid,
  countSolutions
};
