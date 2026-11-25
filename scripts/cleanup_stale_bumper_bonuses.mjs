import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });
import { PendingFeature } from '../server/src/models/PendingFeature.js';
import { ActiveBonus } from '../server/src/models/ActiveBonus.js';

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB. Clearing any stale bonus sessions...');
  const res1 = await ActiveBonus.deleteMany({ isCompleted: false });
  console.log('Removed active bonuses:', res1.deletedCount);
  const res2 = await PendingFeature.deleteMany({ type: 'BONUS' });
  console.log('Removed pending BONUS features:', res2.deletedCount);
  await mongoose.disconnect();
  console.log('Done cleanup.');
})();
