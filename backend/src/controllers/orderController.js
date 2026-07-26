const Order = require("../models/Order");
const Customer = require("../models/Customer");
const LedgerEntry = require("../models/LedgerEntry");

const createOrder = async (req, res) => {
  try {
    const {
      customerId,
      items,
      paymentType,
      paidAmount = 0,
      rawTranscript = "",
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Order items are required" });
    }

    if (!["CASH", "BAKI"].includes(paymentType)) {
      return res.status(400).json({ message: "Invalid payment type" });
    }

    const preparedItems = items.map((item) => {
      const quantity = Number(item.quantity || 1);
      const unitPrice = Number(item.unitPrice);

      return {
        name: item.name,
        quantity,
        unitPrice,
        subtotal: quantity * unitPrice,
      };
    });

    const hasInvalidItem = preparedItems.some(
      (item) =>
        !item.name ||
        item.quantity <= 0 ||
        !Number.isFinite(item.unitPrice) ||
        item.unitPrice <= 0
    );

    if (hasInvalidItem) {
      return res.status(400).json({
        message: "Every item requires a valid name, quantity, and price",
      });
    }

    const total = preparedItems.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );

    const finalPaidAmount =
      paymentType === "CASH" ? total : Number(paidAmount);

    if (finalPaidAmount < 0 || finalPaidAmount > total) {
      return res.status(400).json({ message: "Invalid paid amount" });
    }

    const bakiAmount = total - finalPaidAmount;

    if (bakiAmount > 0 && !customerId) {
      return res.status(400).json({
        message: "Customer is required for a baki order",
      });
    }

    const order = await Order.create({
      customerId: customerId || null,
      items: preparedItems,
      total,
      paymentType,
      paidAmount: finalPaidAmount,
      bakiAmount,
      rawTranscript,
    });

    await LedgerEntry.create({
      customerId: customerId || null,
      orderId: order._id,
      type: "SALE",
      amount: total,
      note: rawTranscript,
    });

    if (bakiAmount > 0) {
      await Customer.findByIdAndUpdate(customerId, {
        $inc: { outstandingBaki: bakiAmount },
      });

      await LedgerEntry.create({
        customerId,
        orderId: order._id,
        type: "BAKI_ADDED",
        amount: bakiAmount,
        note: "Baki added from order",
      });
    }

    res.status(201).json({
      message: "Order saved successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createOrder };