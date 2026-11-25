import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 480, height: 1024 } });
  const page = await context.newPage();

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Check header text & coin
  const headerCoin = await page.evaluate(() => {
    return document.querySelector('header svg text')?.textContent;
  });
  console.log('Header Coin Symbol:', headerCoin);

  // Take full screenshot
  await page.screenshot({
    path: 'C:/Users/shubhangi/.gemini/antigravity/brain/18c88e09-bf0f-4096-98f3-a1d146f91a32/verified_rs_symbol.png',
  });
  console.log('Saved verified_rs_symbol.png');

  await browser.close();
  console.log('Verification completed!');
})();
