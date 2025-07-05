const reverseWords = (text, numberOfSpaces) => {
  const spaces = " ".repeat(numberOfSpaces);
  return text.split(" ").reverse().join(spaces);
};

const isUrdu = (text) => {
  const urduChars = [
    "ا",
    "ب",
    "پ",
    "ت",
    "ٹ",
    "ث",
    "ج",
    "چ",
    "ح",
    "خ",
    "د",
    "ڈ",
    "ذ",
    "ر",
    "ڑ",
    "ز",
    "ژ",
    "س",
    "ش",
    "ص",
    "ض",
    "ط",
    "ظ",
    "ع",
    "غ",
    "ف",
    "ق",
    "ک",
    "گ",
    "ل",
    "م",
    "ن",
    "ں",
    "و",
    "ؤ",
    "ہ",
    "ۂ",
    "ء",
    "ی",
    "ے",
    "ۓ",
    "ء",
    "ػ",
    "ؼ",
    "ؽ",
    "ؾ",
    "ؿ",
    "ٲ",
    "ٳ",
    "ٴ",
    "ٵ",
    "ٹ",
    "پ",
    "چ",
    "ژ",
    "ک",
    "گ",
    "ں",
    "ہ",
    "ۂ",
    "ۓ",
    "ٰ",
    "ں",
    "َ",
    "ُ",
    "ِ",
    "ّ",
    "ْ",
    "ٓ",
    "ٔ",
    "ٕ",
  ];
  return urduChars.some((char) => text.includes(char));
};

const detectLanguage = (lines) => {
  const checkCount = lines.length;
  for (let i = 0; i < checkCount; i++) {
    if (isUrdu(lines[i])) {
      return "urdu";
    }
  }
  return "arabic";
};

module.exports = { reverseWords, isUrdu, detectLanguage };
