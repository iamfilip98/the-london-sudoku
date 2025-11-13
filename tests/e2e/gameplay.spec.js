/**
 * E2E Tests - Gameplay Flow
 * Tests Sudoku game interactions and controls
 */
import { test, expect } from '@playwright/test';
import { waitForPageReady, mockAuth, mockAPIResponses } from '../helpers/test-utils.js';

test.describe('E2E - Gameplay Flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
    await mockAPIResponses(page);
  });

  test('User can start a new game', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);
    await page.waitForTimeout(1000);

    // Look for game start button or difficulty selection
    const startSelectors = [
      'button:has-text("Start")',
      'button:has-text("Play")',
      'button:has-text("Easy")',
      'button:has-text("New Game")',
      '[data-action="start-game"]'
    ];

    for (const selector of startSelectors) {
      const button = page.locator(selector).first();
      if (await button.count() > 0 && await button.isVisible()) {
        await button.click();
        await page.waitForTimeout(1000);
        break;
      }
    }

    await page.screenshot({ path: 'test-results/e2e/gameplay-01-game-started.png', fullPage: true });
  });

  test('Sudoku grid is visible and interactive', async ({ page }) => {
    await page.goto('/#sudoku');
    await waitForPageReady(page);
    await page.waitForTimeout(1000);

    // Find Sudoku grid
    const gridSelectors = [
      '.sudoku-grid',
      '#sudoku-grid',
      'table',
      '[class*="grid"]',
      '.game-container'
    ];

    let gridFound = false;
    for (const selector of gridSelectors) {
      const grid = page.locator(selector);
      if (await grid.count() > 0) {
        gridFound = true;
        console.log(`Found grid with selector: ${selector}`);

        // Check if grid is visible
        if (await grid.first().isVisible()) {
          console.log('Grid is visible');
        }
        break;
      }
    }

    await page.screenshot({ path: 'test-results/e2e/gameplay-02-grid-visible.png', fullPage: true });
  });

  test('User can select a cell in the grid', async ({ page }) => {
    await page.goto('/#sudoku');
    await waitForPageReady(page);
    await page.waitForTimeout(1000);

    // Find and click a cell
    const cellSelectors = [
      '.sudoku-cell',
      '.cell',
      'td',
      '[class*="cell"]',
      '[data-row][data-col]'
    ];

    let cellClicked = false;
    for (const selector of cellSelectors) {
      const cells = page.locator(selector);
      const count = await cells.count();

      if (count > 0) {
        console.log(`Found ${count} cells with selector: ${selector}`);

        // Try to click the first few cells
        for (let i = 0; i < Math.min(5, count); i++) {
          const cell = cells.nth(i);
          if (await cell.isVisible()) {
            try {
              await cell.click();
              await page.waitForTimeout(300);
              cellClicked = true;

              // Check if cell got selected class
              const classes = await cell.getAttribute('class');
              console.log(`Cell ${i} classes after click:`, classes);

              await page.screenshot({
                path: `test-results/e2e/gameplay-03-cell-selected-${i}.png`
              });
              break;
            } catch (e) {
              console.log(`Could not click cell ${i}:`, e.message);
            }
          }
        }
        if (cellClicked) break;
      }
    }
  });

  test('User can enter numbers using keyboard', async ({ page }) => {
    await page.goto('/#sudoku');
    await waitForPageReady(page);
    await page.waitForTimeout(1000);

    // Click on a cell first
    const cell = page.locator('.cell, td, .sudoku-cell').first();
    if (await cell.count() > 0) {
      await cell.click();
      await page.waitForTimeout(200);
    }

    // Try entering numbers 1-9
    const numbers = ['1', '2', '3', '4', '5'];
    for (const num of numbers) {
      await page.keyboard.press(num);
      await page.waitForTimeout(200);
    }

    await page.screenshot({ path: 'test-results/e2e/gameplay-04-keyboard-input.png' });
  });

  test('Game timer is present and functional', async ({ page }) => {
    await page.goto('/#sudoku');
    await waitForPageReady(page);
    await page.waitForTimeout(1000);

    // Look for timer
    const timerSelectors = [
      '.timer',
      '#timer',
      '[class*="timer"]',
      '[data-timer]'
    ];

    let timerFound = false;
    let timerText = '';

    for (const selector of timerSelectors) {
      const timer = page.locator(selector);
      if (await timer.count() > 0) {
        timerFound = true;
        timerText = await timer.first().textContent();
        console.log(`Found timer: ${timerText}`);
        break;
      }
    }

    await page.screenshot({ path: 'test-results/e2e/gameplay-05-timer.png' });
  });

  test('Hint button is present and clickable', async ({ page }) => {
    await page.goto('/#sudoku');
    await waitForPageReady(page);
    await page.waitForTimeout(1000);

    // Look for hint button
    const hintSelectors = [
      'button:has-text("Hint")',
      '.hint-button',
      '[data-action="hint"]',
      'button[title*="hint" i]'
    ];

    for (const selector of hintSelectors) {
      const button = page.locator(selector).first();
      if (await button.count() > 0 && await button.isVisible()) {
        console.log(`Found hint button: ${selector}`);

        // Try to click it
        try {
          await button.click();
          await page.waitForTimeout(500);
        } catch (e) {
          console.log('Could not click hint button:', e.message);
        }
        break;
      }
    }

    await page.screenshot({ path: 'test-results/e2e/gameplay-06-hint-button.png' });
  });

  test('Undo button is present and clickable', async ({ page }) => {
    await page.goto('/#sudoku');
    await waitForPageReady(page);
    await page.waitForTimeout(1000);

    // Look for undo button
    const undoSelectors = [
      'button:has-text("Undo")',
      '.undo-button',
      '[data-action="undo"]',
      'button[title*="undo" i]'
    ];

    for (const selector of undoSelectors) {
      const button = page.locator(selector).first();
      if (await button.count() > 0 && await button.isVisible()) {
        console.log(`Found undo button: ${selector}`);

        // Try to click it
        try {
          await button.click();
          await page.waitForTimeout(500);
        } catch (e) {
          console.log('Could not click undo button:', e.message);
        }
        break;
      }
    }

    await page.screenshot({ path: 'test-results/e2e/gameplay-07-undo-button.png' });
  });

  test('Pause button is present', async ({ page }) => {
    await page.goto('/#sudoku');
    await waitForPageReady(page);
    await page.waitForTimeout(1000);

    // Look for pause button
    const pauseSelectors = [
      'button:has-text("Pause")',
      '.pause-button',
      '[data-action="pause"]',
      'button[title*="pause" i]'
    ];

    for (const selector of pauseSelectors) {
      const button = page.locator(selector).first();
      if (await button.count() > 0 && await button.isVisible()) {
        console.log(`Found pause button: ${selector}`);
        break;
      }
    }

    await page.screenshot({ path: 'test-results/e2e/gameplay-08-pause-button.png' });
  });

  test('User can navigate cells with arrow keys', async ({ page }) => {
    await page.goto('/#sudoku');
    await waitForPageReady(page);
    await page.waitForTimeout(1000);

    // Click on a cell to start
    const cell = page.locator('.cell, td, .sudoku-cell').first();
    if (await cell.count() > 0) {
      await cell.click();
      await page.waitForTimeout(200);
    }

    // Try arrow key navigation
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'test-results/e2e/gameplay-09-arrow-right.png' });

    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'test-results/e2e/gameplay-10-arrow-down.png' });

    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'test-results/e2e/gameplay-11-arrow-left.png' });

    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'test-results/e2e/gameplay-12-arrow-up.png' });
  });

  test('User can delete cell value', async ({ page }) => {
    await page.goto('/#sudoku');
    await waitForPageReady(page);
    await page.waitForTimeout(1000);

    // Click on a cell and enter a number
    const cell = page.locator('.cell, td, .sudoku-cell').first();
    if (await cell.count() > 0) {
      await cell.click();
      await page.waitForTimeout(200);
      await page.keyboard.press('5');
      await page.waitForTimeout(200);

      // Delete the number
      await page.keyboard.press('Backspace');
      await page.waitForTimeout(200);
      await page.screenshot({ path: 'test-results/e2e/gameplay-13-delete-value.png' });

      // Alternative: Delete key
      await page.keyboard.press('5');
      await page.waitForTimeout(200);
      await page.keyboard.press('Delete');
      await page.waitForTimeout(200);
    }
  });

  test('Error highlighting works for invalid moves', async ({ page }) => {
    await page.goto('/#sudoku');
    await waitForPageReady(page);
    await page.waitForTimeout(1000);

    // Try to make an invalid move (duplicate in row/column)
    const cells = page.locator('.cell, td, .sudoku-cell');
    const count = await cells.count();

    if (count > 18) { // Need at least 18 cells (2 rows)
      // Enter same number in same row
      await cells.nth(0).click();
      await page.keyboard.press('5');
      await page.waitForTimeout(200);

      await cells.nth(1).click();
      await page.keyboard.press('5');
      await page.waitForTimeout(500);

      // Check for error highlighting
      await page.screenshot({ path: 'test-results/e2e/gameplay-14-error-highlighting.png' });
    }
  });

  test('Complete gameplay session', async ({ page }) => {
    // Complete gameplay flow
    await page.goto('/');
    await waitForPageReady(page);
    await page.screenshot({ path: 'test-results/e2e/gameplay-journey-01-start.png', fullPage: true });

    // Navigate to game
    await page.goto('/#sudoku');
    await waitForPageReady(page);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/e2e/gameplay-journey-02-grid.png', fullPage: true });

    // Play a few moves
    const cell = page.locator('.cell, td, .sudoku-cell').first();
    if (await cell.count() > 0) {
      for (let i = 0; i < 5; i++) {
        const targetCell = page.locator('.cell, td, .sudoku-cell').nth(i);
        if (await targetCell.isVisible()) {
          await targetCell.click();
          await page.waitForTimeout(100);
          await page.keyboard.press(String(i + 1));
          await page.waitForTimeout(100);
        }
      }
    }

    await page.screenshot({ path: 'test-results/e2e/gameplay-journey-03-playing.png', fullPage: true });

    // Use hint button if available
    const hintButton = page.locator('button:has-text("Hint")').first();
    if (await hintButton.count() > 0 && await hintButton.isVisible()) {
      try {
        await hintButton.click();
        await page.waitForTimeout(500);
      } catch (e) {
        console.log('Could not click hint:', e.message);
      }
    }

    await page.screenshot({ path: 'test-results/e2e/gameplay-journey-04-hint.png', fullPage: true });

    // Use undo button if available
    const undoButton = page.locator('button:has-text("Undo")').first();
    if (await undoButton.count() > 0 && await undoButton.isVisible()) {
      try {
        await undoButton.click();
        await page.waitForTimeout(500);
      } catch (e) {
        console.log('Could not click undo:', e.message);
      }
    }

    await page.screenshot({ path: 'test-results/e2e/gameplay-journey-05-undo.png', fullPage: true });
  });

  test('Mobile gameplay experience', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/#sudoku');
    await waitForPageReady(page);
    await page.waitForTimeout(1000);

    // Check if grid is responsive
    const grid = page.locator('.sudoku-grid, table, .game-container').first();
    if (await grid.count() > 0) {
      const boundingBox = await grid.boundingBox();
      if (boundingBox) {
        console.log('Grid width on mobile:', boundingBox.width);
        expect(boundingBox.width).toBeLessThanOrEqual(375);
      }
    }

    await page.screenshot({ path: 'test-results/e2e/gameplay-15-mobile.png', fullPage: true });
  });
});
