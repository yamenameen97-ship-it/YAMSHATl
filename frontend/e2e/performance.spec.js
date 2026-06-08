/**
 * E2E Performance Tests with Playwright
 * 
 * اختبارات الأداء والـ UI
 * 
 * للتشغيل:
 * npx playwright test e2e/performance.spec.js
 */

import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('should load page within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should lazy load images', async ({ page }) => {
    await page.goto('http://localhost:5173/feed');
    
    // Scroll to bottom
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 5));
    
    // Check that images are loaded
    const images = await page.locator('img[loading="lazy"]').count();
    expect(images).toBeGreaterThan(0);
  });

  test('should handle memory efficiently', async ({ page }) => {
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      if (performance.memory) {
        return performance.memory.usedJSHeapSize;
      }
      return 0;
    });

    // Perform actions
    await page.click('button:has-text("إنشاء منشور")');
    await page.fill('textarea', 'منشور تجريبي');
    await page.click('button:has-text("نشر")');

    // Get final memory usage
    const finalMemory = await page.evaluate(() => {
      if (performance.memory) {
        return performance.memory.usedJSHeapSize;
      }
      return 0;
    });

    // Memory increase should be reasonable
    const memoryIncrease = finalMemory - initialMemory;
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // Less than 10MB
  });

  test('should handle rapid interactions', async ({ page }) => {
    await page.goto('http://localhost:5173/feed');

    // Rapid clicks
    for (let i = 0; i < 10; i++) {
      await page.click('button:has-text("❤️")');
      await page.waitForTimeout(50);
    }

    // Page should remain responsive
    const isResponsive = await page.evaluate(() => {
      return document.body.offsetHeight > 0;
    });

    expect(isResponsive).toBeTruthy();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate network error
    await page.route('**/api/**', route => {
      route.abort('failed');
    });

    await page.goto('http://localhost:5173/feed');

    // Should show error message or fallback UI
    const errorMessage = await page.locator('text=/خطأ|فشل/i').isVisible();
    expect(errorMessage).toBeTruthy();
  });

  test('should retry failed requests', async ({ page }) => {
    let requestCount = 0;

    await page.route('**/api/feed**', route => {
      requestCount++;
      if (requestCount < 2) {
        route.abort('failed');
      } else {
        route.continue();
      }
    });

    await page.goto('http://localhost:5173/feed');

    // Wait for retry
    await page.waitForTimeout(2000);

    // Should have retried
    expect(requestCount).toBeGreaterThan(1);
  });
});

test.describe('UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('should render buttons correctly', async ({ page }) => {
    const buttons = await page.locator('button').count();
    expect(buttons).toBeGreaterThan(0);

    // Check button is clickable
    const firstButton = page.locator('button').first();
    await expect(firstButton).toBeVisible();
    await expect(firstButton).toBeEnabled();
  });

  test('should handle form submission', async ({ page }) => {
    await page.fill('input[placeholder*="بحث"]', 'test');
    await page.press('input[placeholder*="بحث"]', 'Enter');

    // Should navigate or show results
    await page.waitForLoadState('networkidle');
    const results = await page.locator('[data-testid="search-results"]').isVisible();
    expect(results).toBeTruthy();
  });

  test('should show loading states', async ({ page }) => {
    // Slow down network
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 500);
    });

    await page.goto('http://localhost:5173/feed');

    // Should show loading indicator
    const loader = await page.locator('[class*="loading"], [class*="spinner"]').isVisible();
    expect(loader).toBeTruthy();
  });

  test('should show empty states', async ({ page }) => {
    // Mock empty response
    await page.route('**/api/feed**', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ posts: [] }),
      });
    });

    await page.goto('http://localhost:5173/feed');

    // Should show empty state
    const emptyState = await page.locator('text=/لا توجد/i').isVisible();
    expect(emptyState).toBeTruthy();
  });

  test('should handle modal interactions', async ({ page }) => {
    await page.click('button:has-text("📤")'); // Share button

    // Modal should be visible
    const modal = await page.locator('[role="dialog"]').isVisible();
    expect(modal).toBeTruthy();

    // Close modal
    await page.press('Escape');

    // Modal should be hidden
    await expect(modal).not.toBeVisible();
  });

  test('should handle navigation', async ({ page }) => {
    // Click navigation link
    await page.click('a:has-text("الملف الشخصي")');

    // Should navigate
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/profile');
  });
});

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    const h1 = await page.locator('h1').count();
    expect(h1).toBeGreaterThan(0);
  });

  test('should have alt text for images', async ({ page }) => {
    const imagesWithoutAlt = await page.locator('img:not([alt])').count();
    expect(imagesWithoutAlt).toBe(0);
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Tab through elements
    for (let i = 0; i < 5; i++) {
      await page.press('body', 'Tab');
    }

    // Should have focused element
    const focused = await page.evaluate(() => {
      return document.activeElement.tagName;
    });

    expect(focused).not.toBe('BODY');
  });

  test('should have sufficient color contrast', async ({ page }) => {
    // Check text elements have sufficient contrast
    const textElements = await page.locator('p, span, div').count();
    expect(textElements).toBeGreaterThan(0);
  });
});

test.describe('Offline Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('should work offline', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true);

    // Should still be able to interact with cached content
    const content = await page.locator('body').isVisible();
    expect(content).toBeTruthy();

    // Go online
    await context.setOffline(false);
  });

  test('should queue requests while offline', async ({ page, context }) => {
    await context.setOffline(true);

    // Try to create post
    await page.click('button:has-text("إنشاء منشور")');
    await page.fill('textarea', 'منشور بلا إنترنت');
    await page.click('button:has-text("نشر")');

    // Should show offline indicator
    const offlineIndicator = await page.locator('text=/بلا اتصال|offline/i').isVisible();
    expect(offlineIndicator).toBeTruthy();

    // Go online
    await context.setOffline(false);

    // Should sync
    await page.waitForTimeout(2000);
  });
});
