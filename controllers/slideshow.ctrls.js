// Adapt the db import path to your server's existing structure.
const db = require("../models");
const LAYOUTS = new Set(["arab-rom-eng", "arab-eng", "arab-rom", "arab"]);
const idOf = (value) => String(value ?? "");

const validateSlides = async (slides) => {
  if (!Array.isArray(slides) || !slides.length)
    throw new Error("Add at least one slide");
  const ids = [
    ...new Set(
      slides
        .filter((s) => (s.type || "nasheed") === "nasheed")
        .map((s) => idOf(s.nasheedId)),
    ),
  ];
  const nasheeds = ids.length
    ? await db.NasheedV2.find({ _id: { $in: ids } }).lean()
    : [];
  const map = new Map(nasheeds.map((n) => [idOf(n._id), n]));
  for (const slide of slides) {
    const type = slide.type || "nasheed";
    if (type === "custom") {
      if (!slide.title?.trim()) throw new Error("Custom slide needs a title");
      if (!Array.isArray(slide.lines) || !slide.lines.length)
        throw new Error("Custom slide needs at least one line");
      for (const line of slide.lines) {
        if (
          ![line.arab, line.rom, line.eng].some(
            (v) => typeof v === "string" && v.trim(),
          )
        )
          throw new Error(
            "Every custom line must have Arabic, transliteration, or English text",
          );
      }
      continue;
    }
    if (type !== "nasheed") throw new Error("Unsupported slide type");
    if (!LAYOUTS.has(slide.layout || "arab-rom-eng"))
      throw new Error("Invalid nasheed layout");
    const nasheed = map.get(idOf(slide.nasheedId));
    if (!nasheed) throw new Error("A referenced nasheed was not found");
    if (!Array.isArray(slide.blocks) || !slide.blocks.length)
      throw new Error("Nasheed slide needs at least one block");
    const stanzas = new Map(
      (nasheed.stanzas || []).map((s) => [idOf(s._id), s]),
    );
    const refrains = new Map(
      (nasheed.refrains || []).map((r) => [idOf(r._id), r]),
    );
    for (const block of slide.blocks) {
      let lines;
      if (block.type === "stanza") {
        lines = stanzas.get(idOf(block.stanzaId))?.lines;
      } else if (block.type === "refrain") {
        const refrain = refrains.get(idOf(block.refrainId));
        if (refrain) {
          lines = stanzas.get(idOf(refrain.stanzaId))?.lines;
          if (lines && refrain.lineIds?.length) {
            const allowed = new Set(refrain.lineIds.map(idOf));
            lines = lines.filter((line) => allowed.has(idOf(line._id)));
          }
        }
      } else throw new Error("Invalid block type");
      if (!lines)
        throw new Error("A referenced stanza or refrain was not found");
      if (!Array.isArray(block.lineIds) || !block.lineIds.length)
        throw new Error("Every block needs at least one line");
      const allowed = new Set(lines.map((line) => idOf(line._id)));
      if (block.lineIds.some((id) => !allowed.has(idOf(id))))
        throw new Error("A block references an invalid source line");
    }
  }
};

exports.index = async (req, res) => {
  try {
    const creatorId = req.query.userId;
    if (!creatorId)
      return res.status(400).json({ message: "userId is required" });
    const slideshows = await db.Slideshow.find({ creatorId })
      .sort({ updatedAt: -1 })
      .lean();
    return res.json({ slideshows });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};
exports.show = async (req, res) => {
  try {
    const foundSlideshow = await db.Slideshow.findById(req.params.id).lean();
    if (!foundSlideshow)
      return res.status(404).json({ message: "Slideshow not found" });
    return res.json({ foundSlideshow });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};
exports.create = async (req, res) => {
  try {
    await validateSlides(req.body.slides);
    const slideshow = await db.Slideshow.create({
      title: req.body.title,
      slides: req.body.slides,
      creatorId: idOf(req.user.id),
    });
    return res.status(201).json({ slideshow });
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
};
exports.update = async (req, res) => {
  try {
    const slideshow = await db.Slideshow.findById(req.params.id);
    if (!slideshow)
      return res.status(404).json({ message: "Slideshow not found" });
    if (idOf(slideshow.creatorId) !== idOf(req.user.id))
      return res.status(403).json({ message: "Forbidden" });
    await validateSlides(req.body.slides);
    slideshow.title = req.body.title;
    slideshow.slides = req.body.slides;
    await slideshow.save();
    return res.json({ slideshow });
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
};
exports.destroy = async (req, res) => {
  try {
    const slideshow = await db.Slideshow.findById(req.params.id);
    if (!slideshow)
      return res.status(404).json({ message: "Slideshow not found" });
    if (idOf(slideshow.creatorId) !== idOf(req.user.id))
      return res.status(403).json({ message: "Forbidden" });
    await slideshow.deleteOne();
    return res.json({ message: "Slideshow deleted" });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};
