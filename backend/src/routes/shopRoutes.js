const express = require("express");
const { getShop, registerShop, verifyVoicePin } = require("../controllers/shopController");

const router = express.Router();

router.get("/", getShop);
router.post("/register", registerShop);
router.post("/verify", verifyVoicePin);

module.exports = router;
