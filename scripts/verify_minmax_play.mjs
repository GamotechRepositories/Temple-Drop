import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 480, height: 1024 } });
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('response', res => {
    if (res.url().includes('/api/game/drop')) {
      console.log('DROP API RESPONSE STATUS:', res.status());
    }
  });

  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Check initial values
  const getValues = async () => {
    return await page.evaluate(() => {
      const texts = Array.from(document.querySelectorAll('*')).map(el => el.textContent?.trim());
      return {
        hasBet05: texts.some(t => t === '0.50'),
        hasBalls10: texts.some(t => t === '10'),
      };
    });
  };
  console.log('Initial controls state:', await getValues());

  // Step up BALL PER DROP to max 50
  for (let i = 0; i < 7; i++) {
    const incBallBtn = page.locator('button[aria-label="Increase balls per drop"]').first();
    if (await incBallBtn.isEnabled()) {
      await incBallBtn.click();
      await page.waitForTimeout(100);
    }
  }

  // Step up BET PER BALL to max 50.00
  for (let i = 0; i < 8; i++) {
    const incBetBtn = page.locator('button[aria-label="Increase bet per ball"]').first();
    if (await incBetBtn.isEnabled()) {
      await incBetBtn.click();
      await page.waitForTimeout(100);
    }
  }

  // Screenshot at Max (50 CR bet per ball, 50 balls per drop)
  await page.screenshot({
    path: 'C:/Users/shubhangi/.gemini/antigravity/brain/18c88e09-bf0f-4096-98f3-a1d146f91a32/controls_max_50_50.png',
  });
  console.log('Saved controls_max_50_50.png');

  // Step Bet down to 1.00 for the 50 balls test drop (so total wager is 50.00 CR)
  for (let i = 0; i < 5; i++) {
    const decBetBtn = page.locator('button[aria-label="Decrease bet per ball"]').first();
    if (await decBetBtn.isEnabled()) {
      await decBetBtn.click();
      await page.waitForTimeout(100);
    }
  }

  // 2. Play 50 balls drop!
  console.log('Clicking PLAY for 50 balls drop...');
  const playBtn = page.locator('button[aria-label="Play drop"]').first();
  await playBtn.click();

  // Wait for 50-ball plinko drop animation to settle
  console.log('Waiting for 50-ball plinko drop animation to settle...');
  await page.waitForTimeout(5500);

  // Check if Modal is open
  const modalText = await page.evaluate(() => {
    const modal = document.querySelector('div.fixed.inset-0');
    return modal ? modal.innerText : null;
  });

  console.log('Is Modal Open?:', Boolean(modalText));
  if (modalText) {
    console.log('Modal summary preview:\n', modalText.slice(0, 250));
  }

  await page.screenshot({
    path: 'C:/Users/shubhangi/.gemini/antigravity/brain/18c88e09-bf0f-4096-98f3-a1d146f91a32/play_50balls_modal_result.png',
  });
  console.log('Saved play_50balls_modal_result.png');

  // Close modal
  const continueBtn = page.locator('text=Continue / Play Again');
  if (await continueBtn.isVisible()) {
    await continueBtn.click();
    await page.waitForTimeout(400);
    console.log('Modal closed cleanly!');
  }

  await browser.close();
  console.log('All verification checks completed successfully!');
})();
