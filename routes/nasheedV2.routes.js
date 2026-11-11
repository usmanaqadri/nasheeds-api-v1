const express = require("express");

const router = express.Router();

const ctrls = require("../controllers");
const { generatePDF } = require("../services/pdfGenerator");
const { protect } = require("../utils/middleware");
// const {
//   generateTransliteration,
//   generateTranslation,
// } = require("../services/aiFunctions");

router.get("/", ctrls.nasheedV2.index);
router.get("/seed", ctrls.nasheedV2.seed);
router.post("/create", protect, ctrls.nasheedV2.create);
router.post("/echoMessage", ctrls.nasheedV2.echo);
router.get("/:slug", ctrls.nasheedV2.show);
router.put("/:id", protect, ctrls.nasheedV2.update);
router.delete("/:id", protect, ctrls.nasheedV2.destroy);

router.post("/generate-pdf", generatePDF);
// router.post("/generate-transliteration", generateTransliteration);
// router.post("/generate-translation", generateTranslation);

module.exports = router;
