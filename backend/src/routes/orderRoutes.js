const express = require("express");
const { createOrder, getAllOrders } = require("../controllers/orderController");
const { parseVoiceInput } = require("../controllers/aiController");

const router = express.Router();

router.get("/", getAllOrders);
router.post("/", createOrder);
router.post("/parse", parseVoiceInput);

module.exports = router;