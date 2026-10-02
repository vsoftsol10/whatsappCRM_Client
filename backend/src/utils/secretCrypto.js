const crypto = require("crypto");

// ============================================
// SECRET ENCRYPTION (AES-256-GCM)
// ============================================
// Used to store customers' third-party AI API keys safely. A leaked
// database dump alone is NOT enough to read the keys; the encryption
// secret lives only in the server environment.
//
// Secret used (first one that exists):
//   1. AI_KEY_ENCRYPTION_SECRET   <- recommended, set your own long random string
//   2. JWT_SECRET                 <- fallback
//
// IMPORTANT: if the secret changes later, previously saved keys can no
// longer be decrypted and customers must paste their keys again.

const PREFIX = "enc:v1:";

const getKey = () => {
  const secret =
    process.env.AI_KEY_ENCRYPTION_SECRET || process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      "AI_KEY_ENCRYPTION_SECRET (or JWT_SECRET) is not configured on the server"
    );
  }

  return crypto.createHash("sha256").update(secret).digest();
};

const encryptSecret = (plainText) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);

  const encrypted = Buffer.concat([
    cipher.update(String(plainText), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return `${PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
};

// Returns the plain text, or null if it cannot be decrypted.
const decryptSecret = (payload) => {
  if (!payload || typeof payload !== "string") return null;

  if (!payload.startsWith(PREFIX)) return null;

  try {
    const [ivB64, tagB64, dataB64] = payload.slice(PREFIX.length).split(":");

    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      getKey(),
      Buffer.from(ivB64, "base64")
    );
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));

    return Buffer.concat([
      decipher.update(Buffer.from(dataB64, "base64")),
      decipher.final(),
    ]).toString("utf8");
  } catch (error) {
    console.error("Could not decrypt a stored AI API key:", error.message);
    return null;
  }
};

// "sk-abc...wxyz" -> "••••wxyz" (safe to show in the UI)
const maskSecret = (plainText) => {
  if (!plainText) return "";
  const tail = String(plainText).slice(-4);
  return `••••••••${tail}`;
};

module.exports = { encryptSecret, decryptSecret, maskSecret };
