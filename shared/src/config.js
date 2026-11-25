export const GAME_CONFIG = {
  TITLE: 'Temple Drop',
  CURRENCY_SYMBOL: 'CR',
  ROWS: 14,
  SLOTS_COUNT: 15,
  STEPS_COUNT: 14,

  // Bumper peg locations (row index 0-12, col index 0-row)
  BUMPER_PEGS: [
    { row: 4, col: 1 },
    { row: 7, col: 5 },
    { row: 9, col: 4 },
  ],

  // Credit limits (in integer cents / hundredths of demo credits)
  INITIAL_BALANCE_CENTS: 1000000, // 10,000.00 credits
  MIN_BET_CENTS: 50,              // 0.50 credits
  MAX_TOTAL_BET_CENTS: 250000,    // 2,500.00 credits
  PAYOUT_CAP_CENTS: 500000,       // 5,000.00 credits per paid round

  // Allowed betting choices
  BET_PER_BALL_OPTIONS_CENTS: [50, 100, 200, 500, 1000, 2500, 5000, 10000, 25000],
  BALLS_PER_DROP_OPTIONS: [10, 20, 25, 30, 40, 50],
  DEFAULT_BET_PER_BALL_CENTS: 50, // 0.50 credits
  DEFAULT_BALLS_PER_DROP: 10,

  // Energy & spin meter thresholds
  ENERGY_PER_BUMPER_HIT: 10,
  ENERGY_THRESHOLD_FOR_BONUS: 100,
  BONUS_INITIAL_BALLS: 5,
  BONUS_RETRIGGER_BALLS: 3,
  BONUS_MAX_TOTAL_BALLS: 50,

  SPIN_POINTS_PER_HIT: 1,
  SPIN_POINTS_THRESHOLD: 10,

  // 15 Slots configuration (from left to right)
  SLOTS: [
    { index: 0, label: '100x', num: 100, den: 1, isSpin: false, color: '#f43f5e' },
    { index: 1, label: '50x', num: 50, den: 1, isSpin: false, color: '#ec4899' },
    { index: 2, label: '20x', num: 20, den: 1, isSpin: false, color: '#a855f7' },
    { index: 3, label: '10x', num: 10, den: 1, isSpin: false, color: '#8b5cf6' },
    { index: 4, label: '2x', num: 2, den: 1, isSpin: false, color: '#3b82f6' },
    { index: 5, label: '0.5x', num: 1, den: 2, isSpin: false, color: '#06b6d4' },
    { index: 6, label: '0.2x', num: 1, den: 5, isSpin: false, color: '#14b8a6' },
    { index: 7, label: 'SPIN', num: 0, den: 1, isSpin: true, color: '#eab308' },
    { index: 8, label: '0.2x', num: 1, den: 5, isSpin: false, color: '#14b8a6' },
    { index: 9, label: '0.5x', num: 1, den: 2, isSpin: false, color: '#06b6d4' },
    { index: 10, label: '2x', num: 2, den: 1, isSpin: false, color: '#3b82f6' },
    { index: 11, label: '10x', num: 10, den: 1, isSpin: false, color: '#8b5cf6' },
    { index: 12, label: '20x', num: 20, den: 1, isSpin: false, color: '#a855f7' },
    { index: 13, label: '50x', num: 50, den: 1, isSpin: false, color: '#ec4899' },
    { index: 14, label: '100x', num: 100, den: 1, isSpin: false, color: '#f43f5e' },
  ],

  // Wheel configuration: 1x (35%), 2x (30%), 5x (20%), 10x (10%), BONUS (5%)
  WHEEL_OUTCOMES: [
    { id: '1x', label: '1x', num: 1, den: 1, isBonus: false, weight: 35, color: '#0284c7' },
    { id: '2x', label: '2x', num: 2, den: 1, isBonus: false, weight: 30, color: '#059669' },
    { id: '5x', label: '5x', num: 5, den: 1, isBonus: false, weight: 20, color: '#d97706' },
    { id: '10x', label: '10x', num: 10, den: 1, isBonus: false, weight: 10, color: '#dc2626' },
    { id: 'BONUS', label: 'BONUS', num: 0, den: 1, isBonus: true, weight: 5, color: '#9333ea' },
  ],

  // Auto drop count presets
  AUTO_DROP_COUNTS: [5, 10, 20],

  // Avatar presets
  AVATARS: [
    { id: 'explorer', name: 'Explorer', icon: '🤠' },
    { id: 'priestess', name: 'Priestess', icon: '🧝‍♀️' },
    { id: 'shaman', name: 'Shaman', icon: '🧙‍♂️' },
    { id: 'jaguar', name: 'Jaguar', icon: '🐆' },
    { id: 'golden_idol', name: 'Golden Idol', icon: '🗿' },
  ],
};

// Convert cents to decimal credit display string
export function centsToCredits(cents) {
  const credits = cents / 100;
  return credits.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Calculate slot payout using integer arithmetic
export function calculateSlotPayoutCents(betPerBallCents, num, den) {
  if (num === 0 || den === 0) return 0;
  return Math.floor((betPerBallCents * num) / den);
}
