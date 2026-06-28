const db = require("../models");

const index = (req, res) => {
  const userId = req.query.userId;

  db.Slideshow.find({ creatorId: userId }, (error, slideshows) => {
    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({
      slideshows,
      requestedAt: new Date().toLocaleString(),
    });
  });
};

const create = async (req, res) => {
  try {
    const slideshowToCreate = {
      ...req.body,
      creatorId: req.user.id,
    };

    const createdSlideshow = await db.Slideshow.create(slideshowToCreate);
    return res.status(200).json(createdSlideshow);
  } catch (err) {
    return res.status(404).json({ message: err.message, code: err.code });
  }
};

const update = async (req, res) => {
  try {
    const existingSlideshow = await db.Slideshow.findById(req.params.id);

    if (!existingSlideshow) {
      return res.status(404).json({ error: "slideshow not found" });
    }

    if (existingSlideshow.creatorId !== req.user.id) {
      return res.status(403).json({
        message: "Only the slideshow owner can update this slideshow",
      });
    }

    const updatedSlideshow = await db.Slideshow.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          ...req.body,
          creatorId: existingSlideshow.creatorId,
        },
      },
      { new: true, runValidators: true }
    );

    return res.status(200).json(updatedSlideshow);
  } catch (err) {
    return res.status(400).json({ message: err.message, code: err.code });
  }
};

const show = (req, res) => {
  db.Slideshow.findById(req.params.id, (error, foundSlideshow) => {
    if (error) return res.status(400).json({ error });
    return res.status(200).json({ foundSlideshow });
  });
};

const destroy = async (req, res) => {
  try {
    const existingSlideshow = await db.Slideshow.findById(req.params.id);

    if (!existingSlideshow) {
      return res.status(400).json({ error: "slideshow not found" });
    }

    if (existingSlideshow.creatorId !== req.user.id) {
      return res.status(403).json({
        message: "Only the slideshow owner can delete this slideshow",
      });
    }

    await db.Slideshow.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      message: `Slideshow ${existingSlideshow.title} was successfully deleted`,
    });
  } catch (err) {
    return res.status(400).json({ err });
  }
};

const echo = (req, res) => {
  const { message } = req.body;
  return res.status(200).json(message);
};

module.exports = { index, create, echo, show, update, destroy };
