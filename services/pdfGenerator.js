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
  footnotes,
}) {
  let footnoteCounter = 1;
  const footnoteRefs = [];

  const bodyBlocks = arabicArray
    .map((arabic, idx) => {
      const verseFootnotes = footnotes
        .filter((fn) => fn.verseIndex === idx)
        .sort((a, b) => a.range[0] - b.range[0]); // Ascending start offsets

      let englishWithFootnotes = englishArray[idx];
      let offsetDelta = 0;

      verseFootnotes.forEach((fn) => {
        const noteNumber = footnoteCounter++;
        const [start, end] = fn.range;

        if (
          typeof start !== "number" ||
          typeof end !== "number" ||
          start < 0 ||
          end >= englishWithFootnotes.length
        )
          return;

        const adjustedStart = start + offsetDelta;
        const adjustedEnd = end + offsetDelta;

        const before = englishWithFootnotes.slice(0, adjustedStart);
        const highlighted = englishWithFootnotes.slice(
          adjustedStart,
          adjustedEnd
        );
        const after = englishWithFootnotes.slice(adjustedEnd);

        const footnoteMarkup = `<span>${highlighted}</span><sup><a href="#footnote-${noteNumber}">${noteNumber}</a></sup>`;

        englishWithFootnotes = `${before}${footnoteMarkup}${after}`;

        offsetDelta += footnoteMarkup.length - (adjustedEnd - adjustedStart); // Account for insertion length

        footnoteRefs.push({
          verseIndex: fn.verseIndex,
          number: noteNumber,
          content: fn.content,
        });
      });

      return `
      <div class="verse-block" id="verse-${idx}">
        <p class="arabic">${arabic}</p>
        <p class="transliteration"><em>${transliterationArray[idx]}</em></p>
        <p class="english">${englishWithFootnotes}</p>
      </div>
    `;
    })
    .join("\n");

  const footnoteSection =
    footnoteRefs.length > 0
      ? `
        <hr />
        <div class="footnotes">
          ${footnoteRefs
            .map(
              (fn) => `
            <div class="footnote" id="footnote-${fn.number}">
              <sup><a href="#verse-${fn.verseIndex}">${fn.number}</a></sup> ${fn.content}
            </div>
          `
            )
            .join("\n")}
        </div>
`
      : "";

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

        a {
          text-decoration: none;
          color: #6faeec;
          font-weight: bold;
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
          padding-top: 10px;
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
      ${footnoteSection}
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
      footnotes,
    } = req.body;

    const htmlContent = generateHTML({
      arabicTitle,
      engTitle,
      arabicArray,
      englishArray,
      transliterationArray,
      footnotes,
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
    res.status(500).json({ message: err.message });
  }
};

module.exports = { generatePDF };
