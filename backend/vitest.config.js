import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    // The first run downloads a MongoDB binary for mongodb-memory-server (~100 MB).
    testTimeout: 20_000,
    hookTimeout: 120_000,
    // Tests never touch your Atlas cluster: they use an in-memory MongoDB.
    env: {
      NODE_ENV: 'test',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/peerconnect-test',
      JWT_SECRET: 'test-secret-that-is-definitely-longer-than-32-characters',
      CLIENT_URLS: 'http://localhost:5173',
      CLOUDINARY_CLOUD_NAME: '',
      CLOUDINARY_API_KEY: '',
      CLOUDINARY_API_SECRET: '',
    },
  },
});
