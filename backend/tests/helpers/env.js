// Loaded FIRST by every test file. Makes sure tests can never touch a real
// database, real email, WhatsApp, Cloudinary, etc.
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-only-jwt-secret";
process.env.FRONTEND_URL = "http://localhost:5173";
// Even if some module calls dotenv (backend/.env), dotenv never overrides
// values that are already set - so a real DB URL can never be picked up.
process.env.DATABASE_URL = "postgresql://invalid:invalid@127.0.0.1:1/never_used";
process.env.DIRECT_URL = process.env.DATABASE_URL;

// Controllers log a lot (including temp passwords). Keep test output clean.
// Run with DEBUG_TESTS=1 to see the logs again.
if (!process.env.DEBUG_TESTS) {
  for (const m of ["log", "warn", "error", "info"]) console[m] = () => {};
}
