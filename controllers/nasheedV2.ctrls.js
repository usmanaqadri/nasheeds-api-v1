const db = require("../models");

const index = (req, res) => {
  const userId = req.query.userId;
  db.NasheedV2.find(
    {
      $or: [{ isPublic: true }, { creatorId: userId }],
    },
    (error, nasheeds) => {
      if (error) return res.status(400).json({ error: error.message });

      return res.status(200).json({
        nasheeds,
        requestedAt: new Date().toLocaleString(),
      });
    },
  );
};

const seed = (req, res) => {
  db.NasheedV2.create(
    {
      arabTitle: "طَالَمَا أشْكُو غَرَامِي",
      engTitle: "Ṭālamā Ashkū Gharāmī",
      creatorId: "686c5a482f8080cb76a15eef",
      isPublic: true,

      stanzas: [
        {
          _id: stanza1Id,
          lines: [
            {
              _id: line1Id,
              arab: "طَالَمَا أشْكُو غَرَامِي يَا نُورَ الْوُجُوْد",
              rom: "Ṭālamā ashkū gharāmī yā nūra l-wujūd",
              eng: "How often I complain about my love for you, light of existence.",
            },
            {
              _id: line2Id,
              arab: "وَأُنَادِي يَا تِهَامِي يَا مَعْدِنَ الْجُوْد",
              rom: "Wa-unādī yā tihāmī yā maʿdina l-jūd",
              eng: "I call out to you, man from Tihāma, treasure of generosity.",
            },
          ],
        },
      ],

      refrains: [
        {
          _id: refrainId,
          name: "Main Chorus",
          stanzaId: stanza1Id,
          lineIds: [], // Empty means the entire stanza
        },
      ],

      sequence: [
        { type: "stanza", stanzaId: stanza1Id },
        { type: "refrain", refrainId: refrainId },
      ],

      footnotes: [
        {
          lineId: line2Id,
          range: [28, 34],
          content: "Tihāma refers to the coastal region of western Arabia.",
        },
      ],
    },
    (err, data) => {
      console.log("this is the err", err);
      console.log("this is the data", data);
    },
  );
};

const create = (req, res) => {
  const nasheedToCreate = req.body;
  db.NasheedV2.create(nasheedToCreate, (err, createdNasheed) => {
    if (err)
      return res.status(404).json({ message: err.message, code: err.code });
    return res.status(200).json(createdNasheed);
  });
};

const update = (req, res) => {
  db.NasheedV2.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true },
    (err, updatedNasheed) => {
      if (err)
        return res.status(400).json({ message: err.message, code: err.code });
      return res.status(200).json(updatedNasheed);
    },
  );
};

const show = (req, res) => {
  db.NasheedV2.findOne({ slug: req.params.slug }, (error, foundNasheed) => {
    if (error) return res.status(400).json({ error });

    if (!foundNasheed) {
      return res.status(404).json({
        error: "Nasheed not found",
      });
    }

    return res.status(200).json({ foundNasheed });
  });
};

const destroy = (req, res) => {
  db.NasheedV2.findByIdAndDelete(req.params.id, (err, deletedNasheed) => {
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
