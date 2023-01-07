const db = require("../models");

const index = (req, res) => {
  db.Nasheed.find({}, (error, nasheeds) => {
    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({
      nasheeds,
      requestedAt: new Date().toLocaleString(),
    });
  });
};

const seed = (req, res) => {
  db.Nasheed.create(
    {
      arabTitle: "يا إمام الرسل",
      engTitle: "Ya Imam al-Rusli",
      arab: "أنت باب الله معتمدي",
      rom: "Anta baabu l-Lahi mu'tamadi",
      eng: "You are the door to God, my guarantee",
    },
    (err, data) => {
      console.log("this is the err", err);
      console.log("this is the data", data);
    }
  );
};

const create = (req, res) => {
  db.Nasheed.create(req.body, (err, createdNasheed) => {
    if (err) return res.status(404).json({ error: err.message });
    return res.status(200).json(createdNasheed);
  });
};

const update = (req, res) => {
  db.Nasheed.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true },
    (err, updatedNasheed) => {
      if (err) return res.status(400).json({ error: err });
      return res.status(200).json(updatedNasheed);
    }
  );
};

const show = (req, res) => {
  db.Nasheed.findById(req.params.id, (error, foundNasheed) => {
    if (error) return res.status(400).json({ error });
    return res.status(200).json({ foundNasheed });
  });
};

const destroy = (req, res) => {
  db.Nasheed.findByIdAndDelete(req.params.id, (err, deletedNasheed) => {
    if (!deletedNasheed)
      return res.status(400).json({ error: "nasheed not found" });
    if (err) return res.status(400).json({ err });
    return res.status(200).json({
      message: `Nasheed ${deletedNasheed.engTitle} was successfully deleted`,
    });
  });
};

const echo = (req, res) => {
  const { message } = req.body;
  return res.status(200).json(message);
};

module.exports = { index, seed, create, echo, show, update, destroy };
