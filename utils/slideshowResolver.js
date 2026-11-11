const key = (value) => String(value ?? "");

class ResolutionError extends Error {
  constructor(message) {
    super(message);
    this.name = "ResolutionError";
    this.status = 422;
  }
}

function resolveBlock(block, nasheed, itemNumber) {
  const stanzas = new Map((nasheed.stanzas || []).map((s) => [key(s._id), s]));
  const refrains = new Map(
    (nasheed.refrains || []).map((r) => [key(r._id), r]),
  );
  let source;
  if (block.type === "stanza") {
    source = stanzas.get(key(block.stanzaId))?.lines;
  } else if (block.type === "refrain") {
    const refrain = refrains.get(key(block.refrainId));
    if (!refrain)
      throw new ResolutionError(
        `Missing refrain in slideshow item ${itemNumber}`,
      );
    const stanza = stanzas.get(key(refrain.stanzaId));
    if (!stanza)
      throw new ResolutionError(
        `Missing refrain stanza in slideshow item ${itemNumber}`,
      );
    source = stanza.lines;
    if (!block.lineIds?.length && refrain.lineIds?.length) {
      const byId = new Map((source || []).map((line) => [key(line._id), line]));
      return refrain.lineIds.map((id) => {
        const line = byId.get(key(id));
        if (!line)
          throw new ResolutionError(
            `Missing refrain line ${id} in item ${itemNumber}`,
          );
        return line;
      });
    }
  } else {
    throw new ResolutionError(
      `Unknown block type in item ${itemNumber}: ${block.type}`,
    );
  }
  if (!source)
    throw new ResolutionError(
      `Missing ${block.type} in slideshow item ${itemNumber}`,
    );
  const byId = new Map(source.map((line) => [key(line._id), line]));
  const ids = block.lineIds?.length
    ? block.lineIds
    : source.map((line) => line._id);
  return ids.map((id) => {
    const line = byId.get(key(id));
    if (!line)
      throw new ResolutionError(
        `Missing line ${id} in slideshow item ${itemNumber}`,
      );
    return line;
  });
}

async function resolveSlideshow(slideshow, NasheedV2) {
  if (!Array.isArray(slideshow.slides) || !slideshow.slides.length) {
    throw new ResolutionError("Slideshow has no saved slides");
  }
  const ids = [
    ...new Set(
      slideshow.slides
        .filter((s) => s.type !== "custom")
        .map((s) => key(s.nasheedId)),
    ),
  ];
  if (ids.some((id) => !id))
    throw new ResolutionError("A slideshow item has no nasheedId");
  const nasheeds = ids.length
    ? await NasheedV2.find({ _id: { $in: ids } }).lean()
    : [];
  const byId = new Map(nasheeds.map((n) => [key(n._id), n]));
  const slides = slideshow.slides.map((slide, index) => {
    if (slide.type === "custom") {
      return {
        type: "custom",
        title: slide.title || `Custom item ${index + 1}`,
        layout: slide.layout || "arab-rom-eng",
        blocks: [{ type: "custom", lines: slide.lines || [] }],
      };
    }
    const nasheed = byId.get(key(slide.nasheedId));
    if (!nasheed)
      throw new ResolutionError(
        `Missing nasheed for slideshow item ${index + 1}: ${slide.nasheedId}`,
      );
    return {
      type: "nasheed",
      title: nasheed.engTitle || slide.engTitle || "Untitled nasheed",
      arabTitle: nasheed.arabTitle || "",
      layout: slide.layout || "arab-rom-eng",
      blocks: (slide.blocks || []).map((block) => ({
        type: block.type,
        lines: resolveBlock(block, nasheed, index + 1),
      })),
      footnotes: nasheed.footnotes || [],
    };
  });
  return {
    title: slideshow.title || slideshow.engTitle || "Slideshow",
    slides,
  };
}

module.exports = { resolveSlideshow, ResolutionError };
