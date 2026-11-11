const { sanitizeArabic } = require("./sanitizeArabic");

const esc = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
const css = `
  @page { size:A4; margin:20mm 18mm 22mm; }
  * { box-sizing:border-box; }
  body { margin:0; color:#202638; font-family:Georgia,'Times New Roman',serif; }
  .cover { break-after:page; }
  .cover h1 { font-size:34px;font-weight:500;text-align:center;margin:30px 0 12px; }
  .arranger { font-size:19px;text-align:center;margin:0 0 38px; }
  .toc-heading { text-align:center;font-size:25px;margin:0 0 24px; }
  .toc-entry { display:flex;align-items:baseline;gap:10px;font-size:17px;color:inherit;text-decoration:none;margin:0 0 15px;break-inside:avoid; }
  .toc-name { max-width:80%; }
  .dots { border-bottom:1px dotted #777;flex:1; }
  .toc-page { min-width:2em;text-align:right;font-variant-numeric:tabular-nums; }
  .item { break-before:page; }
  .item h1 { font-size:27px;text-align:center;font-weight:500;margin:0 0 28px; }
  .arab-title { font-family:'Noto Nastaliq Urdu','Noto Naskh Arabic',serif;font-size:25px;font-weight:400;text-align:center;line-height:2.3;margin:0 0 12px; }
  .block { margin:0 0 24px; }
  .line { break-inside:avoid;text-align:center;margin:0 0 16px; }
  .arab { font-family:'Noto Nastaliq Urdu','Noto Naskh Arabic',serif;font-size:23px;line-height:2.4;margin-bottom:6px; }
  .rom,.eng { font-size:18px;line-height:1.5;margin:4px 0; }
  .footnotes { break-before:page; }
  .footnote { font-size:15px;margin:0 0 12px;line-height:1.5; }
  sup a,.footnote a { color:inherit;text-decoration:none; }
`;
const wrap = (body) =>
  `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${body}</body></html>`;

function makeParts(slideshow, arranger) {
  const footnotes = [];
  let footnoteNo = 0;
  const seen = new Set();
  const sections = slideshow.slides.map((slide, i) => {
    const footnotesByLine = new Map();
    for (const note of slide.footnotes || []) {
      const id = String(note.lineId);
      if (!footnotesByLine.has(id)) footnotesByLine.set(id, []);
      footnotesByLine.get(id).push(note);
    }
    const blocks = (slide.blocks || [])
      .map(
        (block, bi) =>
          `<div class="block">${(block.lines || [])
            .map((line, li) => {
              const lineId = String(line._id || "");
              const anchor = `line-${i}-${bi}-${li}`;
              let english = esc(line.eng || "");
              // Like the existing nasheed template, only annotate the first occurrence
              // of a repeated line in each nasheed.
              const seenKey = `${i}:${lineId}`;
              if (lineId && !seen.has(seenKey)) {
                seen.add(seenKey);
                const notes = [...(footnotesByLine.get(lineId) || [])].sort(
                  (a, b) => (a.range?.[0] || 0) - (b.range?.[0] || 0),
                );
                const source = String(line.eng || "");
                let pos = 0,
                  out = "";
                for (const note of notes) {
                  const [start, end] = note.range || [];
                  if (
                    !Number.isInteger(start) ||
                    !Number.isInteger(end) ||
                    start < pos ||
                    end <= start ||
                    end > source.length
                  )
                    continue;
                  const n = ++footnoteNo;
                  out +=
                    esc(source.slice(pos, end)) +
                    `<sup><a href="#fn-${n}">${n}</a></sup>`;
                  footnotes.push({ number: n, anchor, content: note.content });
                  pos = end;
                }
                english = out + esc(source.slice(pos));
              }
              const visible = new Set(
                (slide.layout || "arab-rom-eng").split("-"),
              );
              return `<div class="line" id="${anchor}">
        ${visible.has("arab") && line.arab ? `<div class="arab" dir="rtl">${esc(sanitizeArabic(line.arab))}</div>` : ""}
        ${visible.has("rom") && line.rom ? `<div class="rom">${esc(line.rom)}</div>` : ""}
        ${visible.has("eng") && line.eng ? `<div class="eng">${english}</div>` : ""}
      </div>`;
            })
            .join("")}</div>`,
      )
      .join("");
    return `<section class="item" id="item-${i + 1}">
      ${slide.arabTitle ? `<h2 class="arab-title" dir="rtl">${esc(sanitizeArabic(slide.arabTitle))}</h2>` : ""}
      <h1>${esc(slide.title)}</h1>${blocks}</section>`;
  });
  // Footnotes are appended after all slideshow items; each superscript and
  // footnote number is a bidirectional internal PDF hyperlink.
  if (footnotes.length)
    sections.push(
      `<section class="footnotes" id="footnotes"><h2>Footnotes</h2>${footnotes.map((fn) => `<div class="footnote" id="fn-${fn.number}"><sup><a href="#${fn.anchor}">${fn.number}</a></sup> ${esc(fn.content)}</div>`).join("")}</section>`,
    );
  const makeCover = (numbers) =>
    `<section class="cover"><h1>${esc(slideshow.title)}</h1><p class="arranger">Arranged by: ${esc(arranger)}</p><h2 class="toc-heading">Table of Contents</h2>${slideshow.slides.map((slide, i) => `<a class="toc-entry" href="#item-${i + 1}"><span class="toc-name">${esc(slide.title)}</span><span class="dots"></span><span class="toc-page">${numbers?.[i] ?? ""}</span></a>`).join("")}${footnotes.length ? `<a class="toc-entry" href="#footnotes"><span class="toc-name">Footnotes</span><span class="dots"></span><span class="toc-page">${numbers?.[slideshow.slides.length] ?? ""}</span></a>` : ""}</section>`;
  const cover = makeCover(Array(sections.length).fill("00"));
  return {
    wrap,
    cover,
    sections,
    makeFinal: (numbers) => wrap(makeCover(numbers) + sections.join("")),
  };
}
module.exports = {
  makeSlideshowParts,
  generateSlideshowHTML: (s, a) => makeParts(s, a).makeFinal([]),
};
function makeSlideshowParts(slideshow, arranger) {
  return makeParts(slideshow, arranger);
}
