const db = require("../models");
const { generateHTML } = require("../utils/nasheedHtml");
const {
  generateSlideshowHTML,
  makeSlideshowParts,
} = require("../utils/slideshowHtml");
const { resolveSlideshow } = require("../utils/slideshowResolver");
const { renderPDF } = require("../utils/pdfRenderer");

const safeFilename = (name) =>
  String(name || "export")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 120);

async function generatePDF(req, res) {
  try {
    const { type, id } = req.body || {};
    if (
      !["nasheed", "slideshow"].includes(type) ||
      !/^[0-9a-fA-F]{24}$/.test(String(id || ""))
    ) {
      return res
        .status(400)
        .json({ message: "A valid resource type and MongoDB ID are required" });
    }
    let html, title, tocParts;
    if (type === "slideshow") {
      const slideshow = await db.Slideshow.findById(id).lean();
      if (!slideshow)
        return res.status(404).json({ message: "Slideshow not found" });
      // IMPORTANT: Apply your existing slideshow read-access policy here before exporting.
      // This must cover private slideshows; do not rely on the ID being secret.
      const resolved = await resolveSlideshow(slideshow, db.NasheedV2);
      title = resolved.title;
      // Prefer authenticated identity; allow the caller to supply an optional
      // display label when auth middleware does not populate req.user.
      const arranger =
        req.user?.name ||
        req.user?.displayName ||
        (typeof req.body.arrangedBy === "string"
          ? req.body.arrangedBy.trim().slice(0, 120)
          : "") ||
        "Unknown";
      tocParts = makeSlideshowParts(resolved, arranger);
    } else {
      const nasheed = await db.NasheedV2.findById(id).lean();
      if (!nasheed)
        return res.status(404).json({ message: "Nasheed not found" });
      // Apply your existing nasheed read-access policy here if nasheeds are restricted.
      title = nasheed.engTitle;
      html = generateHTML(nasheed);
    }
    const bytes = await renderPDF(html, { tocParts });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeFilename(title)}.pdf"`,
    );
    return res.end(Buffer.from(bytes));
  } catch (error) {
    console.error("PDF generation failed", error);
    return res.status(error.status || 500).json({
      message: error.status ? error.message : "PDF generation failed",
    });
  }
}
module.exports = { generatePDF };
