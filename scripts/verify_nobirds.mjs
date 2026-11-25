import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  
  // 1. Mobile check
  const contextMobile = await browser.newContext({
    viewport: { width: 480, height: 1024 }
  });
  const pageMobile = await contextMobile.newPage();
  await pageMobile.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await pageMobile.waitForTimeout(1000);
  
  // Count birds
  const birdsCountMobile = await pageMobile.evaluate(() => {
    return document.querySelectorAll('svg[class*="flyAcross"], [style*="flyAcross"]').length;
  });
  console.log('Mobile Birds SVG count:', birdsCountMobile);

  await pageMobile.screenshot({
    path: 'C:/Users/shubhangi/.gemini/antigravity/brain/18c88e09-bf0f-4096-98f3-a1d146f91a32/clean_bg_nobirds_mobile.png',
    fullPage: false
  });

  // 2. Desktop check
  const contextDesktop = await browser.newContext({
    viewport: { width: 1366, height: 650 }
  });
  const pageDesktop = await contextDesktop.newPage();
  await pageDesktop.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await pageDesktop.waitForTimeout(1000);

  const birdsCountDesktop = await pageDesktop.evaluate(() => {
    return document.querySelectorAll('svg[class*="flyAcross"], [style*="flyAcross"]').length;
  });
  console.log('Desktop Birds SVG count:', birdsCountDesktop);

  await pageDesktop.screenshot({
    path: 'C:/Users/shubhangi/.gemini/antigravity/brain/18c88e09-bf0f-4096-98f3-a1d146f91a32/clean_bg_nobirds_desktop.png',
    fullPage: false
  });

  await browser.close();
  console.log('Verification completed successfully!');
})();
