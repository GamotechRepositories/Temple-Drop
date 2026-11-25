import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 480, height: 1024 } });
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Set 50 balls
  for (let i = 0; i < 7; i++) {
    const incBallBtn = page.locator('button[aria-label="Increase balls per drop"]').first();
    if (await incBallBtn.isEnabled()) {
      await incBallBtn.click();
      await page.waitForTimeout(50);
    }
  }

  // Click PLAY
  console.log('Clicking PLAY for 50 balls drop...');
  const playBtn = page.locator('button[aria-label="Play drop"]').first();
  await playBtn.click();

  // Poll every 1s for modal
  for (let s = 1; s <= 10; s++) {
    await page.waitForTimeout(1000);
    const state = await page.evaluate(() => {
      const modal = document.querySelector('div.fixed.inset-0.bg-slate-950\\/85');
      const isDroppingBtn = document.querySelector('button[aria-label="Play drop"]')?.disabled;
      return {
        second: 0,
        modalVisible: Boolean(modal),
        buttonDisabled: isDroppingBtn,
      };
    });
    console.log(`At second ${s}:`, state);
    if (state.modalVisible) {
      console.log('SUCCESS! Modal appeared at second', s);
      await page.screenshot({
        path: 'C:/Users/shubhangi/.gemini/antigravity/brain/18c88e09-bf0f-4096-98f3-a1d146f91a32/play_50balls_modal_open.png',
      });
      break;
    }
  }

  await browser.close();
})();
