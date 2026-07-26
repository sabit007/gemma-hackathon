const Customer = require("../models/Customer");
const Order = require("../models/Order");
const LedgerEntry = require("../models/LedgerEntry");

const normalizeName = (name) =>
  name.trim().toLowerCase().replace(/\s+/g, " ");

const parseVoiceInput = async (req, res) => {
  try {
    const { transcript, phone: bodyPhone } = req.body;

    if (!transcript) {
      return res.status(400).json({ message: "Transcript text is required" });
    }

    const apiKey = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        message: "API key is not configured in .env. Please set OPENROUTER_API_KEY.",
      });
    }

    const prompt = `
You are an expert NLP parser for a shopkeeper ledger app called "Shohoj Hisab".
Your task is to parse a shopkeeper's natural language voice transcript (in Bangla or English) describing a transaction, and extract the structured data in JSON.

Examples of natural language input and expected output:

Input: "রহিমকে ৩২০ টাকার সদাই দিলাম, ১০০ টাকা দিল"
Output: {
  "customerName": "রহিম",
  "phone": null,
  "items": [
    { "name": "সদাই", "quantity": "১ স্লট", "unitPrice": 320 }
  ],
  "paymentType": "BAKI",
  "paidAmount": 100
}

Input: "করিম ভাইকে ৩ কেজি চাল দিলাম বাকি, দাম ২১০ টাকা"
Output: {
  "customerName": "করিম ভাই",
  "phone": null,
  "items": [
    { "name": "চাল", "quantity": "৩ কেজি", "unitPrice": 70 }
  ],
  "paymentType": "BAKI",
  "paidAmount": 0
}

Input: "সবুজ ভাই ১০০ টাকা ক্যাশ জমা দিল"
Output: {
  "customerName": "সবুজ ভাই",
  "phone": null,
  "items": [
    { "name": "নগদ জমা", "quantity": "ক্যাশ", "unitPrice": 100 }
  ],
  "paymentType": "CASH",
  "paidAmount": 100
}

Input: "Kamal paid 150 taka"
Output: {
  "customerName": "Kamal",
  "phone": null,
  "items": [
    { "name": "Cash Repayment", "quantity": "1 slot", "unitPrice": 150 }
  ],
  "paymentType": "CASH",
  "paidAmount": 150
}

Input: "সাদিককে ২৫০ টাকা বাকি দিলাম, মোবাইল নম্বর ০১৭১২৩৪৫৬৭৮"
Output: {
  "customerName": "সাদিক",
  "phone": "01712345678",
  "items": [
    { "name": "সদাই", "quantity": "১ স্লট", "unitPrice": 250 }
  ],
  "paymentType": "BAKI",
  "paidAmount": 0
}

Rules:
1. Always parse customerName. Keep it as the name/title of the customer.
2. If phone is mentioned, extract it as a clean string containing digits (e.g. 01712345678). If not mentioned, return null.
3. Convert all Bangla digits/numbers into standard English integers (e.g., "২৫০" -> 250, "১০০" -> 100).
4. For items:
   - Identify item name, quantity (e.g. "৩ কেজি", "১টি", "১ লিটার"), and price.
   - If unit price or quantities are not explicitly separate but only a total is given, set quantity = "১টি" or "1 slot" and unitPrice = total price.
5. If the transaction has amountPaid equal to the total bill, or if it is a repayment (e.g., "Kamal paid 150 taka"), paymentType must be "CASH".
6. If the transaction has amountPaid less than the total bill, paymentType must be "BAKI".
7. Return strictly a JSON object matching this schema:
{
  "customerName": string,
  "phone": string or null,
  "items": [
    { "name": string, "quantity": string, "unitPrice": number }
  ],
  "paymentType": "CASH" | "BAKI",
  "paidAmount": number
}

Analyze this input: "${transcript}"
`;

    // Make API request to OpenRouter
    const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Shohoj Hisab",
      },
      body: JSON.stringify({
        model: "google/gemma-4-26b-a4b-it:free",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      return res.status(502).json({
        message: `OpenRouter API returned an error: ${errorText}`,
      });
    }

    const responseData = await openRouterResponse.json();
    
    if (!responseData.choices || responseData.choices.length === 0) {
      return res.status(502).json({
        message: "Invalid response format from OpenRouter API.",
      });
    }

    const responseText = responseData.choices[0].message.content;

    // Clean and extract JSON string in case the model returns markdown code fences
    let cleanText = responseText.trim();
    if (cleanText.startsWith("```")) {
      cleanText = cleanText.replace(/^```(json)?\n/, "");
      cleanText = cleanText.replace(/\n```$/, "");
    }

    const parsedData = JSON.parse(cleanText.trim());

    const { customerName, phone, items, paymentType, paidAmount } = parsedData;

    if (!customerName) {
      return res.status(400).json({ message: "Could not resolve customer name from speech." });
    }

    const normalizedName = normalizeName(customerName);
    let customer = await Customer.findOne({ normalizedName });

    // Handle new customer flows
    if (!customer) {
      const finalPhone = phone || bodyPhone;
      if (!finalPhone) {
        // Return parsed data so frontend can prompt for phone
        return res.json({
          requiresPhone: true,
          parsedData: {
            customerName,
            items,
            paymentType,
            paidAmount,
            rawTranscript: transcript
          }
        });
      }

      // Create new customer
      customer = await Customer.create({
        name: customerName,
        normalizedName,
        phone: finalPhone,
        outstandingBaki: 0
      });
    }

    // Prepare items total
    const preparedItems = items.map((item) => {
      const quantityStr = item.quantity || "1";
      const quantityMatch = quantityStr.match(/\d+/);
      const quantity = quantityMatch ? Number(quantityMatch[0]) : 1;
      const unitPrice = Number(item.unitPrice || 0);

      return {
        name: item.name,
        quantity,
        unitPrice,
        subtotal: quantity * unitPrice
      };
    });

    const total = preparedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const finalPaidAmount = paymentType === "CASH" ? total : Number(paidAmount || 0);
    const bakiAmount = total - finalPaidAmount;

    // Credit Limit system lock (Gemma alert) check
    const CREDIT_LIMIT = 1000;
    if (bakiAmount > 0 && customer.outstandingBaki + bakiAmount > CREDIT_LIMIT) {
      return res.json({
        limitExceeded: true,
        message: `বকেয়া সীমা অতিক্রম করেছে! কাস্টমার ${customer.name} এর মোট বকেয়া ${customer.outstandingBaki + bakiAmount} ৳ যা সীমা (${CREDIT_LIMIT} ৳) ছাড়িয়েছে। আর বাকি দেওয়া যাবে না। আগে বকেয়া পরিশোধ করতে হবে।`,
        outstandingBaki: customer.outstandingBaki,
        bakiAmount
      });
    }

    // Save order
    const order = await Order.create({
      customerId: customer._id,
      items: preparedItems,
      total,
      paymentType,
      paidAmount: finalPaidAmount,
      bakiAmount,
      rawTranscript: transcript
    });

    // Create ledger transaction logs
    await LedgerEntry.create({
      customerId: customer._id,
      orderId: order._id,
      type: "SALE",
      amount: total,
      note: transcript
    });

    if (bakiAmount > 0) {
      customer.outstandingBaki += bakiAmount;
      await customer.save();

      await LedgerEntry.create({
        customerId: customer._id,
        orderId: order._id,
        type: "BAKI_ADDED",
        amount: bakiAmount,
        note: "Baki added from voice transaction"
      });
    } else if (total === 0 && finalPaidAmount > 0) {
      // Repayment cash transaction
      customer.outstandingBaki = Math.max(0, customer.outstandingBaki - finalPaidAmount);
      await customer.save();

      await LedgerEntry.create({
        customerId: customer._id,
        orderId: order._id,
        type: "BAKI_PAYMENT",
        amount: finalPaidAmount,
        note: "Repayment logged from voice transaction"
      });
    }

    res.status(201).json({
      success: true,
      message: "Voice order parsed and saved successfully",
      customer,
      order
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  parseVoiceInput,
};
