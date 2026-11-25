import { describe, it, expect } from 'vitest';
import { GAME_CONFIG } from '@temple-drop/shared';

describe('Responsive Layout & Slot Legibility Verification', () => {
  const viewports = [
    { name: 'Mobile 360px', width: 360, height: 640 },
    { name: 'Tablet 768px', width: 768, height: 1024 },
    { name: 'Desktop 1440px', width: 1440, height: 900 },
  ];

  viewports.forEach(({ name, width, height }) => {
    it(`calculates valid slot bounds for ${name} (${width}px)`, () => {
      const containerWidth = Math.min(740, Math.max(340, width - 16));
      const slotTotalWidth = containerWidth * 0.94;
      const slotWidth = slotTotalWidth / GAME_CONFIG.SLOTS_COUNT;
      const slotStartX = (containerWidth - slotTotalWidth) / 2;

      expect(slotStartX).toBeGreaterThanOrEqual(0);
      expect(slotStartX + slotTotalWidth).toBeLessThanOrEqual(containerWidth);

      expect(slotWidth).toBeGreaterThanOrEqual(18);
      const fontSize = Math.max(9, Math.min(13, Math.round(slotWidth * 0.36)));
      expect(fontSize).toBeGreaterThanOrEqual(9);

      let lastX = -1;
      for (let s = 0; s < GAME_CONFIG.SLOTS_COUNT; s++) {
        const x = slotStartX + s * slotWidth;
        expect(x).toBeGreaterThan(lastX);
        lastX = x;
      }
    });
  });

  it('verifies center SPIN slot index is 7 with mirrored multipliers', () => {
    const slots = GAME_CONFIG.SLOTS;
    expect(slots).toHaveLength(15);
    expect(slots[7].label).toBe('SPIN');
    expect(slots[7].isSpin).toBe(true);

    for (let i = 0; i < 7; i++) {
      const left = slots[i];
      const right = slots[14 - i];
      expect(left.num).toBe(right.num);
      expect(left.den).toBe(right.den);
      expect(left.label).toBe(right.label);
    }
  });
});
