const Customer = require("../models/Customer");
const Order = require("../models/Order");
const LedgerEntry = require("../models/LedgerEntry");

const seedDatabase = async () => {
  try {
    const customerCount = await Customer.countDocuments();
    if (customerCount > 0) {
      console.log("Database already seeded with customers.");
      return;
    }

    console.log("Seeding sample data to MongoDB...");

    // 1. Create Customers
    const rahim = await Customer.create({
      name: "রহিম মিয়া",
      normalizedName: "রহিম মিয়া",
      phone: "01712345678",
      outstandingBaki: 220, // Net baki remaining: 200 baki - 200 paid + 220 baki = 220
    });

    const kamal = await Customer.create({
      name: "কামাল হোসেন",
      normalizedName: "কামাল হোসেন",
      phone: "01887654321",
      outstandingBaki: 0,
    });

    const billkis = await Customer.create({
      name: "বিলকিস বেগম",
      normalizedName: "বিলকিস বেগম",
      phone: "01555667788",
      outstandingBaki: 0,
    });

    // 2. Create Orders & Ledger Entries

    // Order 1: Billkis Begum (23 July 2026) - CASH
    const order1 = await Order.create({
      customerId: billkis._id,
      items: [
        { name: "প্যারাসুট নারিকেল তেল", quantity: 1, unitPrice: 120, subtotal: 120 },
        { name: "লাক্স সাবান", quantity: 1, unitPrice: 65, subtotal: 65 },
      ],
      total: 185,
      paymentType: "CASH",
      paidAmount: 185,
      bakiAmount: 0,
      rawTranscript: "বিলকিস বেগম ১৮৫ টাকার নারিকেল তেল আর লাক্স সাবান নিল ক্যাশ",
      createdAt: new Date("2026-07-23T10:00:00Z"),
    });

    await LedgerEntry.create({
      customerId: billkis._id,
      orderId: order1._id,
      type: "SALE",
      amount: 185,
      note: order1.rawTranscript,
      createdAt: new Date("2026-07-23T10:00:00Z"),
    });

    // Order 2: Rahim Mia (23 July 2026) - BAKI
    const order2 = await Order.create({
      customerId: rahim._id,
      items: [
        { name: "মসুর ডাল", quantity: 1, unitPrice: 140, subtotal: 140 },
        { name: "মুড়ি", quantity: 1, unitPrice: 60, subtotal: 60 },
      ],
      total: 200,
      paymentType: "BAKI",
      paidAmount: 0,
      bakiAmount: 200,
      rawTranscript: "রহিম মিয়াকে ২০০ টাকার ডাল আর মুড়ি বাকি দিলাম",
      createdAt: new Date("2026-07-23T14:30:00Z"),
    });

    await LedgerEntry.create({
      customerId: rahim._id,
      orderId: order2._id,
      type: "SALE",
      amount: 200,
      note: order2.rawTranscript,
      createdAt: new Date("2026-07-23T14:30:00Z"),
    });

    await LedgerEntry.create({
      customerId: rahim._id,
      orderId: order2._id,
      type: "BAKI_ADDED",
      amount: 200,
      note: "Baki added from order",
      createdAt: new Date("2026-07-23T14:30:05Z"),
    });

    // Order 3: Kamal Hossain (25 July 2026) - CASH
    const order3 = await Order.create({
      customerId: kamal._id,
      items: [
        { name: "ডিম", quantity: 12, unitPrice: 12.5, subtotal: 150 }, // 1 dozen
        { name: "চিনি", quantity: 1, unitPrice: 130, subtotal: 130 },
        { name: "চাপাতা", quantity: 1, unitPrice: 110, subtotal: 110 },
      ],
      total: 390,
      paymentType: "CASH",
      paidAmount: 390,
      bakiAmount: 0,
      rawTranscript: "কামাল হোসেন ডিম চিনি আর চাপাতা ৩৯০ টাকা ক্যাশ দিল",
      createdAt: new Date("2026-07-25T09:15:00Z"),
    });

    await LedgerEntry.create({
      customerId: kamal._id,
      orderId: order3._id,
      type: "SALE",
      amount: 390,
      note: order3.rawTranscript,
      createdAt: new Date("2026-07-25T09:15:00Z"),
    });

    // Order 4: Rahim Mia (25 July 2026) - REPAYMENT
    const order4 = await Order.create({
      customerId: rahim._id,
      items: [], // repayment
      total: 0,
      paymentType: "CASH",
      paidAmount: 200,
      bakiAmount: -200,
      rawTranscript: "রহিম মিয়া ২০০ টাকা নগদ জমা দিল",
      createdAt: new Date("2026-07-25T17:00:00Z"),
    });

    await LedgerEntry.create({
      customerId: rahim._id,
      orderId: order4._id,
      type: "BAKI_PAYMENT",
      amount: 200,
      note: "Repayment logged from voice transaction",
      createdAt: new Date("2026-07-25T17:00:05Z"),
    });

    // Order 5: Rahim Mia (26 July 2026) - BAKI (Partial Payment)
    const order5 = await Order.create({
      customerId: rahim._id,
      items: [
        { name: "মিনিকেট চাল", quantity: 2, unitPrice: 70, subtotal: 140 },
        { name: "সয়াবিন তেল", quantity: 1, unitPrice: 180, subtotal: 180 },
      ],
      total: 320,
      paymentType: "BAKI",
      paidAmount: 100,
      bakiAmount: 220,
      rawTranscript: "রহিম মিয়াকে ৩২০ টাকার চাল আর তেল দিলাম, ১০০ টাকা দিল",
      createdAt: new Date("2026-07-26T11:00:00Z"),
    });

    await LedgerEntry.create({
      customerId: rahim._id,
      orderId: order5._id,
      type: "SALE",
      amount: 320,
      note: order5.rawTranscript,
      createdAt: new Date("2026-07-26T11:00:00Z"),
    });

    await LedgerEntry.create({
      customerId: rahim._id,
      orderId: order5._id,
      type: "BAKI_ADDED",
      amount: 220,
      note: "Baki added from order",
      createdAt: new Date("2026-07-26T11:00:05Z"),
    });

    console.log("Database seeded successfully with Rahim, Kamal, and Billkis sample data!");

  } catch (error) {
    console.error("Seeding database failed:", error.message);
  }
};

module.exports = seedDatabase;
