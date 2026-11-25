import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 480, height: 1024 } });
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('response', res => {
    if (res.url().includes('/api/game/')) {
      console.log('GAME API:', res.status(), res.url());
    }
  });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Check state of main play button
  const btnInfo = await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label*="PLAY"], button[aria-label*="BONUS"], button[aria-label*="SPIN"]');
    return {
      ariaLabel: btn?.getAttribute('aria-label'),
      text: btn?.innerText?.trim(),
      disabled: btn?.disabled,
    };
  });
  console.log('Main Action Button on load:', btnInfo);

  // Click the main action button
  console.log('Clicking Main Action Button...');
  const mainBtn = page.locator('button[aria-label*="PLAY"], button[aria-label*="BONUS"], button[aria-label*="SPIN"]').first();
  await mainBtn.click();

  // Wait for 5 seconds
  await page.waitForTimeout(5000);

  const afterState = await page.evaluate(() => {
    const modal = document.querySelector('div.fixed.inset-0.bg-slate-950\\/85');
    const btn = document.querySelector('button[aria-label*="PLAY"], button[aria-label*="BONUS"], button[aria-label*="SPIN"]');
    return {
      modalVisible: Boolean(modal),
      btnText: btn?.innerText?.trim(),
      btnDisabled: btn?.disabled,
    };
  });
  console.log('State after 5s:', afterState);

  await page.screenshot({
    path: 'C:/Users/shubhangi/.gemini/antigravity/brain/18c88e09-bf0f-4096-98f3-a1d146f91a32/verified_play_flow.png',
  });
  console.log('Saved verified_play_flow.png');

  await browser.close();
  console.log('Test completed successfully!');
})();
