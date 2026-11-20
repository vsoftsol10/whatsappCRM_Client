// Helpers for showing customer phone numbers.
// The backend stores Indian numbers with the 91 country code (e.g. 919840011201).

// "919840011201" -> "9840011201". Only strips 91 when the number is 12 digits,
// so a 10-digit number that happens to start with 91 is left alone.
export function toLocalPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");

  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }

  return digits;
}

// "919840011201" -> "+91 98400 11201"
export function formatPhone(phone) {
  const local = toLocalPhone(phone);

  if (local.length === 10) {
    return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
  }

  return phone ? String(phone) : "-";
}