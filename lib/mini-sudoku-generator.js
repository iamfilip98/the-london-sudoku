/**
 * Mini Sudoku 6x6 Generator and Validator
 * Phase 1 Month 5
 *
 * Mini Sudoku Rules:
 * - 6x6 grid (36 cells instead of 81)
 * - Digits 1-6 (instead of 1-9)
 * - 6 rows, each must contain 1-6
 * - 6 columns, each must contain 1-6
 * - 6 boxes (2 rows × 3 columns), each must contain 1-6
 *
 * Box layout:
 * ┌─────┬─────┬─────┐
 * │  0  │  1  │  2  │
 * ├─────┼─────┼─────┤
 * │  3  │  4  │  5  │
 * └─────┴─────┴─────┘
 *
 * Each box is 2 rows × 3 columns
 */

/**
 * Check if a 6-element array contains all digits 1-6
 */
function isValidSet(arr) {
  if (arr.length !== 6) return false;
  const sorted = [...arr].sort((a, b) => a - b);
  for (let i = 0; i < 6; i++) {
    if (sorted[i] !== i + 1) return false;
  }
  return true;
}

/**
 * Validate Mini Sudoku 6x6 solution (string of 36 digits)
 */
function validateMiniSudokuSolution(solution) {
  if (typeof solution !== 'string' || solution.length !== 36) {
    return false;
  }

  // Convert string to 6x6 grid
  const grid = [];
  for (let i = 0; i < 6; i++) {
    grid[i] = [];
    for (let j = 0; j < 6; j++) {
      const val = parseInt(solution[i * 6 + j]);
      if (isNaN(val) || val < 1 || val > 6) return false;
      grid[i][j] = val;
    }
  }

  // Validate rows
  for (let row = 0; row < 6; row++) {
    if (!isValidSet(grid[row])) return false;
  }

  // Validate columns
  for (let col = 0; col < 6; col++) {
    const colValues = [];
    for (let row = 0; row < 6; row++) {
      colValues.push(grid[row][col]);
    }
    if (!isValidSet(colValues)) return false;
  }

  // Validate 2x3 boxes
  // Box positions: (boxRow, boxCol) where each box is 2 rows × 3 columns
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 2; boxCol++) {
      const boxValues = [];
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 3; c++) {
          const row = boxRow * 2 + r;
          const col = boxCol * 3 + c;
          boxValues.push(grid[row][col]);
        }
      }
      if (!isValidSet(boxValues)) return false;
    }
  }

  return true;
}

/**
 * Generate a solved Mini Sudoku 6x6 grid
 */
function generateMiniSudokuSolution(seed) {
  // Seeded random number generator
  let rng = seed;
  function random() {
    rng = (rng * 9301 + 49297) % 233280;
    return rng / 233280.0;
  }

  const maxAttempts = 100;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const grid = Array(6).fill(null).map(() => Array(6).fill(0));

    if (fillGrid(grid, random)) {
      // Convert to string
      const solution = grid.flat().join('');
      if (validateMiniSudokuSolution(solution)) {
        return solution;
      }
    }
  }

  // Error occurred
  return null;
}

/**
 * Fill grid using backtracking
 */
function fillGrid(grid, random) {
  // Find next empty cell
  let row = -1, col = -1;
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 6; j++) {
      if (grid[i][j] === 0) {
        row = i;
        col = j;
        break;
      }
    }
    if (row !== -1) break;
  }

  // If no empty cell, we're done
  if (row === -1) return true;

  // Try digits 1-6 in random order
  const digits = [1, 2, 3, 4, 5, 6];
  shuffleArray(digits, random);

  for (const num of digits) {
    if (isValidPlacementMini(grid, row, col, num)) {
      grid[row][col] = num;
      if (fillGrid(grid, random)) {
        return true;
      }
      grid[row][col] = 0;
    }
  }

  return false;
}

/**
 * Check if placing num at (row, col) is valid for Mini Sudoku
 */
function isValidPlacementMini(grid, row, col, num) {
  // Check row
  for (let c = 0; c < 6; c++) {
    if (grid[row][c] === num) return false;
  }

  // Check column
  for (let r = 0; r < 6; r++) {
    if (grid[r][col] === num) return false;
  }

  // Check 2x3 box
  // Box structure: 2 rows × 3 columns
  const boxRow = Math.floor(row / 2) * 2;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 2; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (grid[r][c] === num) return false;
    }
  }

  return true;
}

/**
 * Shuffle array in place using seeded random
 */
function shuffleArray(arr, random) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/**
 * Generate Mini Sudoku puzzle by removing clues from solution
 * Target clue counts (proportional to 9x9):
 * - Easy: 18-20 clues (44% of 9x9 easy which has 42)
 * - Medium: 12-14 clues (44% of 9x9 medium which has 28)
 * - Hard: 10-12 clues (44% of 9x9 hard which has 25)
 */
function generateMiniSudokuPuzzle(solution, difficulty, seed) {
  const targetClues = {
    easy: 19,
    medium: 13,
    hard: 11
  };

  const target = targetClues[difficulty];
  const puzzle = solution.split('');

  // Create list of cell positions
  const positions = [];
  for (let i = 0; i < 36; i++) {
    positions.push(i);
  }

  // Seeded random for position selection
  let rng = seed * 17;
  function random() {
    rng = (rng * 9301 + 49297) % 233280;
    return rng / 233280.0;
  }

  shuffleArray(positions, random);

  // Remove clues one by one
  let clues = 36;
  for (const pos of positions) {
    if (clues <= target) break;

    puzzle[pos] = '0';
    clues--;
  }

  return puzzle.join('');
}

/**
 * Main entry point: Generate complete Mini Sudoku 6x6 puzzle
 */
function generateMiniSudoku(difficulty, seed) {
  const solution = generateMiniSudokuSolution(seed);
  if (!solution) {
    throw new Error('Failed to generate Mini Sudoku solution');
  }

  const puzzle = generateMiniSudokuPuzzle(solution, difficulty, seed + 1);

  return {
    variant: 'mini',
    difficulty,
    puzzle,
    solution,
    seed,
    gridSize: 6
  };
}

module.exports = {
  generateMiniSudoku,
  validateMiniSudokuSolution,
  isValidPlacementMini
};
