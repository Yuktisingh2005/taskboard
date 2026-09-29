
  import { MongoMemoryServer } from "mongodb-memory-server";
  import mongoose from "mongoose";
import { afterAll, afterEach, beforeAll } from "vitest";


  process.env.JWT_SECRET = "test-secret-for-vitest";
  process.env.JWT_EXPIRES_IN = "1h";

  let mongod: MongoMemoryServer;


  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
  });


  afterEach(async () => {
    const collections = mongoose.connection.collections;
    await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });