const express = require("express");

const router = express.Router();

const ctrls = require("../controllers");
const { generatePDF } = require("../services/pdfGenerator");
const { protect } = require("../utils/middleware");
const {
  generateTransliteration,
  generateTranslation,
} = require("../services/aiFunctions");

router.get("/", ctrls.nasheed.index);
router.get("/seed", ctrls.nasheed.seed);
router.post("/create", protect, ctrls.nasheed.create);
router.post("/echoMessage", ctrls.nasheed.echo);
router.get("/:id", ctrls.nasheed.show);
router.put("/:id", protect, ctrls.nasheed.update);
router.delete("/:id", ctrls.nasheed.destroy);

router.post("/generate-pdf", generatePDF);
router.post("/generate-transliteration", generateTransliteration);
router.post("/generate-translation", generateTranslation);

module.exports = router;
