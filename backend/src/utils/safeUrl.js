const dns = require("dns");
const net = require("net");
const https = require("https");

// ============================================
// SSRF PROTECTION FOR CUSTOM AI ENDPOINTS
// ============================================
// Customers may point the CUSTOM provider at their own
// OpenAI-compatible URL. Without protection that would let them make
// the server call internal addresses (localhost, cloud metadata,
// private networks). We therefore:
//   1. only allow https URLs with a public hostname, and
//   2. re-check the resolved IP at connection time (blocks DNS tricks).

const isPrivateIPv4 = (ip) => {
  const [a, b] = ip.split(".").map(Number);

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
    (a === 169 && b === 254) || // link-local / cloud metadata
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    a >= 224 // multicast / reserved
  );
};

const isPrivateIp = (ip) => {
  if (net.isIPv4(ip)) return isPrivateIPv4(ip);

  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();

    if (lower === "::1" || lower === "::") return true;
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local
    if (lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) return true; // link-local

    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateIPv4(mapped[1]);

    return false;
  }

  return true; // not a valid IP -> treat as unsafe
};

// DNS lookup used by the HTTPS agent: refuses private addresses.
const safeLookup = (hostname, options, callback) => {
  dns.lookup(hostname, options, (err, address, family) => {
    if (err) return callback(err);

    const addresses = Array.isArray(address) ? address : [{ address, family }];

    if (addresses.some((entry) => isPrivateIp(entry.address))) {
      return callback(
        new Error("This endpoint resolves to a private or internal address")
      );
    }

    return callback(null, address, family);
  });
};

const safeHttpsAgent = new https.Agent({ lookup: safeLookup });

// Validates a user supplied URL. Throws an Error with a friendly
// message, or returns the normalised URL string.
const assertSafeHttpsUrl = async (rawUrl) => {
  let parsed;

  try {
    parsed = new URL(String(rawUrl).trim());
  } catch {
    throw new Error("Base URL is not a valid URL");
  }

  if (parsed.protocol !== "https:") {
    throw new Error("Base URL must start with https://");
  }

  if (parsed.username || parsed.password) {
    throw new Error("Base URL must not contain a username or password");
  }

  const hostname = parsed.hostname.toLowerCase();

  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    throw new Error("Base URL must be a public address");
  }

  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      throw new Error("Base URL must be a public address");
    }
  } else {
    let records;
    try {
      records = await dns.promises.lookup(hostname, { all: true });
    } catch {
      throw new Error("Base URL host could not be resolved");
    }

    if (records.some((r) => isPrivateIp(r.address))) {
      throw new Error("Base URL must be a public address");
    }
  }

  return parsed.toString();
};

module.exports = { assertSafeHttpsUrl, safeHttpsAgent };
