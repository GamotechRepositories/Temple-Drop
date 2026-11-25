import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 480, height: 1024 } });
  const page = await context.newPage();

  page.on('console', msg => console.log('CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('response', res => {
    if (res.url().includes('/api/')) {
      console.log('API:', res.status(), res.url());
    }
  });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const t0 = Date.now();
  console.log('Clicking BET button...');
  await page.locator('button[aria-label="BET"]').first().click();

  // Check every 500ms for 6 seconds
  for (let i = 1; i <= 12; i++) {
    await page.waitForTimeout(500);
    const state = await page.evaluate(() => {
      const rootHtml = document.getElementById('root')?.innerHTML?.length || 0;
      const modalOpen = document.body.innerText.includes('Continue / Play Again');
      return { rootHtmlLen: rootHtml, modalOpen };
    });
    console.log(`t+${i * 500}ms:`, state);
    if (state.rootHtmlLen === 0) {
      console.log('BLANK SCREEN DETECTED!');
      break;
    }
    if (state.modalOpen) {
      console.log(`Result modal appeared at ${Date.now() - t0}ms!`);
      break;
    }
  }

  await browser.close();
})();
