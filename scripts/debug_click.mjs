import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.setViewportSize({ width: 480, height: 1024 });
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);

  console.log('Finding PLAY button...');
  const playBtn = page.locator('button[aria-label="Play drop"]').first();
  await playBtn.click();
  console.log('Clicked PLAY button, waiting 7 seconds...');
  await page.waitForTimeout(7000);

  const isModalOpen = await page.isVisible('text=Round Specifications');
  console.log('Is Modal Open?:', isModalOpen);

  await page.screenshot({ path: 'C:/Users/shubhangi/.gemini/antigravity/brain/18c88e09-bf0f-4096-98f3-a1d146f91a32/debug_modal.png' });
  await browser.close();
})();
