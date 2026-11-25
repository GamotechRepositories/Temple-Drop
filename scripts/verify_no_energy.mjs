import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 480, height: 1024 } });
  const page = await context.newPage();

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Trigger drop
  const playBtn = page.locator('button[aria-label="PLAY"]').first();
  await playBtn.click();
  await page.waitForTimeout(5500);

  await page.screenshot({
    path: 'C:/Users/shubhangi/.gemini/antigravity/brain/18c88e09-bf0f-4096-98f3-a1d146f91a32/verified_no_energy_section.png',
  });
  console.log('Saved verified_no_energy_section.png');

  await browser.close();
})();
