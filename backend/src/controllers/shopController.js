const Shop = require("../models/Shop");

const getShop = async (req, res) => {
  try {
    const shop = await Shop.findOne().sort({ createdAt: -1 });
    if (!shop) {
      return res.json({ exists: false });
    }
    res.json({
      exists: true,
      shop: {
        name: shop.name,
        // Optional: send voicePin for frontend offline fallback checking
        voicePin: shop.voicePin,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const registerShop = async (req, res) => {
  try {
    const { name, voicePin } = req.body;

    if (!name || !voicePin) {
      return res.status(400).json({ message: "Shop name and voice PIN are required" });
    }

    // Upsert shop record
    let shop = await Shop.findOne();
    if (shop) {
      shop.name = name;
      shop.voicePin = voicePin;
      await shop.save();
    } else {
      shop = await Shop.create({ name, voicePin });
    }

    res.status(201).json({
      success: true,
      message: "Shop voice profile saved to database successfully",
      shop,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verifyVoicePin = async (req, res) => {
  try {
    const { voicePin } = req.body;

    if (!voicePin) {
      return res.status(400).json({ message: "Voice PIN is required for verification" });
    }

    const shop = await Shop.findOne();
    if (!shop) {
      return res.status(404).json({ message: "No registered shop profile found" });
    }

    if (shop.voicePin === voicePin.trim()) {
      return res.json({ success: true, message: "Voice PIN matched successfully" });
    } else {
      return res.json({ success: false, message: "Voice PIN mismatch" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getShop,
  registerShop,
  verifyVoicePin,
};
