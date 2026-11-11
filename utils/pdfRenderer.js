const puppeteer = require("puppeteer");

function countPages(bytes) {
  // Chromium-generated PDF page dictionaries (not a general-purpose PDF parser).
  const count = (
    Buffer.from(bytes)
      .toString("latin1")
      .match(/\/Type\s*\/Page\b/g) || []
  ).length;
  if (!count) throw new Error("Unable to count Chromium PDF pages for TOC");
  return count;
}

async function renderPDF(html, { tocParts } = {}) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    const options = {
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: `<div style="width:100%;font:14px Arial,sans-serif;color:#555;text-align:right;padding-right:18mm"><span class="pageNumber"></span></div>`,
    };
    const load = async (markup) => {
      await page.setContent(markup, { waitUntil: "networkidle0" });
      await page.evaluate(() => document.fonts.ready);
    };
    if (tocParts) {
      await load(tocParts.wrap(tocParts.cover));
      let nextPage = countPages(await page.pdf(options)) + 1;
      const pageNumbers = [];
      for (const section of tocParts.sections) {
        pageNumbers.push(nextPage);
        await load(tocParts.wrap(section));
        nextPage += countPages(await page.pdf(options));
      }
      html = tocParts.makeFinal(pageNumbers);
    }
    await load(html);
    return await page.pdf(options);
  } finally {
    await browser.close();
  }
}
module.exports = { renderPDF };
