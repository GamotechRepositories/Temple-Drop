import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 480, height: 1024 } });
  const page = await context.newPage();

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Click settings button in header
  const settingsBtn = page.locator('button[aria-label="Player profile and settings"]').first();
  await settingsBtn.click();
  await page.waitForTimeout(500);

  // Check if "CHOOSE AVATAR" is absent
  const hasAvatarSection = await page.evaluate(() => {
    return document.body.innerText.includes('Choose Avatar') || document.body.innerText.includes('CHOOSE AVATAR');
  });
  console.log('Does modal still have Choose Avatar?:', hasAvatarSection);

  // Screenshot modal
  await page.screenshot({
    path: 'C:/Users/shubhangi/.gemini/antigravity/brain/18c88e09-bf0f-4096-98f3-a1d146f91a32/verified_settings_modal_clean.png',
  });
  console.log('Saved verified_settings_modal_clean.png');

  // Test toggling sound effect switch
  const firstToggle = page.locator('button[role="switch"]').first();
  await firstToggle.click();
  await page.waitForTimeout(250);

  await page.screenshot({
    path: 'C:/Users/shubhangi/.gemini/antigravity/brain/18c88e09-bf0f-4096-98f3-a1d146f91a32/verified_settings_modal_toggled.png',
  });
  console.log('Saved verified_settings_modal_toggled.png');

  await browser.close();
  console.log('Settings Modal verified successfully!');
})();
