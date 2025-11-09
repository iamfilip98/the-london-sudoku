/**
 * Hyper Sudoku Generator (also known as Windoku)
 * Phase 2 Month 11
 *
 * Hyper Sudoku Rules:
 * - Standard 9x9 Sudoku rules apply (rows, columns, 3x3 boxes)
 * - PLUS: Four additional 3x3 "hyper regions" must also contain digits 1-9
 * - The hyper regions are at: (1-3, 1-3), (1-3, 5-7), (5-7, 1-3), (5-7, 5-7)
 */

const {
  isValidHyperPlacement,
  validateHyperSudokuBoard,
  validateHyperSudokuSolution,
  getHyperRegions
} = require('./hyper-sudoku-validator');

/**
 * Generate a solved Hyper Sudoku grid using backtracking
 *
 * @param {number} seed - Seed for random number generation
 * @returns {Array<Array<number>>|null} 9x9 grid or null if generation failed
 */
function generateHyperSudokuSolution(seed) {
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

  // Backtracking solver with Hyper constraints
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
      // Check if number is valid for this position (includes Hyper check)
      if (isValidHyperPlacement(grid, row, col, num)) {
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
  const success = solve(0, 0);

  return success ? grid : null;
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
function countSolutions(puzzleGrid, maxSolutions = 2) {
  const grid = puzzleGrid.map(row => [...row]); // Deep copy
  let solutionCount = 0;

  function solve(row, col) {
    if (solutionCount >= maxSolutions) return; // Early exit if we found multiple solutions

    // Move to next row if we've reached the end of current row
    if (col === 9) {
      row++;
      col = 0;
    }

    // If we've filled all rows, we found a solution
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
      if (isValidHyperPlacement(grid, row, col, num)) {
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
 * Generate a Hyper Sudoku puzzle by removing numbers from solution
 *
 * @param {string} difficulty - 'easy', 'medium', or 'hard'
 * @param {number} seed - Seed for random generation
 * @returns {Object} {puzzle, solution, difficulty, variant, hyperRegions}
 */
function generateHyperSudoku(difficulty, seed) {
  // Target number of clues for different difficulties
  // Hyper Sudoku is harder than classic, so we give slightly more clues
  const targetClues = {
    easy: 36,    // More clues for easier puzzle
    medium: 30,  // Moderate clues
    hard: 26     // Fewer clues for harder puzzle
  };

  const clueCount = targetClues[difficulty] || targetClues.medium;

  // Generate a complete solution
  const solution = generateHyperSudokuSolution(seed);

  if (!solution) {
    throw new Error('Failed to generate Hyper Sudoku solution');
  }

  // Create puzzle by removing numbers
  const puzzle = solution.map(row => [...row]); // Deep copy

  // Seeded random for consistent puzzle generation
  let rng = seed;
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
    const solutions = countSolutions(puzzle, 2);

    if (solutions !== 1) {
      // Multiple solutions or no solution - restore the number
      puzzle[row][col] = value;
    } else {
      removedCount++;
    }
  }

  // Validate the final puzzle
  if (!validateHyperSudokuBoard(puzzle)) {
    throw new Error('Generated invalid Hyper Sudoku puzzle');
  }

  return {
    puzzle: gridToString(puzzle),
    solution: gridToString(solution),
    difficulty,
    variant: 'hyper-sudoku',
    hyperRegions: getHyperRegions() // Include hyper region definitions for frontend
  };
}

module.exports = {
  generateHyperSudokuSolution,
  generateHyperSudoku,
  gridToString,
  stringToGrid,
  countSolutions
};
