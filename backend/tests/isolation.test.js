// Company data isolation: one company must NEVER see or change another
// company's customers, leads or chats - by list, by id, by search, by write,
// or by bulk action. Company A is the "attacker", company B is the "victim".
//
// Every cross-company attempt must (1) be refused (404/400/403) or return
// nothing, (2) leave the victim's data untouched, and (3) never echo the
// victim's data back in the response.
const { describe, test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const t = require("./helpers/testApp");

const { api, db } = t;

// Strings that exist ONLY in company B's data. If any appears in a response
// to company A, data has leaked.
const B_SECRETS = ["Bravo Secret Client", "secret@bravo-client.test", "919000000002", "Bhavna Bravo",
  "Lead B1 Confidential", "Bravo private message", "B private note", "hi from B", "cust-b1", "conv-b1", "msg-b1"];
const noLeak = (res) => {
  for (const secret of B_SECRETS) {
    assert.ok(!res.text.includes(secret), `LEAK: company B data "${secret}" appeared in a company A response`);
  }
};
const refused = (res) =>
  assert.ok([400, 403, 404].includes(res.status), `expected 400/403/404 but got ${res.status}`);

let w, aAdmin, aEmp1, bAdmin;
before(t.start);
after(t.stop);
beforeEach(() => {
  w = t.seedWorld();
  aAdmin = t.tokenFor(w.users.aAdmin);
  aEmp1 = t.tokenFor(w.users.aEmp1);
  bAdmin = t.tokenFor(w.users.bAdmin);
});

describe("customers", () => {
  test("each company's list contains only its own customers", async () => {
    const a = await api.get("/api/customers", { token: aAdmin });
    const b = await api.get("/api/customers", { token: bAdmin });
    assert.deepEqual(a.body.customers.map((c) => c.id).sort(), ["cust-a1", "cust-a2"]);
    assert.deepEqual(b.body.customers.map((c) => c.id).sort(), ["cust-b1", "cust-b2"]);
    noLeak(a);
  });

  test("an employee of company A also sees only company A customers", async () => {
    const res = await api.get("/api/customers", { token: aEmp1 });
    assert.ok(res.body.customers.every((c) => c.companyId === 1));
    noLeak(res);
  });

  test("searching for another company's customer finds nothing (name, phone and email)", async () => {
    for (const term of ["Bravo Secret", "919000000002", "secret@bravo"]) {
      const res = await api.get(`/api/customers?search=${encodeURIComponent(term)}`, { token: aAdmin });
      assert.equal(res.status, 200);
      assert.deepEqual(res.body.customers, [], `search "${term}" leaked a result`);
    }
  });

  test("status filter does not widen the result to other companies", async () => {
    const res = await api.get("/api/customers?status=ACTIVE", { token: aAdmin });
    assert.ok(res.body.customers.every((c) => c.companyId === 1));
  });

  test("GET /customers/:id of another company's customer -> 404 with no data", async () => {
    const res = await api.get("/api/customers/cust-b1", { token: aAdmin });
    assert.equal(res.status, 404);
    noLeak(res);
  });

  test("GET /customers/:id of own customer works", async () => {
    const res = await api.get("/api/customers/cust-a1", { token: aAdmin });
    assert.equal(res.status, 200);
    assert.equal(res.body.customer.name, "Alice Acme");
  });

  test("PUT /customers/:id on another company's customer -> 404 and nothing changes", async () => {
    const before = structuredClone(db.get("customer", "cust-b1"));
    const res = await api.put("/api/customers/cust-b1", { token: aAdmin, body: { name: "Hijacked", phone: "919999999999" } });
    assert.equal(res.status, 404);
    assert.deepEqual(db.get("customer", "cust-b1"), before);
  });

  test("DELETE /customers/:id on another company's customer -> 404 and it still exists", async () => {
    const res = await api.delete("/api/customers/cust-b1", { token: aAdmin });
    assert.equal(res.status, 404);
    assert.ok(db.get("customer", "cust-b1"));
    assert.ok(db.get("conversation", "conv-b1"), "their chat must survive too");
    assert.ok(db.get("message", "msg-b1"), "their messages must survive too");
  });

  test("bulk delete mixing own and foreign ids deletes ONLY the own ones", async () => {
    const res = await api.post("/api/customers/bulk-delete", { token: aAdmin, body: { ids: ["cust-a2", "cust-b1", "cust-b2"] } });
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.deletedIds, ["cust-a2"]);
    assert.equal(db.get("customer", "cust-a2"), null);
    assert.ok(db.get("customer", "cust-b1"));
    assert.ok(db.get("customer", "cust-b2"));
  });

  test("bulk delete of ONLY foreign ids -> 404 and nothing is deleted", async () => {
    const res = await api.post("/api/customers/bulk-delete", { token: aAdmin, body: { ids: ["cust-b1", "cust-b2"] } });
    assert.equal(res.status, 404);
    assert.equal(db.rows("customer").filter((c) => c.companyId === 2).length, 2);
    assert.ok(db.get("conversation", "conv-b1"));
  });

  test("two companies may hold the same phone number as separate customers", async () => {
    db.insert("customer", { id: "cust-b-same-phone", companyId: 2, name: "Same Phone B", phone: "919000000001", status: "ACTIVE", userId: "b-admin" });
    const a = await api.get("/api/customers/cust-a1", { token: aAdmin });
    assert.equal(a.body.customer.name, "Alice Acme");
    const asB = await api.get("/api/customers/cust-a1", { token: bAdmin });
    assert.equal(asB.status, 404);
  });
});

describe("leads", () => {
  test("each company's admin list contains only its own leads", async () => {
    const a = await api.get("/api/leads", { token: aAdmin });
    const b = await api.get("/api/leads", { token: bAdmin });
    assert.deepEqual(a.body.data.map((l) => l.id).sort((x, y) => x - y), [1, 2, 3]);
    assert.deepEqual(b.body.data.map((l) => l.id).sort((x, y) => x - y), [11, 12]);
    noLeak(a);
  });

  test("PUT /leads/:id on another company's lead -> 404 and nothing changes", async () => {
    const before = structuredClone(db.get("lead", 11));
    const res = await api.put("/api/leads/11", { token: aAdmin, body: { name: "Hijacked" } });
    assert.equal(res.status, 404);
    assert.deepEqual(db.get("lead", 11), before);
  });

  test("PATCH /leads/:id/status on another company's lead -> 404 and nothing changes", async () => {
    const res = await api.patch("/api/leads/11/status", { token: aAdmin, body: { status: "WON" } });
    assert.equal(res.status, 404);
    assert.equal(db.get("lead", 11).status, "NEW");
  });

  test("DELETE /leads/:id on another company's lead -> 404 and it still exists", async () => {
    const res = await api.delete("/api/leads/11", { token: aAdmin });
    assert.equal(res.status, 404);
    assert.ok(db.get("lead", 11));
  });

  test("POST /leads/:id/convert on another company's lead -> 404, no customer created", async () => {
    db.get("lead", 11).status = "WON";
    const customersBefore = db.rows("customer").length;
    const res = await api.post("/api/leads/11/convert", { token: aAdmin });
    assert.equal(res.status, 404);
    assert.equal(db.rows("customer").length, customersBefore);
    assert.equal(db.get("lead", 11).isConverted, false);
  });

  test("converting a lead is NOT blocked by a customer that exists in a DIFFERENT company", async () => {
    // Company B already has a customer with this phone number. That must be
    // invisible to company A - A's lead converts normally.
    db.get("lead", 1).status = "WON";
    db.get("lead", 1).phone = "9000000002"; // normalises to 919000000002 = B's customer
    const res = await api.post("/api/leads/1/convert", { token: aAdmin });

    assert.equal(res.status, 201, `got ${res.status} "${res.body && res.body.message}" - another company's data influenced this company`);
    const created = db.rows("customer").find((c) => c.companyId === 1 && c.phone === "919000000002");
    assert.ok(created, "customer should be created inside company A");
    assert.ok(db.get("customer", "cust-b1"), "company B's customer must be untouched");
  });

  test("converting a lead IS still blocked by a duplicate in the SAME company", async () => {
    db.get("lead", 1).status = "WON";
    db.get("lead", 1).phone = "9000000001"; // = A's own customer 919000000001
    const res = await api.post("/api/leads/1/convert", { token: aAdmin });
    assert.equal(res.status, 400);
    assert.equal(res.body.message, "Customer already exists");
  });

  test("work notes of another company's lead -> 404 and no note text leaks", async () => {
    const res = await api.get("/api/leads/11/work-notes", { token: aAdmin });
    assert.equal(res.status, 404);
    noLeak(res);
  });

  test("bulk delete mixing own and foreign lead ids deletes ONLY the own ones", async () => {
    const res = await api.post("/api/leads/bulk-delete", { token: aAdmin, body: { ids: [1, 11, 12] } });
    assert.equal(res.status, 200);
    assert.equal(db.get("lead", 1), null);
    assert.ok(db.get("lead", 11));
    assert.ok(db.get("lead", 12));
  });

  test("a lead cannot be created and assigned to another company's employee", async () => {
    const res = await api.post("/api/leads", { token: aAdmin, body: { name: "Sneaky", assignedToId: "b-emp" } });
    assert.equal(res.status, 400);
    assert.ok(!db.rows("lead").some((l) => l.name === "Sneaky"));
  });

  test("a lead cannot be re-assigned to another company's employee", async () => {
    const res = await api.put("/api/leads/1", { token: aAdmin, body: { name: "Lead A1", assignedToId: "b-emp" } });
    assert.equal(res.status, 400);
    assert.equal(db.get("lead", 1).assignedToId, "a-emp1");
  });

  test("a new lead is always stored under the creator's own company", async () => {
    const res = await api.post("/api/leads", { token: aAdmin, body: { name: "Fresh Lead", companyId: 2 } });
    assert.equal(res.status, 201);
    assert.equal(db.rows("lead").find((l) => l.name === "Fresh Lead").companyId, 1);
  });

  test("an employee sees none of company B's leads", async () => {
    const res = await api.get("/api/leads", { token: aEmp1 });
    assert.ok(res.body.data.every((l) => l.companyId === 1));
    noLeak(res);
  });
});

describe("chats (conversations and messages)", () => {
  test("each company's chat list contains only its own chats", async () => {
    const a = await api.get("/api/conversations", { token: aAdmin });
    const b = await api.get("/api/conversations", { token: bAdmin });
    assert.deepEqual(a.body.conversations.map((c) => c.id), ["conv-a1"]);
    assert.deepEqual(b.body.conversations.map((c) => c.id), ["conv-b1"]);
    noLeak(a);
  });

  test("an employee sees only their own company's chats", async () => {
    const res = await api.get("/api/conversations", { token: aEmp1 });
    assert.deepEqual(res.body.conversations.map((c) => c.id), ["conv-a1"]);
    noLeak(res);
  });

  test("GET /conversations/:id of another company -> 404 and no messages leak", async () => {
    const res = await api.get("/api/conversations/conv-b1", { token: aAdmin });
    assert.equal(res.status, 404);
    noLeak(res);
  });

  test("GET /conversations/:id of own chat works", async () => {
    const res = await api.get("/api/conversations/conv-a1", { token: aAdmin });
    assert.equal(res.status, 200);
    assert.equal(res.body.conversation.id, "conv-a1");
  });

  test("GET /conversations/customer/:customerId of another company's customer -> 404", async () => {
    const res = await api.get("/api/conversations/customer/cust-b1", { token: aAdmin });
    assert.equal(res.status, 404);
    noLeak(res);
  });

  test("starting a chat with another company's customer -> 404 and no chat is created", async () => {
    db.rows("conversation").splice(db.rows("conversation").findIndex((c) => c.id === "conv-b1"), 1);
    const before = db.rows("conversation").length;
    const res = await api.post("/api/conversations", { token: aAdmin, body: { customerId: "cust-b1" } });
    assert.equal(res.status, 404);
    assert.equal(db.rows("conversation").length, before);
  });

  test("PATCH status / read / unread / bot-toggle on another company's chat -> 404 and nothing changes", async () => {
    const before = structuredClone(db.get("conversation", "conv-b1"));
    const attempts = [
      api.patch("/api/conversations/conv-b1", { token: aAdmin, body: { status: "CLOSED" } }),
      api.patch("/api/conversations/conv-b1/read", { token: aAdmin }),
      api.patch("/api/conversations/conv-b1/unread", { token: aAdmin }),
      api.patch("/api/conversations/conv-b1/bot-toggle", { token: aAdmin, body: { botEnabled: false } }),
    ];
    for (const res of await Promise.all(attempts)) assert.equal(res.status, 404);
    const after = db.get("conversation", "conv-b1");
    assert.equal(after.status, before.status);
    assert.equal(after.unreadCount, before.unreadCount);
    assert.equal(after.botEnabled, before.botEnabled);
  });

  test("clearing or deleting another company's chat -> 404 and messages survive", async () => {
    const clear = await api.delete("/api/conversations/conv-b1/messages", { token: aAdmin });
    const del = await api.delete("/api/conversations/conv-b1", { token: aAdmin });
    refused(clear);
    refused(del);
    assert.ok(db.get("conversation", "conv-b1"));
    assert.ok(db.get("message", "msg-b1"));
  });

  test("GET /messages/:conversationId of another company -> 404 and no message text leaks", async () => {
    const res = await api.get("/api/messages/conv-b1", { token: aAdmin });
    assert.equal(res.status, 404);
    noLeak(res);
  });

  test("GET /messages/:conversationId of own chat returns only that chat's messages", async () => {
    const res = await api.get("/api/messages/conv-a1", { token: aAdmin });
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.messages.map((m) => m.id), ["msg-a1"]);
  });

  test("sending a message into another company's chat -> 404 and nothing is stored", async () => {
    const before = db.rows("message").length;
    const res = await api.post("/api/messages", { token: aAdmin, body: { conversationId: "conv-b1", content: "spam", sender: "AGENT" } });
    assert.equal(res.status, 404);
    assert.equal(db.rows("message").length, before);
  });

  test("editing or deleting another company's message -> 404 and it is unchanged", async () => {
    const edit = await api.put("/api/messages/msg-b1", { token: aAdmin, body: { content: "tampered" } });
    const del = await api.delete("/api/messages/msg-b1", { token: aAdmin });
    assert.equal(edit.status, 404);
    assert.equal(del.status, 404);
    assert.equal(db.get("message", "msg-b1").content, "Bravo private message");
  });

  test("editing and deleting your OWN message still works", async () => {
    assert.equal((await api.put("/api/messages/msg-a1", { token: aAdmin, body: { content: "edited" } })).status, 200);
    assert.equal(db.get("message", "msg-a1").content, "edited");
    assert.equal((await api.delete("/api/messages/msg-a1", { token: aAdmin })).status, 200);
    assert.equal(db.get("message", "msg-a1"), null);
  });
});

describe("tokens cannot be used to cross the company boundary", () => {
  test("a valid A-company token with the company id edited to B is rejected everywhere", async () => {
    const tampered = t.tokenFor(w.users.aAdmin, { companyId: 2 });
    for (const url of ["/api/customers", "/api/leads", "/api/conversations", "/api/messages/conv-b1"]) {
      const res = await api.get(url, { token: tampered });
      assert.equal(res.status, 401, `${url} accepted a tampered company id`);
      noLeak(res);
    }
  });

  test("a token signed with the wrong secret is rejected on every data endpoint", async () => {
    const forged = t.jwt.sign({ userId: "b-admin", companyId: 2, role: "ADMIN" }, "wrong-secret");
    for (const url of ["/api/customers", "/api/leads", "/api/conversations"]) {
      assert.equal((await api.get(url, { token: forged })).status, 401);
    }
  });

  test("no endpoint returns data without a token", async () => {
    for (const url of ["/api/customers", "/api/customers/cust-a1", "/api/leads", "/api/conversations", "/api/conversations/conv-a1", "/api/messages/conv-a1", "/api/employees"]) {
      assert.equal((await api.get(url)).status, 401, `${url} answered without a token`);
    }
  });
});

describe("employees of other companies", () => {
  test("the employee list never includes another company's staff", async () => {
    const res = await api.get("/api/employees", { token: aAdmin });
    assert.equal(res.status, 200);
    assert.ok(res.body.employees.every((e) => ["a-emp1", "a-emp2"].includes(e.id)));
    assert.ok(!res.text.includes("bina@bravo.test"));
  });

  test("another company's employee cannot be read, edited or deleted by id", async () => {
    assert.equal((await api.get("/api/employees/b-emp", { token: aAdmin })).status, 404);
    assert.equal((await api.put("/api/employees/b-emp", { token: aAdmin, body: { name: "Hijacked" } })).status, 404);
    assert.equal((await api.delete("/api/employees/b-emp", { token: aAdmin })).status, 404);
    assert.equal(db.get("user", "b-emp").name, "Bina Emp");
  });
});
