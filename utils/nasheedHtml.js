const { sanitizeArabic } = require("./sanitizeArabic");

function sanitizeFilename(name) {
  return (name || "nasheed").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

function escapeHTML(value = "") {
  return String(value ?? "")
    .replace(/&/g, "&amp;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;")

    .replace(/"/g, "&quot;")

    .replace(/'/g, "&#39;");
}

// Resolve the actual lines for one V2 sequence item.

function resolveSequenceItem(item, stanzaById, refrainById) {
  if (item.type === "stanza") {
    return stanzaById.get(String(item.stanzaId))?.lines || [];
  }

  if (item.type === "refrain") {
    const refrain = refrainById.get(String(item.refrainId));

    if (!refrain) return [];

    const stanza = stanzaById.get(String(refrain.stanzaId));

    if (!stanza) return [];

    if (!refrain.lineIds?.length) {
      return stanza.lines || [];
    }

    const selectedIds = new Set(refrain.lineIds.map(String));

    return (stanza.lines || []).filter((line) =>
      selectedIds.has(String(line._id)),
    );
  }

  return [];
}

// Insert footnote superscripts using offsets into the

// ORIGINAL, unmodified English translation.

function renderEnglishWithFootnotes(text, notes, counter, refs, anchorId) {
  const original = String(text || "");

  const sorted = [...notes].sort((a, b) => a.range[0] - b.range[0]);

  let html = "";

  let cursor = 0;

  for (const note of sorted) {
    const [start, end] = note.range || [];

    // V2 ranges use [start, end), with end exclusive.

    if (
      !Number.isInteger(start) ||
      !Number.isInteger(end) ||
      start < cursor ||
      end <= start ||
      end > original.length
    ) {
      continue;
    }

    html += escapeHTML(original.slice(cursor, start));

    html += escapeHTML(original.slice(start, end));

    const number = counter.value++;

    html += `<sup><a href="#footnote-${number}">${number}</a></sup>`;

    refs.push({
      number,

      content: note.content,

      anchorId,
    });

    cursor = end;
  }

  html += escapeHTML(original.slice(cursor));

  return html;
}

function generateHTML(nasheed) {
  const {
    arabTitle = "",

    engTitle = "",

    stanzas = [],

    refrains = [],

    sequence = [],

    footnotes = [],
  } = nasheed;

  const stanzaById = new Map(
    stanzas.map((stanza) => [String(stanza._id), stanza]),
  );

  const refrainById = new Map(
    refrains.map((refrain) => [String(refrain._id), refrain]),
  );

  const footnotesByLineId = new Map();

  for (const note of footnotes) {
    const key = String(note.lineId);

    if (!footnotesByLineId.has(key)) {
      footnotesByLineId.set(key, []);
    }

    footnotesByLineId.get(key).push(note);
  }

  const footnoteCounter = { value: 1 };

  const footnoteRefs = [];

  // A source line can appear multiple times in the sequence.

  // Only display its footnotes on its first occurrence.

  const seenFootnoteLines = new Set();

  const bodyBlocks = sequence

    .map((item, sequenceIndex) => {
      const lines = resolveSequenceItem(item, stanzaById, refrainById);

      if (!lines.length) return "";

      const lineBlocks = lines

        .map((line, lineIndex) => {
          const lineId = String(line._id);

          const anchorId = `verse-${sequenceIndex}-${lineIndex}`;

          const showFootnotes = !seenFootnoteLines.has(lineId);

          seenFootnoteLines.add(lineId);

          const lineFootnotes = showFootnotes
            ? footnotesByLineId.get(lineId) || []
            : [];

          const englishHTML = renderEnglishWithFootnotes(
            line.eng,

            lineFootnotes,

            footnoteCounter,

            footnoteRefs,

            anchorId,
          );

          return `

            <div class="verse-block" id="${anchorId}">

              <p class="arabic" dir="rtl">

                ${escapeHTML(sanitizeArabic(line.arab))}

              </p>



              <p class="transliteration">

                <em>${escapeHTML(line.rom)}</em>

              </p>



              <p class="english">

                ${englishHTML}

              </p>

            </div>

          `;
        })

        .join("\n");

      return `

        <section class="stanza-block">

          ${lineBlocks}

        </section>

      `;
    })

    .join("\n");

  const footnoteSection = footnoteRefs.length
    ? `

      <section class="footnotes">

        <hr />

        <h3>Footnotes</h3>



        ${footnoteRefs

          .map(
            (fn) => `

              <div class="footnote" id="footnote-${fn.number}">

                <sup>

                  <a href="#${fn.anchorId}">${fn.number}</a>

                </sup>

                ${escapeHTML(fn.content)}

              </div>

            `,
          )

          .join("\n")}

      </section>

    `
    : "";

  return `

    <!DOCTYPE html>

    <html lang="en">

      <head>

        <meta charset="UTF-8" />

        <title>${escapeHTML(engTitle)}</title>



        <link

          href="https\://fonts.googleapis.com/css2?family=Cormorant:wght\@300;400;500&family=Noto+Nastaliq+Urdu&display=swap"

          rel="stylesheet"

        />



        <style>

          @page {

            size: A4;

            margin: 20mm;

          }



          * {

            box-sizing: border-box;

          }



          body {

            font-family: "Cormorant", serif;

            color: #222;

            margin: 0;

          }



          h1, h2, h3 {

            text-align: center;

          }



          .arabic-title {

            font-family: "Noto Nastaliq Urdu", serif;

            font-size: 30px;

            direction: rtl;

            line-height: 2.2;

            margin: 0 0 4px;

          }



          .english-title {

            font-size: 27px;

            font-weight: 400;

            margin: 0 0 32px;

          }



          .stanza-block {

            margin: 0 0 28px;

          }



          .verse-block {

            text-align: center;

            margin: 0 0 14px;

            break-inside: avoid;

            page-break-inside: avoid;

          }



          .arabic {

            font-family: "Noto Nastaliq Urdu", serif;

            font-size: 24px;

            direction: rtl;

            line-height: 2.5;

            word-spacing: 0.2em;

            margin: 0 0 6px;

            padding: 6px 0;

            overflow: visible;

          }



          .transliteration {

            font-size: 20px;

            line-height: 1.4;

            margin: 4px 0;

          }



          .english {

            font-size: 20px;

            line-height: 1.4;

            margin: 4px 0;

          }



          a {

            text-decoration: none;

            color: #3178c6;

          }



          sup {

            font-size: 0.65em;

            vertical-align: super;

            line-height: 0;

          }



          .footnotes {

            margin-top: 32px;

            break-before: auto;

          }



          .footnotes h3 {

            font-size: 22px;

            text-align: left;

          }



          .footnote {

            font-size: 17px;

            line-height: 1.5;

            margin: 8px 0;

            break-inside: avoid;

          }



          .footnote sup {

            margin-right: 5px;

          }



          hr {

            border: 0;

            border-top: 1px solid #bbb;

          }

        </style>

      </head>



      <body>

        <h1 class="arabic-title">

          ${escapeHTML(arabTitle)}

        </h1>



        <h2 class="english-title">

          <em>${escapeHTML(engTitle)}</em>

        </h2>



        ${bodyBlocks}



        ${footnoteSection}

      </body>

    </html>

  `;
}

module.exports = { generateHTML };
