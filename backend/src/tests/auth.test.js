// Login, protected-route authentication and password reset.
const { describe, test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const t = require("./helpers/testApp");

const { api, db, PASSWORD } = t;
const GENERIC_FORGOT_MESSAGE =
  "If an account exists for this email, a password reset link has been sent.";

let w;
before(t.start);
after(t.stop);
beforeEach(() => { w = t.seedWorld(); });

const login = (body) => api.post("/api/auth/login", { body });

describe("login", () => {
  test("valid credentials return a signed token with the right user and company", async () => {
    const res = await login({ email: "arun@acme.test", password: PASSWORD });

    assert.equal(res.status, 200);
    assert.equal(res.body.message, "Login successful");
    assert.equal(res.body.forcePasswordChange, false);
    assert.equal(res.body.user.id, "a-emp1");
    assert.equal(res.body.user.role, "USER");
    assert.equal(res.body.user.companyId, 1);

    const decoded = t.jwt.verify(res.body.token, process.env.JWT_SECRET);
    assert.equal(decoded.userId, "a-emp1");
    assert.equal(decoded.companyId, 1);
    assert.equal(decoded.role, "USER");
  });

  test("the response never contains the password hash or reset token", async () => {
    const res = await login({ email: "arun@acme.test", password: PASSWORD });
    assert.ok(!res.text.includes("$2"), "bcrypt hash leaked in login response");
    assert.equal(res.body.user.password, undefined);
    assert.equal(res.body.user.resetToken, undefined);
  });

  test("an admin logs in with the ADMIN role", async () => {
    const res = await login({ email: "admin@acme.test", password: PASSWORD });
    assert.equal(res.status, 200);
    assert.equal(res.body.user.role, "ADMIN");
  });

  test("email is case-insensitive and ignores surrounding spaces", async () => {
    const res = await login({ email: "  ARUN@Acme.Test ", password: PASSWORD });
    assert.equal(res.status, 200);
    assert.equal(res.body.user.id, "a-emp1");
  });

  test("wrong password is rejected", async () => {
    const res = await login({ email: "arun@acme.test", password: "wrong-password" });
    assert.equal(res.status, 400);
    assert.equal(res.body.message, "Invalid email or password");
    assert.equal(res.body.token, undefined);
  });

  test("unknown email gets the SAME error as a wrong password (no account enumeration)", async () => {
    const unknown = await login({ email: "nobody@nowhere.test", password: PASSWORD });
    const wrongPw = await login({ email: "arun@acme.test", password: "nope" });
    assert.equal(unknown.status, wrongPw.status);
    assert.deepEqual(unknown.body, wrongPw.body);
  });

  test("an INACTIVE employee cannot log in", async () => {
    db.get("user", "a-emp1").status = "INACTIVE";
    const res = await login({ email: "arun@acme.test", password: PASSWORD });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /inactive/i);
    assert.equal(res.body.token, undefined);
  });

  test("first login asks the user to change the temporary password", async () => {
    db.get("user", "a-emp2").isFirstLogin = true;
    const res = await login({ email: "anu@acme.test", password: PASSWORD });
    assert.equal(res.status, 200);
    assert.equal(res.body.forcePasswordChange, true);
  });

  describe("same email registered in two companies", () => {
    beforeEach(() => {
      t.addUser({ id: "b-shared", companyId: 2, name: "Shared B", email: "shared@mail.test" });
      t.addUser({ id: "a-shared", companyId: 1, name: "Shared A", email: "shared@mail.test" });
    });

    test("same password in both: login without a company code is refused (never guesses)", async () => {
      const res = await login({ email: "shared@mail.test", password: PASSWORD });
      assert.equal(res.status, 400);
      assert.equal(res.body.token, undefined);
    });

    test("same password in both: the company code decides which company you enter", async () => {
      const a = await login({ email: "shared@mail.test", password: PASSWORD, companyId: "COM-A" });
      const b = await login({ email: "shared@mail.test", password: PASSWORD, companyId: "com-b" });
      assert.equal(a.status, 200);
      assert.equal(a.body.user.companyId, 1);
      assert.equal(a.body.user.id, "a-shared");
      assert.equal(b.status, 200);
      assert.equal(b.body.user.companyId, 2);
      assert.equal(b.body.user.id, "b-shared");
    });

    test("different passwords: you only ever enter the company whose password you typed", async () => {
      db.get("user", "a-shared").password = t.bcrypt.hashSync("OnlyCompanyA!1", 4);
      const res = await login({ email: "shared@mail.test", password: "OnlyCompanyA!1" });
      assert.equal(res.status, 200);
      assert.equal(res.body.user.companyId, 1);
    });

    test("a company code for a company the user does not belong to does not log them in there", async () => {
      const res = await login({ email: "arun@acme.test", password: PASSWORD, companyId: "COM-B" });
      // Arun only exists in company A, so the code is irrelevant - he must land in A, never B.
      assert.equal(res.status, 200);
      assert.equal(res.body.user.companyId, 1);
    });
  });

  test("missing email returns a clean 400, not a 500", async () => {
    const res = await login({ password: PASSWORD });
    assert.equal(res.status, 400);
  });

  test("missing password returns a clean 400, not a 500", async () => {
    const res = await login({ email: "arun@acme.test" });
    assert.equal(res.status, 400);
    assert.equal(res.body.token, undefined);
  });
});

describe("protected routes: token checks (authMiddleware)", () => {
  const me = (token, headers) => api.get("/api/auth/me", { token, headers });

  test("no token -> 401", async () => {
    const res = await api.get("/api/auth/me");
    assert.equal(res.status, 401);
  });

  test("header without the Bearer token part -> 401", async () => {
    const res = await api.get("/api/auth/me", { headers: { Authorization: "Bearer" } });
    assert.equal(res.status, 401);
  });

  test("garbage token -> 401", async () => {
    assert.equal((await me("not.a.real.token")).status, 401);
  });

  test("token signed with a different secret -> 401", async () => {
    const forged = t.jwt.sign({ userId: "a-admin", companyId: 1, role: "ADMIN" }, "attacker-secret");
    assert.equal((await me(forged)).status, 401);
  });

  test("expired token -> 401", async () => {
    const expired = t.tokenFor(w.users.aEmp1, {}, { expiresIn: -60 });
    assert.equal((await me(expired)).status, 401);
  });

  test("token without userId/companyId -> 401", async () => {
    const bad = t.jwt.sign({ role: "ADMIN" }, process.env.JWT_SECRET);
    assert.equal((await me(bad)).status, 401);
  });

  test("valid token -> 200 and returns only the caller's own profile", async () => {
    const res = await me(t.tokenFor(w.users.aEmp1));
    assert.equal(res.status, 200);
    assert.equal(res.body.id, "a-emp1");
    assert.equal(res.body.companyId, 1);
    assert.equal(res.body.password, undefined);
    assert.equal(res.body.resetToken, undefined);
    assert.ok(!res.text.includes("$2"), "password hash leaked from /me");
  });

  test("a deleted user's old token stops working immediately", async () => {
    const token = t.tokenFor(w.users.aEmp1);
    db.rows("user").splice(db.rows("user").findIndex((u) => u.id === "a-emp1"), 1);
    assert.equal((await me(token)).status, 401);
  });

  test("an employee set to INACTIVE loses access even with a valid token", async () => {
    const token = t.tokenFor(w.users.aEmp1);
    db.get("user", "a-emp1").status = "INACTIVE";
    assert.equal((await me(token)).status, 401);
  });

  test("a token whose companyId does not match the user's real company is refused", async () => {
    // A properly signed token that claims user a-emp1 belongs to company B.
    const mixed = t.tokenFor(w.users.aEmp1, { companyId: 2 });
    assert.equal((await me(mixed)).status, 401);
  });
});

describe("forgot password", () => {
  const forgot = (email) => api.post("/api/auth/forgot-password", { body: { email } });

  test("known email: generic reply, token stored for ~1 hour, email sent with the link", async () => {
    const res = await forgot("arun@acme.test");

    assert.equal(res.status, 200);
    assert.equal(res.body.message, GENERIC_FORGOT_MESSAGE);

    const user = db.get("user", "a-emp1");
    assert.match(user.resetToken, /^[0-9a-f]{64}$/);
    const minutes = (user.resetTokenExpiry.getTime() - Date.now()) / 60000;
    assert.ok(minutes > 58 && minutes <= 60, `expiry should be about 60 minutes, was ${minutes.toFixed(1)}`);

    assert.equal(t.sentEmails.length, 1);
    assert.equal(t.sentEmails[0].to, "arun@acme.test");
    assert.ok(t.sentEmails[0].link.endsWith(`/reset-password/${user.resetToken}`));
  });

  test("the reset token is never returned in the API response", async () => {
    const res = await forgot("arun@acme.test");
    assert.ok(!res.text.includes(db.get("user", "a-emp1").resetToken));
  });

  test("unknown email: IDENTICAL reply, no email, nothing stored (no account enumeration)", async () => {
    const known = await forgot("arun@acme.test");
    t.sentEmails.length = 0;
    const unknown = await forgot("nobody@nowhere.test");

    assert.equal(unknown.status, known.status);
    assert.deepEqual(unknown.body, known.body);
    assert.equal(t.sentEmails.length, 0);
    assert.ok(db.rows("user").every((u) => !u.resetToken || u.id === "a-emp1"));
  });

  test("empty email -> 400", async () => {
    assert.equal((await forgot("   ")).status, 400);
    assert.equal((await api.post("/api/auth/forgot-password", { body: {} })).status, 400);
  });

  test("email used in two companies: no token is created for EITHER company", async () => {
    t.addUser({ id: "a-dup", companyId: 1, name: "Dup A", email: "dup@mail.test" });
    t.addUser({ id: "b-dup", companyId: 2, name: "Dup B", email: "dup@mail.test" });

    const res = await forgot("dup@mail.test");

    assert.equal(res.status, 400);
    assert.equal(t.sentEmails.length, 0);
    assert.equal(db.get("user", "a-dup").resetToken, null);
    assert.equal(db.get("user", "b-dup").resetToken, null);
  });

  test("email is matched case-insensitively", async () => {
    const res = await forgot("  ARUN@ACME.TEST ");
    assert.equal(res.status, 200);
    assert.equal(t.sentEmails.length, 1);
  });
});

describe("reset password", () => {
  const reset = (token, password) =>
    api.post(`/api/auth/reset-password/${token}`, { body: { password } });

  const issueToken = async (email = "arun@acme.test") => {
    await api.post("/api/auth/forgot-password", { body: { email } });
    return t.sentEmails.at(-1).link.split("/").pop();
  };

  test("a valid token changes the password; old password stops working, new one works", async () => {
    const token = await issueToken();

    const res = await reset(token, "BrandNew@456");
    assert.equal(res.status, 200);
    assert.equal(res.body.message, "Password reset successful");

    assert.equal((await login({ email: "arun@acme.test", password: PASSWORD })).status, 400);
    const ok = await login({ email: "arun@acme.test", password: "BrandNew@456" });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.user.id, "a-emp1");
  });

  test("the new password is stored hashed, never as plain text", async () => {
    const token = await issueToken();
    await reset(token, "BrandNew@456");
    const stored = db.get("user", "a-emp1").password;
    assert.notEqual(stored, "BrandNew@456");
    assert.ok(await t.bcrypt.compare("BrandNew@456", stored));
  });

  test("the token is cleared after use and cannot be used a second time", async () => {
    const token = await issueToken();
    assert.equal((await reset(token, "BrandNew@456")).status, 200);

    const user = db.get("user", "a-emp1");
    assert.equal(user.resetToken, null);
    assert.equal(user.resetTokenExpiry, null);

    const again = await reset(token, "Hijack@789");
    assert.equal(again.status, 400);
    assert.ok(await t.bcrypt.compare("BrandNew@456", db.get("user", "a-emp1").password));
  });

  test("an invalid token is rejected and changes nothing", async () => {
    const before = db.get("user", "a-emp1").password;
    const res = await reset("f".repeat(64), "BrandNew@456");
    assert.equal(res.status, 400);
    assert.equal(res.body.message, "Invalid or expired token");
    assert.equal(db.get("user", "a-emp1").password, before);
  });

  test("an expired token is rejected and changes nothing", async () => {
    const token = await issueToken();
    db.get("user", "a-emp1").resetTokenExpiry = new Date(Date.now() - 1000);
    const before = db.get("user", "a-emp1").password;

    const res = await reset(token, "BrandNew@456");
    assert.equal(res.status, 400);
    assert.equal(db.get("user", "a-emp1").password, before);
  });

  test("resetting clears the first-login flag", async () => {
    db.get("user", "a-emp1").isFirstLogin = true;
    const token = await issueToken();
    await reset(token, "BrandNew@456");
    assert.equal(db.get("user", "a-emp1").isFirstLogin, false);
  });

  test("a reset only changes the account that owns the token, never another company's account", async () => {
    // Same email address exists in company B too.
    t.addUser({ id: "b-twin", companyId: 2, name: "Twin", email: "arun@acme.test" });
    const twinBefore = db.get("user", "b-twin").password;
    db.get("user", "a-emp1").resetToken = "a".repeat(64);
    db.get("user", "a-emp1").resetTokenExpiry = new Date(Date.now() + 60000);

    const res = await reset("a".repeat(64), "BrandNew@456");

    assert.equal(res.status, 200);
    assert.equal(db.get("user", "b-twin").password, twinBefore);
    assert.ok(await t.bcrypt.compare("BrandNew@456", db.get("user", "a-emp1").password));
  });

  test("missing password returns a clean 400", async () => {
    const token = await issueToken();
    const res = await api.post(`/api/auth/reset-password/${token}`, { body: {} });
    assert.equal(res.status, 400);
  });

  test("a very short password is rejected and the token stays usable", async () => {
    const token = await issueToken();
    const before = db.get("user", "a-emp1").password;
    const res = await reset(token, "a");
    assert.equal(res.status, 400);
    assert.equal(db.get("user", "a-emp1").password, before);
    assert.equal((await reset(token, "Long@Enough1")).status, 200);
  });
});
