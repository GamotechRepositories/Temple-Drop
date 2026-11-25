import { chromium } from 'playwright';

async function measure() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const viewports = [
    { name: 'Samsung (412x690)', width: 412, height: 690 },
    { name: 'iPhone 14 (390x844)', width: 390, height: 844 },
    { name: 'iPhone SE (375x667)', width: 375, height: 667 }
  ];
  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: vp });
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(600);
    const m = await page.evaluate(() => {
      const temple = document.querySelector('img[alt="Temple Shrine Frame"]').getBoundingClientRect();
      const tray = document.querySelector('.w-full.max-w-\\[940px\\].mx-auto').firstElementChild.getBoundingClientRect();
      return {
        templeBottom: temple.bottom,
        trayTop: tray.top,
        trayBottom: tray.bottom,
        viewportHeight: window.innerHeight,
        gapBetweenTempleAndTray: tray.top - temple.bottom,
        gapUnderTray: window.innerHeight - tray.bottom
      };
    });
    console.log(vp.name, m);
  }
  await browser.close();
}

measure();
