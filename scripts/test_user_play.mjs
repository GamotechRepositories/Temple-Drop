import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 480, height: 1024 } });
  const page = await context.newPage();

  page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('requestfailed', req => console.log('REQ FAILED:', req.url(), req.failure()?.errorText));
  page.on('response', res => {
    if (res.url().includes('/api/')) {
      console.log('API RESPONSE:', res.status(), res.url());
      if (res.status() >= 400) {
        res.text().then(t => console.log('ERROR BODY:', t)).catch(() => {});
      }
    }
  });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Check state in app
  const appState = await page.evaluate(() => {
    return {
      betText: document.querySelector('div.flex.items-center.space-x-2 span.font-mono')?.textContent,
      playBtnDisabled: document.querySelector('button[aria-label="Play drop"]')?.disabled,
      playBtnHTML: document.querySelector('button[aria-label="Play drop"]')?.outerHTML,
    };
  });
  console.log('App State before click:', appState);

  // Click play button
  console.log('Clicking Play Button...');
  const playBtn = page.locator('button[aria-label="Play drop"]').first();
  await playBtn.click();

  await page.waitForTimeout(2000);

  const afterState = await page.evaluate(() => {
    return {
      playBtnDisabled: document.querySelector('button[aria-label="Play drop"]')?.disabled,
      errorText: document.querySelector('.text-rose-400, .bg-rose-500, [class*="rose"]')?.textContent,
    };
  });
  console.log('App State after click:', afterState);

  await page.screenshot({
    path: 'C:/Users/shubhangi/.gemini/antigravity/brain/18c88e09-bf0f-4096-98f3-a1d146f91a32/debug_play_click.png',
  });

  await browser.close();
})();
