const express = require("express");

const router = express.Router();

const ctrls = require("../controllers");
const { protect } = require("../utils/middleware");

router.get("/", ctrls.liveSession.index);
router.post("/create", protect, ctrls.liveSession.create);
router.post("/echoMessage", ctrls.liveSession.echo);
router.get("/session/:sessionId", ctrls.liveSession.showBySessionId);
router.get("/:id", ctrls.liveSession.show);
router.put("/:id", protect, ctrls.liveSession.update);
router.delete("/:id", protect, ctrls.liveSession.destroy);

module.exports = router;
