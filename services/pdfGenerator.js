const PdfPrinter = require("pdfmake");
const { reverseWords, detectLanguage } = require("../utils/languageDetection");
const { parseTransliteration } = require("../utils/htmlParser");

// Load fonts
const fonts = {
  NotoSans: {
    normal: "./fonts/NotoSans-Regular.ttf",
    bold: "./fonts/NotoSans-Bold.ttf",
    italics: "./fonts/NotoSans-Italic.ttf",
    bolditalics: "./fonts/NotoSans-BoldItalic.ttf",
  },
  NotoNaskhArabic: {
    normal: "./fonts/NotoNaskhArabic-Regular.ttf",
    bold: "./fonts/NotoNaskhArabic-Bold.ttf",
    italics: "./fonts/NotoNaskhArabic-Regular.ttf", // fallback
    bolditalics: "./fonts/NotoNaskhArabic-Bold.ttf", // fallback
  },
  JameelNooriNastaleeq: {
    normal: "./fonts/JameelNooriNastaleeqRegular.ttf",
    bold: "./fonts/JameelNooriNastaleeqRegular.ttf",
    italics: "./fonts/JameelNooriNastaleeqRegular.ttf",
    bolditalics: "./fonts/JameelNooriNastaleeqRegular.ttf",
  },
};

const printer = new PdfPrinter(fonts);

const generatePDF = (req, res) => {
  const {
    arabicTitle,
    engTitle,
    arabicArray,
    englishArray,
    transliterationArray,
  } = req.body;

  const isUrdu = detectLanguage(arabicArray) === "urdu";
  const content = [
    {
      text: reverseWords(arabicTitle, isUrdu ? 40 : 3),
      fontSize: 24,
      bold: true,
      alignment: "center",
      margin: [0, 20, 0, 10],
      rtl: true,
      font: isUrdu ? "JameelNooriNastaleeq" : "NotoNaskhArabic",
    },
    {
      text: engTitle,
      fontSize: 16,
      italics: true,
      alignment: "center",
      margin: [0, 0, 0, 30],
      font: "NotoSans",
    },
  ];

  for (let i = 0; i < arabicArray.length; i++) {
    const processedArabic = reverseWords(arabicArray[i], isUrdu ? 40 : 3);

    content.push({
      unbreakable: true,
      stack: [
        {
          text: processedArabic,
          fontSize: isUrdu ? 20 : 16,
          alignment: "center",
          font: isUrdu ? "JameelNooriNastaleeq" : "NotoNaskhArabic",
          rtl: true,
          margin: [0, 10],
        },
        {
          text: parseTransliteration(transliterationArray[i]),
          fontSize: 12,
          alignment: "center",
          italics: true,
          margin: [0, 5],
          font: "NotoSans",
        },
        {
          text: englishArray[i],
          fontSize: 12,
          alignment: "center",
          margin: [0, 5, 0, 20],
          font: "NotoSans",
        },
      ],
    });
  }

  const docDefinition = {
    content: content,
    defaultStyle: {
      font: "NotoSans",
    },
  };

  const pdfDoc = printer.createPdfKitDocument(docDefinition);

  let chunks = [];
  pdfDoc.on("data", (chunk) => {
    chunks.push(chunk);
  });

  pdfDoc.on("end", () => {
    const result = Buffer.concat(chunks);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=lyrics.pdf");
    res.send(result);
  });

  pdfDoc.end();
};

module.exports = { generatePDF };
