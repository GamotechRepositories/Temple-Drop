import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  // 1. Mobile view
  const ctxMobile = await browser.newContext({ viewport: { width: 480, height: 1024 } });
  const pageMobile = await ctxMobile.newPage();
  await pageMobile.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await pageMobile.waitForTimeout(800);
  await pageMobile.screenshot({
    path: 'C:/Users/shubhangi/.gemini/antigravity/brain/18c88e09-bf0f-4096-98f3-a1d146f91a32/verified_bottom_theme_mobile.png',
  });

  // 2. Desktop view
  const ctxDesktop = await browser.newContext({ viewport: { width: 1366, height: 650 } });
  const pageDesktop = await ctxDesktop.newPage();
  await pageDesktop.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await pageDesktop.waitForTimeout(800);
  await pageDesktop.screenshot({
    path: 'C:/Users/shubhangi/.gemini/antigravity/brain/18c88e09-bf0f-4096-98f3-a1d146f91a32/verified_bottom_theme_desktop.png',
  });

  await browser.close();
  console.log('Bottom theme screenshots saved!');
})();
