const express = require("express");
const { getTodaySummary } = require("../controllers/summaryController");

const router = express.Router();

router.get("/today", getTodaySummary);

module.exports = router;