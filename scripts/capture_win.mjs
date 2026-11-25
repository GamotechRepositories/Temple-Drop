import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage();
  
  await page.setViewportSize({ width: 480, height: 1024 });
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);

  // Play until we get a winning drop or max 6 tries
  for (let tryCount = 1; tryCount <= 8; tryCount++) {
    console.log(`Drop attempt ${tryCount}...`);
    const playBtn = page.locator('button[aria-label="Play drop"]').first();
    await playBtn.click();
    await page.waitForTimeout(6500);

    const isWin = await page.isVisible('text=🎉 Bet Won!');
    if (isWin) {
      console.log('WIN POPUP APPEARED!');
      await page.screenshot({ path: 'C:/Users/shubhangi/.gemini/antigravity/brain/18c88e09-bf0f-4096-98f3-a1d146f91a32/bet_result_win_popup.png' });
      break;
    }

    // Close and try again
    const continueBtn = page.locator('text=Continue / Play Again');
    if (await continueBtn.isVisible()) {
      await continueBtn.click();
      await page.waitForTimeout(800);
    }
  }

  await browser.close();
  console.log('Script done');
})();
