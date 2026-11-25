import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import request from 'supertest';
import { createServer } from '../src/server.js';
import { GAME_CONFIG } from '@temple-drop/shared';

describe('Temple Drop Integration & API Tests', () => {
  let replSet;
  let app;
  let guestCookie;
  let csrfToken;

  beforeAll(async () => {
    replSet = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: 'wiredTiger' },
    });
    const uri = replSet.getUri();
    await mongoose.connect(uri);
    app = createServer();
  }, 60000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (replSet) {
      await replSet.stop();
    }
  });

  it('GET /api/health returns healthy', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.database).toBe('connected');
  });

  it('GET /api/game/config returns public configuration and expected math', async () => {
    const res = await request(app).get('/api/game/config');
    expect(res.status).toBe(200);
    expect(res.body.config.ROWS).toBe(14);
    expect(res.body.config.SLOTS).toHaveLength(15);
    expect(res.body.mathDocumentation).toBeDefined();
    expect(res.body.mathDocumentation.sharedPayoutCapCredits).toBe(5000);
  });

  it('POST /api/auth/guest registers a guest explorer with 10,000 demo credits', async () => {
    const res = await request(app).post('/api/auth/guest');
    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.isGuest).toBe(true);
    expect(res.body.wallet.balanceCents).toBe(GAME_CONFIG.INITIAL_BALANCE_CENTS);

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    guestCookie = cookies.find((c) => c.startsWith('td_session=')) || '';
    expect(guestCookie).toBeTruthy();

    const csrfRes = await request(app).get('/api/csrf-token').set('Cookie', guestCookie);
    expect(csrfRes.status).toBe(200);
    csrfToken = csrfRes.body.csrfToken;
    expect(csrfToken).toBeTruthy();
  });

  it('GET /api/game/state returns current player state', async () => {
    const res = await request(app)
      .get('/api/game/state')
      .set('Cookie', guestCookie);

    expect(res.status).toBe(200);
    expect(res.body.wallet.balanceCents).toBe(1000000);
    expect(res.body.spinPoints).toBe(0);
    expect(res.body.energyPoints).toBe(0);
    expect(res.body.pendingFeatures).toEqual([]);
    expect(res.body.activeBonus).toBeNull();
  });

  it('POST /api/game/drop processes paid drop, debits wallet, and awards payouts/meters', async () => {
    const idempotencyKey = 'drop-test-key-1';
    const res = await request(app)
      .post('/api/game/drop')
      .set('Cookie', guestCookie)
      .set('x-csrf-token', csrfToken)
      .set('x-idempotency-key', idempotencyKey)
      .send({
        betPerBallCents: 50,
        ballCount: 10,
      });

    expect(res.status).toBe(200);
    expect(res.body.roundId).toBeDefined();
    expect(res.body.balls).toHaveLength(10);
    expect(res.body.totalBetCents).toBe(500);

    for (const b of res.body.balls) {
      expect(b.steps).toHaveLength(14);
      expect(b.slotIndex).toBeGreaterThanOrEqual(0);
      expect(b.slotIndex).toBeLessThanOrEqual(14);
    }

    expect(res.body.walletBalanceCents).toBeDefined();
  });

  it('Idempotency middleware returns cached response when same key is sent', async () => {
    const idempotencyKey = 'drop-test-key-1';
    const res = await request(app)
      .post('/api/game/drop')
      .set('Cookie', guestCookie)
      .set('x-csrf-token', csrfToken)
      .set('x-idempotency-key', idempotencyKey)
      .send({
        betPerBallCents: 50,
        ballCount: 10,
      });

    expect(res.status).toBe(200);
    expect(res.headers['x-cache-lookup']).toBe('HIT');
  });

  it('Idempotency middleware rejects key reused with different payload', async () => {
    const idempotencyKey = 'drop-test-key-1';
    const res = await request(app)
      .post('/api/game/drop')
      .set('Cookie', guestCookie)
      .set('x-csrf-token', csrfToken)
      .set('x-idempotency-key', idempotencyKey)
      .send({
        betPerBallCents: 100,
        ballCount: 10,
      });

    expect(res.status).toBe(422);
    expect(res.body.error).toContain('different request payload');
  });

  it('POST /api/game/wallet/refill fails if wallet has sufficient balance', async () => {
    const res = await request(app)
      .post('/api/game/wallet/refill')
      .set('Cookie', guestCookie)
      .set('x-csrf-token', csrfToken);

    expect(res.status).toBe(500);
    expect(res.body.error).toContain('Refill only available below');
  });

  it('GET /api/game/history returns recorded paid rounds with slot details', async () => {
    const res = await request(app)
      .get('/api/game/history')
      .set('Cookie', guestCookie);

    expect(res.status).toBe(200);
    expect(res.body.items).toBeDefined();
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
    expect(res.body.items[0].balls).toHaveLength(10);
  });
});
