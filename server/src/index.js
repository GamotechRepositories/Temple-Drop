import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createServer } from './server.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
let replSetInstance = null;

async function connectDatabase() {
  const uri = process.env.MONGODB_URI;
  const useInMemory = process.env.USE_IN_MEMORY_MONGO === 'true';

  if (useInMemory || !uri) {
    console.log('[Database] Starting in-memory MongoDB replica set (with transaction support)...');
    try {
      const { MongoMemoryReplSet } = await import('mongodb-memory-server');
      replSetInstance = await MongoMemoryReplSet.create({
        replSet: { count: 1, storageEngine: 'wiredTiger' },
      });
      const inMemoryUri = replSetInstance.getUri();
      console.log(`[Database] In-memory MongoDB replica set ready at ${inMemoryUri}`);
      await mongoose.connect(inMemoryUri);
      console.log('[Database] Connected to in-memory MongoDB successfully.');
      return;
    } catch (err) {
      console.error('[Database] Failed to initialize in-memory replica set:', err);
    }
  }

  if (uri) {
    try {
      console.log(`[Database] Connecting to MongoDB at ${uri.replace(/\/\/.*@/, '//***@')}...`);
      await mongoose.connect(uri);
      console.log('[Database] Connected to external MongoDB successfully.');
    } catch (err) {
      console.error('[Database] External MongoDB connection error:', err);
      if (!replSetInstance) {
        console.log('[Database] Falling back to embedded in-memory MongoDB...');
        const { MongoMemoryReplSet } = await import('mongodb-memory-server');
        replSetInstance = await MongoMemoryReplSet.create({
          replSet: { count: 1, storageEngine: 'wiredTiger' },
        });
        await mongoose.connect(replSetInstance.getUri());
        console.log('[Database] Connected to fallback in-memory MongoDB.');
      }
    }
  }
}

async function start() {
  await connectDatabase();
  const app = createServer();

  const server = app.listen(PORT, () => {
    console.log(`[Server] Temple Drop backend listening on port ${PORT}`);
    console.log(`[Server] Health check available at http://localhost:${PORT}/api/health`);
  });

  const shutdown = async () => {
    console.log('[Server] Shutting down gracefully...');
    server.close();
    await mongoose.disconnect();
    if (replSetInstance) {
      await replSetInstance.stop();
    }
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
