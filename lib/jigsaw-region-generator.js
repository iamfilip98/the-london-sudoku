/**
 * JIGSAW SUDOKU REGION GENERATOR
 *
 * Generates irregular regions for Jigsaw Sudoku puzzles
 * - Creates 9 connected regions of 9 cells each
 * - Ensures regions are aesthetically pleasing
 * - Uses flood-fill algorithm for region creation
 *
 * Phase 2 Month 14
 */

/**
 * Generate irregular regions for Jigsaw Sudoku
 * @param {number} seed - Random seed for deterministic generation
 * @returns {Array<Array<number>>} 9x9 grid where each cell contains region ID (0-8)
 */
function generateJigsawRegions(seed = Date.now()) {
    // Seeded random number generator
    let randomSeed = seed;
    function random() {
        randomSeed = (randomSeed * 9301 + 49297) % 233280;
        return randomSeed / 233280;
    }

    const maxAttempts = 100;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            const regions = attemptRegionGeneration(random);
            if (validateRegions(regions)) {
                return regions;
            }
        } catch (e) {
            // Try again
            continue;
        }
    }

    // Fallback: return a simple checkerboard-like pattern
    // Warning occurred
    return generateFallbackRegions();
}

/**
 * Attempt to generate regions using growth algorithm
 */
function attemptRegionGeneration(random) {
    const grid = Array(9).fill(null).map(() => Array(9).fill(-1));
    const regionSizes = Array(9).fill(0);
    const targetSize = 9;

    // Start with 9 seed cells (one per region)
    const seeds = [];
    const used = new Set();

    // Distribute seeds evenly across the grid
    for (let region = 0; region < 9; region++) {
        let row, col;
        let attempts = 0;
        do {
            row = Math.floor(random() * 9);
            col = Math.floor(random() * 9);
            attempts++;
            if (attempts > 100) {
                throw new Error('Cannot place seed');
            }
        } while (used.has(`${row},${col}`));

        grid[row][col] = region;
        regionSizes[region] = 1;
        seeds.push({ row, col, region });
        used.add(`${row},${col}`);
    }

    // Grow regions iteratively
    let unassignedCells = 81 - 9; // Total cells minus seeds

    while (unassignedCells > 0) {
        let progress = false;

        // Shuffle order of region growth to avoid bias
        const regionOrder = Array.from({ length: 9 }, (_, i) => i);
        shuffleArray(regionOrder, random);

        for (const region of regionOrder) {
            if (regionSizes[region] >= targetSize) continue;

            // Find all cells adjacent to this region
            const candidates = [];
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (grid[row][col] !== -1) continue;

                    // Check if adjacent to current region
                    const neighbors = getNeighbors(row, col);
                    const hasRegionNeighbor = neighbors.some(([r, c]) => grid[r][c] === region);

                    if (hasRegionNeighbor) {
                        // Count how many neighbors are unassigned (prefer cells with fewer unassigned neighbors)
                        const unassignedNeighbors = neighbors.filter(([r, c]) => grid[r][c] === -1).length;
                        candidates.push({ row, col, unassignedNeighbors });
                    }
                }
            }

            if (candidates.length === 0) continue;

            // Sort by unassigned neighbors (prefer cells with fewer unassigned neighbors to avoid isolation)
            candidates.sort((a, b) => a.unassignedNeighbors - b.unassignedNeighbors);

            // Pick one of the top candidates
            const topCandidates = candidates.slice(0, Math.max(1, Math.floor(candidates.length * 0.3)));
            const chosen = topCandidates[Math.floor(random() * topCandidates.length)];

            grid[chosen.row][chosen.col] = region;
            regionSizes[region]++;
            unassignedCells--;
            progress = true;
        }

        if (!progress) {
            // Dead end - assign remaining cells to nearest region
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (grid[row][col] === -1) {
                        const neighbors = getNeighbors(row, col);
                        const assignedNeighbors = neighbors.filter(([r, c]) => grid[r][c] !== -1);
                        if (assignedNeighbors.length > 0) {
                            const [nr, nc] = assignedNeighbors[Math.floor(random() * assignedNeighbors.length)];
                            grid[row][col] = grid[nr][nc];
                            regionSizes[grid[nr][nc]]++;
                            unassignedCells--;
                        }
                    }
                }
            }

            if (unassignedCells > 0) {
                throw new Error('Failed to assign all cells');
            }
        }
    }

    return grid;
}

/**
 * Get orthogonally adjacent neighbors
 */
function getNeighbors(row, col) {
    const neighbors = [];
    if (row > 0) neighbors.push([row - 1, col]);
    if (row < 8) neighbors.push([row + 1, col]);
    if (col > 0) neighbors.push([row, col - 1]);
    if (col < 8) neighbors.push([row, col + 1]);
    return neighbors;
}

/**
 * Shuffle array in place
 */
function shuffleArray(array, random) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

/**
 * Validate that regions are well-formed
 */
function validateRegions(grid) {
    // Check each region has exactly 9 cells
    const regionCounts = Array(9).fill(0);
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const region = grid[row][col];
            if (region < 0 || region > 8) return false;
            regionCounts[region]++;
        }
    }

    for (let i = 0; i < 9; i++) {
        if (regionCounts[i] !== 9) return false;
    }

    // Check each region is connected (flood fill)
    for (let region = 0; region < 9; region++) {
        if (!isRegionConnected(grid, region)) {
            return false;
        }
    }

    return true;
}

/**
 * Check if a region is connected using flood fill
 */
function isRegionConnected(grid, regionId) {
    // Find first cell in region
    let startRow = -1, startCol = -1;
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (grid[row][col] === regionId) {
                startRow = row;
                startCol = col;
                break;
            }
        }
        if (startRow !== -1) break;
    }

    if (startRow === -1) return false;

    // Flood fill
    const visited = Array(9).fill(null).map(() => Array(9).fill(false));
    const queue = [[startRow, startCol]];
    let count = 0;

    while (queue.length > 0) {
        const [row, col] = queue.shift();
        if (visited[row][col]) continue;
        if (grid[row][col] !== regionId) continue;

        visited[row][col] = true;
        count++;

        const neighbors = getNeighbors(row, col);
        for (const [nr, nc] of neighbors) {
            if (!visited[nr][nc] && grid[nr][nc] === regionId) {
                queue.push([nr, nc]);
            }
        }
    }

    return count === 9;
}

/**
 * Generate fallback regions (modified standard boxes)
 */
function generateFallbackRegions() {
    const grid = [
        [0, 0, 0, 1, 1, 1, 2, 2, 2],
        [0, 0, 0, 1, 1, 1, 2, 2, 2],
        [0, 0, 0, 1, 1, 1, 2, 2, 2],
        [3, 3, 3, 4, 4, 4, 5, 5, 5],
        [3, 3, 3, 4, 4, 4, 5, 5, 5],
        [3, 3, 3, 4, 4, 4, 5, 5, 5],
        [6, 6, 6, 7, 7, 7, 8, 8, 8],
        [6, 6, 6, 7, 7, 7, 8, 8, 8],
        [6, 6, 6, 7, 7, 7, 8, 8, 8]
    ];
    return grid;
}

/**
 * Get all cells in a specific region
 */
function getRegionCells(regions, regionId) {
    const cells = [];
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (regions[row][col] === regionId) {
                cells.push([row, col]);
            }
        }
    }
    return cells;
}

module.exports = {
    generateJigsawRegions,
    getRegionCells,
    validateRegions
};
