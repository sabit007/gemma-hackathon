const Customer = require("../models/Customer");

const normalizeName = (name) =>
    name.trim().toLowerCase().replace(/\s+/g, " ");

const findOrCreateCustomer = async (req, res) => {
    try {
        const { name, phone } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Customer name is required" });
        }

        const normalizedName = normalizeName(name);

        let customer = await Customer.findOne({ normalizedName });

        if (customer) {
            return res.json({
                created: false,
                customer,
            });
        }

        if (!phone) {
            return res.status(200).json({
                created: false,
                requiresPhone: true,
                message: "Phone number is required for a new customer",
            });
        }

        customer = await Customer.create({
            name,
            normalizedName,
            phone,
        });

        res.status(201).json({
            created: true,
            customer,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const LedgerEntry = require("../models/LedgerEntry");

const payBaki = async (req, res) => {
    try {
        const { amount } = req.body;
        const paymentAmount = Number(amount);

        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        if (
            !Number.isFinite(paymentAmount) ||
            paymentAmount <= 0 ||
            paymentAmount > customer.outstandingBaki
        ) {
            return res.status(400).json({
                message: "Invalid payment amount",
            });
        }

        customer.outstandingBaki -= paymentAmount;
        await customer.save();

        await LedgerEntry.create({
            customerId: customer._id,
            type: "BAKI_PAYMENT",
            amount: paymentAmount,
            note: "Customer baki payment",
        });

        res.json({
            message: "Baki payment recorded",
            paidAmount: paymentAmount,
            outstandingBaki: customer.outstandingBaki,
            customer,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    findOrCreateCustomer,
    payBaki,
};