const express = require("express");

const {
  findOrCreateCustomer,
  payBaki,
} = require("../controllers/customerController");

const router = express.Router();

router.post("/find-or-create", findOrCreateCustomer);
router.post("/:id/pay-baki", payBaki);

module.exports = router;