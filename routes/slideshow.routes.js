const express = require("express");

const router = express.Router();

const ctrls = require("../controllers");
const { protect } = require("../utils/middleware");

router.get("/", ctrls.slideshow.index);
router.post("/create", protect, ctrls.slideshow.create);
router.post("/echoMessage", ctrls.slideshow.echo);
router.get("/:id", ctrls.slideshow.show);
router.put("/:id", protect, ctrls.slideshow.update);
router.delete("/:id", protect, ctrls.slideshow.destroy);

module.exports = router;
