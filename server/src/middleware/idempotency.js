import crypto from 'crypto';
import { IdempotencyKey } from '../models/IdempotencyKey.js';

export function idempotencyMiddleware(actionName) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User must be authenticated' });
        return;
      }

      const key = req.headers['x-idempotency-key'];
      if (!key) {
        res.status(400).json({ error: 'Missing required X-Idempotency-Key header' });
        return;
      }

      const requestHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(req.body || {}))
        .digest('hex');

      const existing = await IdempotencyKey.findOne({
        userId: req.user._id,
        action: actionName,
        key,
      });

      if (existing) {
        if (existing.requestHash !== requestHash) {
          res.status(422).json({
            error: 'Idempotency key reused with a different request payload',
          });
          return;
        }

        if (existing.status === 'COMPLETED') {
          res.setHeader('X-Cache-Lookup', 'HIT');
          res.status(existing.statusCode || 200).json(existing.responseBody);
          return;
        }

        if (existing.status === 'IN_PROGRESS') {
          res.status(409).json({
            error: 'Concurrent request with this idempotency key is already in progress',
          });
          return;
        }
      }

      let keyDoc;
      try {
        keyDoc = new IdempotencyKey({
          key,
          userId: req.user._id,
          action: actionName,
          requestHash,
          status: 'IN_PROGRESS',
        });
        await keyDoc.save();
      } catch (err) {
        if (err.code === 11000) {
          res.status(409).json({
            error: 'Concurrent action detected from another tab or request',
          });
          return;
        }
        throw err;
      }

      const originalJson = res.json.bind(res);
      res.json = (body) => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          IdempotencyKey.updateOne(
            { _id: keyDoc._id },
            {
              $set: {
                status: 'COMPLETED',
                statusCode: res.statusCode,
                responseBody: body,
              },
            }
          ).exec().catch(console.error);
        } else {
          IdempotencyKey.deleteOne({ _id: keyDoc._id }).exec().catch(console.error);
        }

        return originalJson(body);
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}
