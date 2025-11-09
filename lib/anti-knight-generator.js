/**
 * Anti-Knight Sudoku Generator and Validator
 * Phase 2 Month 9
 *
 * Anti-Knight Rules:
 * - Standard 9x9 Sudoku rules apply (rows, columns, 3x3 boxes)
 * - PLUS: Cells that are a knight's move apart cannot contain the same digit
 * - Knight's move: 2 squares in one direction, 1 square perpendicular (chess knight)
 */

const {
  isValidAntiKnightPlacement,
  validateAntiKnightBoard,
  validateAntiKnightSolution,
  getValidNumbers
} = require('./anti-knight-validator');

/**
 * Check if a 9-element array contains all digits 1-9
 */
function isValidSet(arr) {
  if (arr.length !== 9) return false;
  const sorted = [...arr].sort();
  for (let i = 0; i < 9; i++) {
    if (sorted[i] !== i + 1) return false;
  }
  return true;
}

/**
 * Validate Anti-Knight Sudoku solution (string of 81 digits)
 */
function validateAntiKnightSolutionString(solution) {
  if (typeof solution !== 'string' || solution.length !== 81) {
    return false;
  }

  // Convert string to 9x9 grid
  const grid = [];
  for (let i = 0; i < 9; i++) {
    grid[i] = [];
    for (let j = 0; j < 9; j++) {
      const val = parseInt(solution[i * 9 + j]);
      if (isNaN(val) || val < 1 || val > 9) return false;
      grid[i][j] = val;
    }
  }

  // Validate rows
  for (let row = 0; row < 9; row++) {
    if (!isValidSet(grid[row])) return false;
  }

  // Validate columns
  for (let col = 0; col < 9; col++) {
    const colValues = [];
    for (let row = 0; row < 9; row++) {
      colValues.push(grid[row][col]);
    }
    if (!isValidSet(colValues)) return false;
  }

  // Validate 3x3 boxes
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const boxValues = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          boxValues.push(grid[boxRow * 3 + r][boxCol * 3 + c]);
        }
      }
      if (!isValidSet(boxValues)) return false;
    }
  }

  // Validate Anti-Knight constraints
  if (!validateAntiKnightBoard(grid)) {
    return false;
  }

  return true;
}

/**
 * Generate a solved Anti-Knight Sudoku grid using backtracking
 *
 * @param {number} seed - Seed for random number generation
 * @returns {Array<Array<number>>|null} 9x9 grid or null if generation failed
 */
function generateAntiKnightSolution(seed) {
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

  // Backtracking solver with Anti-Knight constraints
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
      // Check if number is valid for this position
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

  // Check if a number can be placed at position (includes Anti-Knight check)
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

    // Check Anti-Knight constraint
    if (!isValidAntiKnightPlacement(board, row, col, num)) {
      return false;
    }

    return true;
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
      if (isValidPlacement(grid, row, col, num)) {
        grid[row][col] = num;
        solve(row, col + 1);
        grid[row][col] = 0; // Backtrack
      }
    }
  }

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

    // Check Anti-Knight constraint
    if (!isValidAntiKnightPlacement(board, row, col, num)) {
      return false;
    }

    return true;
  }

  solve(0, 0);
  return solutionCount;
}

/**
 * Generate an Anti-Knight Sudoku puzzle by removing numbers from a solution
 *
 * @param {string} difficulty - 'easy', 'medium', or 'hard'
 * @param {number} seed - Seed for random generation
 * @returns {Object} {puzzle, solution, difficulty}
 */
function generateAntiKnight(difficulty, seed) {
  // Target number of clues for different difficulties
  const targetClues = {
    easy: 40,    // More clues for easier puzzle
    medium: 32,  // Moderate clues
    hard: 28     // Fewer clues for harder puzzle
  };

  const clueCount = targetClues[difficulty] || targetClues.medium;

  // Generate a complete solution
  const solution = generateAntiKnightSolution(seed);

  if (!solution) {
    throw new Error('Failed to generate Anti-Knight solution');
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

  return {
    puzzle: gridToString(puzzle),
    solution: gridToString(solution),
    difficulty,
    variant: 'anti-knight'
  };
}

module.exports = {
  validateAntiKnightSolutionString,
  generateAntiKnightSolution,
  generateAntiKnight,
  gridToString,
  stringToGrid
};
