function sanitizeArabic(value) {
  if (typeof value !== "string") return value;

  let text = value
    .replace(/\uFFFD/g, "") // Replacement character
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/\uFEFF/g, ""); // Byte order mark

  text = text
    // Quranic annotation marks
    .replace(
      /[\u06D6-\u06DC\u06DF-\u06E0\u06E2-\u06E4\u06E7-\u06E8\u06EA-\u06ED]/g,
      "",
    )

    // Quranic-specific sukoon form
    .replace(/\u06E1/g, "\u0652")

    // Keep small Quranic waw/yeh as visible letters
    .replace(/\u06E5/g, "\u0648")
    .replace(/\u06E6/g, "\u064A");

  return text;
}

module.exports = { sanitizeArabic };
