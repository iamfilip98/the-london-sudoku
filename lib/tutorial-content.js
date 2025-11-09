/**
 * PHASE 2 MONTH 18: Interactive Variant Tutorial System
 *
 * Comprehensive tutorial content for all Sudoku variants.
 * Each tutorial includes step-by-step instructions, interactive examples,
 * and visual demonstrations to help players learn variant rules.
 */

const TUTORIAL_CONTENT = {
    'classic': {
        id: 'classic',
        name: 'Classic Sudoku',
        difficulty: 'beginner',
        estimatedTime: '5 minutes',
        description: 'Learn the fundamental rules of Sudoku',
        icon: '🎯',
        steps: [
            {
                title: 'Welcome to Sudoku!',
                content: 'Sudoku is a logic-based number puzzle played on a 9×9 grid. Your goal is to fill the grid with numbers 1-9.',
                type: 'introduction',
                visual: 'grid-overview'
            },
            {
                title: 'The Three Rules',
                content: 'Every number from 1-9 must appear exactly once in:\n• Each row (9 rows)\n• Each column (9 columns)\n• Each 3×3 box (9 boxes)',
                type: 'rules',
                highlights: ['row', 'column', 'box']
            },
            {
                title: 'Starting Clues',
                content: 'The puzzle begins with some numbers already filled in (called "clues" or "givens"). These are locked and cannot be changed.',
                type: 'explanation',
                highlights: ['initial-cells']
            },
            {
                title: 'Your First Move',
                content: 'Look for cells where only one number can fit. Check the row, column, and box to eliminate possibilities.',
                type: 'interactive',
                task: 'place-number',
                targetCell: [0, 3],
                expectedValue: 5
            },
            {
                title: 'Using Candidates',
                content: 'For harder puzzles, you can write small "candidate" numbers in cells to track possibilities. Toggle candidate mode with the pencil button.',
                type: 'demonstration',
                feature: 'candidate-mode'
            },
            {
                title: 'Completing the Puzzle',
                content: 'Keep filling in numbers following the three rules. The puzzle is complete when all 81 cells are filled correctly!',
                type: 'completion'
            }
        ]
    },

    'x-sudoku': {
        id: 'x-sudoku',
        name: 'X-Sudoku (Diagonal Sudoku)',
        difficulty: 'intermediate',
        estimatedTime: '7 minutes',
        description: 'Classic Sudoku with diagonal constraints',
        icon: '✖️',
        prerequisites: ['classic'],
        steps: [
            {
                title: 'X-Sudoku Basics',
                content: 'X-Sudoku follows all classic Sudoku rules, PLUS two additional diagonal constraints.',
                type: 'introduction',
                visual: 'diagonal-overview'
            },
            {
                title: 'Main Diagonal Constraint',
                content: 'The main diagonal (top-left to bottom-right) must contain each number 1-9 exactly once.',
                type: 'rules',
                highlights: ['main-diagonal'],
                interactive: true
            },
            {
                title: 'Anti-Diagonal Constraint',
                content: 'The anti-diagonal (top-right to bottom-left) must also contain each number 1-9 exactly once.',
                type: 'rules',
                highlights: ['anti-diagonal'],
                interactive: true
            },
            {
                title: 'Diagonal Cells',
                content: 'Cells on diagonals have extra constraints. They must satisfy their row, column, box, AND diagonal.',
                type: 'explanation',
                highlights: ['diagonal-cells']
            },
            {
                title: 'Try It Yourself',
                content: 'Place a number on the main diagonal. Notice how it eliminates options for other cells on that diagonal.',
                type: 'interactive',
                task: 'place-diagonal',
                targetCell: [4, 4],
                expectedValue: 5
            },
            {
                title: 'Mastering X-Sudoku',
                content: 'Use diagonal constraints to your advantage! They provide extra clues for solving the puzzle.',
                type: 'completion'
            }
        ]
    },

    'anti-knight': {
        id: 'anti-knight',
        name: 'Anti-Knight Sudoku',
        difficulty: 'intermediate',
        estimatedTime: '8 minutes',
        description: 'Sudoku with chess knight move constraints',
        icon: '♞',
        prerequisites: ['classic'],
        steps: [
            {
                title: 'Anti-Knight Rules',
                content: 'Anti-Knight Sudoku adds a chess-based constraint: cells that are a knight\'s move apart cannot contain the same digit.',
                type: 'introduction',
                visual: 'knight-moves'
            },
            {
                title: 'What is a Knight\'s Move?',
                content: 'In chess, a knight moves in an "L" shape: 2 squares in one direction, then 1 square perpendicular. This creates 8 possible positions.',
                type: 'demonstration',
                visual: 'knight-pattern',
                interactive: true
            },
            {
                title: 'The Anti-Knight Constraint',
                content: 'If a cell contains the number 5, then ALL cells that are a knight\'s move away CANNOT contain 5.',
                type: 'rules',
                highlights: ['knight-constraints']
            },
            {
                title: 'Visualizing Knight Positions',
                content: 'Click on a cell to see all 8 knight\'s move positions highlighted. These positions cannot have the same number.',
                type: 'interactive',
                task: 'explore-knight-moves',
                allowExploration: true
            },
            {
                title: 'Strategic Solving',
                content: 'The knight constraint eliminates many possibilities, making some cells easier to solve. Look for these opportunities!',
                type: 'explanation'
            },
            {
                title: 'Practice Placement',
                content: 'Try placing a number. The game will prevent you from violating the knight\'s move rule.',
                type: 'interactive',
                task: 'place-with-knight-check',
                targetCell: [3, 3],
                expectedValue: 7
            }
        ]
    },

    'killer-sudoku': {
        id: 'killer-sudoku',
        name: 'Killer Sudoku',
        difficulty: 'advanced',
        estimatedTime: '10 minutes',
        description: 'Sudoku with cage sum constraints',
        icon: '🔪',
        prerequisites: ['classic'],
        steps: [
            {
                title: 'Welcome to Killer Sudoku',
                content: 'Killer Sudoku combines Sudoku with elements of Kakuro. The grid is divided into "cages" - outlined groups of cells.',
                type: 'introduction',
                visual: 'cages-overview'
            },
            {
                title: 'Cage Rules',
                content: 'Each cage has two rules:\n1. The numbers in the cage must sum to the target shown in the top-left\n2. Numbers CANNOT repeat within a cage',
                type: 'rules',
                highlights: ['cage-example']
            },
            {
                title: 'Reading Cage Sums',
                content: 'The small number in the top-left corner of each cage is the target sum. All numbers in that cage must add up to this total.',
                type: 'explanation',
                highlights: ['cage-sums'],
                interactive: true
            },
            {
                title: 'No Duplicates in Cages',
                content: 'Unlike classic Sudoku boxes, cage cells can span multiple boxes. But within each cage, every number must be unique.',
                type: 'rules',
                highlights: ['cage-unique']
            },
            {
                title: 'Cage Mathematics',
                content: 'Example: A 2-cell cage with sum 15 can only be [6,9], [7,8], [8,7], or [9,6]. Use this logic to solve!',
                type: 'demonstration',
                visual: 'cage-math-example'
            },
            {
                title: 'Try a Simple Cage',
                content: 'This 2-cell cage needs to sum to 3. What numbers can go here?',
                type: 'interactive',
                task: 'solve-simple-cage',
                targetCage: 0,
                hint: 'Only 1 and 2 can sum to 3!'
            },
            {
                title: 'Completing Cages',
                content: 'When a cage has only one empty cell, you can calculate the missing number: Target Sum - Current Sum = Missing Number.',
                type: 'explanation'
            },
            {
                title: 'Mastering Killer Sudoku',
                content: 'Combine Sudoku logic with cage arithmetic. Each constraint helps narrow down possibilities!',
                type: 'completion'
            }
        ]
    },

    'hyper-sudoku': {
        id: 'hyper-sudoku',
        name: 'Hyper Sudoku (Windoku)',
        difficulty: 'intermediate',
        estimatedTime: '7 minutes',
        description: 'Sudoku with four extra overlapping regions',
        icon: '🎯',
        prerequisites: ['classic'],
        steps: [
            {
                title: 'Hyper Sudoku Overview',
                content: 'Hyper Sudoku (also called Windoku) adds four extra 3×3 regions to the standard puzzle, creating overlapping constraints.',
                type: 'introduction',
                visual: 'hyper-regions'
            },
            {
                title: 'The Four Hyper Regions',
                content: 'In addition to standard rows, columns, and boxes, there are 4 extra 3×3 regions highlighted with subtle backgrounds.',
                type: 'rules',
                highlights: ['hyper-region-1', 'hyper-region-2', 'hyper-region-3', 'hyper-region-4'],
                interactive: true
            },
            {
                title: 'Overlapping Constraints',
                content: 'Some cells belong to BOTH a standard box AND a hyper region. These cells have extra constraints!',
                type: 'explanation',
                highlights: ['overlapping-cells']
            },
            {
                title: 'Total Constraints',
                content: 'Hyper Sudoku has 31 regions total:\n• 9 rows\n• 9 columns\n• 9 standard boxes\n• 4 hyper regions',
                type: 'rules'
            },
            {
                title: 'Using Hyper Regions',
                content: 'The extra regions provide additional clues. A number might be forced in a hyper region even when it has multiple options in its row/column/box.',
                type: 'demonstration',
                visual: 'hyper-solving-example'
            },
            {
                title: 'Practice Placement',
                content: 'Try placing a number in a hyper region. Notice how it affects both the standard box AND the hyper region.',
                type: 'interactive',
                task: 'place-in-hyper-region',
                targetCell: [2, 2],
                expectedValue: 8
            }
        ]
    },

    'consecutive-sudoku': {
        id: 'consecutive-sudoku',
        name: 'Consecutive Sudoku',
        difficulty: 'advanced',
        estimatedTime: '9 minutes',
        description: 'Sudoku with consecutive number markers',
        icon: '🔢',
        prerequisites: ['classic'],
        steps: [
            {
                title: 'Consecutive Sudoku Rules',
                content: 'Consecutive Sudoku uses white circle markers between cells to indicate consecutive relationships.',
                type: 'introduction',
                visual: 'consecutive-markers'
            },
            {
                title: 'Marker Meaning',
                content: 'A white circle between two cells means those cells MUST contain consecutive numbers (differ by exactly 1).',
                type: 'rules',
                highlights: ['marked-edges'],
                examples: ['3-4', '7-8', '1-2']
            },
            {
                title: 'The Negative Constraint',
                content: 'IMPORTANT: If there is NO marker between two cells, they CANNOT be consecutive. This is just as important as marked cells!',
                type: 'rules',
                highlights: ['unmarked-edges'],
                emphasis: true
            },
            {
                title: 'Reading Markers',
                content: 'If you see ⚪ between two cells, they must differ by 1. If you don\'t see ⚪, they must NOT differ by 1.',
                type: 'explanation',
                interactive: true
            },
            {
                title: 'Using Negative Constraints',
                content: 'Example: If a cell has 5, and there\'s NO marker to its neighbor, that neighbor cannot be 4 or 6.',
                type: 'demonstration',
                visual: 'negative-constraint-example'
            },
            {
                title: 'Try It Yourself',
                content: 'Look at the markers around this cell. Which numbers are possible?',
                type: 'interactive',
                task: 'deduce-from-markers',
                targetCell: [4, 4],
                hint: 'Check both marked AND unmarked edges!'
            },
            {
                title: 'Strategic Solving',
                content: 'Consecutive constraints create strong deductions. Use both positive (marked) and negative (unmarked) information!',
                type: 'completion'
            }
        ]
    },

    'thermo-sudoku': {
        id: 'thermo-sudoku',
        name: 'Thermo Sudoku',
        difficulty: 'advanced',
        estimatedTime: '10 minutes',
        description: 'Sudoku with thermometer constraints',
        icon: '🌡️',
        prerequisites: ['classic'],
        steps: [
            {
                title: 'Thermo Sudoku Basics',
                content: 'Thermo Sudoku features "thermometers" - chains of cells where numbers must strictly increase from bulb to tip.',
                type: 'introduction',
                visual: 'thermometers-overview'
            },
            {
                title: 'Thermometer Structure',
                content: 'Each thermometer has:\n• A BULB (circular start) - the smallest number\n• A PATH of cells - increasing sequence\n• A TIP (pointed end) - the largest number',
                type: 'rules',
                highlights: ['thermometer-parts'],
                interactive: true
            },
            {
                title: 'Strictly Increasing',
                content: 'Numbers MUST strictly increase along the thermometer. Each cell must be greater than the previous one (not just non-decreasing).',
                type: 'rules',
                examples: ['1-2-3-4', '3-5-7-9'],
                counterexamples: ['1-1-2', '5-4-6']
            },
            {
                title: 'Bulb Constraints',
                content: 'The bulb must be smaller than ALL other cells on its thermometer. This limits which numbers can go in the bulb.',
                type: 'explanation',
                highlights: ['bulb-limits']
            },
            {
                title: 'Tip Constraints',
                content: 'The tip must be larger than ALL other cells on its thermometer. Long thermometers force high numbers at the tip!',
                type: 'explanation',
                highlights: ['tip-limits']
            },
            {
                title: 'Middle Cells',
                content: 'Cells in the middle must be between the values before and after them. This creates a "sandwich" constraint.',
                type: 'demonstration',
                visual: 'middle-cell-example'
            },
            {
                title: 'Practice Example',
                content: 'This 4-cell thermometer needs to increase. If the bulb is 2, what could the tip be?',
                type: 'interactive',
                task: 'solve-thermometer',
                hint: 'Must be at least 5 (2→3→4→5 minimum)'
            },
            {
                title: 'Advanced Strategy',
                content: 'Use thermometer lengths to limit possibilities. A 7-cell thermometer MUST use numbers like 1-2-3-4-5-6-7!',
                type: 'explanation'
            }
        ]
    },

    'jigsaw-sudoku': {
        id: 'jigsaw-sudoku',
        name: 'Jigsaw Sudoku',
        difficulty: 'intermediate',
        estimatedTime: '8 minutes',
        description: 'Sudoku with irregular shaped regions',
        icon: '🧩',
        prerequisites: ['classic'],
        steps: [
            {
                title: 'Jigsaw Sudoku Overview',
                content: 'Jigsaw Sudoku replaces the standard 3×3 boxes with irregular shaped regions of the same size.',
                type: 'introduction',
                visual: 'jigsaw-regions'
            },
            {
                title: 'Irregular Regions',
                content: 'Instead of nine 3×3 boxes, the grid has nine irregular regions. Each region still contains exactly 9 cells.',
                type: 'rules',
                highlights: ['irregular-regions'],
                interactive: true
            },
            {
                title: 'Region Shapes',
                content: 'Regions can be any shape! They might be L-shaped, T-shaped, or completely irregular. But they always contain 9 connected cells.',
                type: 'explanation',
                visual: 'region-shapes-example'
            },
            {
                title: 'Same Rules, Different Boxes',
                content: 'The core rules remain:\n• Each row: 1-9\n• Each column: 1-9\n• Each IRREGULAR REGION: 1-9',
                type: 'rules'
            },
            {
                title: 'Identifying Regions',
                content: 'Regions are shown with bold borders and subtle background colors. Hover over a cell to highlight its entire region.',
                type: 'demonstration',
                interactive: true
            },
            {
                title: 'Solving Strategy',
                content: 'Track which numbers are in each irregular region just like you would with standard boxes. The shapes make it trickier but more fun!',
                type: 'explanation'
            },
            {
                title: 'Practice Placement',
                content: 'Place a number in this irregular region. Notice how the region shape affects your possibilities.',
                type: 'interactive',
                task: 'place-in-jigsaw-region',
                targetCell: [3, 5],
                expectedValue: 6
            }
        ]
    },

    'mini': {
        id: 'mini',
        name: 'Mini Sudoku (6×6)',
        difficulty: 'beginner',
        estimatedTime: '4 minutes',
        description: 'Smaller 6×6 Sudoku for quick games',
        icon: '📐',
        prerequisites: [],
        steps: [
            {
                title: 'Mini Sudoku Basics',
                content: 'Mini Sudoku is played on a smaller 6×6 grid using numbers 1-6 instead of 1-9.',
                type: 'introduction',
                visual: 'mini-grid'
            },
            {
                title: 'The Rules',
                content: 'Fill the 6×6 grid so that:\n• Each row contains 1-6\n• Each column contains 1-6\n• Each 2×3 region contains 1-6',
                type: 'rules',
                highlights: ['mini-regions']
            },
            {
                title: 'Smaller Regions',
                content: 'Instead of 3×3 boxes, Mini Sudoku uses 2×3 rectangular regions. There are 6 regions total.',
                type: 'explanation',
                highlights: ['mini-boxes'],
                interactive: true
            },
            {
                title: 'Perfect for Practice',
                content: 'Mini Sudoku games are quicker to solve (2-4 minutes) and great for learning or warming up!',
                type: 'explanation'
            },
            {
                title: 'Try It!',
                content: 'Place a number in this mini grid. The same logic applies, just on a smaller scale.',
                type: 'interactive',
                task: 'place-in-mini',
                targetCell: [2, 3],
                expectedValue: 4
            }
        ]
    }
};

// Tutorial progression and prerequisites
const TUTORIAL_PROGRESSION = {
    beginner: ['classic', 'mini'],
    intermediate: ['x-sudoku', 'anti-knight', 'hyper-sudoku', 'jigsaw-sudoku'],
    advanced: ['killer-sudoku', 'consecutive-sudoku', 'thermo-sudoku']
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TUTORIAL_CONTENT, TUTORIAL_PROGRESSION };
}
