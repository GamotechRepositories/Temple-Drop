import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const users = await db.collection('users').find({}).sort({ updatedAt: -1 }).limit(5).toArray();
  console.log('Recent users:');
  for (const u of users) {
    console.log('User ID:', u._id.toString(), 'email:', u.email, 'updatedAt:', u.updatedAt);
    const wallet = await db.collection('wallets').findOne({ userId: u._id });
    console.log('  Wallet balance:', wallet?.balanceCents);
    const pending = await db.collection('pendingfeatures').find({ userId: u._id, status: { $in: ['PENDING', 'ACTIVE'] } }).toArray();
    console.log('  Pending features:', pending);
    const round = await db.collection('rounds').findOne({ userId: u._id }, { sort: { createdAt: -1 } });
    console.log('  Last round:', round?.roundId, 'type:', round?.type, 'createdAt:', round?.createdAt);
  }
  await mongoose.disconnect();
})();
