# Sudoku Strategy Guide - From Beginner to Expert

**Master the art of Sudoku solving!** This comprehensive guide covers techniques from basic to advanced, helping you solve puzzles faster and more efficiently.

---

## 📖 Table of Contents

- [Introduction](#introduction)
- [Beginner Techniques](#beginner-techniques)
- [Intermediate Techniques](#intermediate-techniques)
- [Advanced Techniques](#advanced-techniques)
- [Expert Techniques](#expert-techniques)
- [General Tips & Strategies](#general-tips--strategies)
- [Variant-Specific Strategies](#variant-specific-strategies)

---

## Introduction

### How to Use This Guide

- **Start with Beginner**: Master basic techniques before moving to advanced ones
- **Practice Each Technique**: Try each technique on actual puzzles
- **Progress Gradually**: Don't rush—understanding beats memorization
- **Use Candidates**: Most intermediate+ techniques require candidate tracking

### Understanding Candidates (Pencil Marks)

**Candidates** (also called notes or pencil marks) are the possible numbers for each cell. Learning to use candidates effectively is essential for Medium and Hard puzzles.

**Example Notation:**
```
Cell with candidates 2, 5, 7:
┌─────┐
│2 5 7│
│     │
└─────┘
```

Press **Space** in The London Sudoku to toggle candidate mode.

---

## Beginner Techniques

### 1. Naked Singles

**Difficulty**: ⭐ Very Easy
**When to Use**: Throughout the entire puzzle
**Frequency**: Very common (especially in Easy puzzles)

#### What It Is
A **Naked Single** occurs when a cell has only one possible candidate remaining.

#### How to Identify
1. Look at empty cells
2. Check which numbers are already used in the cell's row, column, and box
3. If only one number is possible, that's a naked single

#### Example
```
Row contains: 1, 2, 3, 4, 5, 6, 7, 9
Column contains: 1, 2, 3, 5, 7, 8
Box contains: 1, 2, 4, 5, 6, 7, 9

The empty cell can only be 8 → Naked Single!
```

#### Strategy Tips
- Scan systematically: rows first, then columns, then boxes
- In Easy puzzles, naked singles are the primary solving technique
- After placing a number, look for new naked singles it creates

---

### 2. Hidden Singles

**Difficulty**: ⭐⭐ Easy
**When to Use**: Throughout the entire puzzle
**Frequency**: Very common (essential for Medium/Hard puzzles)

#### What It Is
A **Hidden Single** occurs when a number can only go in one cell within a row, column, or box, even if that cell has other candidates.

#### How to Identify
1. Pick a number (e.g., 5)
2. Look at a row, column, or box
3. Check all empty cells—can the number go there?
4. If it can only go in ONE cell, that's a hidden single

#### Example
```
Box 1 (top-left 3×3):
┌───┬───┬───┐
│ 1 │ 2 │   │  Candidates for empty cells:
├───┼───┼───┤  - Top-right: 4, 6, 7
│   │ 5 │ 3 │  - Middle-left: 4, 6, 8, 9
├───┼───┼───┤  - Bottom-left: 4, 6, 9
│   │   │ 8 │  - Bottom-middle: 4, 6, 7, 9
└───┴───┴───┘
Looking for 7 in this box:
Only the top-right cell can be 7 → Hidden Single!
```

#### Strategy Tips
- Systematically scan each box for each number (1-9)
- Hidden singles often appear in crowded boxes/rows/columns
- This technique is especially powerful in Hard puzzles

---

### 3. Scanning (Cross-Hatching)

**Difficulty**: ⭐⭐ Easy
**When to Use**: Early in the puzzle
**Frequency**: Very common

#### What It Is
**Scanning** (or cross-hatching) is systematically checking where a specific number can go based on rows and columns.

#### How to Do It
1. Pick a number (e.g., 5)
2. Look at boxes where 5 is NOT yet placed
3. Use placed 5s in other rows/columns to eliminate possibilities
4. If only one cell remains in a box, place the 5

#### Example
```
Looking for where 5 can go in the middle box:

   1  2  3  4  5  6  7  8  9
  ┌──┬──┬──┬──┬──┬──┬──┬──┬──┐
1 │  │  │  │  │  │  │  │  │  │
  ├──┼──┼──┼──┼──┼──┼──┼──┼──┤
2 │  │  │  │  │  │  │  │  │  │
  ├──┼──┼──┼──┼──┼──┼──┼──┼──┤
3 │  │  │  │5 │  │  │  │  │  │  ← 5 in row 3
  ├──┼──┼──┼──┼──┼──┼──┼──┼──┤
4 │  │5 │  │  │  │  │  │  │  │  ← 5 in column 2
  ├──┼──┼──┼──┼──┼──┼──┼──┼──┤
5 │  │  │  │  │X │  │  │  │  │  ← Only cell in box 5
  ├──┼──┼──┼──┼──┼──┼──┼──┼──┤
6 │  │  │  │  │  │  │  │  │  │
  └──┴──┴──┴──┴──┴──┴──┴──┴──┘

Row 3 eliminates row 3 of box 5
Column 2 eliminates column 4 of box 5
→ The 5 must go in the marked X cell
```

#### Strategy Tips
- Start with numbers that appear frequently (6-7 times on the board)
- Work box by box for each number
- Combine with hidden singles for maximum efficiency

---

### 4. Elimination (Basic)

**Difficulty**: ⭐⭐ Easy
**When to Use**: Throughout the puzzle
**Frequency**: Constant (fundamental technique)

#### What It Is
**Elimination** is the process of removing impossible candidates from cells based on placed numbers.

#### How to Do It
1. Place a number in a cell
2. Remove that number from all candidates in the same row
3. Remove that number from all candidates in the same column
4. Remove that number from all candidates in the same box

#### Example
```
Before placing 7 in center:     After placing 7 in center:
┌───────┬───────┬───────┐      ┌───────┬───────┬───────┐
│   7   │  1 7  │       │      │   7   │   1   │       │
│       │       │       │      │       │       │       │
│  7 9  │   7   │   7   │  →   │   9   │  [7]  │       │
│       │       │       │      │       │       │       │
│   7   │   7   │  5 7  │      │       │       │   5   │
└───────┴───────┴───────┘      └───────┴───────┴───────┘

All 7s removed from row, column, and box!
```

#### Strategy Tips
- Update candidates immediately after placing numbers
- In The London Sudoku, press Space to enter candidate mode
- Consistent elimination prevents errors

---

## Intermediate Techniques

### 5. Naked Pairs

**Difficulty**: ⭐⭐⭐ Medium
**When to Use**: Mid-puzzle, when basic techniques slow down
**Frequency**: Common in Medium/Hard puzzles

#### What It Is
A **Naked Pair** occurs when two cells in the same row, column, or box both have exactly the same two candidates.

#### How to Identify
1. Look for two cells with identical pairs (e.g., both have candidates 3, 7)
2. Those cells must contain those two numbers
3. Remove those numbers from all other cells in the same row/column/box

#### Example
```
Row 5 candidates:
Cell 1: 3, 7       ← Naked Pair
Cell 2: 3, 7       ← Naked Pair
Cell 3: 2, 3, 5, 7
Cell 4: 1, 7, 9
Cell 5: 2, 3, 7
...

Since cells 1 and 2 must be 3 and 7, eliminate 3 and 7 from other cells:

After elimination:
Cell 1: 3, 7
Cell 2: 3, 7
Cell 3: 2, 5       ← 3 and 7 removed
Cell 4: 1, 9       ← 7 removed
Cell 5: 2          ← 3 and 7 removed (naked single!)
```

#### Strategy Tips
- Scan rows, columns, and boxes for identical pairs
- Works with any two numbers (1-2, 5-8, etc.)
- Can lead to immediate naked singles

---

### 6. Hidden Pairs

**Difficulty**: ⭐⭐⭐ Medium
**When to Use**: When candidates are cluttered
**Frequency**: Moderate in Hard puzzles

#### What It Is
A **Hidden Pair** occurs when two candidates appear in exactly the same two cells within a row, column, or box, even if those cells have other candidates.

#### How to Identify
1. Look at a row, column, or box
2. Find two numbers that only appear in the same two cells
3. Remove all other candidates from those two cells

#### Example
```
Row 3 candidates:
Cell A: 2, 4, 6
Cell B: 2, 4, 7
Cell C: 1, 3, 5
Cell D: 1, 3, 5, 8
Cell E: 3, 9

Looking at candidates 2 and 4:
- 2 appears only in cells A and B
- 4 appears only in cells A and B
→ Hidden Pair! Cells A and B must be 2 and 4

After cleanup:
Cell A: 2, 4       ← Remove 6
Cell B: 2, 4       ← Remove 7
Cell C: 1, 3, 5
Cell D: 1, 3, 5, 8
Cell E: 3, 9
```

#### Strategy Tips
- Check each number pair systematically (1-2, 1-3, 1-4, etc.)
- Often creates naked singles after cleanup
- More common in boxes than rows/columns

---

### 7. Naked Triples

**Difficulty**: ⭐⭐⭐⭐ Hard
**When to Use**: In difficult puzzles when pairs don't work
**Frequency**: Occasional in Hard puzzles

#### What It Is
A **Naked Triple** occurs when three cells in the same row, column, or box contain only three specific candidates (distributed among them).

#### How to Identify
1. Look for three cells with subsets of the same three candidates
2. Example: Cell A has {2,5}, Cell B has {2,7}, Cell C has {5,7}
3. Those three cells must contain 2, 5, and 7
4. Remove 2, 5, and 7 from all other cells in that row/column/box

#### Example
```
Column 4 candidates:
Cell 1: 2, 5       ┐
Cell 2: 2, 7       ├─ Naked Triple: {2, 5, 7}
Cell 3: 5, 7       ┘
Cell 4: 1, 2, 5, 7, 8
Cell 5: 2, 4, 7, 9
Cell 6: 3, 5, 6, 7

After elimination:
Cell 1: 2, 5
Cell 2: 2, 7
Cell 3: 5, 7
Cell 4: 1, 8       ← 2, 5, 7 removed
Cell 5: 4, 9       ← 2, 7 removed
Cell 6: 3, 6       ← 5, 7 removed
```

#### Strategy Tips
- Look for cells with 2-3 candidates
- The triple doesn't require all three candidates in each cell
- Can be hard to spot—practice makes perfect

---

### 8. Pointing Pairs (Box/Line Reduction)

**Difficulty**: ⭐⭐⭐ Medium
**When to Use**: Mid to late puzzle
**Frequency**: Common in Medium/Hard puzzles

#### What It Is
A **Pointing Pair** occurs when a candidate appears only in one row or column within a box, allowing you to eliminate it from that row/column outside the box.

#### How to Identify
1. Look at a box
2. Find a candidate that appears in only one row or column of that box
3. Eliminate that candidate from the rest of that row/column (outside the box)

#### Example
```
Box 1 (top-left):
┌───┬───┬───┐
│ 1 │ 2 │   │  Row 1: 3 can only go here →
├───┼───┼───┤
│ 4 │ 5 │ 6 │
├───┼───┼───┤
│ 7 │ 8 │ 9 │
└───┴───┴───┘

Looking for candidate 3 in Box 1:
- 3 can only appear in row 1 of this box

Therefore:
- Eliminate 3 from all cells in row 1 outside Box 1
- This often creates hidden singles elsewhere in row 1
```

#### Strategy Tips
- Systematically check each box for each candidate
- Works in both directions (row → box and column → box)
- Essential for Hard puzzles

---

### 9. Box/Line Reduction

**Difficulty**: ⭐⭐⭐ Medium
**When to Use**: Mid to late puzzle
**Frequency**: Common

#### What It Is
**Box/Line Reduction** is the reverse of pointing pairs: when a candidate appears only in one box within a row or column, eliminate it from other cells in that box.

#### How to Identify
1. Look at a row or column
2. Find a candidate that appears only within one box
3. Eliminate that candidate from other cells in that box (not in the row/column)

#### Example
```
Row 5 spans three boxes:
Box 4 │ Box 5 │ Box 6
──────┼───────┼──────
  3   │   3   │
      │       │

Looking at row 5:
- Candidate 3 only appears in Box 5 within row 5

Therefore:
- Eliminate 3 from all cells in Box 5 that are NOT in row 5
```

#### Strategy Tips
- Check both rows and columns
- Often used in combination with pointing pairs
- Creates breakthroughs in stuck puzzles

---

## Advanced Techniques

### 10. X-Wing

**Difficulty**: ⭐⭐⭐⭐ Hard
**When to Use**: Late puzzle when simpler techniques fail
**Frequency**: Occasional in Hard puzzles

#### What It Is
An **X-Wing** is a pattern where a candidate appears in exactly two cells in each of two rows (or columns), forming a rectangle. This allows eliminating that candidate from the columns (or rows) forming the X.

#### How to Identify
1. Pick a candidate number
2. Find two rows where that candidate appears in exactly the same two columns
3. Eliminate that candidate from all other cells in those two columns

#### Example
```
Looking for candidate 5:

   Col 2        Col 7
    ↓            ↓
Row 3: ... [5] ... ... [5] ...  ← 5 only in cols 2 and 7
Row 8: ... [5] ... ... [5] ...  ← 5 only in cols 2 and 7

X-Wing pattern forms a rectangle:
        Col 2   Col 7
Row 3:   [5]     [5]
         │  \  / │
         │   \/  │
         │   /\  │
         │  /  \ │
Row 8:   [5]     [5]

Elimination:
Remove 5 from all other cells in columns 2 and 7
(except rows 3 and 8)
```

#### Strategy Tips
- Start with candidates that have limited placements
- Also works with columns (checking rows for the pattern)
- Rare but powerful when found

---

### 11. Swordfish

**Difficulty**: ⭐⭐⭐⭐⭐ Expert
**When to Use**: Very difficult puzzles
**Frequency**: Rare

#### What It Is
A **Swordfish** is an extension of X-Wing: a pattern where a candidate appears in at most three cells in each of three rows, all in the same three columns. This allows eliminating that candidate from those columns.

#### How to Identify
1. Pick a candidate number
2. Find three rows where that candidate appears in 2-3 cells each
3. Check if all those cells are in the same three columns
4. If yes, eliminate that candidate from all other cells in those three columns

#### Example
```
Looking for candidate 7:

Row 2: 7 in columns 3, 5
Row 5: 7 in columns 3, 5, 8
Row 9: 7 in columns 5, 8

Swordfish pattern (3 rows × 3 columns):
      Col 3  Col 5  Col 8
Row 2:  [7]    [7]     -
Row 5:  [7]    [7]    [7]
Row 9:   -     [7]    [7]

Elimination:
Remove 7 from all other cells in columns 3, 5, and 8
```

#### Strategy Tips
- Very difficult to spot—use only when stuck
- Requires systematic checking
- Computer solvers use this frequently, but humans rarely need it
- Swordfish also works with columns (checking three columns across three rows)

---

### 12. XY-Wing

**Difficulty**: ⭐⭐⭐⭐ Hard
**When to Use**: Late puzzle for breakthroughs
**Frequency**: Occasional in Hard puzzles

#### What It Is
An **XY-Wing** involves three cells forming a chain:
- **Pivot**: Cell with candidates X, Y
- **Wing 1**: Cell with candidates X, Z (shares a unit with pivot)
- **Wing 2**: Cell with candidates Y, Z (shares a unit with pivot)

If the pivot is X, then Wing 2 must be Z. If the pivot is Y, then Wing 1 must be Z. Either way, any cell that sees both wings cannot be Z.

#### How to Identify
1. Find a cell with exactly two candidates (X, Y) — the pivot
2. Find two other cells with candidates (X, Z) and (Y, Z)
3. Those two cells must share a row, column, or box
4. Eliminate Z from any cell that sees both wing cells

#### Example
```
Pivot: Cell A4 has {3, 5}
Wing 1: Cell A9 has {3, 7} (same row as pivot)
Wing 2: Cell D4 has {5, 7} (same column as pivot)

Logic:
- If A4 = 3, then D4 = 7
- If A4 = 5, then A9 = 7
→ Either way, one of the wings is 7

Elimination:
Any cell that sees both A9 and D4 cannot be 7
(e.g., Cell D9 sees both wings)
```

#### Strategy Tips
- Look for bi-value cells (cells with only 2 candidates)
- Check their neighbors for matching patterns
- Extremely powerful when found

---

### 13. Unique Rectangles

**Difficulty**: ⭐⭐⭐⭐ Hard
**When to Use**: Late puzzle
**Frequency**: Rare (requires specific setup)

#### What It Is
A **Unique Rectangle** exploits the fact that valid Sudoku puzzles have only one solution. If four cells in two rows and two columns all have the same two candidates, placing them would create multiple solutions—which is impossible. Therefore, at least one of those cells must have an additional candidate, which must be the correct value.

#### How to Identify
1. Find four cells in two rows and two columns
2. All four cells have the same pair of candidates (e.g., all have {2, 7})
3. **BUT** one or more cells also have a third candidate
4. That third candidate must be the solution for those cells

#### Example
```
Four cells forming a rectangle:

       Col 3    Col 7
Row 2:  {2,7}    {2,7}
Row 6:  {2,7,9}  {2,7}

If all four cells could be {2, 7}, the puzzle would have multiple solutions.
Since Row 6, Col 3 has an additional candidate 9:
→ Row 6, Col 3 MUST be 9

Elimination:
Place 9 in Row 6, Col 3
```

#### Strategy Tips
- Requires understanding of puzzle uniqueness
- Look for pairs of cells with identical candidates
- If you find a "deadly pattern," look for the extra candidate
- Not all Sudoku variants allow this technique (some allow multiple solutions)

---

## Expert Techniques

### 14. Simple Coloring (Chains)

**Difficulty**: ⭐⭐⭐⭐⭐ Expert
**When to Use**: Extremely difficult puzzles
**Frequency**: Rare (last resort)

#### What It Is
**Simple Coloring** tracks chains of related cells for a single candidate. You "color" cells alternately (e.g., Blue/Red), representing two possible states. If two cells of the same color see each other, that color is eliminated; if a third cell sees two different colors, that candidate is eliminated from it.

#### How to Do It
1. Pick a candidate (e.g., 5)
2. Find a cell with only two possible placements in a row/column/box
3. Color one Blue, the other Red
4. Follow the chain: if Blue is true, then cells seeing Blue in their row/column/box must be Red
5. Continue coloring until chains complete
6. Apply elimination rules:
   - If two cells of the same color see each other → that color is false
   - If a cell sees both colors → eliminate that candidate from it

#### Example
```
Chain for candidate 5:

Row 1: [5]Blue in col 3, [5]Red in col 8
Row 3: [5]Red in col 3 (sees Blue in col 3)
Row 5: [5]Blue in col 8 (sees Red in col 8)
...

If [5]Blue and [5]Blue both see cell X:
→ Eliminate 5 from cell X

If [5]Red and [5]Red see each other:
→ Red is false, all Blue cells are true
```

#### Strategy Tips
- Extremely advanced—practice on easier techniques first
- Requires careful tracking (use colors or labels)
- Can solve "impossible" puzzles
- Consider using computer assistance for complex chains

---

### 15. Forcing Chains

**Difficulty**: ⭐⭐⭐⭐⭐ Expert
**When to Use**: As a last resort
**Frequency**: Very rare (most puzzles don't need this)

#### What It Is
**Forcing Chains** follow the implications of assuming a candidate is true or false. If both possibilities lead to the same conclusion in a specific cell, that conclusion must be true.

#### How to Do It
1. Pick a bi-value cell (two candidates only, e.g., {3, 7})
2. Assume one candidate is true (e.g., 3) and follow all implications
3. Assume the other candidate is true (e.g., 7) and follow all implications
4. If both chains lead to the same result in another cell → that result is certain

#### Example
```
Cell A1 has {3, 7}

Chain 1: Assume A1 = 3
- If A1 = 3, then B1 = 7
- If B1 = 7, then B5 = 2
- If B5 = 2, then F5 = 8

Chain 2: Assume A1 = 7
- If A1 = 7, then C1 = 3
- If C1 = 3, then C4 = 9
- If C4 = 9, then F5 = 8

Both chains result in F5 = 8:
→ F5 MUST be 8, regardless of A1's value
```

#### Strategy Tips
- Requires extensive notation and tracking
- Use only when all other techniques fail
- Consider using trial-and-error at this point (not ideal, but practical)
- Computer solvers excel at forcing chains

---

## General Tips & Strategies

### Solving Workflow

**Step 1: Scan for Naked Singles (Easy Wins)**
- Look for cells with only one possible candidate
- Fill in all obvious numbers first

**Step 2: Hidden Singles (Essential Progress)**
- Systematically check each box, row, and column for each number
- Mark hidden singles as you find them

**Step 3: Use Candidates (Medium/Hard Only)**
- Fill in candidates for all empty cells
- Update candidates as you place numbers

**Step 4: Apply Intermediate Techniques**
- Look for naked pairs, hidden pairs, pointing pairs
- Eliminate candidates to create new singles

**Step 5: Advanced Techniques (When Stuck)**
- Try X-Wing, XY-Wing, unique rectangles
- Only use expert techniques as a last resort

**Step 6: Verify and Repeat**
- After placing numbers, go back to Step 1
- Each placement can create new opportunities

---

### Common Mistakes to Avoid

**1. Rushing Without Candidates**
- Medium/Hard puzzles require candidate tracking
- Don't guess—use logic

**2. Ignoring Hidden Singles**
- Hidden singles are often easier to spot than complex patterns
- Systematically check each number in each unit

**3. Not Updating Candidates**
- Always eliminate candidates after placing numbers
- Outdated candidates lead to errors

**4. Jumping to Advanced Techniques Too Soon**
- Exhaust simpler techniques first
- Advanced techniques are rarely needed

**5. Forgetting to Check All Units**
- A cell is constrained by its row, column, AND box
- Check all three when eliminating candidates

---

### Speed Solving Tips

**1. Start with High-Frequency Numbers**
- Look for numbers that appear 6-7 times on the board
- These often lead to quick hidden singles

**2. Use Keyboard Shortcuts**
- Learn shortcuts for faster navigation (see [KEYBOARD_SHORTCUTS.md](KEYBOARD_SHORTCUTS.md))
- Arrow keys, Tab, and number keys speed up input

**3. Focus on Crowded Areas**
- Boxes/rows/columns with many filled cells solve faster
- Target areas with 6-7 numbers already placed

**4. Practice Specific Techniques**
- Use the Lessons feature in The London Sudoku
- Practice mode lets you drill techniques without pressure

**5. Don't Overthink**
- If you see a naked single, place it immediately
- Save analysis for when you're stuck

---

### When You're Stuck

**Checklist:**
1. ☐ Re-scan for naked singles
2. ☐ Check for hidden singles (systematically, number by number)
3. ☐ Update all candidates
4. ☐ Look for naked pairs/triples
5. ☐ Check for pointing pairs and box/line reductions
6. ☐ Try X-Wing or XY-Wing
7. ☐ Use a hint (costs -5 points but gets you unstuck)
8. ☐ Take a break and come back with fresh eyes

**If Still Stuck:**
- Check for errors (did you place a wrong number?)
- Review the Lessons for techniques you might have forgotten
- Use a hint strategically to break the deadlock

---

## Variant-Specific Strategies

### X-Sudoku (Diagonal Sudoku)

**Key Strategy**: Treat diagonals as additional rows/columns
- Check diagonals for hidden singles early
- Diagonal constraints often create easy breakthroughs
- Diagonals intersect at the center cell (extra constraint)

**Example**:
```
Main diagonals:
A1-B2-C3-D4-E5-F6-G7-H8-I9
A9-B8-C7-D6-E5-F4-G3-H2-I1

If 5 appears at B2, eliminate 5 from all diagonal cells
```

---

### Killer Sudoku

**Key Strategy**: Use sum constraints to limit candidates
- **Start with small cages** (2-cell cages have limited combinations)
- **Use unique combinations**: A 2-cell cage with sum 3 MUST be {1, 2}
- **Check cage math**: If a 3-cell cage sums to 6, it's {1, 2, 3}
- **Use innies/outies**: Track which cells complete a box's sum

**Common Cage Combinations**:
- Sum 3 (2 cells): {1, 2}
- Sum 4 (2 cells): {1, 3}
- Sum 5 (2 cells): {1, 4} or {2, 3}
- Sum 17 (2 cells): {8, 9}
- Sum 16 (2 cells): {7, 9}

**Example**:
```
Cage sum 15 (2 cells): Must be {7, 8} or {6, 9}
Check row/column/box constraints to determine which
```

---

### Anti-Knight Sudoku

**Key Strategy**: Remember the knight's move constraint
- Cells an "L-shape" apart (2 squares one direction, 1 perpendicular) cannot match
- Visualize knight moves from each cell
- Often creates early hidden singles

**Example**:
```
If cell D4 = 5, then cells with knight's move away cannot be 5:
- B3, B5, C2, C6, E2, E6, F3, F5
```

---

### Thermo Sudoku

**Key Strategy**: Use thermometer constraints to limit candidates
- **Bulb = lowest number**, tip = highest
- **Strict increase**: Each cell > previous cell
- **Short thermos**: A 2-cell thermo cannot be {1, 9} if they're adjacent
- **Long thermos**: Limits based on length (e.g., 5-cell thermo: bulb ≤ 5, tip ≥ 5)

**Example**:
```
Thermo with 3 cells:
If bulb = 5, then middle ≥ 6, tip ≥ 7
If tip = 3, then middle ≤ 2, bulb = 1
```

---

### Jigsaw Sudoku

**Key Strategy**: Treat irregular regions like boxes
- **Scan irregular regions** for hidden singles
- **Count region sizes**: All regions should be 9 cells
- **Region shape matters**: Long thin regions have different properties than compact ones

**Example**:
```
If an irregular region has 8 cells filled with 1-8:
The remaining cell MUST be 9 (hidden single)
```

---

### Consecutive Sudoku

**Key Strategy**: Use marked/unmarked constraints
- **White dot/bar**: Cells ARE consecutive (differ by 1)
- **No mark**: Cells are NOT consecutive (differ by ≥2)
- **High/low constraints**: 1 can only neighbor 2; 9 can only neighbor 8

**Example**:
```
Two cells with white bar between them:
If left = 5, then right = 4 or 6
If right = 1, then left MUST be 2 (only option)
```

---

### Hyper Sudoku

**Key Strategy**: Track four extra regions
- **Four extra 3×3 regions** overlaid on grid
- **Early hidden singles**: Check extra regions for each number
- **Conflicting constraints**: Use overlaps between standard boxes and hyper regions

**Example**:
```
Standard grid boxes:
┌─────┬─────┬─────┐
│Box 1│Box 2│Box 3│
├─────┼─────┼─────┤
│Box 4│Box 5│Box 6│
├─────┼─────┼─────┤
│Box 7│Box 8│Box 9│
└─────┴─────┴─────┘

Hyper regions (overlaid):
    ┌─────┐   ┌─────┐
    │Hyper│   │Hyper│
    │  1  │   │  2  │
    └─────┘   └─────┘
    ┌─────┐   ┌─────┐
    │Hyper│   │Hyper│
    │  3  │   │  4  │
    └─────┘   └─────┘

Check all 13 regions (9 standard + 4 hyper) for hidden singles!
```

---

## 🎓 Practice Makes Perfect

**Next Steps:**
1. **Start with Easy puzzles**: Master beginner techniques
2. **Progress to Medium**: Add candidate tracking and intermediate techniques
3. **Challenge yourself with Hard**: Apply advanced techniques
4. **Try Variants**: Expand your skills with different rule sets
5. **Use Lessons**: The London Sudoku's lesson system teaches these techniques interactively

**Remember**: Every expert was once a beginner. Keep practicing, and you'll master even the hardest puzzles!

---

**Happy Solving!** 🧩✨
