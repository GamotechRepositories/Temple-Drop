import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 480, height: 1024 } });
  const page = await context.newPage();

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Open Settings -> Game Rules & Limits
  await page.locator('button[aria-label="Player profile and settings"]').first().click();
  await page.waitForTimeout(300);
  await page.locator('text=Game Rules & Limits').click();
  await page.waitForTimeout(400);

  const rulesText = await page.evaluate(() => document.body.innerText);
  console.log('Has TEMPLE WHEEL OUTCOMES & WEIGHTS?:', rulesText.toUpperCase().includes('TEMPLE WHEEL OUTCOMES'));

  await page.screenshot({
    path: 'C:/Users/shubhangi/.gemini/antigravity/brain/18c88e09-bf0f-4096-98f3-a1d146f91a32/verified_rules_wheel_hidden.png',
  });

  await browser.close();
})();
