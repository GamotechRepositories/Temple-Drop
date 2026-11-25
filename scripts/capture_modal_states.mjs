import { chromium } from 'playwright';
import path from 'path';

const artifactDir = 'C:/Users/shubhangi/.gemini/antigravity/brain/18c88e09-bf0f-4096-98f3-a1d146f91a32';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage();
  
  await page.setViewportSize({ width: 480, height: 1024 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  // 1. Capture WIN Modal
  await page.evaluate(() => {
    window.__TEST_SET_RESULT__({
      roundId: 'round_1795602488_win77',
      betPerBallCents: 50,
      ballCount: 10,
      totalBetCents: 500,
      grossPayoutCents: 2650,
      netPayoutCents: 2150,
      walletBalanceCents: 102150,
      balls: [
        { slotLabel: '50x', slotIndex: 1, creditedPayoutCents: 2500, bumperHits: [{ id: 'bumper_4_1' }] },
        { slotLabel: '2x', slotIndex: 4, creditedPayoutCents: 100, bumperHits: [] },
        { slotLabel: '0.5x', slotIndex: 5, creditedPayoutCents: 25, bumperHits: [] },
        { slotLabel: '0.2x', slotIndex: 6, creditedPayoutCents: 10, bumperHits: [] },
        { slotLabel: '0.2x', slotIndex: 6, creditedPayoutCents: 10, bumperHits: [] },
        { slotLabel: 'SPIN', slotIndex: 7, isSpin: true, creditedPayoutCents: 0, bumperHits: [] },
        { slotLabel: '0.5x', slotIndex: 9, creditedPayoutCents: 25, bumperHits: [] },
        { slotLabel: '0.2x', slotIndex: 8, creditedPayoutCents: 10, bumperHits: [] },
        { slotLabel: '0.2x', slotIndex: 8, creditedPayoutCents: 10, bumperHits: [] },
        { slotLabel: 'SPIN', slotIndex: 7, isSpin: true, creditedPayoutCents: 0, bumperHits: [] },
      ],
      spinPoints: 4,
      energyPoints: 40,
      payoutCapReached: false,
    });
  });

  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(artifactDir, 'bet_won_popup_mobile.png') });
  console.log('Saved WIN popup screenshot');

  // Close modal
  await page.click('text=Continue / Play Again');
  await page.waitForTimeout(400);

  // 2. Capture LOSS Modal
  await page.evaluate(() => {
    window.__TEST_SET_RESULT__({
      roundId: 'round_1795602499_loss33',
      betPerBallCents: 50,
      ballCount: 10,
      totalBetCents: 500,
      grossPayoutCents: 140,
      netPayoutCents: -360,
      walletBalanceCents: 99640,
      balls: [
        { slotLabel: '0.5x', slotIndex: 5, creditedPayoutCents: 25, bumperHits: [{ id: 'bumper_7_5' }] },
        { slotLabel: '0.2x', slotIndex: 6, creditedPayoutCents: 10, bumperHits: [] },
        { slotLabel: '0.2x', slotIndex: 6, creditedPayoutCents: 10, bumperHits: [] },
        { slotLabel: '0.2x', slotIndex: 6, creditedPayoutCents: 10, bumperHits: [] },
        { slotLabel: 'SPIN', slotIndex: 7, isSpin: true, creditedPayoutCents: 0, bumperHits: [] },
        { slotLabel: 'SPIN', slotIndex: 7, isSpin: true, creditedPayoutCents: 0, bumperHits: [] },
        { slotLabel: '0.5x', slotIndex: 9, creditedPayoutCents: 25, bumperHits: [] },
        { slotLabel: '0.2x', slotIndex: 8, creditedPayoutCents: 10, bumperHits: [] },
        { slotLabel: '0.5x', slotIndex: 9, creditedPayoutCents: 25, bumperHits: [] },
        { slotLabel: '0.5x', slotIndex: 9, creditedPayoutCents: 25, bumperHits: [] },
      ],
      spinPoints: 2,
      energyPoints: 60,
      payoutCapReached: false,
    });
  });

  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(artifactDir, 'bet_loss_popup_mobile.png') });
  console.log('Saved LOSS popup screenshot');

  await browser.close();
  console.log('DONE');
})();
