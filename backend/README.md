# PeerConnect: Backend

Express 5 + MongoDB Atlas + Socket.IO API. Deployed to **Render**.
Full setup (Atlas, Cloudinary, Render, Vercel): see the [main README](../README.md).

## Quick start

```bash
npm install
cp .env.example .env     # fill in MONGODB_URI and JWT_SECRET (Cloudinary optional)
npm run dev              # nodemon: restarts on every save
```

- Health: http://localhost:5001/api/health
- API docs (Swagger): http://localhost:5001/api/docs

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Development server with nodemon (watches `src/` and `.env`) |
| `npm start` | Production start (Render) |
| `npm test` | All automated tests (in-memory MongoDB, no Atlas needed) |
| `npm run test:watch` | Tests in watch mode |

## Manual API testing

- **Swagger UI:** `/api/docs`
- **Postman:** import `postman/PeerConnect.postman_collection.json`
- **VS Code REST Client:** open `requests.http`

## Structure

```
src/
  config/       env (zod-validated), db, cloudinary, cors
  models/       User, Message (indexes documented inline)
  validators/   zod request schemas
  middleware/   protectRoute, validate, rateLimiters, errorHandler, notFound
  services/     auth.service, message.service (business logic + socket emits)
  controllers/  thin HTTP handlers
  routes/       /api/health, /api/auth, /api/messages
  socket/       index (handshake auth, presence), events, emitter,
                handlers/{typing,receipts}, presence/memoryPresence
  utils/        jwt, cookies, logger, ApiError, conversation key, data URIs
  docs/         OpenAPI spec
  app.js        Express app (used by tests)
  server.js     HTTP + Socket.IO server, graceful shutdown
```

## Render settings

Root Directory `backend` · Build `npm ci` · Start `npm start` · Health check `/api/health`
Env: `NODE_ENV=production`, `MONGODB_URI`, `MONGODB_DB_NAME`, `JWT_SECRET`, `CLIENT_URLS`, `TRUST_PROXY=2`, `CLOUDINARY_*`.
