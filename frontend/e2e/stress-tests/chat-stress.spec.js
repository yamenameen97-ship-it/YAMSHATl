import { test, expect } from '@playwright/test';

test.describe('Chat Realtime Stress Test', () => {
  test('should handle rapid message bursts', async ({ page }) => {
    await page.goto('/login');
    // تسجيل الدخول (بافتراض وجود مستخدم تجريبي)
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForURL('/chat');

    const messageInput = page.locator('input[placeholder*="Type a message"]');
    const sendButton = page.locator('button:has-text("Send")');

    // إرسال 50 رسالة بشكل سريع جداً لمحاكاة الضغط
    for (let i = 0; i < 50; i++) {
      await messageInput.fill(`Stress test message #${i}`);
      await sendButton.click();
      // لا ننتظر هنا لمحاكاة السرعة العالية
    }

    // التحقق من أن الواجهة لا تزال مستجيبة
    await expect(page.locator('text=Stress test message #49')).toBeVisible({ timeout: 10000 });
  });

  test('should handle multiple reconnects', async ({ page }) => {
    await page.goto('/chat');
    
    for (let i = 0; i < 5; i++) {
      // محاكاة انقطاع الإنترنت عبر تعطيل الـ Network
      await page.context().setOffline(true);
      await page.waitForTimeout(2000);
      
      // إعادة الاتصال
      await page.context().setOffline(false);
      await page.waitForTimeout(5000); // انتظار إعادة الاتصال (Exponential Backoff)
      
      // التحقق من أن السوكيت عاد للعمل
      const statusIndicator = page.locator('.socket-status-online');
      await expect(statusIndicator).toBeVisible();
    }
  });
});
