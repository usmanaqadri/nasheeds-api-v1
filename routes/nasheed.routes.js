const express = require("express");

const router = express.Router();

const ctrls = require("../controllers");

router.get("/", ctrls.nasheed.index);
router.get("/seed", ctrls.nasheed.seed);
router.post("/", ctrls.nasheed.create);
router.post("/echoMessage", ctrls.nasheed.echo);
router.get("/:id", ctrls.nasheed.show);
router.put("/:id", ctrls.nasheed.update);
router.delete("/:id", ctrls.nasheed.destroy);

module.exports = router;
