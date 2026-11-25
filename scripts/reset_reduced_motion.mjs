import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: 'server/.env' });

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const res = await mongoose.connection.db.collection('users').updateMany(
    { 'preferences.reducedMotion': true },
    { $set: { 'preferences.reducedMotion': false, 'preferences.animationEnabled': true } }
  );
  console.log('Reset reducedMotion=false for users:', res.modifiedCount);
  await mongoose.disconnect();
})();
