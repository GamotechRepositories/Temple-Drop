import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });
import { FeatureQueueService } from '../server/src/services/featureQueueService.js';
import { User } from '../server/src/models/User.js';

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const users = await User.find({});
  console.log(`Checking ${users.length} users for healthy feature state...`);
  for (const u of users) {
    const res = await FeatureQueueService.ensureActiveFeature(u._id);
    if (res.activeBonus) {
      console.log(`User ${u._id} initialized ActiveBonus:`, res.activeBonus._id, 'remainingBalls:', res.activeBonus.remainingBalls);
    }
  }
  console.log('Feature state sync completed.');
  await mongoose.disconnect();
})();
