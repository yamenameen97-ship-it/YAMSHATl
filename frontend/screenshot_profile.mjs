import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 500, height: 1080 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
});

await context.addInitScript(() => {
  const session = {
    username: 'yamenameen97',
    user: 'yamenameen97',
    email: 'yamenameen97@example.com',
    token: 'dummy.token.value',
    remember_me: true,
  };
  localStorage.setItem('user', JSON.stringify(session));
  localStorage.setItem('yamshatAuth', JSON.stringify(session));
  localStorage.setItem('yamshat-auth', JSON.stringify(session));
  localStorage.setItem('yamshat-language', 'ar');
  localStorage.setItem('yamshat-theme', 'dark');
});

const page = await context.newPage();
await page.goto('http://127.0.0.1:4173/profile', { waitUntil: 'networkidle' });
await page.screenshot({ path: '/home/user/downloads/yamproj/yamshat/frontend/profile-preview.png', fullPage: true });
await browser.close();
