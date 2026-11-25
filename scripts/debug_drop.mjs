import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 480, height: 1024 } });
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('response', res => {
    if (res.url().includes('/api/game/drop')) {
      console.log('DROP API RESPONSE STATUS:', res.status());
    }
  });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Click play with default (10 balls @ 0.50)
  console.log('Triggering default drop (10 balls @ 0.50)...');
  const playBtn = page.locator('button[aria-label="Play drop"]').first();
  await playBtn.click();

  // Wait for 6s
  await page.waitForTimeout(6000);

  const modalVisible = await page.evaluate(() => {
    return Boolean(document.querySelector('div.fixed.inset-0'));
  });
  console.log('Default drop Modal Visible?:', modalVisible);

  await page.screenshot({
    path: 'C:/Users/shubhangi/.gemini/antigravity/brain/18c88e09-bf0f-4096-98f3-a1d146f91a32/debug_drop_10balls.png',
  });

  await browser.close();
})();
