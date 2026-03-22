import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, afterEach, beforeAll } from 'vitest';

/** Start a throwaway in-memory MongoDB for the current test file. */
export function useTestDatabase() {
  let mongod;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri(), { dbName: 'peerconnect-test' });
    // Unique indexes (email, clientMessageId) must exist before tests rely on them.
    await Promise.all(Object.values(mongoose.models).map((model) => model.syncIndexes()));
  });

  afterEach(async () => {
    await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})));
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod?.stop();
  });
}
