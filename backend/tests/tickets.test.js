// Tickets: create, read, update, status change, delete and work notes,
// with the admin / employee / other-company rules.
const { describe, test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const t = require("./helpers/featureApp");

const { api, db, tokenFor } = t;

let w, aAdmin, aEmp1, aEmp2, bAdmin;
before(t.start);
after(t.stop);
beforeEach(() => {
  w = t.seedFeatureWorld();
  aAdmin = tokenFor(w.users.aAdmin);
  aEmp1 = tokenFor(w.users.aEmp1);
  aEmp2 = tokenFor(w.users.aEmp2);
  bAdmin = tokenFor(w.users.bAdmin);
});

describe("create", () => {
  test("an admin creates a ticket for a customer of their company", async () => {
    const res = await api.post("/api/tickets", {
      token: aAdmin,
      body: { title: "Refund request", description: "Order delayed", priority: "HIGH", customerId: "cust-a1", assignedToId: "a-emp1" },
    });

    assert.equal(res.status, 201);
    const ticket = db.get("ticket", res.body.data.id);
    assert.equal(ticket.title, "Refund request");
    assert.equal(ticket.companyId, 1);
    assert.equal(ticket.customerId, "cust-a1");
    assert.equal(ticket.createdById, "a-admin");
    assert.equal(ticket.assignedToId, "a-emp1");
    assert.equal(ticket.priority, "HIGH");
  });

  test("title and customer are required", async () => {
    const noTitle = await api.post("/api/tickets", { token: aAdmin, body: { customerId: "cust-a1" } });
    const noCustomer = await api.post("/api/tickets", { token: aAdmin, body: { title: "x" } });
    assert.equal(noTitle.status, 400);
    assert.equal(noCustomer.status, 400);
  });

  test("an employee cannot create tickets", async () => {
    const res = await api.post("/api/tickets", { token: aEmp1, body: { title: "x", customerId: "cust-a1" } });
    assert.equal(res.status, 403);
  });

  test("a customer from another company cannot be used", async () => {
    const before = db.rows("ticket").length;
    const res = await api.post("/api/tickets", { token: aAdmin, body: { title: "x", customerId: "cust-b1" } });
    assert.equal(res.status, 404);
    assert.equal(db.rows("ticket").length, before);
  });

  test("a ticket cannot be assigned to an employee of another company or to an admin", async () => {
    const otherCompany = await api.post("/api/tickets", { token: aAdmin, body: { title: "x", customerId: "cust-a1", assignedToId: "b-emp" } });
    const anAdmin = await api.post("/api/tickets", { token: aAdmin, body: { title: "x", customerId: "cust-a1", assignedToId: "a-admin" } });
    assert.equal(otherCompany.status, 400);
    assert.equal(anAdmin.status, 400);
  });

  test("no token -> 401", async () => {
    const res = await api.post("/api/tickets", { body: { title: "x", customerId: "cust-a1" } });
    assert.equal(res.status, 401);
  });
});

describe("read", () => {
  test("an admin sees every ticket of their company and none of another company", async () => {
    const res = await api.get("/api/tickets", { token: aAdmin });
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.data.map((x) => x.id).sort(), ["tick-a1", "tick-a2"]);
  });

  test("an employee sees only the tickets assigned to them", async () => {
    const res = await api.get("/api/tickets", { token: aEmp1 });
    assert.deepEqual(res.body.data.map((x) => x.id), ["tick-a1"]);
  });

  test("an admin can open a ticket of their company", async () => {
    const res = await api.get("/api/tickets/tick-a2", { token: aAdmin });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.title, "Login issue");
  });

  test("an employee cannot open a ticket assigned to someone else", async () => {
    const res = await api.get("/api/tickets/tick-a2", { token: aEmp1 });
    assert.equal(res.status, 403);
  });

  test("another company's ticket looks like it does not exist", async () => {
    const res = await api.get("/api/tickets/tick-b1", { token: aAdmin });
    assert.equal(res.status, 404);
    assert.ok(!res.text.includes("Bravo confidential"));
  });
});

describe("update and status", () => {
  test("an admin updates the title, priority and assignee", async () => {
    const res = await api.put("/api/tickets/tick-a1", {
      token: aAdmin,
      body: { title: "Printer replaced", priority: "LOW", status: "IN_PROGRESS", assignedToId: "a-emp2" },
    });
    assert.equal(res.status, 200);
    const ticket = db.get("ticket", "tick-a1");
    assert.equal(ticket.title, "Printer replaced");
    assert.equal(ticket.priority, "LOW");
    assert.equal(ticket.status, "IN_PROGRESS");
    assert.equal(ticket.assignedToId, "a-emp2");
  });

  test("an employee cannot edit a ticket", async () => {
    const res = await api.put("/api/tickets/tick-a1", { token: aEmp1, body: { title: "Hacked" } });
    assert.equal(res.status, 403);
    assert.equal(db.get("ticket", "tick-a1").title, "Printer broken");
  });

  test("an admin cannot edit another company's ticket", async () => {
    const res = await api.put("/api/tickets/tick-b1", { token: aAdmin, body: { title: "Hacked" } });
    assert.equal(res.status, 404);
    assert.equal(db.get("ticket", "tick-b1").title, "Bravo confidential");
  });

  test("the assigned employee can change the status", async () => {
    const res = await api.patch("/api/tickets/tick-a1/status", { token: aEmp1, body: { status: "RESOLVED" } });
    assert.equal(res.status, 200);
    assert.equal(db.get("ticket", "tick-a1").status, "RESOLVED");
  });

  test("an employee who is not assigned cannot change the status", async () => {
    const res = await api.patch("/api/tickets/tick-a1/status", { token: aEmp2, body: { status: "CLOSED" } });
    assert.equal(res.status, 403);
    assert.equal(db.get("ticket", "tick-a1").status, "OPEN");
  });

  test("an admin of another company cannot change the status", async () => {
    const res = await api.patch("/api/tickets/tick-a1/status", { token: bAdmin, body: { status: "CLOSED" } });
    assert.equal(res.status, 404);
    assert.equal(db.get("ticket", "tick-a1").status, "OPEN");
  });
});

describe("delete", () => {
  test("an admin deletes a ticket of their company", async () => {
    const res = await api.delete("/api/tickets/tick-a2", { token: aAdmin });
    assert.equal(res.status, 200);
    assert.equal(db.get("ticket", "tick-a2"), null);
  });

  test("an employee cannot delete a ticket", async () => {
    const res = await api.delete("/api/tickets/tick-a1", { token: aEmp1 });
    assert.equal(res.status, 403);
    assert.ok(db.get("ticket", "tick-a1"));
  });

  test("an admin cannot delete another company's ticket", async () => {
    const res = await api.delete("/api/tickets/tick-b1", { token: aAdmin });
    assert.equal(res.status, 404);
    assert.ok(db.get("ticket", "tick-b1"));
  });
});

describe("work notes", () => {
  test("the assigned employee adds a note", async () => {
    const res = await api.post("/api/tickets/tick-a1/work-notes", { token: aEmp1, body: { note: "  Ordered a new cartridge  " } });
    assert.equal(res.status, 201);
    const saved = db.rows("ticketWorkNote").find((n) => n.id === res.body.data.id);
    assert.equal(saved.note, "Ordered a new cartridge");
    assert.equal(saved.ticketId, "tick-a1");
    assert.equal(saved.employeeId, "a-emp1");
  });

  test("an admin can add a note to any ticket of their company", async () => {
    const res = await api.post("/api/tickets/tick-a2/work-notes", { token: aAdmin, body: { note: "Following up" } });
    assert.equal(res.status, 201);
  });

  test("an empty note is rejected", async () => {
    const res = await api.post("/api/tickets/tick-a1/work-notes", { token: aEmp1, body: { note: "   " } });
    assert.equal(res.status, 400);
  });

  test("an employee cannot add a note to a ticket assigned to someone else", async () => {
    const res = await api.post("/api/tickets/tick-a2/work-notes", { token: aEmp1, body: { note: "sneaky" } });
    assert.equal(res.status, 403);
  });

  test("notes of another company's ticket cannot be read or added to", async () => {
    const read = await api.get("/api/tickets/tick-b1/work-notes", { token: aAdmin });
    const add = await api.post("/api/tickets/tick-b1/work-notes", { token: aAdmin, body: { note: "x" } });
    assert.equal(read.status, 404);
    assert.equal(add.status, 404);
    assert.ok(!read.text.includes("Bravo private note"));
  });

  test("the assigned employee can read the notes of their ticket", async () => {
    const res = await api.get("/api/tickets/tick-a1/work-notes", { token: aEmp1 });
    assert.equal(res.status, 200);
    assert.equal(res.body.count, 1);
    assert.equal(res.body.data[0].note, "Checked the printer");
  });

  test("an employee edits their own note but not someone else's", async () => {
    const own = await api.put("/api/tickets/work-notes/note-a1", { token: aEmp1, body: { note: "Updated" } });
    assert.equal(own.status, 200);
    assert.equal(db.get("ticketWorkNote", "note-a1").note, "Updated");

    const other = await api.put("/api/tickets/work-notes/note-a1", { token: aEmp2, body: { note: "Overwritten" } });
    assert.equal(other.status, 403);
    assert.equal(db.get("ticketWorkNote", "note-a1").note, "Updated");
  });

  test("an admin can delete any note in their company, but not another company's", async () => {
    const other = await api.delete("/api/tickets/work-notes/note-b1", { token: aAdmin });
    assert.equal(other.status, 404);
    assert.ok(db.get("ticketWorkNote", "note-b1"));

    const own = await api.delete("/api/tickets/work-notes/note-a1", { token: aAdmin });
    assert.equal(own.status, 200);
    assert.equal(db.get("ticketWorkNote", "note-a1"), null);
  });
});

describe("expired or inactive subscription", () => {
  test("the company can still READ its tickets but cannot create, edit or delete", async () => {
    db.get("company", 1).status = "EXPIRED";

    assert.equal((await api.get("/api/tickets", { token: aAdmin })).status, 200);
    assert.equal((await api.post("/api/tickets", { token: aAdmin, body: { title: "x", customerId: "cust-a1" } })).status, 403);
    assert.equal((await api.put("/api/tickets/tick-a1", { token: aAdmin, body: { title: "x" } })).status, 403);
    assert.equal((await api.delete("/api/tickets/tick-a1", { token: aAdmin })).status, 403);
    assert.equal((await api.patch("/api/tickets/tick-a1/status", { token: aEmp1, body: { status: "CLOSED" } })).status, 403);
    assert.equal((await api.post("/api/tickets/tick-a1/work-notes", { token: aEmp1, body: { note: "x" } })).status, 403);
    assert.ok(db.get("ticket", "tick-a1"));
  });
});