// Campaigns: create, plan limit, sending to recipients, failures and retries,
// and the rules that stop one company touching another company's campaign.
const { describe, test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const t = require("./helpers/featureApp");

const { api, db, tokenFor, whatsapp, waitFor, OK, TEMPORARY_ERROR } = t;

let w, aAdmin, bAdmin, aEmp1;
before(t.start);
after(t.stop);
beforeEach(() => {
  w = t.seedFeatureWorld();
  aAdmin = tokenFor(w.users.aAdmin);
  bAdmin = tokenFor(w.users.bAdmin);
  aEmp1 = tokenFor(w.users.aEmp1);
});

const campaign = (id) => db.get("campaign", id);
const recipientsOf = (id) => db.rows("campaignRecipient").filter((r) => r.campaignId === id);
const statusOf = (recipientId) => db.get("campaignRecipient", recipientId).status;

/** Starts a send and waits until the background job has finished. */
async function sendAndWait(token, body, id = "camp-a") {
  const res = await api.post("/api/campaigns/send", { token, body });
  if (res.status !== 200) return { res };
  await waitFor(() => !["SENDING", "DRAFT"].includes(campaign(id).status));
  return { res, campaign: campaign(id) };
}

describe("create a campaign", () => {
  test("an admin creates a campaign with recipients from their own company", async () => {
    const res = await api.post("/api/campaigns", {
      token: aAdmin,
      body: { name: "  Summer Sale ", type: "PROMOTIONAL", templateId: "tpl-a", messageContent: "10% off", customerIds: ["cust-a1", "cust-a2"] },
    });

    assert.equal(res.status, 201);
    const saved = campaign(res.body.data.id);
    assert.equal(saved.name, "Summer Sale");
    assert.equal(saved.companyId, 1);
    assert.equal(saved.status, "DRAFT");
    assert.equal(saved.totalRecipients, 2);
    assert.equal(saved.createdById, "a-admin");
    assert.deepEqual(recipientsOf(saved.id).map((r) => r.customerId).sort(), ["cust-a1", "cust-a2"]);
  });

  test("a campaign with a future date becomes SCHEDULED", async () => {
    const res = await api.post("/api/campaigns", {
      token: aAdmin,
      body: { name: "Later", type: "PROMOTIONAL", templateId: "tpl-a", customerIds: ["cust-a1"], scheduledAt: new Date(Date.now() + 3600 * 1000).toISOString() },
    });
    assert.equal(res.status, 201);
    assert.equal(campaign(res.body.data.id).status, "SCHEDULED");
  });

  test("a date in the past is rejected", async () => {
    const res = await api.post("/api/campaigns", {
      token: aAdmin,
      body: { name: "Past", type: "PROMOTIONAL", templateId: "tpl-a", customerIds: ["cust-a1"], scheduledAt: new Date(Date.now() - 3600 * 1000).toISOString() },
    });
    assert.equal(res.status, 400);
  });

  test("name and type are required", async () => {
    const noName = await api.post("/api/campaigns", { token: aAdmin, body: { type: "PROMOTIONAL" } });
    const noType = await api.post("/api/campaigns", { token: aAdmin, body: { name: "x" } });
    assert.equal(noName.status, 400);
    assert.equal(noType.status, 400);
  });

  test("customers from another company are refused", async () => {
    const before = db.rows("campaign").length;
    const res = await api.post("/api/campaigns", {
      token: aAdmin,
      body: { name: "Leak", type: "PROMOTIONAL", templateId: "tpl-a", customerIds: ["cust-a1", "cust-b1"] },
    });
    assert.equal(res.status, 400);
    assert.deepEqual(res.body.invalidCustomerIds, ["cust-b1"]);
    assert.equal(db.rows("campaign").length, before);
  });

  test("a template of another company cannot be used", async () => {
    const res = await api.post("/api/campaigns", { token: aAdmin, body: { name: "x", type: "PROMOTIONAL", templateId: "tpl-b", customerIds: ["cust-a1"] } });
    assert.equal(res.status, 404);
  });

  test("a template that is not approved cannot be used", async () => {
    const res = await api.post("/api/campaigns", { token: aAdmin, body: { name: "x", type: "PROMOTIONAL", templateId: "tpl-a-draft", customerIds: ["cust-a1"] } });
    assert.equal(res.status, 400);
  });
});

describe("plan limit and subscription", () => {
  test("a company that reached its plan's campaign limit cannot create another", async () => {
    // company B: plan allows 1 campaign and it already has camp-b
    const before = db.rows("campaign").length;
    const res = await api.post("/api/campaigns", { token: bAdmin, body: { name: "Second", type: "PROMOTIONAL", templateId: "tpl-b", customerIds: ["cust-b1"] } });

    assert.equal(res.status, 403);
    assert.equal(res.body.limitType, "campaigns");
    assert.equal(res.body.maxAllowed, 1);
    assert.equal(db.rows("campaign").length, before);
  });

  test("a company with room left in its plan can create one", async () => {
    const res = await api.post("/api/campaigns", { token: aAdmin, body: { name: "Allowed", type: "PROMOTIONAL", templateId: "tpl-a", customerIds: ["cust-a1"] } });
    assert.equal(res.status, 201);
  });

  test("a company with no active plan cannot create a campaign", async () => {
    db.get("subscription", "sub-a").status = "CANCELLED";
    const res = await api.post("/api/campaigns", { token: aAdmin, body: { name: "x", type: "PROMOTIONAL", templateId: "tpl-a", customerIds: ["cust-a1"] } });
    assert.equal(res.status, 403);
  });

  test("an expired company cannot create or send, but can still look at its campaigns", async () => {
    db.get("company", 1).status = "EXPIRED";

    assert.equal((await api.get("/api/campaigns", { token: aAdmin })).status, 200);
    assert.equal((await api.post("/api/campaigns", { token: aAdmin, body: { name: "x", type: "PROMOTIONAL", customerIds: ["cust-a1"] } })).status, 403);

    const send = await api.post("/api/campaigns/send", { token: aAdmin, body: { campaignId: "camp-a" } });
    assert.equal(send.status, 403);
    assert.equal(whatsapp.calls.length, 0, "nothing may be sent");
    assert.equal(campaign("camp-a").status, "DRAFT");
  });

  test("a company whose subscription date has passed cannot send", async () => {
    db.get("company", 1).expiryDate = new Date(Date.now() - 24 * 3600 * 1000);
    const send = await api.post("/api/campaigns/send", { token: aAdmin, body: { campaignId: "camp-a" } });
    assert.equal(send.status, 403);
    assert.equal(whatsapp.calls.length, 0);
  });
});

describe("sending a campaign", () => {
  test("every recipient gets the template message and is marked SENT", async () => {
    const { res, campaign: done } = await sendAndWait(aAdmin, { campaignId: "camp-a" });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.recipientsThisRun, 3);
    assert.equal(done.status, "COMPLETED");
    assert.equal(done.sentCount, 3);
    assert.equal(done.failedCount, 0);

    assert.equal(whatsapp.calls.length, 3);
    assert.deepEqual(whatsapp.calls.map((c) => c.to).sort(), ["919000000001", "919000000003", "919000000005"]);
    assert.ok(whatsapp.calls.every((c) => c.template === "offer_a"));
    ["rec-a1", "rec-a2", "rec-a3"].forEach((id) => assert.equal(statusOf(id), "SENT"));
  });

  test("each sent message is saved in the customer's chat", async () => {
    await sendAndWait(aAdmin, { campaignId: "camp-a" });

    const sent = db.rows("message").filter((m) => m.sender === "AGENT" && m.status === "SENT");
    assert.equal(sent.length, 3);
    assert.ok(sent.every((m) => m.content.startsWith("Hi ") && m.content.includes("20% off")));
    // the messages belong to company A conversations only
    sent.forEach((m) => assert.equal(db.get("conversation", m.conversationId).companyId, 1));
  });

  test("a failed send marks only that recipient FAILED", async () => {
    whatsapp.failFor("919000000003"); // cust-a2
    const { campaign: done } = await sendAndWait(aAdmin, { campaignId: "camp-a" });

    assert.equal(statusOf("rec-a1"), "SENT");
    assert.equal(statusOf("rec-a2"), "FAILED");
    assert.equal(statusOf("rec-a3"), "SENT");
    assert.equal(done.status, "COMPLETED");
    assert.equal(done.sentCount, 2);
    assert.equal(done.failedCount, 1);
  });

  test("when every send fails the campaign is FAILED", async () => {
    ["919000000001", "919000000003", "919000000005"].forEach((p) => whatsapp.failFor(p));
    const { campaign: done } = await sendAndWait(aAdmin, { campaignId: "camp-a" });

    assert.equal(done.status, "FAILED");
    assert.equal(done.sentCount, 0);
    assert.equal(done.failedCount, 3);
  });

  test("a customer without a phone number is marked FAILED and the others still go out", async () => {
    db.insert("customer", { id: "cust-nophone", companyId: 1, name: "No Phone", phone: null, status: "ACTIVE" });
    db.insert("campaignRecipient", { id: "rec-a4", campaignId: "camp-a", customerId: "cust-nophone", status: "PENDING" });

    const { campaign: done } = await sendAndWait(aAdmin, { campaignId: "camp-a" });

    assert.equal(statusOf("rec-a4"), "FAILED");
    assert.equal(done.sentCount, 3);
    assert.equal(done.failedCount, 1);
  });

  test("a temporary Meta error is retried and then succeeds", async () => {
    // first attempt for the first recipient fails with a temporary error, the retry works
    whatsapp.queue(TEMPORARY_ERROR);
    const { campaign: done } = await sendAndWait(aAdmin, { campaignId: "camp-a" });

    assert.equal(done.status, "COMPLETED");
    assert.equal(done.sentCount, 3);
    assert.equal(done.failedCount, 0);
    assert.equal(whatsapp.calls.length, 4, "3 recipients + 1 retry");
  });

  test("sending only to chosen customers does not message the rest", async () => {
    const { res, campaign: done } = await sendAndWait(aAdmin, { campaignId: "camp-a", recipientIds: ["cust-a1"] });

    assert.equal(res.body.data.recipientsThisRun, 1);
    assert.equal(whatsapp.calls.length, 1);
    assert.equal(whatsapp.calls[0].to, "919000000001");
    assert.equal(statusOf("rec-a1"), "SENT");
    assert.equal(statusOf("rec-a2"), "PENDING");
    assert.equal(done.status, "COMPLETED");
  });

  test("chosen customers from another company are never added or messaged", async () => {
    const res = await api.post("/api/campaigns/send", { token: aAdmin, body: { campaignId: "camp-a", recipientIds: ["cust-b1"] } });
    assert.equal(res.status, 400);
    assert.equal(whatsapp.calls.length, 0);
    assert.equal(recipientsOf("camp-a").some((r) => r.customerId === "cust-b1"), false);
  });
});

describe("a send that must be refused", () => {
  test("another company cannot send my campaign", async () => {
    const res = await api.post("/api/campaigns/send", { token: bAdmin, body: { campaignId: "camp-a" } });
    assert.equal(res.status, 404);
    assert.equal(whatsapp.calls.length, 0);
    assert.equal(campaign("camp-a").status, "DRAFT");
  });

  test("a campaign id is required", async () => {
    const res = await api.post("/api/campaigns/send", { token: aAdmin, body: {} });
    assert.equal(res.status, 400);
  });

  test("a company without a connected WhatsApp number cannot send", async () => {
    db.get("whatsAppAccount", 1).status = "DISCONNECTED";
    const res = await api.post("/api/campaigns/send", { token: aAdmin, body: { campaignId: "camp-a" } });
    assert.equal(res.status, 400);
    assert.equal(whatsapp.calls.length, 0);
  });

  test("a campaign whose template is not approved cannot be sent", async () => {
    db.get("template", "tpl-a").status = "REJECTED";
    const res = await api.post("/api/campaigns/send", { token: aAdmin, body: { campaignId: "camp-a" } });
    assert.equal(res.status, 400);
    assert.equal(whatsapp.calls.length, 0);
  });

  test("a campaign without a template cannot be sent", async () => {
    db.get("campaign", "camp-a").templateId = null;
    const res = await api.post("/api/campaigns/send", { token: aAdmin, body: { campaignId: "camp-a" } });
    assert.equal(res.status, 400);
  });

  test("a campaign with no recipients cannot be sent", async () => {
    db.rows("campaignRecipient").splice(0, db.rows("campaignRecipient").length);
    const res = await api.post("/api/campaigns/send", { token: aAdmin, body: { campaignId: "camp-a" } });
    assert.equal(res.status, 400);
  });

  test("no token -> 401", async () => {
    const res = await api.post("/api/campaigns/send", { body: { campaignId: "camp-a" } });
    assert.equal(res.status, 401);
  });
});

describe("reading campaigns", () => {
  test("the list only shows the company's own campaigns", async () => {
    const res = await api.get("/api/campaigns", { token: aAdmin });
    assert.equal(res.status, 200);
    assert.ok(!res.text.includes("Bravo Offer"));
    assert.ok(res.text.includes("Diwali Offer"));
  });

  test("opening another company's campaign is a 404", async () => {
    const res = await api.get("/api/campaigns/camp-b", { token: aAdmin });
    assert.equal(res.status, 404);
  });

  test("another company's recipients cannot be listed", async () => {
    const res = await api.get("/api/campaigns/camp-b/recipients", { token: aAdmin });
    assert.notEqual(res.status, 200);
    assert.ok(!res.text.includes("Bravo Secret Client"));
  });
});