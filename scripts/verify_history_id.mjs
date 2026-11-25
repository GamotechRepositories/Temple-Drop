import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({
    viewport: { width: 480, height: 1024 },
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const page = await context.newPage();

  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('response', res => {
    if (res.url().includes('/api/game/')) {
      console.log('API:', res.status(), res.url());
    }
  });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Place a bet so history has an entry
  await page.locator('button[aria-label="BET"]').first().click();

  // Wait for Bet Result modal to appear
  const cont = page.locator('text=Continue / Play Again');
  await cont.waitFor({ state: 'visible', timeout: 12000 });
  await cont.click();
  await page.waitForTimeout(400);

  // Open Settings -> My Bet History
  await page.locator('button[aria-label="Player profile and settings"]').first().click();
  await page.waitForTimeout(300);
  await page.locator('text=My Bet History').click();
  await page.waitForTimeout(1000);

  const historyText = await page.evaluate(() => document.body.innerText);
  console.log('Has Bet ID in History?:', historyText.includes('ID: round_'));

  // Click copy button
  const copyBtn = page.locator('button[title^="Copy Bet ID:"]').first();
  if (await copyBtn.isVisible()) {
    await copyBtn.click();
    await page.waitForTimeout(200);
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    console.log('Copied Bet ID from clipboard:', clipboardText);
  }

  await page.screenshot({
    path: 'C:/Users/shubhangi/.gemini/antigravity/brain/18c88e09-bf0f-4096-98f3-a1d146f91a32/verified_history_bet_id.png',
  });

  await browser.close();
})();
