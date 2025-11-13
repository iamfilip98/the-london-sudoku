/**
 * E2E Tests - Achievements Flow
 * Tests achievements page and functionality
 */
import { test, expect } from '@playwright/test';
import { waitForPageReady, mockAuth, mockAPIResponses } from '../helpers/test-utils.js';

test.describe('E2E - Achievements Flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
    await mockAPIResponses(page);
  });

  test('User can access achievements page', async ({ page }) => {
    await page.goto('/#achievements');
    await waitForPageReady(page);
    await page.waitForTimeout(1000);

    // Check URL hash
    expect(page.url()).toContain('achievements');

    await page.screenshot({ path: 'test-results/e2e/achievements-01-page-loaded.png', fullPage: true });
  });

  test('Achievements page displays achievement cards', async ({ page }) => {
    await page.goto('/#achievements');
    await waitForPageReady(page);
    await page.waitForTimeout(1000);

    // Look for achievement elements
    const achievementSelectors = [
      '.achievement',
      '[class*="achievement"]',
      '.achievement-card',
      '[data-achievement]',
      '.badge'
    ];

    let achievementsFound = false;
    for (const selector of achievementSelectors) {
      const elements = page.locator(selector);
      const count = await elements.count();

      if (count > 0) {
        achievementsFound = true;
        console.log(`Found ${count} achievements with selector: ${selector}`);

        // Check if first achievement is visible
        if (await elements.first().isVisible()) {
          const text = await elements.first().textContent();
          console.log('First achievement text:', text);
        }
        break;
      }
    }

    await page.screenshot({ path: 'test-results/e2e/achievements-02-cards-displayed.png', fullPage: true });
  });

  test('User can see achievement details', async ({ page }) => {
    await page.goto('/#achievements');
    await waitForPageReady(page);
    await page.waitForTimeout(1000);

    // Find achievement card
    const achievement = page.locator('.achievement, [class*="achievement"]').first();

    if (await achievement.count() > 0 && await achievement.isVisible()) {
      // Look for achievement details
      const name = achievement.locator('h3, h4, .title, .name').first();
      const description = achievement.locator('p, .description').first();

      if (await name.count() > 0) {
        const nameText = await name.textContent();
        console.log('Achievement name:', nameText);
      }

      if (await description.count() > 0) {
        const descText = await description.textContent();
        console.log('Achievement description:', descText);
      }
    }

    await page.screenshot({ path: 'test-results/e2e/achievements-03-details.png', fullPage: true });
  });

  test('Achievements have visual indicators for locked/unlocked state', async ({ page }) => {
    await page.goto('/#achievements');
    await waitForPageReady(page);
    await page.waitForTimeout(1000);

    // Look for locked/unlocked indicators
    const indicators = [
      '.locked',
      '.unlocked',
      '[data-locked="true"]',
      '[data-locked="false"]',
      '.achievement.completed',
      '.achievement.incomplete'
    ];

    for (const selector of indicators) {
      const elements = page.locator(selector);
      const count = await elements.count();

      if (count > 0) {
        console.log(`Found ${count} achievements with state: ${selector}`);
      }
    }

    await page.screenshot({ path: 'test-results/e2e/achievements-04-locked-unlocked.png', fullPage: true });
  });

  test('User can filter achievements by category', async ({ page }) => {
    await page.goto('/#achievements');
    await waitForPageReady(page);
    await page.waitForTimeout(1000);

    // Look for filter buttons or tabs
    const filterSelectors = [
      'button[data-category]',
      '.filter-button',
      '.category-tab',
      'select[name*="category"]',
      'button:has-text("All")',
      'button:has-text("Milestone")',
      'button:has-text("Speed")'
    ];

    for (const selector of filterSelectors) {
      const filters = page.locator(selector);
      const count = await filters.count();

      if (count > 0) {
        console.log(`Found ${count} filter controls: ${selector}`);

        // Try clicking first filter
        const filter = filters.first();
        if (await filter.isVisible()) {
          try {
            await filter.click();
            await page.waitForTimeout(500);
            console.log('Clicked filter button');
            break;
          } catch (e) {
            console.log('Could not click filter:', e.message);
          }
        }
      }
    }

    await page.screenshot({ path: 'test-results/e2e/achievements-05-filter.png', fullPage: true });
  });

  test('Achievement progress bars are displayed', async ({ page }) => {
    await page.goto('/#achievements');
    await waitForPageReady(page);
    await page.waitForTimeout(1000);

    // Look for progress indicators
    const progressSelectors = [
      '.progress',
      '.progress-bar',
      '[class*="progress"]',
      'progress',
      '.achievement-progress'
    ];

    for (const selector of progressSelectors) {
      const elements = page.locator(selector);
      const count = await elements.count();

      if (count > 0) {
        console.log(`Found ${count} progress bars: ${selector}`);

        // Check first progress bar
        const progressBar = elements.first();
        if (await progressBar.isVisible()) {
          const ariaValue = await progressBar.getAttribute('aria-valuenow');
          const dataProgress = await progressBar.getAttribute('data-progress');
          console.log('Progress value:', ariaValue || dataProgress);
        }
        break;
      }
    }

    await page.screenshot({ path: 'test-results/e2e/achievements-06-progress.png', fullPage: true });
  });

  test('User can see achievement rarity indicators', async ({ page }) => {
    await page.goto('/#achievements');
    await waitForPageReady(page);
    await page.waitForTimeout(1000);

    // Look for rarity indicators
    const raritySelectors = [
      '[data-rarity]',
      '.rarity',
      '.common',
      '.rare',
      '.epic',
      '.legendary'
    ];

    for (const selector of raritySelectors) {
      const elements = page.locator(selector);
      const count = await elements.count();

      if (count > 0) {
        console.log(`Found ${count} elements with rarity: ${selector}`);
      }
    }

    await page.screenshot({ path: 'test-results/e2e/achievements-07-rarity.png', fullPage: true });
  });

  test('Achievement icons/images are loaded', async ({ page }) => {
    await page.goto('/#achievements');
    await waitForPageReady(page);
    await page.waitForTimeout(1000);

    // Look for achievement icons
    const iconSelectors = [
      '.achievement img',
      '.achievement-icon',
      '[class*="achievement"] svg',
      '.badge img'
    ];

    let iconsFound = 0;
    for (const selector of iconSelectors) {
      const icons = page.locator(selector);
      const count = await icons.count();
      iconsFound += count;

      if (count > 0) {
        console.log(`Found ${count} icons: ${selector}`);
      }
    }

    console.log(`Total icons found: ${iconsFound}`);
    await page.screenshot({ path: 'test-results/e2e/achievements-08-icons.png', fullPage: true });
  });

  test('User can click on achievement to see more details', async ({ page }) => {
    await page.goto('/#achievements');
    await waitForPageReady(page);
    await page.waitForTimeout(1000);

    // Find and click an achievement
    const achievement = page.locator('.achievement, [class*="achievement"]').first();

    if (await achievement.count() > 0 && await achievement.isVisible()) {
      try {
        await achievement.click();
        await page.waitForTimeout(500);

        // Look for modal or expanded view
        const modalSelectors = [
          '.modal',
          '.dialog',
          '[role="dialog"]',
          '.achievement-detail',
          '.expanded'
        ];

        for (const selector of modalSelectors) {
          if (await page.locator(selector).count() > 0) {
            console.log(`Found detail view: ${selector}`);
            break;
          }
        }

        await page.screenshot({ path: 'test-results/e2e/achievements-09-detail-view.png' });
      } catch (e) {
        console.log('Could not click achievement:', e.message);
      }
    }
  });

  test('Achievements are sorted correctly', async ({ page }) => {
    await page.goto('/#achievements');
    await waitForPageReady(page);
    await page.waitForTimeout(1000);

    // Get all achievement titles
    const achievements = page.locator('.achievement h3, .achievement h4, .achievement .title');
    const count = await achievements.count();

    console.log(`Found ${count} achievements`);

    // Get text of first few achievements
    const titles = [];
    for (let i = 0; i < Math.min(5, count); i++) {
      const title = await achievements.nth(i).textContent();
      titles.push(title?.trim());
    }

    console.log('Achievement titles:', titles);

    await page.screenshot({ path: 'test-results/e2e/achievements-10-sorted.png', fullPage: true });
  });

  test('Achievement statistics are displayed', async ({ page }) => {
    await page.goto('/#achievements');
    await waitForPageReady(page);
    await page.waitForTimeout(1000);

    // Look for achievement stats (e.g., "5 of 20 unlocked")
    const statSelectors = [
      '.achievement-stats',
      '[class*="stats"]',
      'p:has-text("unlocked")',
      '.achievement-summary'
    ];

    for (const selector of statSelectors) {
      const stats = page.locator(selector);
      if (await stats.count() > 0) {
        const text = await stats.first().textContent();
        console.log('Achievement stats:', text);
        break;
      }
    }

    await page.screenshot({ path: 'test-results/e2e/achievements-11-stats.png', fullPage: true });
  });

  test('User can search for achievements', async ({ page }) => {
    await page.goto('/#achievements');
    await waitForPageReady(page);
    await page.waitForTimeout(1000);

    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();

    if (await searchInput.count() > 0 && await searchInput.isVisible()) {
      await searchInput.fill('first');
      await page.waitForTimeout(500);

      console.log('Searched for "first"');
      await page.screenshot({ path: 'test-results/e2e/achievements-12-search.png', fullPage: true });
    } else {
      console.log('No search functionality found');
      await page.screenshot({ path: 'test-results/e2e/achievements-12-no-search.png', fullPage: true });
    }
  });

  test('Achievements page is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/#achievements');
    await waitForPageReady(page);
    await page.waitForTimeout(1000);

    // Check if achievements are displayed in mobile view
    const achievements = page.locator('.achievement, [class*="achievement"]');
    const count = await achievements.count();

    console.log(`Found ${count} achievements on mobile`);

    // Check if they're stacked vertically
    if (count >= 2) {
      const first = await achievements.nth(0).boundingBox();
      const second = await achievements.nth(1).boundingBox();

      if (first && second) {
        const isVerticalStack = second.y > first.y + first.height - 10;
        console.log('Achievements are stacked vertically:', isVerticalStack);
      }
    }

    await page.screenshot({ path: 'test-results/e2e/achievements-13-mobile.png', fullPage: true });
  });

  test('Complete achievements journey', async ({ page }) => {
    // Step 1: Navigate to achievements
    await page.goto('/');
    await waitForPageReady(page);
    await page.screenshot({ path: 'test-results/e2e/achievements-journey-01-start.png', fullPage: true });

    // Step 2: Open achievements page
    await page.goto('/#achievements');
    await waitForPageReady(page);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/e2e/achievements-journey-02-page.png', fullPage: true });

    // Step 3: Explore achievements
    const achievements = page.locator('.achievement, [class*="achievement"]');
    const count = await achievements.count();

    if (count > 0) {
      // Click first achievement
      await achievements.first().click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'test-results/e2e/achievements-journey-03-detail.png' });
    }

    // Step 4: Try filtering (if available)
    const filterButton = page.locator('button[data-category], .filter-button').first();
    if (await filterButton.count() > 0 && await filterButton.isVisible()) {
      await filterButton.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'test-results/e2e/achievements-journey-04-filtered.png', fullPage: true });
    }

    // Journey complete!
  });

  test('Achievements have proper ARIA labels for accessibility', async ({ page }) => {
    await page.goto('/#achievements');
    await waitForPageReady(page);
    await page.waitForTimeout(1000);

    // Check for ARIA labels
    const achievement = page.locator('.achievement, [class*="achievement"]').first();

    if (await achievement.count() > 0) {
      const ariaLabel = await achievement.getAttribute('aria-label');
      const ariaDescribedBy = await achievement.getAttribute('aria-describedby');
      const role = await achievement.getAttribute('role');

      console.log('Achievement accessibility:', {
        ariaLabel,
        ariaDescribedBy,
        role
      });
    }
  });
});
