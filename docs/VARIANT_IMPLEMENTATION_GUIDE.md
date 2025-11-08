# 🧩 SUDOKU VARIANT IMPLEMENTATION GUIDE

**Purpose**: Complete algorithms and specs for each puzzle variant
**Version**: 1.0
**Last Updated**: November 2025

---

## 📋 VARIANT ROADMAP

| Variant | Complexity | Dev Time | Phase | Priority |
|---------|------------|----------|-------|----------|
| Classic 9x9 | ✅ Complete | - | Existing | - |
| X-Sudoku | Easy | 2 weeks | Phase 1 | High |
| Mini 6x6 | Easy | 2 weeks | Phase 1 | High |
| Anti-Knight | Medium | 3 weeks | Phase 2 | Medium |
| **Killer Sudoku** | Hard | 8-10 weeks | Phase 3 | **MUST-HAVE** |
| Jigsaw Sudoku | Medium-High | 6-8 weeks | Phase 4 | High |

---

## 1️⃣ X-SUDOKU (Diagonal Sudoku)

### Rules
- Standard 9x9 Sudoku rules apply
- **PLUS**: Both main diagonals must contain 1-9 (no duplicates)

### Generation Algorithm

```javascript
function generateXSudoku(difficulty) {
  // Start with standard solver
  const grid = createEmptyGrid();

  // Fill diagonals first (helps with constraint satisfaction)
  fillMainDiagonal(grid);      // Top-left to bottom-right
  fillAntiDiagonal(grid);      // Top-right to bottom-left

  // Fill remaining cells using backtracking
  if (!fillRemaining(grid, 0, 0)) {
    return generateXSudoku(difficulty); // Retry if failed
  }

  // Remove cells to create puzzle
  const puzzle = removeCells(grid, difficulty);

  // Validate unique solution
  if (countSolutions(puzzle) !== 1) {
    return generateXSudoku(difficulty); // Retry
  }

  return { puzzle, solution: grid };
}

function fillMainDiagonal(grid) {
  const used = new Set();
  for (let i = 0; i < 9; i++) {
    let num;
    do {
      num = Math.floor(Math.random() * 9) + 1;
    } while (used.has(num));

    grid[i][i] = num;
    used.add(num);
  }
}

function fillAntiDiagonal(grid) {
  const used = new Set();
  for (let i = 0; i < 9; i++) {
    let num;
    do {
      num = Math.floor(Math.random() * 9) + 1;
    } while (used.has(num) || grid[i][8 - i] !== 0);

    grid[i][8 - i] = num;
    used.add(num);
  }
}
```

### Validation

```javascript
function isValidXSudoku(grid, row, col, num) {
  // Standard checks
  if (!isValidRow(grid, row, num)) return false;
  if (!isValidCol(grid, col, num)) return false;
  if (!isValidBox(grid, row, col, num)) return false;

  // Diagonal checks
  if (row === col) {
    if (isInDiagonal(grid, 'main', num)) return false;
  }
  if (row + col === 8) {
    if (isInDiagonal(grid, 'anti', num)) return false;
  }

  return true;
}

function isInDiagonal(grid, type, num) {
  for (let i = 0; i < 9; i++) {
    const cell = type === 'main' ? grid[i][i] : grid[i][8 - i];
    if (cell === num) return true;
  }
  return false;
}
```

### UI Enhancements

```css
/* Highlight diagonals */
.cell.diagonal-main {
  background-color: rgba(100, 150, 255, 0.1);
}
.cell.diagonal-anti {
  background-color: rgba(100, 255, 150, 0.1);
}
```

---

## 2️⃣ MINI SUDOKU (6x6)

### Rules
- 6x6 grid instead of 9x9
- Rows, columns, and 2×3 boxes contain 1-6
- Same logic as classic, just smaller

### Generation Algorithm

```javascript
function generateMini6x6(difficulty) {
  const SIZE = 6;
  const BOX_ROWS = 2;
  const BOX_COLS = 3;

  const grid = createEmptyGrid(SIZE);

  // Fill grid using backtracking
  if (!fillGrid(grid, 0, 0, SIZE)) {
    return generateMini6x6(difficulty);
  }

  // Remove cells based on difficulty
  const cluesTarget = {
    easy: 20,    // ~67% filled
    medium: 16,  // ~44% filled
    hard: 12     // ~33% filled
  }[difficulty];

  const puzzle = removeCells(grid, SIZE * SIZE - cluesTarget, SIZE);

  return { puzzle, solution: grid };
}

function fillGrid(grid, row, col, size) {
  if (row === size) return true;
  if (col === size) return fillGrid(grid, row + 1, 0, size);
  if (grid[row][col] !== 0) return fillGrid(grid, row, col + 1, size);

  const numbers = shuffle([1, 2, 3, 4, 5, 6]);

  for (const num of numbers) {
    if (isValidMini(grid, row, col, num, size)) {
      grid[row][col] = num;
      if (fillGrid(grid, row, col + 1, size)) return true;
      grid[row][col] = 0;
    }
  }

  return false;
}

function isValidMini(grid, row, col, num, size) {
  // Check row
  for (let c = 0; c < size; c++) {
    if (grid[row][c] === num) return false;
  }

  // Check column
  for (let r = 0; r < size; r++) {
    if (grid[r][col] === num) return false;
  }

  // Check 2×3 box
  const boxRow = Math.floor(row / 2) * 2;
  const boxCol = Math.floor(col / 3) * 3;

  for (let r = boxRow; r < boxRow + 2; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (grid[r][c] === num) return false;
    }
  }

  return true;
}
```

### UI Adjustments

```css
/* Smaller grid */
.sudoku-grid.mini-6x6 {
  grid-template-columns: repeat(6, 1fr);
  grid-template-rows: repeat(6, 1fr);
}

.sudoku-grid.mini-6x6 .cell {
  width: 50px;
  height: 50px;
  font-size: 24px;
}
```

---

## 3️⃣ ANTI-KNIGHT SUDOKU

### Rules
- Standard 9x9 Sudoku rules
- **PLUS**: Cells that are a chess knight's move apart cannot contain the same digit

### Knight Moves
```
From (r, c), knight can reach:
- (r-2, c-1), (r-2, c+1)
- (r-1, c-2), (r-1, c+2)
- (r+1, c-2), (r+1, c+2)
- (r+2, c-1), (r+2, c+1)
```

### Validation

```javascript
function isValidAntiKnight(grid, row, col, num) {
  // Standard checks
  if (!isValidRow(grid, row, num)) return false;
  if (!isValidCol(grid, col, num)) return false;
  if (!isValidBox(grid, row, col, num)) return false;

  // Knight move checks
  const knightMoves = [
    [-2, -1], [-2, 1],
    [-1, -2], [-1, 2],
    [1, -2], [1, 2],
    [2, -1], [2, 1]
  ];

  for (const [dr, dc] of knightMoves) {
    const newRow = row + dr;
    const newCol = col + dc;

    if (newRow >= 0 && newRow < 9 && newCol >= 0 && newCol < 9) {
      if (grid[newRow][newCol] === num) return false;
    }
  }

  return true;
}
```

### UI Enhancement (Optional)

```javascript
// Highlight cells that would conflict if knight move enabled
function showKnightConflicts(row, col) {
  const conflicts = getKnightCells(row, col);
  conflicts.forEach(([r, c]) => {
    cells[r][c].classList.add('knight-conflict');
  });
}
```

---

## 4️⃣ KILLER SUDOKU (⭐ PRIORITY VARIANT)

### Rules
- Standard 9x9 Sudoku (rows, cols, boxes)
- Grid divided into "cages" (outlined groups)
- Each cage has a sum (displayed in top-left corner)
- Digits within a cage must add up to the sum
- Digits cannot repeat within a cage

### Data Structure

```javascript
const killerPuzzle = {
  grid: [[0,0,0,...], ...],  // Standard grid
  cages: [
    { cells: [[0,0], [0,1], [1,0]], sum: 15 },
    { cells: [[0,2], [0,3]], sum: 7 },
    ...
  ]
};
```

### Generation Algorithm (Complex!)

```javascript
function generateKillerSudoku(difficulty) {
  // 1. Generate valid solved grid
  const solution = generateSolvedGrid();

  // 2. Create cages
  const cages = generateCages(solution, difficulty);

  // 3. Clear grid (all zeros, only cages with sums remain)
  const puzzle = { grid: createEmptyGrid(), cages };

  // 4. Validate unique solution
  if (countKillerSolutions(puzzle) !== 1) {
    return generateKillerSudoku(difficulty);
  }

  return { puzzle, solution };
}

function generateCages(solution, difficulty) {
  const cages = [];
  const visited = Array(9).fill(0).map(() => Array(9).fill(false));

  // Target cage sizes based on difficulty
  const avgCageSize = {
    easy: 2.5,    // Smaller cages, more unique combinations
    medium: 3.0,
    hard: 3.5     // Larger cages, fewer unique combinations
  }[difficulty];

  // Greedy cage generation
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (!visited[r][c]) {
        const cage = createCage(solution, r, c, visited, avgCageSize);
        cages.push(cage);
      }
    }
  }

  return cages;
}

function createCage(solution, startR, startC, visited, avgSize) {
  const cells = [[startR, startC]];
  visited[startR][startC] = true;

  const targetSize = Math.round(avgSize + (Math.random() - 0.5));
  const maxSize = Math.min(5, targetSize); // Max 5 cells per cage

  // Flood-fill adjacent cells
  while (cells.length < maxSize) {
    const candidates = getAdjacentUnvisited(cells, visited);
    if (candidates.length === 0) break;

    const [r, c] = candidates[Math.floor(Math.random() * candidates.length)];
    cells.push([r, c]);
    visited[r][c] = true;
  }

  // Calculate sum
  const sum = cells.reduce((total, [r, c]) => total + solution[r][c], 0);

  return { cells, sum };
}

function getAdjacentUnvisited(cells, visited) {
  const adj = [];
  const dirs = [[0,1], [1,0], [0,-1], [-1,0]];

  for (const [r, c] of cells) {
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < 9 && nc >= 0 && nc < 9 && !visited[nr][nc]) {
        adj.push([nr, nc]);
      }
    }
  }

  return [...new Set(adj.map(([r,c]) => `${r},${c}`))].map(s => s.split(',').map(Number));
}
```

### Validation

```javascript
function isValidKiller(puzzle, row, col, num) {
  // Standard checks
  if (!isValidRow(puzzle.grid, row, num)) return false;
  if (!isValidCol(puzzle.grid, col, num)) return false;
  if (!isValidBox(puzzle.grid, row, col, num)) return false;

  // Cage checks
  const cage = findCage(puzzle.cages, row, col);
  if (!cage) return true; // Should never happen

  // Check no duplicate in cage
  for (const [r, c] of cage.cells) {
    if (r === row && c === col) continue;
    if (puzzle.grid[r][c] === num) return false;
  }

  // Check sum constraint (only if cage fully filled)
  const filledCells = cage.cells.filter(([r,c]) => puzzle.grid[r][c] !== 0).length + 1;
  if (filledCells === cage.cells.length) {
    const currentSum = cage.cells.reduce((sum, [r,c]) => {
      return sum + (r === row && c === col ? num : puzzle.grid[r][c]);
    }, 0);

    if (currentSum !== cage.sum) return false;
  }

  return true;
}
```

### Cage Combination Reference

```javascript
// Common unique combinations (educational content)
const UNIQUE_COMBINATIONS = {
  2: {
    3: [[1,2]],
    4: [[1,3]],
    16: [[7,9]],
    17: [[8,9]]
  },
  3: {
    6: [[1,2,3]],
    7: [[1,2,4]],
    23: [[6,8,9]],
    24: [[7,8,9]]
  },
  // ... more combinations
};
```

### UI Implementation

```html
<!-- Cage rendering -->
<div class="cage" data-cage-id="0">
  <div class="cage-sum">15</div>
  <div class="cage-border"></div>
</div>

<style>
.cage {
  position: relative;
  border: 2px dashed #666;
}

.cage-sum {
  position: absolute;
  top: 2px;
  left: 2px;
  font-size: 10px;
  font-weight: bold;
}
</style>
```

---

## 5️⃣ JIGSAW SUDOKU (Irregular Regions)

### Rules
- Standard 9x9 grid
- Instead of 3×3 boxes, regions are irregular jigsaw-like shapes
- Each region contains exactly 9 cells

### Generation Algorithm

```javascript
function generateJigsawSudoku(difficulty) {
  // 1. Generate regions (9 regions, 9 cells each)
  const regions = generateJigsawRegions();

  // 2. Generate valid solved grid using these regions
  const solution = solveWithRegions(createEmptyGrid(), regions);

  // 3. Remove cells
  const puzzle = removeCells(solution, difficulty);

  return { puzzle, solution, regions };
}

function generateJigsawRegions() {
  const regions = Array(9).fill(0).map(() => []);
  const assigned = Array(9).fill(0).map(() => Array(9).fill(-1));

  // Start with one cell per region
  const seeds = shuffle([
    [0,0], [0,4], [0,8],
    [4,0], [4,4], [4,8],
    [8,0], [8,4], [8,8]
  ]);

  seeds.forEach(([r,c], i) => {
    regions[i].push([r,c]);
    assigned[r][c] = i;
  });

  // Grow regions using flood-fill
  while (regions.some(r => r.length < 9)) {
    for (let i = 0; i < 9; i++) {
      if (regions[i].length >= 9) continue;

      const candidates = getAdjacentCells(regions[i], assigned);
      if (candidates.length === 0) continue;

      const [r, c] = candidates[Math.floor(Math.random() * candidates.length)];
      regions[i].push([r,c]);
      assigned[r][c] = i;
    }
  }

  return regions;
}

function solveWithRegions(grid, regions) {
  // Similar to standard solver, but check regions instead of boxes
  // ...
}
```

### UI Rendering

```css
/* Color each region differently */
.region-0 { background-color: rgba(255, 200, 200, 0.3); }
.region-1 { background-color: rgba(200, 255, 200, 0.3); }
.region-2 { background-color: rgba(200, 200, 255, 0.3); }
/* ... 9 total */
```

---

## 🧪 QUALITY VALIDATION

### Difficulty Metrics (Adapt from Classic)

```javascript
function validateDifficulty(puzzle, variant, difficulty) {
  const solver = getSolver(variant);
  const analysis = solver.analyze(puzzle);

  const criteria = {
    easy: {
      naked_singles: { min: 15, max: Infinity },
      hidden_singles: { min: 0, max: 5 },
      advanced_techniques: { max: 0 }
    },
    medium: {
      naked_singles: { min: 6, max: 15 },
      candidate_density: { min: 2.5, max: 3.3 },
      advanced_techniques: { max: 2 }
    },
    hard: {
      naked_singles: { max: 5 },
      candidate_density: { min: 3.4, max: 5.0 },
      advanced_techniques: { min: 1 }
    }
  }[difficulty];

  return checkCriteria(analysis, criteria);
}
```

---

## ✅ IMPLEMENTATION CHECKLIST (Per Variant)

- [ ] Generator creates valid puzzles
- [ ] Validation enforces all rules
- [ ] Solver can solve generated puzzles
- [ ] Difficulty calibration accurate
- [ ] UI displays correctly
- [ ] Mobile-responsive
- [ ] Tutorial lessons created
- [ ] Achievements defined
- [ ] Pre-generate 200-300 puzzles
- [ ] Automated tests pass

---

**Each variant is a separate project. Start simple (X-Sudoku, Mini), validate the system works, THEN tackle complex ones (Killer, Jigsaw).**
