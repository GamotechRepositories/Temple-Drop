import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    isGuest: { type: Boolean, default: false },
    avatarId: { type: String, default: 'explorer' },
    preferences: {
      soundEnabled: { type: Boolean, default: false },
      musicEnabled: { type: Boolean, default: false },
      animationEnabled: { type: Boolean, default: true },
      fastMode: { type: Boolean, default: false },
      reducedMotion: { type: Boolean, default: false },
      avatarId: { type: String, default: 'explorer' },
      dontShowHowToPlay: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

export const User = mongoose.model('User', UserSchema);
