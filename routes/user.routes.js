const express = require("express");

const router = express.Router();

const ctrls = require("../controllers");

router.get("/", ctrls.user.index);
router.post("/auth", ctrls.user.auth);
router.get("/seed", ctrls.user.seed);
router.post("/", ctrls.user.create);
router.post("/echoMessage", ctrls.user.echo);
router.get("/:id", ctrls.user.show);
router.put("/:id", ctrls.user.update);
router.delete("/:id", ctrls.user.destroy);

module.exports = router;
