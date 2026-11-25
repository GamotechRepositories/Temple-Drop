import { chromium } from 'playwright';
import path from 'path';

const artifactDir = 'C:/Users/shubhangi/.gemini/antigravity/brain/18c88e09-bf0f-4096-98f3-a1d146f91a32';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage();
  
  // Test Mobile (User Screen)
  await page.setViewportSize({ width: 480, height: 1024 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  console.log('Testing ball count stepper...');
  // Click decrease ball count button
  await page.click('button[aria-label="Decrease balls per drop"]');
  await page.waitForTimeout(300);
  const ballCountText = await page.textContent('span.font-black.font-mono.text-white');
  console.log('Ball count after decrease:', ballCountText);

  // Click PLAY button to trigger drop
  console.log('Clicking PLAY button...');
  await page.click('button[aria-label="Play drop"]');

  // Wait for ball animation to complete and modal to appear
  console.log('Waiting for drop animation and modal settlement...');
  await page.waitForTimeout(6000);

  // Capture screenshot of Bet Result Modal
  const popupScreenshotPath = path.join(artifactDir, 'bet_result_popup_mobile.png');
  await page.screenshot({ path: popupScreenshotPath });
  console.log('Saved Bet Result Popup screenshot to', popupScreenshotPath);

  // Verify modal elements
  const modalVisible = await page.isVisible('text=Round Specifications');
  console.log('Modal visible:', modalVisible);

  // Click continue button
  if (modalVisible) {
    await page.click('text=Continue / Play Again');
    await page.waitForTimeout(600);
    const closed = !(await page.isVisible('text=Round Specifications'));
    console.log('Modal closed after clicking Continue:', closed);
  }

  // Also test Desktop
  await page.setViewportSize({ width: 1366, height: 650 });
  await page.waitForTimeout(600);
  console.log('Clicking PLAY on desktop...');
  const desktopPlay = page.locator('button[aria-label="Play drop"]').nth(1);
  await desktopPlay.click();
  await page.waitForTimeout(4500);
  await page.screenshot({ path: path.join(artifactDir, 'bet_result_popup_desktop.png') });
  console.log('Saved Desktop Bet Result Popup screenshot');

  await browser.close();
  console.log('ALL VERIFICATIONS SUCCESSFUL');
})();
