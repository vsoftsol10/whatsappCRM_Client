// Public lead capture: a website form posts to /api/public/leads/:publicKey
const { describe, test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const t = require("./helpers/featureApp");

const { api, db } = t;

before(t.start);
after(t.stop);
beforeEach(() => { t.seedFeatureWorld(); });

// The public endpoint allows 10 requests per minute per IP+key, so each test
// pretends to be a different visitor (different IP) to stay independent.
let visitor = 0;
const submit = (key, body, { origin, ip } = {}) =>
  api.post(`/api/public/leads/${key}`, {
    body,
    headers: {
      "x-forwarded-for": ip || `10.0.0.${++visitor}`,
      ...(origin ? { origin } : {}),
    },
  });

const leadsOf = (companyId) => db.rows("lead").filter((l) => l.companyId === companyId);

describe("capturing a lead", () => {
  test("a valid form creates a NEW lead in the right company", async () => {
    const before = leadsOf(1).length;
    const res = await submit("key-acme", {
      name: "Ravi Kumar", phone: "9876543210", email: "ravi@example.com",
      companyName: "Ravi Traders", message: "Need a quote",
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(leadsOf(1).length, before + 1);

    const lead = db.get("lead", res.body.leadId);
    assert.equal(lead.companyId, 1);
    assert.equal(lead.name, "Ravi Kumar");
    assert.equal(lead.phone, "9876543210");
    assert.equal(lead.email, "ravi@example.com");
    assert.equal(lead.companyName, "Ravi Traders");
    assert.equal(lead.requirements, "Need a quote");
    assert.equal(lead.status, "NEW");
    assert.equal(lead.source, "Website - Acme Website");
  });

  test("the lead goes to the company that owns the key, never to another company", async () => {
    const beforeA = leadsOf(1).length;
    const res = await submit("key-bravo", { name: "Bravo Visitor", phone: "9123456789" });

    assert.equal(res.status, 201);
    assert.equal(db.get("lead", res.body.leadId).companyId, 2);
    assert.equal(leadsOf(1).length, beforeA);
  });

  test("an email alone is enough, and the name defaults to 'Website Visitor'", async () => {
    const res = await submit("key-acme", { email: "only.email@example.com" });
    assert.equal(res.status, 201);
    const lead = db.get("lead", res.body.leadId);
    assert.equal(lead.name, "Website Visitor");
    assert.equal(lead.phone, null);
  });

  test("a successful capture updates the integration's last-event time", async () => {
    assert.equal(db.get("integration", 1).lastEventAt, undefined);
    await submit("key-acme", { name: "X", phone: "9876500001" });
    assert.ok(db.get("integration", 1).lastEventAt instanceof Date);
  });

  test("very long text is cut to a safe length", async () => {
    const res = await submit("key-acme", { name: "N".repeat(500), phone: "9876500002", message: "M".repeat(5000) });
    assert.equal(res.status, 201);
    const lead = db.get("lead", res.body.leadId);
    assert.equal(lead.name.length, 120);
    assert.ok(lead.requirements.length <= 1800);
  });
});

describe("invalid submissions are rejected", () => {
  test("no phone and no email -> 400, nothing saved", async () => {
    const before = leadsOf(1).length;
    const res = await submit("key-acme", { name: "No Contact" });
    assert.equal(res.status, 400);
    assert.equal(res.body.message, "Phone or email is required");
    assert.equal(leadsOf(1).length, before);
  });

  test("a phone number that is not valid -> 400", async () => {
    const res = await submit("key-acme", { name: "Bad Phone", phone: "12" });
    assert.equal(res.status, 400);
    assert.equal(res.body.message, "Phone number is not valid");
  });

  test("an invalid email with no phone -> 400", async () => {
    const res = await submit("key-acme", { name: "Bad Email", email: "not-an-email" });
    assert.equal(res.status, 400);
  });

  test("an unknown key -> 404", async () => {
    const res = await submit("no-such-key", { phone: "9876500003" });
    assert.equal(res.status, 404);
  });

  test("an INACTIVE form -> 404", async () => {
    const res = await submit("key-off", { phone: "9876500004" });
    assert.equal(res.status, 404);
  });

  test("a key that belongs to another kind of integration (Shopify) cannot be used as a lead form", async () => {
    const before = db.rows("lead").length;
    const res = await submit("key-shopify", { phone: "9876500005" });
    assert.equal(res.status, 404);
    assert.equal(db.rows("lead").length, before);
  });
});

describe("spam and duplicates", () => {
  test("the same phone submitted twice creates only ONE lead", async () => {
    const first = await submit("key-acme", { name: "Dup", phone: "9876500010" });
    const before = leadsOf(1).length;
    const second = await submit("key-acme", { name: "Dup again", phone: "9876500010" });

    assert.equal(first.status, 201);
    assert.equal(second.status, 200);
    assert.equal(second.body.duplicate, true);
    assert.equal(second.body.leadId, first.body.leadId);
    assert.equal(leadsOf(1).length, before);
  });

  test("the same email submitted twice creates only ONE lead", async () => {
    await submit("key-acme", { email: "same@example.com" });
    const before = leadsOf(1).length;
    const second = await submit("key-acme", { email: "same@example.com" });
    assert.equal(second.body.duplicate, true);
    assert.equal(leadsOf(1).length, before);
  });

  test("a 10-digit number matches an existing 91-prefixed lead", async () => {
    db.insert("lead", { id: 500, companyId: 1, name: "Old", phone: "919876500011", status: "NEW", createdAt: new Date() });
    const res = await submit("key-acme", { name: "Same person", phone: "9876500011" });
    assert.equal(res.body.duplicate, true);
    assert.equal(res.body.leadId, 500);
  });

  test("the same phone in ANOTHER company is not a duplicate", async () => {
    await submit("key-acme", { name: "Shared", phone: "9876500012" });
    const res = await submit("key-bravo", { name: "Shared", phone: "9876500012" });
    assert.equal(res.status, 201);
    assert.equal(db.get("lead", res.body.leadId).companyId, 2);
  });

  test("a lead older than 24 hours does not block a new one", async () => {
    db.insert("lead", { id: 501, companyId: 1, name: "Old lead", phone: "9876500013", status: "NEW", createdAt: new Date(Date.now() - 48 * 3600 * 1000) });
    const res = await submit("key-acme", { name: "Back again", phone: "9876500013" });
    assert.equal(res.status, 201);
    assert.notEqual(res.body.leadId, 501);
  });

  test("the hidden 'website_url' trap field (bots) silently creates nothing", async () => {
    const before = db.rows("lead").length;
    const res = await submit("key-acme", { name: "Bot", phone: "9876500014", website_url: "http://spam.example" });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(db.rows("lead").length, before);
  });
});

describe("allowed websites", () => {
  test("a request from an allowed website works", async () => {
    const res = await submit("key-locked", { phone: "9876500020" }, { origin: "https://acme.test" });
    assert.equal(res.status, 201);
  });

  test("a sub-domain of an allowed website works", async () => {
    const res = await submit("key-locked", { phone: "9876500021" }, { origin: "https://shop.acme.test" });
    assert.equal(res.status, 201);
  });

  test("a request from another website is refused", async () => {
    const before = db.rows("lead").length;
    const res = await submit("key-locked", { phone: "9876500022" }, { origin: "https://evil.test" });
    assert.equal(res.status, 403);
    assert.equal(db.rows("lead").length, before);
  });
});

describe("rate limit", () => {
  test("the 11th request in a minute from the same visitor gets 429", async () => {
    const ip = "203.0.113.77";
    for (let i = 0; i < 10; i++) {
      const ok = await submit("key-acme", { name: `Visitor ${i}`, phone: `98765001${String(i).padStart(2, "0")}` }, { ip });
      assert.notEqual(ok.status, 429, `request ${i + 1} should be allowed`);
    }
    const blocked = await submit("key-acme", { name: "One too many", phone: "9876500199" }, { ip });
    assert.equal(blocked.status, 429);
  });

  test("another visitor is not affected by someone else's limit", async () => {
    const res = await submit("key-acme", { phone: "9876500198" }, { ip: "198.51.100.5" });
    assert.notEqual(res.status, 429);
  });
});