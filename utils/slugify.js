const unidecode = require("unidecode");

function slugify(title) {
  return unidecode(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

module.exports = slugify;
