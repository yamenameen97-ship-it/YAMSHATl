import { expect, test } from '@playwright/test';

function lessThan(limit) {
  return {
    asymmetricMatch(value) {
      return Number(value) < limit;
    },
    toString() {
      return `< ${limit}`;
    },
  };
}

const messages = Array.from({ length: 180 }, (_, index) => ({
  id: index + 1,
  sender: index % 2 === 0 ? 'tester' : 'other-user',
  receiver: index % 2 === 0 ? 'other-user' : 'tester',
  message: `رسالة تجريبية رقم ${index + 1}`,
  type: 'text',
  created_at: new Date(Date.UTC(2026, 0, 1, 10, index % 60, 0)).toISOString(),
}));

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600, user_id: 1, typ: 'access' }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
    const fakeToken = `header.${payload}.signature`;
    const user = {
      token: fakeToken,
      access_token: fakeToken,
      refresh_token: 'refresh-token',
      username: 'tester',
      user: 'tester',
      role: 'user',
      email_verified: true,
    };
    window.sessionStorage.setItem('yamshat_user_session', JSON.stringify(user));
  });

  await page.route('**/api/messages**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(messages),
    });
  });

  await page.route('**/api/presence/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ is_online: true, last_seen: null }),
    });
  });

  await page.route('**/api/chat_block_status/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ blocked_by_me: false, blocked_me: false, can_chat: true }),
    });
  });

  await page.route('**/api/update_online', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
  });

  await page.route('**/api/message_seen', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
  });

  await page.route('**/api/analytics/events', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'ok' }) });
  });
});

test('renders long chat with virtualized list and send controls', async ({ page }) => {
  await page.goto('/chat/other-user');
  await expect(page.getByText('other-user')).toBeVisible();
  await expect(page.getByPlaceholder(/ابحث داخل المحادثة|Search conversation/)).toBeVisible();
  await expect(page.getByText('رسالة تجريبية رقم 1')).toBeVisible();
  await expect(page.locator('.message-row')).toHaveCount(lessThan(80));
  await page.locator('.messages-shell').evaluate((node) => {
    node.scrollTop = node.scrollHeight;
    node.dispatchEvent(new Event('scroll'));
  });
  await expect(page.getByText('رسالة تجريبية رقم 180')).toBeVisible();
  await expect(page.getByRole('button', { name: /إرسال|Send/ })).toBeVisible();
});
