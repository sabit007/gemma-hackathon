const express = require("express");
const { createOrder, getAllOrders } = require("../controllers/orderController");
const { parseVoiceInput, saveExternalParsedData } = require("../controllers/aiController");

const router = express.Router();

router.get("/", getAllOrders);
router.post("/", createOrder);
router.post("/parse", parseVoiceInput);
router.post("/save-external", saveExternalParsedData);

module.exports = router;