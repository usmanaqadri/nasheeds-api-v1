const reverseWords = (text) => {
  return text.split(" ").reverse().join(" ");
};

const isUrdu = (text) => {
  const urduChars = ["ے", "ٹ", "ں", "ڈ", "ڑ", "ؤ", "ۂ", "ۓ", "ٰ"];
  return urduChars.some((char) => text.includes(char));
};

const detectLanguage = (lines, linesToCheck = 5) => {
  const checkCount = Math.min(linesToCheck, lines.length);
  for (let i = 0; i < checkCount; i++) {
    if (isUrdu(lines[i])) {
      return "urdu";
    }
  }
  return "arabic";
};

module.exports = { reverseWords, isUrdu, detectLanguage };
