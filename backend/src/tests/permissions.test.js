// Admin vs employee permissions, and what an expired subscription may do.
const { describe, test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const t = require("./helpers/testApp");
const adminOnly = require("../src/middleware/adminOnly");

const { api, db } = t;

let w, admin, emp1, emp2;
before(t.start);
after(t.stop);
beforeEach(() => {
  w = t.seedWorld();
  admin = t.tokenFor(w.users.aAdmin);
  emp1 = t.tokenFor(w.users.aEmp1);
  emp2 = t.tokenFor(w.users.aEmp2);
});

const newEmployee = (extra = {}) => ({
  name: "New Person", email: "new.person@acme.test", phone: "9876543210", ...extra,
});

describe("adminOnly middleware", () => {
  const run = (user) => {
    let result = { nextCalled: false };
    const res = {
      status(code) { result.status = code; return this; },
      json(body) { result.body = body; return this; },
    };
    adminOnly({ user }, res, () => { result.nextCalled = true; });
    return result;
  };

  test("lets an ADMIN through", () => assert.equal(run({ role: "ADMIN" }).nextCalled, true));
  test("blocks a USER with 403", () => {
    const r = run({ role: "USER" });
    assert.equal(r.nextCalled, false);
    assert.equal(r.status, 403);
  });
  test("blocks a request with no user with 403", () => assert.equal(run(undefined).status, 403));
});

describe("admin-only endpoints over HTTP", () => {
  test("POST /api/users/create-employee: employee gets 403, admin is allowed through", async () => {
    const asEmployee = await api.post("/api/users/create-employee", { token: emp1, body: newEmployee() });
    assert.equal(asEmployee.status, 403);
    assert.equal(db.rows("user").filter((u) => u.email === "new.person@acme.test").length, 0);

    const asAdmin = await api.post("/api/users/create-employee", { token: admin, body: {} });
    assert.notEqual(asAdmin.status, 403);
    assert.notEqual(asAdmin.status, 401);
  });

  test("POST /api/services: employee gets 403, admin is allowed through", async () => {
    const asEmployee = await api.post("/api/services", { token: emp1, body: { name: "SEO" } });
    assert.equal(asEmployee.status, 403);

    const asAdmin = await api.post("/api/services", { token: admin, body: { name: "SEO" } });
    assert.notEqual(asAdmin.status, 403);
    assert.notEqual(asAdmin.status, 401);
  });

  test("no token on an admin-only endpoint gets 401, not data", async () => {
    assert.equal((await api.post("/api/services", { body: { name: "SEO" } })).status, 401);
  });
});

describe("the role comes from the database, not from the token", () => {
  test("a token that CLAIMS admin but belongs to an employee gets no admin rights", async () => {
    const fakeAdminToken = t.tokenFor(w.users.aEmp1, { role: "ADMIN" });
    const res = await api.post("/api/users/create-employee", { token: fakeAdminToken, body: newEmployee() });
    assert.equal(res.status, 403);
  });

  test("an admin who was demoted loses admin rights immediately (old token still valid)", async () => {
    db.get("user", "a-admin").role = "USER";
    const res = await api.post("/api/services", { token: admin, body: { name: "SEO" } });
    assert.equal(res.status, 403);
  });

  test("a token that claims USER but whose DB role is ADMIN is treated as admin", async () => {
    const staleToken = t.tokenFor(w.users.aAdmin, { role: "USER" });
    const res = await api.post("/api/services", { token: staleToken, body: { name: "SEO" } });
    assert.notEqual(res.status, 403);
  });
});

describe("managing employees and admins (/api/employees)", () => {
  test("an employee CANNOT create an admin", async () => {
    const res = await api.post("/api/employees", { token: emp1, body: newEmployee({ role: "ADMIN" }) });
    assert.equal(res.status, 403);
    assert.equal(db.rows("user").filter((u) => u.email === "new.person@acme.test").length, 0);
  });

  test("an admin CAN create an admin", async () => {
    const res = await api.post("/api/employees", { token: admin, body: newEmployee({ role: "ADMIN" }) });
    assert.equal(res.status, 201);
    const created = db.rows("user").find((u) => u.email === "new.person@acme.test");
    assert.equal(created.role, "ADMIN");
  });

  test("an admin creates an employee in their OWN company, even if the request names another company", async () => {
    const res = await api.post("/api/employees", { token: admin, body: newEmployee({ companyId: 2 }) });
    assert.equal(res.status, 201);
    const created = db.rows("user").find((u) => u.email === "new.person@acme.test");
    assert.equal(created.companyId, 1);
    assert.equal(created.role, "USER");
  });

  test("a new employee gets a temporary password and must change it at first login", async () => {
    await api.post("/api/employees", { token: admin, body: newEmployee() });
    const created = db.rows("user").find((u) => u.email === "new.person@acme.test");
    assert.equal(created.isFirstLogin, true);
    assert.ok(created.password.startsWith("$2"), "password must be stored hashed");
  });

  test("an employee CANNOT promote themselves to admin", async () => {
    const res = await api.put("/api/employees/a-emp1", { token: emp1, body: { role: "ADMIN" } });
    assert.equal(res.status, 403);
    assert.equal(db.get("user", "a-emp1").role, "USER");
  });

  test("an employee CANNOT promote a colleague to admin", async () => {
    const res = await api.put("/api/employees/a-emp2", { token: emp1, body: { role: "ADMIN" } });
    assert.equal(res.status, 403);
    assert.equal(db.get("user", "a-emp2").role, "USER");
  });

  test("an employee CANNOT edit or delete an admin account", async () => {
    t.addUser({ id: "a-admin2", companyId: 1, name: "Second Admin", email: "admin2@acme.test", role: "ADMIN", createdAt: new Date("2026-02-01") });

    const edit = await api.put("/api/employees/a-admin2", { token: emp1, body: { name: "Hacked" } });
    assert.equal(edit.status, 403);
    assert.equal(db.get("user", "a-admin2").name, "Second Admin");

    const del = await api.delete("/api/employees/a-admin2", { token: emp1 });
    assert.equal(del.status, 403);
    assert.ok(db.get("user", "a-admin2"));
  });

  test("an admin CAN delete an employee", async () => {
    const res = await api.delete("/api/employees/a-emp2", { token: admin });
    assert.equal(res.status, 200);
    assert.equal(db.get("user", "a-emp2"), null);
  });

  test("an admin cannot delete their own account", async () => {
    t.addUser({ id: "a-admin2", companyId: 1, name: "Second Admin", email: "admin2@acme.test", role: "ADMIN", createdAt: new Date("2026-02-01") });
    const res = await api.delete("/api/employees/a-admin2", { token: t.tokenFor(db.get("user", "a-admin2")) });
    assert.equal(res.status, 400);
    assert.ok(db.get("user", "a-admin2"));
  });

  test("an admin cannot change their own role or deactivate themselves", async () => {
    t.addUser({ id: "a-admin2", companyId: 1, name: "Second Admin", email: "admin2@acme.test", role: "ADMIN", createdAt: new Date("2026-02-01") });
    const token = t.tokenFor(db.get("user", "a-admin2"));

    assert.equal((await api.put("/api/employees/a-admin2", { token, body: { role: "USER" } })).status, 400);
    assert.equal((await api.put("/api/employees/a-admin2", { token, body: { status: "INACTIVE" } })).status, 400);
    assert.equal(db.get("user", "a-admin2").role, "ADMIN");
    assert.equal(db.get("user", "a-admin2").status, "ACTIVE");
  });

  test("the company owner (first admin) is hidden from the employee screens and cannot be edited or deleted", async () => {
    t.addUser({ id: "a-admin2", companyId: 1, name: "Second Admin", email: "admin2@acme.test", role: "ADMIN", createdAt: new Date("2026-02-01") });
    const token = t.tokenFor(db.get("user", "a-admin2"));

    const list = await api.get("/api/employees?includeAdmins=true", { token });
    assert.equal(list.status, 200);
    assert.ok(!list.body.employees.some((e) => e.id === "a-admin"), "owner must not be listed");

    assert.equal((await api.get("/api/employees/a-admin", { token })).status, 404);
    assert.equal((await api.put("/api/employees/a-admin", { token, body: { name: "x" } })).status, 404);
    assert.equal((await api.delete("/api/employees/a-admin", { token })).status, 404);
    assert.ok(db.get("user", "a-admin"));
  });

  test("an employee cannot ask the API to list admins", async () => {
    t.addUser({ id: "a-admin2", companyId: 1, name: "Second Admin", email: "admin2@acme.test", role: "ADMIN", createdAt: new Date("2026-02-01") });
    const res = await api.get("/api/employees?includeAdmins=true", { token: emp1 });
    assert.equal(res.status, 200);
    assert.ok(res.body.employees.every((e) => e.role === "USER"));
  });

  test("an employee cannot create a regular employee", async () => {
    const res = await api.post("/api/employees", { token: emp1, body: newEmployee() });
    assert.equal(res.status, 403);
  });

  test("an employee cannot delete a colleague", async () => {
    const res = await api.delete("/api/employees/a-emp2", { token: emp1 });
    assert.equal(res.status, 403);
    assert.ok(db.get("user", "a-emp2"));
  });
});

describe("employee management is admin-only (but the staff list stays readable)", () => {
  test("an employee cannot edit a colleague", async () => {
    const res = await api.put("/api/employees/a-emp2", { token: emp1, body: { name: "Hacked", email: "anu@acme.test" } });
    assert.equal(res.status, 403);
    assert.equal(db.get("user", "a-emp2").name, "Anu Emp");
  });

  test("an employee can still LIST employees (needed for assign dropdowns)", async () => {
    const res = await api.get("/api/employees", { token: emp1 });
    assert.equal(res.status, 200);
    assert.ok(res.body.employees.length > 0);
  });

  test("an admin can still create, edit and delete employees", async () => {
    const created = await api.post("/api/employees", { token: admin, body: newEmployee() });
    assert.equal(created.status, 201);
    const edited = await api.put("/api/employees/a-emp2", { token: admin, body: { name: "Anu Renamed", email: "anu@acme.test" } });
    assert.equal(edited.status, 200);
    assert.equal(db.get("user", "a-emp2").name, "Anu Renamed");
    assert.equal((await api.delete("/api/employees/a-emp1", { token: admin })).status, 200);
  });
});

describe("leads: what an employee may see and do", () => {
  const ids = (res) => res.body.data.map((l) => l.id).sort((a, b) => a - b);

  test("an admin sees every lead of the company", async () => {
    const res = await api.get("/api/leads", { token: admin });
    assert.deepEqual(ids(res), [1, 2, 3]);
  });

  test("an employee sees ONLY the leads assigned to them", async () => {
    assert.deepEqual(ids(await api.get("/api/leads", { token: emp1 })), [1]);
    assert.deepEqual(ids(await api.get("/api/leads", { token: emp2 })), [2]);
  });

  test("an employee cannot read the work notes of a lead assigned to someone else", async () => {
    const res = await api.get("/api/leads/2/work-notes", { token: emp1 });
    assert.equal(res.status, 403);
  });

  test("an employee can read work notes of their own lead; an admin can read any", async () => {
    assert.equal((await api.get("/api/leads/1/work-notes", { token: emp1 })).status, 200);
    assert.equal((await api.get("/api/leads/2/work-notes", { token: admin })).status, 200);
  });

  test("an employee's bulk delete removes only leads assigned to them", async () => {
    const res = await api.post("/api/leads/bulk-delete", { token: emp1, body: { ids: [1, 2, 3] } });
    assert.equal(res.status, 200);
    assert.equal(db.get("lead", 1), null, "own lead should be deleted");
    assert.ok(db.get("lead", 2), "colleague's lead must survive");
    assert.ok(db.get("lead", 3), "unassigned lead must survive");
  });

  test("an admin's bulk delete can remove any lead of their company", async () => {
    const res = await api.post("/api/leads/bulk-delete", { token: admin, body: { ids: [1, 2, 3] } });
    assert.equal(res.status, 200);
    assert.deepEqual([db.get("lead", 1), db.get("lead", 2), db.get("lead", 3)], [null, null, null]);
  });

  test("a lead can only be assigned to an employee (USER) - not to an admin", async () => {
    const res = await api.post("/api/leads", { token: admin, body: { name: "New Lead", assignedToId: "a-admin" } });
    assert.equal(res.status, 400);
  });

  test("an employee cannot delete a lead assigned to a colleague", async () => {
    const res = await api.delete("/api/leads/2", { token: emp1 });
    assert.ok([403, 404].includes(res.status), `expected 403/404, got ${res.status}`);
    assert.ok(db.get("lead", 2));
  });

  test("an employee cannot change the status of a lead assigned to a colleague", async () => {
    const res = await api.patch("/api/leads/2/status", { token: emp1, body: { status: "CONTACTED" } });
    assert.ok([403, 404].includes(res.status), `expected 403/404, got ${res.status}`);
    assert.equal(db.get("lead", 2).status, "NEW");
  });
});

describe("leads: employees work only on their OWN assigned leads", () => {
  test("an employee CAN change the status of their own lead", async () => {
    const res = await api.patch("/api/leads/1/status", { token: emp1, body: { status: "CONTACTED" } });
    assert.equal(res.status, 200);
    assert.equal(db.get("lead", 1).status, "CONTACTED");
  });

  test("an employee CAN edit their own lead", async () => {
    const res = await api.put("/api/leads/1", { token: emp1, body: { name: "Lead A1 Updated" } });
    assert.equal(res.status, 200);
    assert.equal(db.get("lead", 1).name, "Lead A1 Updated");
  });

  test("an employee CAN delete their own lead", async () => {
    assert.equal((await api.delete("/api/leads/1", { token: emp1 })).status, 200);
    assert.equal(db.get("lead", 1), null);
  });

  test("an employee cannot edit a colleague's lead or an unassigned lead", async () => {
    for (const id of [2, 3]) {
      const res = await api.put(`/api/leads/${id}`, { token: emp1, body: { name: "Hacked" } });
      assert.equal(res.status, 404, `lead ${id}`);
      assert.notEqual(db.get("lead", id).name, "Hacked");
    }
  });

  test("an employee cannot delete an unassigned lead", async () => {
    assert.equal((await api.delete("/api/leads/3", { token: emp1 })).status, 404);
    assert.ok(db.get("lead", 3));
  });

  test("an employee cannot convert a colleague's WON lead to a customer", async () => {
    db.get("lead", 2).status = "WON";
    const customers = db.rows("customer").length;
    const res = await api.post("/api/leads/2/convert", { token: emp1 });
    assert.equal(res.status, 404);
    assert.equal(db.rows("customer").length, customers);
    assert.equal(db.get("lead", 2).isConverted, false);
  });

  test("an admin can still edit, change status of, convert and delete ANY lead of the company", async () => {
    assert.equal((await api.patch("/api/leads/2/status", { token: admin, body: { status: "WON" } })).status, 200);
    assert.equal((await api.post("/api/leads/2/convert", { token: admin })).status, 201);
    assert.equal((await api.put("/api/leads/3", { token: admin, body: { name: "Admin Edit" } })).status, 200);
    assert.equal((await api.delete("/api/leads/3", { token: admin })).status, 200);
  });
});

describe("expired / inactive subscription: view yes, change no", () => {
  const setCompany = (patch) => Object.assign(db.get("company", 1), patch);

  for (const status of ["EXPIRED", "INACTIVE"]) {
    test(`${status} company can still VIEW customers, leads and chats`, async () => {
      setCompany({ status });
      assert.equal((await api.get("/api/customers", { token: admin })).status, 200);
      assert.equal((await api.get("/api/leads", { token: admin })).status, 200);
      assert.equal((await api.get("/api/conversations", { token: admin })).status, 200);
    });

    test(`${status} company cannot create, edit or delete anything`, async () => {
      setCompany({ status });
      const attempts = [
        api.post("/api/customers", { token: admin, body: { name: "X", phone: "919111111111" } }),
        api.put("/api/customers/cust-a1", { token: admin, body: { name: "Changed", phone: "919000000001" } }),
        api.delete("/api/customers/cust-a1", { token: admin }),
        api.post("/api/leads", { token: admin, body: { name: "X" } }),
        api.delete("/api/leads/1", { token: admin }),
        api.patch("/api/conversations/conv-a1", { token: admin, body: { status: "CLOSED" } }),
        api.delete("/api/conversations/conv-a1", { token: admin }),
        api.post("/api/messages", { token: admin, body: { conversationId: "conv-a1", content: "hi", sender: "AGENT" } }),
      ];
      for (const res of await Promise.all(attempts)) assert.equal(res.status, 403);

      assert.equal(db.get("customer", "cust-a1").name, "Alice Acme");
      assert.ok(db.get("lead", 1));
      assert.ok(db.get("conversation", "conv-a1"));
    });
  }

  test("an ACTIVE company whose expiry date has passed is also read-only", async () => {
    setCompany({ status: "ACTIVE", expiryDate: new Date(Date.now() - 1000) });
    assert.equal((await api.get("/api/customers", { token: admin })).status, 200);
    assert.equal((await api.delete("/api/customers/cust-a1", { token: admin })).status, 403);
    assert.ok(db.get("customer", "cust-a1"));
  });

  test("a TRIAL company can still make changes", async () => {
    setCompany({ status: "TRIAL" });
    const res = await api.post("/api/leads", { token: admin, body: { name: "Trial Lead" } });
    assert.equal(res.status, 201);
  });
});
