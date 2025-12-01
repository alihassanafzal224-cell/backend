**Project**: **Backend** — simple Express + Mongoose API

- **Location**: `src/`
- **Entry**: `src/index.js` (boots the server)

**Quick Start**
- **Install deps**:

```powershell
npm install
```

- **Run in development**:

```powershell
npm run start
```

The server listens on `process.env.PORT` or `8000` by default.

**Environment**
- Create a `.env` file at the project root with at least:

```
PORT=8000
MONGO_URI=<your mongodb uri>
JWT_SECRET=<your jwt secret>
NODE_ENV=development
```

**Project layout (important files)**
- `src/index.js`: loads env, connects DB, starts server.
- `src/app.js`: configures Express, middleware, and routes.
- `src/routes/`: route definitions (`user.route.js`, `post.route.js`).
- `src/controllers/`: business logic for routes.
- `src/models/`: Mongoose models.
- `middleware/`: custom middleware used by the app.

**Middleware added & purpose**
- `middleware/logger.js`: **Logger** — logs method, path, status and duration.
- `middleware/errorHandler.js`: **Error Handler** — centralizes error responses.
- `middleware/validateRequest.js`: **Validator** — helper `requireFields([...])` to validate `req.body` fields.
- `middleware/rateLimiter.js`: **Rate Limiter** — simple in-memory limiter (dev only).
- `middleware/auth.js`: **Auth (JWT)** — checks `Authorization: Bearer <token>` header or cookie `token`, verifies with `JWT_SECRET` and attaches `req.user`.
- `middleware/index.js`: re-exports middleware for convenient imports.

**How middleware is wired**
- `src/app.js` applies middleware in this order:
  - `cors()` and `express.json()` + `cookie-parser()`
  - `logger`
  - `rateLimiter()`
  - route handlers (`/api/users`, `/api/posts`)
  - `errorHandler` (last)

**Auth usage**
- `post` routes that modify data (`create`, `update`, `delete`) are protected by `auth` middleware. Supply a valid JWT via `Authorization: Bearer <token>` header or a cookie named `token`.

Notes:
- `auth` expects `process.env.JWT_SECRET` to be defined. If missing, the middleware returns a 500 error.
- Your `user.controller.js` should sign tokens using the same `JWT_SECRET` on login/register.

**Rate limiter**
- The included `rateLimiter` is in-memory and best for development or single-instance apps. For production use a store-backed limiter (Redis) or switch to `express-rate-limit`.

**Validation**
- Use `requireFields(['name','description','age'])` in route handlers to ensure required fields are present. For more complex validation, consider `joi` or `express-validator`.

**Common tasks**
- Add a new middleware: create file in `middleware/`, export it from `middleware/index.js`, then `import { myMiddleware } from '../middleware/index.js'` and `app.use(myMiddleware)` or apply to specific routes.

**Testing / Manual checks**
- Start server:
  ```powershell
  npm run start
  ```
- Quick endpoint checks (use curl, httpie or Postman):
  - Register/login to get a token via `POST /api/users/register` and `POST /api/users/login`.
  - Use the token for protected routes: `POST /api/posts/create` with header `Authorization: Bearer <token>`.

**Next improvements (suggested)**
- Replace in-memory rate limiter with Redis-backed limiter for production.
- Add automated tests (Jest + Supertest) for middleware and routes.
- Add request schema validation using `joi` or `express-validator`.
- Improve auth: token rotation, refresh tokens, and role-based access control.

If you want, I can also:
- run the server here and do a quick smoke test, or
- add a short `docs/MIDDLEWARE.md` describing each middleware and configuration options.
this is a intro to backend 