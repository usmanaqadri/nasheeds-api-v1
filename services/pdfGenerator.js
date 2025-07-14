const puppeteer = require("puppeteer");

function sanitizeFilename(name) {
  if (!name) return "nasheed";
  return name.replace(/[^a-zA-Z0-9-_\.]/g, "_");
}
function generateHTML({
  arabicTitle,
  engTitle,
  arabicArray,
  transliterationArray,
  englishArray,
}) {
  const bodyBlocks = arabicArray
    .map((arabic, idx) => {
      return `
        <div class="verse-block">
          <p class="arabic">${arabic}</p>
          <p class="transliteration"><em>${transliterationArray[idx]}</em></p>
          <p class="english">${englishArray[idx]}</p>
        </div>
      `;
    })
    .join("\n");

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>${engTitle}</title>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant:wght@300&family=Noto+Nastaliq+Urdu&display=swap" rel="stylesheet">
      <style>
        @page {
          margin: 40px;
        }

        body {
          font-family: 'Cormorant', serif;
          background-color: #fdfbf9;
          color: #222;
          margin: 0;
          padding: 0;
        }

        .container {
          padding: 40px;
        }

        h1, h2 {
          text-align: center;
        }

        .verse-block {
          margin: 20px 0;
          text-align: center;
          break-inside: avoid;
        }

        .arabic-title {
          font-family: 'Noto Nastaliq Urdu', serif;
          direction: rtl;
          word-spacing: 0.2em;
        }

        .arabic {
          font-size: 24px;
          font-family: 'Noto Nastaliq Urdu', serif;
          direction: rtl;
          line-height: 2;
          word-spacing: 0.2em;
        }

        .transliteration {
          font-size: 16px;
          font-style: italic;
        }

        .english {
          font-size: 16px;
        }
      </style>
    </head>
    <body>
      <h1 class="arabic-title">${arabicTitle}</h1>
      <h2><em>${engTitle}</em></h2>
      ${bodyBlocks}
    </body>
    </html>
  `;
}

const generatePDF = async (req, res) => {
  try {
    const {
      arabicTitle,
      engTitle,
      arabicArray,
      englishArray,
      transliterationArray,
    } = req.body;

    const htmlContent = generateHTML({
      arabicTitle,
      engTitle,
      arabicArray,
      englishArray,
      transliterationArray,
    });

    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    const safeFileName = sanitizeFilename(engTitle);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeFileName}.pdf"`
    );
    res.end(pdfBuffer);
  } catch (err) {
    console.error("PDF generation failed:", err);
    res.status(500).send("Failed to generate PDF");
  }
};

module.exports = { generatePDF };
