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

const create = async (req, res) => {
  try {
    const slideshow = await db.Slideshow.findById(req.body.slideshowId);

    if (!slideshow) {
      return res.status(404).json({ message: "slideshow not found" });
    }

    if (slideshow.creatorId !== req.user.id) {
      return res.status(403).json({
        message: "You can only start a live session for your own slideshow",
      });
    }

    const createdLiveSession = await db.LiveSession.create({
      slideshowId: req.body.slideshowId,
      leaderUserId: req.user.id,
      currentSlideIndex: 0,
      isActive: true,
    });

    return res.status(200).json(createdLiveSession);
  } catch (err) {
    return res.status(404).json({ message: err.message, code: err.code });
  }
};

const update = async (req, res) => {
  try {
    const existingLiveSession = await db.LiveSession.findById(req.params.id);

    if (!existingLiveSession) {
      return res.status(404).json({ error: "live session not found" });
    }

    if (existingLiveSession.leaderUserId !== req.user.id) {
      return res.status(403).json({
        message: "Only the session leader can update this live session",
      });
    }

    const updatedLiveSession = await db.LiveSession.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          ...req.body,
          leaderUserId: existingLiveSession.leaderUserId,
          slideshowId: existingLiveSession.slideshowId,
        },
      },
      { new: true, runValidators: true }
    );

    emitSessionUpdate(req, "session-updated", updatedLiveSession);

    return res.status(200).json(updatedLiveSession);
  } catch (err) {
    return res.status(400).json({ message: err.message, code: err.code });
  }
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

const destroy = async (req, res) => {
  try {
    const existingLiveSession = await db.LiveSession.findById(req.params.id);

    if (!existingLiveSession) {
      return res.status(400).json({ error: "live session not found" });
    }

    if (existingLiveSession.leaderUserId !== req.user.id) {
      return res.status(403).json({
        message: "Only the session leader can delete this live session",
      });
    }

    await db.LiveSession.findByIdAndDelete(req.params.id);

    emitSessionUpdate(req, "session-ended", {
      ...existingLiveSession.toObject(),
      isActive: false,
    });

    return res.status(200).json({
      message: `Live session ${existingLiveSession.sessionId} was successfully deleted`,
    });
  } catch (err) {
    return res.status(400).json({ err });
  }
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
