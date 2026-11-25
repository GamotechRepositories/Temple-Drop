import { chromium } from 'playwright';
import path from 'path';

const outDir = 'C:/Users/shubhangi/.gemini/antigravity/brain/18c88e09-bf0f-4096-98f3-a1d146f91a32';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function run() {
  console.log('Launching headless Chrome via Playwright...');
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1253, height: 562 },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();
  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

  // 1. Desktop baseline (1253x562)
  await page.waitForTimeout(1000);
  const baselinePath = path.join(outDir, 'screenshot_1253x562.png');
  await page.screenshot({ path: baselinePath });
  console.log('Saved baseline desktop screenshot to:', baselinePath);

  // 2. Click PLAY button to trigger drop
  console.log('Clicking PLAY button...');
  const playButton = page.locator('button[aria-label="Play drop"]');
  if (await playButton.isVisible()) {
    await playButton.click();
    await page.waitForTimeout(500);
    const dropPath = path.join(outDir, 'screenshot_drop_active.png');
    await page.screenshot({ path: dropPath });
    console.log('Saved drop active screenshot to:', dropPath);

    // Wait for balls to settle
    await page.waitForTimeout(3000);
    const settledPath = path.join(outDir, 'screenshot_settled.png');
    await page.screenshot({ path: settledPath });
    console.log('Saved settled screenshot to:', settledPath);
  }

  // 3. How to play modal
  console.log('Opening How to Play modal...');
  const howToPlayBtn = page.locator('button[aria-label="How to play instructions"]');
  if (await howToPlayBtn.isVisible()) {
    await howToPlayBtn.click();
    await page.waitForTimeout(500);
    const modalPath = path.join(outDir, 'screenshot_how_to_play.png');
    await page.screenshot({ path: modalPath });
    console.log('Saved how to play modal screenshot to:', modalPath);

    // Close modal
    const closeBtn = page.locator('button[aria-label="Close how to play"]');
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(300);
    }
  }

  // 4. Tablet viewport (768x1024)
  console.log('Testing Tablet viewport 768x1024...');
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(500);
  const tabletPath = path.join(outDir, 'screenshot_tablet_768x1024.png');
  await page.screenshot({ path: tabletPath });
  console.log('Saved tablet screenshot to:', tabletPath);

  // 5. Mobile viewport (360x800)
  console.log('Testing Mobile viewport 360x800...');
  await page.setViewportSize({ width: 360, height: 800 });
  await page.waitForTimeout(500);
  const mobilePath = path.join(outDir, 'screenshot_mobile_360x800.png');
  await page.screenshot({ path: mobilePath });
  console.log('Saved mobile screenshot to:', mobilePath);

  await browser.close();
  console.log('All verification screenshots captured successfully!');
}

run().catch((err) => {
  console.error('Error during verification:', err);
  process.exit(1);
});
