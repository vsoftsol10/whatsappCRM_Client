const bcrypt = require("bcrypt");

const password = "$IDb6Czxv2";

const hash =
  "$2b$10$Z5SknZhmHCo/GOgdLQ3u3ON7dPrWf3//OpBUsvl5GyfA.Wj0D0Mse";

async function test() {
  const result = await bcrypt.compare(password, hash);

  console.log("Password:", password);
  console.log("Hash:", hash);
  console.log("MATCH:", result);
}

test();