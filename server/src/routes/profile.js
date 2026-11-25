import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.patch('/preferences', requireAuth, async (req, res, next) => {
  try {
    const user = req.user;
    const {
      soundEnabled,
      musicEnabled,
      animationEnabled,
      fastMode,
      reducedMotion,
      avatarId,
      dontShowHowToPlay,
    } = req.body;

    if (soundEnabled !== undefined) user.preferences.soundEnabled = Boolean(soundEnabled);
    if (musicEnabled !== undefined) user.preferences.musicEnabled = Boolean(musicEnabled);
    if (animationEnabled !== undefined) user.preferences.animationEnabled = Boolean(animationEnabled);
    if (fastMode !== undefined) user.preferences.fastMode = Boolean(fastMode);
    if (reducedMotion !== undefined) user.preferences.reducedMotion = Boolean(reducedMotion);
    if (avatarId !== undefined) {
      user.preferences.avatarId = String(avatarId);
      user.avatarId = String(avatarId);
    }
    if (dontShowHowToPlay !== undefined) {
      user.preferences.dontShowHowToPlay = Boolean(dontShowHowToPlay);
    }

    await user.save();

    res.json({
      preferences: user.preferences,
      avatarId: user.avatarId,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
