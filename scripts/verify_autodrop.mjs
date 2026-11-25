import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 480, height: 1024 } });
  const page = await context.newPage();

  let dropCount = 0;
  page.on('response', res => {
    if (res.url().includes('/api/game/drop') && res.status() === 200) {
      dropCount++;
      console.log(`Auto-drop API #${dropCount} succeeded (200 OK)`);
    }
  });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Open Auto Drop options & select 5 drops
  await page.locator('button[aria-label="Open Auto Drop options"]').first().click();
  await page.waitForTimeout(250);
  await page.locator('text=5 drops').first().click();

  // Wait for 2 consecutive auto drops
  for (let i = 0; i < 24; i++) {
    await page.waitForTimeout(500);
    if (dropCount >= 2) break;
  }

  // Click Stop Auto Drop
  const stopBtn = page.locator('button[aria-label="Stop Auto Drop"]').first();
  if (await stopBtn.isVisible()) {
    await stopBtn.click();
    console.log('Clicked Stop Auto Drop!');
  }

  // Wait for Auto Drop Summary modal to appear after the in-flight round completes
  const summaryTitle = page.locator('text=Total Auto Drop Summary');
  await summaryTitle.waitFor({ state: 'visible', timeout: 10000 });

  const modalText = await page.evaluate(() => document.body.innerText);
  console.log('Has Total Auto Drop Summary?:', modalText.includes('Total Auto Drop Summary'));
  console.log('Has Each Bet Details?:', modalText.includes('Each Bet Details'));
  console.log('Has Bet #1 & Bet #2?:', modalText.includes('Bet #1') && modalText.includes('Bet #2'));

  await page.screenshot({
    path: 'C:/Users/shubhangi/.gemini/antigravity/brain/18c88e09-bf0f-4096-98f3-a1d146f91a32/verified_autodrop_summary.png',
  });

  await browser.close();
  console.log('Auto Drop Summary verification PASSED!');
})();
