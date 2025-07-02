const { parse } = require("node-html-parser");

const parseTransliteration = (htmlString) => {
  const root = parse(htmlString);
  let result = [];

  root.childNodes.forEach((node) => {
    if (node.nodeType === 3) {
      result.push({ text: node.rawText });
    } else if (node.tagName === "SPAN") {
      const style = node.getAttribute("style") || "";
      const styleObj = {};

      if (style.includes("font-weight: 700")) {
        styleObj.bold = true;
      }

      const fontSizeMatch = style.match(/font-size:\s*([\d.]+)em/);
      if (fontSizeMatch) {
        styleObj.fontSize = 12 * parseFloat(fontSizeMatch[1]);
      }

      result.push({
        text: node.text,
        ...styleObj,
      });
    }
  });

  return result;
};

module.exports = { parseTransliteration };
