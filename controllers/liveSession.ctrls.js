const db = require("../models");

const emitSessionUpdate = (req, eventName, payload) => {
  const io = req.app.get("io");

  if (io && payload?.sessionId) {
    io.to(payload.sessionId).emit(eventName, payload);
  }
};

const index = (req, res) => {
  const userId = req.query.userId;

  db.LiveSession.find({ leaderUserId: userId }, (error, liveSessions) => {
    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({
      liveSessions,
      requestedAt: new Date().toLocaleString(),
    });
  });
};

const create = (req, res) => {
  const liveSessionToCreate = req.body;

  db.LiveSession.create(liveSessionToCreate, (err, createdLiveSession) => {
    if (err)
      return res.status(404).json({ message: err.message, code: err.code });

    return res.status(200).json(createdLiveSession);
  });
};

const update = (req, res) => {
  db.LiveSession.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true },
    (err, updatedLiveSession) => {
      if (err)
        return res.status(400).json({ message: err.message, code: err.code });
      if (!updatedLiveSession)
        return res.status(404).json({ error: "live session not found" });

      emitSessionUpdate(req, "session-updated", updatedLiveSession);

      return res.status(200).json(updatedLiveSession);
    }
  );
};

const show = (req, res) => {
  db.LiveSession.findById(req.params.id, (error, foundLiveSession) => {
    if (error) return res.status(400).json({ error });
    if (!foundLiveSession)
      return res.status(404).json({ error: "live session not found" });

    return res.status(200).json({ foundLiveSession });
  });
};

const showBySessionId = (req, res) => {
  db.LiveSession.findOne(
    { sessionId: req.params.sessionId },
    (error, foundLiveSession) => {
      if (error) return res.status(400).json({ error });
      if (!foundLiveSession)
        return res.status(404).json({ error: "live session not found" });

      return res.status(200).json({ foundLiveSession });
    }
  );
};

const destroy = (req, res) => {
  db.LiveSession.findByIdAndDelete(req.params.id, (err, deletedLiveSession) => {
    if (!deletedLiveSession)
      return res.status(400).json({ error: "live session not found" });
    if (err) return res.status(400).json({ err });

    emitSessionUpdate(req, "session-ended", {
      ...deletedLiveSession.toObject(),
      isActive: false,
    });

    return res.status(200).json({
      message: `Live session ${deletedLiveSession.sessionId} was successfully deleted`,
    });
  });
};

const echo = (req, res) => {
  const { message } = req.body;
  return res.status(200).json(message);
};

module.exports = {
  index,
  create,
  echo,
  show,
  showBySessionId,
  update,
  destroy,
};
