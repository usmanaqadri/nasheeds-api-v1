const express = require("express");

const router = express.Router();

const ctrls = require("../controllers");
const { generatePDF } = require("../services/pdfGenerator");
const { isAuthenticated } = require("../utils/customMiddleware");

router.get("/", ctrls.nasheed.index);
router.get("/seed", ctrls.nasheed.seed);
router.post("/", isAuthenticated, ctrls.nasheed.create);
router.post("/echoMessage", ctrls.nasheed.echo);
router.get("/:id", ctrls.nasheed.show);
router.put("/:id", ctrls.nasheed.update);
router.delete("/:id", ctrls.nasheed.destroy);

router.post("/generate-pdf", generatePDF);

module.exports = router;
