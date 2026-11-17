
const escapeHTML = (value = "") =>
    String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

/**
 * Renders plain text with formatting ranges.
 *
 * Ranges use JavaScript string offsets: [start, end).
 * markers: [{ offset, html }] for trusted, internally generated HTML,
 * such as footnote links.
 */
function renderFormattedText(text, ranges = [], markers = []) {
    const source = String(text ?? "");
    const length = source.length;

    const validRanges = (Array.isArray(ranges) ? ranges : [])
        .filter(
            (r) =>
                Number.isInteger(r.start) &&
                Number.isInteger(r.end) &&
                r.start >= 0 &&
                r.end <= length &&
                r.end > r.start
        );

    const validMarkers = (Array.isArray(markers) ? markers : [])
        .filter(
            (m) =>
                Number.isInteger(m.offset) &&
                m.offset >= 0 &&
                m.offset <= length &&
                typeof m.html === "string"
        );

    const boundaries = new Set([0, length]);

    for (const range of validRanges) {
        boundaries.add(range.start);
        boundaries.add(range.end);
    }

    for (const marker of validMarkers) {
        boundaries.add(marker.offset);
    }

    const positions = [...boundaries].sort((a, b) => a - b);

    const markerHTML = (offset) =>
        validMarkers
            .filter((m) => m.offset === offset)
            .map((m) => m.html)
            .join("");

    let html = "";

    for (let i = 0; i < positions.length - 1; i++) {
        const start = positions[i];
        const end = positions[i + 1];

        html += markerHTML(start);

        const active = validRanges.filter(
            (r) => r.start <= start && r.end >= end
        );

        const styles = {};

        for (const range of active) {
            const s = range.styles || {};

            if (s.bold) styles.bold = true;
            if (s.italic) styles.italic = true;
            if (s.underline) styles.underline = true;

            if (
                Number.isFinite(s.fontSize) &&
                s.fontSize >= 0.5 &&
                s.fontSize <= 3 &&
                s.fontSize !== 1
            ) {
                styles.fontSize = s.fontSize;
            }
        }

        const css = [];

        if (styles.bold) css.push("font-weight:700");
        if (styles.italic) css.push("font-style:italic");
        if (styles.underline) css.push("text-decoration:underline");
        if (styles.fontSize) {
            css.push(`font-size:${styles.fontSize}em`);
        }

        const segment = escapeHTML(source.slice(start, end));

        html += css.length
            ? `<span style="${css.join(";")}">${segment}</span>`
            : segment;
    }

    html += markerHTML(length);

    return html;
}

module.exports = { renderFormattedText };
