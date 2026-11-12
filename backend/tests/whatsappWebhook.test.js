// WhatsApp (Meta) webhook: verification handshake, signature check,
// incoming messages, duplicates, unknown numbers and delivery statuses.
const { describe, test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const t = require("./helpers/featureApp");

const { api, db, postWebhook, incomingTextPayload, signMeta } = t;

before(t.start);
after(t.stop);
beforeEach(() => { t.seedFeatureWorld(); });

const URL = "/api/saas/webhook";

describe("webhook verification (Meta GET handshake)", () => {
  test("a correct verify token returns the challenge", async () => {
    const res = await api.get(`${URL}?hub.mode=subscribe&hub.verify_token=${process.env.VERIFY_TOKEN}&hub.challenge=12345`);
    assert.equal(res.status, 200);
    assert.equal(res.text, "12345");
  });

  test("a wrong verify token is refused", async () => {
    const res = await api.get(`${URL}?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=12345`);
    assert.equal(res.status, 403);
  });

  test("a missing verify token is refused", async () => {
    const res = await api.get(`${URL}?hub.mode=subscribe&hub.challenge=12345`);
    assert.equal(res.status, 403);
  });
});

describe("signature check", () => {
  test("a request without a signature is rejected and nothing is saved", async () => {
    const res = await postWebhook(incomingTextPayload(), { signature: null });
    assert.equal(res.status, 401);
    assert.equal(db.rows("message").filter((m) => m.sender === "CUSTOMER" && m.id !== "msg-a1" && m.id !== "msg-b1").length, 0);
  });

  test("a request signed with the wrong secret is rejected", async () => {
    const payload = incomingTextPayload();
    const res = await postWebhook(payload, { signature: signMeta(JSON.stringify(payload), "not-the-real-secret") });
    assert.equal(res.status, 401);
  });

  test("a body changed after signing is rejected", async () => {
    const signature = signMeta(JSON.stringify(incomingTextPayload({ text: "original" })));
    const res = await postWebhook(incomingTextPayload({ text: "tampered" }), { signature });
    assert.equal(res.status, 401);
  });

  test("a correctly signed request is accepted", async () => {
    const res = await postWebhook(incomingTextPayload());
    assert.equal(res.status, 200);
  });
});

describe("incoming customer message", () => {
  test("a message from a new number creates a customer-less conversation and saves the message", async () => {
    const res = await postWebhook(incomingTextPayload({ from: "919888800001", id: "wamid.NEW1", text: "Do you ship to Chennai?" }));
    assert.equal(res.status, 200);

    const conv = db.rows("conversation").find((c) => c.phone === "919888800001");
    assert.ok(conv, "a conversation should be created");
    assert.equal(conv.companyId, 1);
    assert.equal(conv.whatsappAccountId, 1);

    const msg = db.rows("message").find((m) => m.metaMessageId === "wamid.NEW1");
    assert.ok(msg, "the message should be saved");
    assert.equal(msg.conversationId, conv.id);
    assert.equal(msg.content, "Do you ship to Chennai?");
    assert.equal(msg.sender, "CUSTOMER");
    assert.equal(conv.unreadCount, 1);
    assert.equal(conv.lastMessage, "Do you ship to Chennai?");
  });

  test("a message from an existing customer goes into that customer's conversation", async () => {
    const res = await postWebhook(incomingTextPayload({ from: "919000000001", id: "wamid.EX1", text: "Hi again" }));
    assert.equal(res.status, 200);

    const msg = db.rows("message").find((m) => m.metaMessageId === "wamid.EX1");
    assert.ok(msg);
    const conv = db.get("conversation", msg.conversationId);
    assert.equal(conv.companyId, 1);
    assert.equal(conv.customerId, "cust-a1");
  });

  test("the message is saved in the company that owns the WhatsApp number", async () => {
    await postWebhook(incomingTextPayload({ phoneNumberId: "PNID-B", from: "919000000002", id: "wamid.B1", text: "Hello Bravo" }));

    const msg = db.rows("message").find((m) => m.metaMessageId === "wamid.B1");
    assert.ok(msg);
    assert.equal(db.get("conversation", msg.conversationId).companyId, 2);
    // company A's chats are untouched
    assert.equal(db.get("conversation", "conv-a1").unreadCount, 2);
  });

  test("the same message delivered twice is saved only once", async () => {
    const payload = incomingTextPayload({ id: "wamid.DUP", text: "Only once please" });
    assert.equal((await postWebhook(payload)).status, 200);
    assert.equal((await postWebhook(payload)).status, 200);

    assert.equal(db.rows("message").filter((m) => m.metaMessageId === "wamid.DUP").length, 1);
  });

  test("several messages in one delivery are all saved", async () => {
    const payload = incomingTextPayload({ id: "wamid.M1", text: "first" });
    payload.entry[0].changes[0].value.messages.push(
      { from: "919888800001", id: "wamid.M2", timestamp: "1700000001", type: "text", text: { body: "second" } }
    );
    assert.equal((await postWebhook(payload)).status, 200);

    const saved = db.rows("message").filter((m) => ["wamid.M1", "wamid.M2"].includes(m.metaMessageId));
    assert.deepEqual(saved.map((m) => m.content).sort(), ["first", "second"]);
  });

  test("an unsupported message type is stored as readable text, not dropped", async () => {
    const payload = incomingTextPayload({ id: "wamid.LOC" });
    payload.entry[0].changes[0].value.messages[0] = { from: "919888800001", id: "wamid.LOC", type: "location", location: {} };
    assert.equal((await postWebhook(payload)).status, 200);

    const msg = db.rows("message").find((m) => m.metaMessageId === "wamid.LOC");
    assert.ok(msg);
    assert.equal(msg.content, "[location message]");
  });
});

describe("numbers and payloads the system does not know", () => {
  test("a message for an unknown WhatsApp number is ignored but acknowledged", async () => {
    const before = db.rows("message").length;
    const res = await postWebhook(incomingTextPayload({ phoneNumberId: "PNID-UNKNOWN", id: "wamid.UNK" }));
    assert.equal(res.status, 200); // Meta must get 200 or it keeps retrying
    assert.equal(db.rows("message").length, before);
    assert.equal(db.rows("conversation").filter((c) => c.phone === "919888800001").length, 0);
  });

  test("a message for a DISCONNECTED WhatsApp number is ignored", async () => {
    const before = db.rows("message").length;
    const res = await postWebhook(incomingTextPayload({ phoneNumberId: "PNID-OFF", id: "wamid.OFF" }));
    assert.equal(res.status, 200);
    assert.equal(db.rows("message").length, before);
  });

  test("a payload without phone_number_id is ignored", async () => {
    const payload = incomingTextPayload();
    delete payload.entry[0].changes[0].value.metadata;
    const before = db.rows("message").length;
    assert.equal((await postWebhook(payload)).status, 200);
    assert.equal(db.rows("message").length, before);
  });

  test("an empty or malformed payload does not crash the webhook", async () => {
    assert.equal((await postWebhook({})).status, 200);
    assert.equal((await postWebhook({ entry: "not-a-list" })).status, 200);
    assert.equal((await postWebhook({ entry: [{ changes: [{ field: "messages" }] }] })).status, 200);
  });
});

describe("delivery status updates", () => {
  test("a 'delivered' status updates the stored message", async () => {
    db.insert("message", { id: "msg-out1", conversationId: "conv-a1", content: "Sent by agent", sender: "AGENT", status: "SENT", metaMessageId: "wamid.OUT1" });
    const payload = {
      entry: [{ changes: [{ field: "messages", value: {
        metadata: { phone_number_id: "PNID-A" },
        statuses: [{ id: "wamid.OUT1", status: "delivered" }],
      } }] }],
    };
    assert.equal((await postWebhook(payload)).status, 200);
    assert.equal(db.get("message", "msg-out1").status, "DELIVERED");
  });

  test("a 'failed' status stores the failure reason", async () => {
    db.insert("message", { id: "msg-out2", conversationId: "conv-a1", content: "Sent by agent", sender: "AGENT", status: "SENT", metaMessageId: "wamid.OUT2" });
    const payload = {
      entry: [{ changes: [{ field: "messages", value: {
        metadata: { phone_number_id: "PNID-A" },
        statuses: [{ id: "wamid.OUT2", status: "failed", errors: [{ title: "Re-engagement message" }] }],
      } }] }],
    };
    assert.equal((await postWebhook(payload)).status, 200);
    const msg = db.get("message", "msg-out2");
    assert.equal(msg.status, "FAILED");
    assert.equal(msg.failureReason, "Re-engagement message");
  });
});

describe("account_update events", () => {
  test("PARTNER_REMOVED marks the WhatsApp account as disconnected", async () => {
    const payload = {
      entry: [{ changes: [{ field: "account_update", value: { event: "PARTNER_REMOVED", phone_number: "15550001111" } }] }],
    };
    assert.equal((await postWebhook(payload)).status, 200);
    assert.equal(db.get("whatsAppAccount", 1).status, "DISCONNECTED");
    // the other company's number is untouched
    assert.equal(db.get("whatsAppAccount", 2).status, "CONNECTED");
  });
});