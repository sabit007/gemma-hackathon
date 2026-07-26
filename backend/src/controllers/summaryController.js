const Order = require("../models/Order");
const Customer = require("../models/Customer");

const getTodaySummary = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    const totalSales = orders.reduce(
      (sum, order) => sum + order.total,
      0
    );

    const totalCashReceived = orders.reduce(
      (sum, order) => sum + order.paidAmount,
      0
    );

    const totalBakiAdded = orders.reduce(
      (sum, order) => sum + order.bakiAmount,
      0
    );

    const customers = await Customer.find({
      outstandingBaki: { $gt: 0 },
    })
      .sort({ outstandingBaki: -1 })
      .limit(5);

    const totalBakiOutstanding = await Customer.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$outstandingBaki" },
        },
      },
    ]);

    res.json({
      date: new Date().toISOString().split("T")[0],
      totalSales,
      totalCashReceived,
      totalBakiAdded,
      totalBakiOutstanding:
        totalBakiOutstanding[0]?.total || 0,
      topDebtors: customers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getTodaySummary };