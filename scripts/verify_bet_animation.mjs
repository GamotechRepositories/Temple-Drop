import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 480, height: 1024 } });
  const page = await context.newPage();

  const pageErrors = [];
  page.on('pageerror', err => {
    pageErrors.push(err.message);
    console.log('PAGE ERROR:', err.message);
  });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  await page.locator('button[aria-label="BET"]').first().click();

  // Capture mid-animation at 1.5s
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: 'C:/Users/shubhangi/.gemini/antigravity/brain/18c88e09-bf0f-4096-98f3-a1d146f91a32/verified_mid_drop_balls.png',
  });
  console.log('Mid-drop screenshot saved');

  // Wait for modal to settle at +3.8s (total 5.3s)
  await page.waitForTimeout(3800);
  const modalVisible = await page.locator('text=Continue / Play Again').isVisible();
  console.log('Bet Result Modal visible after animation?:', modalVisible);
  console.log('Page errors count:', pageErrors.length);

  await page.screenshot({
    path: 'C:/Users/shubhangi/.gemini/antigravity/brain/18c88e09-bf0f-4096-98f3-a1d146f91a32/verified_settled_bet_result.png',
  });

  await browser.close();
})();
