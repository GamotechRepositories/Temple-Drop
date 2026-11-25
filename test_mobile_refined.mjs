import { chromium } from 'playwright';

async function testMobileLayout() {
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 375, height: 667 } });
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);

  // Apply responsive classes to test in DOM
  await page.evaluate(() => {
    // 1. Frame wrapper sizing for mobile
    const frameContainer = document.querySelector('img[alt="Temple Shrine Frame"]').parentElement.parentElement;
    frameContainer.className = 'relative z-10 w-full max-w-[335px] sm:max-w-[520px] flex flex-col items-center select-none';

    // 2. Meters margin
    const meters = document.querySelector('label').closest('.max-w-\\[940px\\]');
    meters.className = 'relative z-20 w-full max-w-[940px] px-2 sm:px-3 flex items-end justify-between -mt-4 sm:-mt-9 mb-1';

    // 3. Tray container
    const trayOuter = document.querySelector('button[aria-label="Play drop"]').closest('.max-w-\\[940px\\]');
    trayOuter.className = 'w-full h-auto rounded-[16px] px-2.5 sm:px-5 py-2 sm:py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 shadow-2xl relative';

    // 4. Group top Bet/Win
    const betWin = trayOuter.children[0];
    betWin.className = 'flex items-center justify-between w-full sm:w-auto px-1 sm:px-0 sm:space-x-8';

    // 5. Group steppers + buttons for mobile row
    // If we wrap or make steppers flex-1
    const betStepper = trayOuter.children[1];
    betStepper.className = 'flex-1 sm:flex-initial sm:w-[185px] h-[48px] sm:h-[58px] rounded-[12px] px-2.5 sm:px-3.5 flex items-center justify-between transition-all';

    const ballStepper = trayOuter.children[2];
    ballStepper.className = 'flex-1 sm:flex-initial sm:w-[185px] h-[48px] sm:h-[58px] rounded-[12px] px-2.5 sm:px-3.5 flex items-center justify-between transition-all';

    const actionBtns = trayOuter.children[3];
    actionBtns.className = 'flex items-center space-x-2 sm:space-x-3 w-auto justify-end relative';

    const autoBtn = actionBtns.querySelector('button');
    autoBtn.className = 'w-[44px] sm:w-[62px] h-[48px] sm:h-[58px] rounded-[12px] sm:rounded-[14px] bg-slate-900/90 border border-slate-700 text-slate-300 flex items-center justify-center';

    const playBtn = actionBtns.querySelector('button[aria-label="Play drop"]');
    playBtn.className = 'w-[68px] sm:w-[115px] h-[48px] sm:h-[58px] rounded-[12px] sm:rounded-[14px] flex items-center justify-center transition-all bg-gradient-to-b from-[#22c55e] to-[#15803d] border border-[#34d399]';

    // Let's put steppers and buttons into a horizontal flex container on mobile
    let controlsRow = trayOuter.querySelector('.mobile-controls-row');
    if (!controlsRow) {
      controlsRow = document.createElement('div');
      controlsRow.className = 'mobile-controls-row flex items-center space-x-2 w-full sm:contents';
      trayOuter.insertBefore(controlsRow, betStepper);
      controlsRow.appendChild(betStepper);
      controlsRow.appendChild(ballStepper);
      controlsRow.appendChild(actionBtns);
    }
  });

  await page.screenshot({ path: 'C:/Users/shubhangi/.gemini/antigravity/brain/18c88e09-bf0f-4096-98f3-a1d146f91a32/test_mobile_refined.png' });
  await browser.close();
}

testMobileLayout().catch(console.error);
