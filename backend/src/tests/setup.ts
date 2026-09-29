  // backend/src/tests/setup.ts
  import { MongoMemoryServer } from "mongodb-memory-server";
  import mongoose from "mongoose";
import { afterAll, afterEach, beforeAll } from "vitest";

  // Set required env vars BEFORE any module reads them.
  // jwt.ts throws if JWT_SECRET is missing — this prevents that in tests.
  process.env.JWT_SECRET = "test-secret-for-vitest";
  process.env.JWT_EXPIRES_IN = "1h";

  let mongod: MongoMemoryServer;

  // Spin up an in-memory MongoDB before any tests run.
  // Tests never touch the real Atlas database.
  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
  });

  // Wipe all collections between tests so they don't bleed into each other.
  afterEach(async () => {
    const collections = mongoose.connection.collections;
    await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });