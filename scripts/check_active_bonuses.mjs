import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const activeBonuses = await db.collection('activebonuses').find({}).toArray();
  console.log('Total ActiveBonuses in DB:', activeBonuses.length);
  for (const ab of activeBonuses) {
    console.log('ActiveBonus:', ab._id, 'userId:', ab.userId, 'isCompleted:', ab.isCompleted, 'remainingBalls:', ab.remainingBalls);
  }
  await mongoose.disconnect();
})();
