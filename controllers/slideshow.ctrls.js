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

const create = (req, res) => {
  const slideshowToCreate = req.body;

  db.Slideshow.create(slideshowToCreate, (err, createdSlideshow) => {
    if (err)
      return res.status(404).json({ message: err.message, code: err.code });

    return res.status(200).json(createdSlideshow);
  });
};

const update = (req, res) => {
  db.Slideshow.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true },
    (err, updatedSlideshow) => {
      if (err)
        return res.status(400).json({ message: err.message, code: err.code });

      return res.status(200).json(updatedSlideshow);
    }
  );
};

const show = (req, res) => {
  db.Slideshow.findById(req.params.id, (error, foundSlideshow) => {
    if (error) return res.status(400).json({ error });
    return res.status(200).json({ foundSlideshow });
  });
};

const destroy = (req, res) => {
  db.Slideshow.findByIdAndDelete(req.params.id, (err, deletedSlideshow) => {
    if (!deletedSlideshow)
      return res.status(400).json({ error: "slideshow not found" });
    if (err) return res.status(400).json({ err });

    return res.status(200).json({
      message: `Slideshow ${deletedSlideshow.title} was successfully deleted`,
    });
  });
};

const echo = (req, res) => {
  const { message } = req.body;
  return res.status(200).json(message);
};

module.exports = { index, create, echo, show, update, destroy };
