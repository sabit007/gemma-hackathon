"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

export interface TransactionItem {
  name: string;
  qty: string;
  price: number;
}

export interface Transaction {
  id: string;
  customerName: string;
  phone?: string;
  date: string;
  items: TransactionItem[];
  totalAmount: number; // Overall cost of items
  amountPaid: number;  // Amount paid cash
  status: "Due" | "Paid";
  smsDraft: string;
}

interface AppContextType {
  language: "bn" | "en";
  setLanguage: (lang: "bn" | "en") => void;
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, "id">) => void;
  parseAndAddTransaction: (transcript: string, phoneInput?: string) => Promise<void>;
  saveExternalParsedTransaction: (parsedData: any) => Promise<void>;
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  showInsights: boolean;
  setShowInsights: (show: boolean) => void;
  showAuth: boolean;
  setShowAuth: (show: boolean) => void;
  shopName: string;
  setShopName: (name: string) => void;
  voicePin: string;
  setVoicePin: (pin: string) => void;
  t: (key: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialTransactions: Transaction[] = [
  {
    id: "tx-1",
    customerName: "রহিম মিয়া",
    phone: "01712345678",
    date: "২৬ জুলাই, ২০২৬",
    items: [
      { name: "মিনিকেট চাল", qty: "২ কেজি", price: 140 },
      { name: "সয়াবিন তেল", qty: "১ লিটার", price: 180 },
    ],
    totalAmount: 320,
    amountPaid: 100, // Partial payment of 100 Taka
    status: "Due",
    smsDraft: "",
  },
  {
    id: "tx-2",
    customerName: "কামাল হোসেন",
    phone: "01887654321",
    date: "২৫ জুলাই, ২০২৬",
    items: [
      { name: "ডিম", qty: "১ ডজন", price: 150 },
      { name: "চিনি", qty: "১ কেজি", price: 130 },
      { name: "চাপাতা", qty: "২০০ গ্রাম", price: 110 },
    ],
    totalAmount: 390,
    amountPaid: 390, // Fully paid
    status: "Paid",
    smsDraft: "",
  },
  {
    id: "tx-repay",
    customerName: "রহিম মিয়া",
    phone: "01712345678",
    date: "২৫ জুলাই, ২০২৬",
    items: [], // Repayment transaction has no items
    totalAmount: 0,
    amountPaid: 200, // Paid back 200 Taka
    status: "Paid",
    smsDraft: "",
  },
  {
    id: "tx-3",
    customerName: "রহিম মিয়া",
    phone: "01712345678",
    date: "২৩ জুলাই, ২০২৬",
    items: [
      { name: "মসুর ডাল", qty: "১ কেজি", price: 140 },
      { name: "মুড়ি", qty: "৫০০ গ্রাম", price: 60 },
    ],
    totalAmount: 200,
    amountPaid: 0, // No payment
    status: "Due",
    smsDraft: "",
  },
  {
    id: "tx-4",
    customerName: "বিলকিস বেগম",
    phone: "01555667788",
    date: "২৩ জুলাই, ২০২৬",
    items: [
      { name: "প্যারাসুট নারিকেল তেল", qty: "১ ফাইল", price: 120 },
      { name: "লাক্স সাবান", qty: "১টি", price: 65 },
    ],
    totalAmount: 185,
    amountPaid: 185,
    status: "Paid",
    smsDraft: "",
  },
];

const translations = {
  bn: {
    title: "সহজ হিসাব",
    subtitle: "ভয়েস-ভিত্তিক খাতা",
    langSwitch: "English",
    verifyVoice: "কণ্ঠস্বর যাচাই করুন",
    matchingVoice: "কণ্ঠস্বর ম্যাচিং হচ্ছে...",
    voiceVerified: "ভয়েস ভেরিফাইড!",
    speakHint: "কথা বলতে নিচের বোতামে চাপ দিন...",
    textPlaceholder: "অথবা এখানে টাইপ করুন (যেমন: রহিমকে ৩২০ টাকার সদাই দিলাম, ১০০ টাকা দিল)",
    insightsBtn: "এআই সামারি",
    summaryTitle: "সারাদিনের হিসাবের সামারি (EOD)",
    totalSales: "মোট বিক্রি",
    totalCollected: "মোট নগদ আদায়",
    totalDue: "মোট বাকি (বকেয়া)",
    dueCustomers: "বকেয়া কাস্টমার সংখ্যা",
    smsDraftTitle: "এসএমএস ড্রাফট",
    smsSend: "পাঠান",
    smsCopied: "কপি হয়েছে!",
    statusDue: "বাকি",
    statusPaid: "জমা (Paid)",
    processingGemma: "Gemma ৪ ইনপুট প্রসেস করছে...",
    noTransactions: "কোনো লেনদেন পাওয়া যায়নি",
    addTxSuccess: "লেনদেন সফলভাবে যোগ হয়েছে!",
  },
  en: {
    title: "Shohoj Hisab",
    subtitle: "Voice-first Ledger",
    langSwitch: "বাংলা",
    verifyVoice: "Verify Voice Security",
    matchingVoice: "Matching voice print...",
    voiceVerified: "Voice Verified!",
    speakHint: "Tap the mic below to speak...",
    textPlaceholder: "Or type here (e.g. Rahim 320 items, paid 100)",
    insightsBtn: "AI Summary",
    summaryTitle: "End of Day (EOD) AI Insights",
    totalSales: "Total Sales",
    totalCollected: "Total Collected",
    totalDue: "Total Outstanding Due",
    dueCustomers: "Due Customers",
    smsDraftTitle: "SMS Draft",
    smsSend: "Send",
    smsCopied: "Copied!",
    statusDue: "Due",
    statusPaid: "Paid",
    processingGemma: "Gemma 4 is processing input...",
    noTransactions: "No transactions logged yet",
    addTxSuccess: "Transaction added successfully!",
  },
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<"bn" | "en">("bn");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [showAuth, setShowAuth] = useState(true);

  // Shop configurations stored in localStorage
  const [shopName, setShopNameState] = useState<string>("");
  const [voicePin, setVoicePinState] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShopNameState(localStorage.getItem("shopName") || "");
      setVoicePinState(localStorage.getItem("voicePin") || "");
    }
  }, []);

  const setShopName = (name: string) => {
    setShopNameState(name);
    if (typeof window !== "undefined") {
      localStorage.setItem("shopName", name);
    }
  };

  const setVoicePin = (pin: string) => {
    setVoicePinState(pin);
    if (typeof window !== "undefined") {
      localStorage.setItem("voicePin", pin);
    }
  };

  // Fallback local NLP parsing
  const parseLedgerTextLocal = (text: string) => {
    let customerName = "Unknown Customer";
    let phone = "01" + Math.floor(100000000 + Math.random() * 900000000);
    let totalAmount = 100;
    let amountPaid = 0;
    let status: "Due" | "Paid" = "Due";

    const isBanglaText = /[\u0980-\u09FF]/.test(text);

    const getNumbers = (str: string): number[] => {
      const bnDigits = { "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4", "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9" };
      let englishDigitsStr = "";
      for (const char of str) {
        if (char >= "0" && char <= "9") {
          englishDigitsStr += char;
        } else if (char in bnDigits) {
          englishDigitsStr += bnDigits[char as keyof typeof bnDigits];
        } else {
          englishDigitsStr += " ";
        }
      }
      return englishDigitsStr
        .split(/\s+/)
        .filter((tok) => tok.length > 0)
        .map((tok) => parseInt(tok, 10))
        .filter((val) => !isNaN(val));
    };

    const parsedNumbers = getNumbers(text);

    if (isBanglaText) {
      customerName = "অপরিচিত কাস্টমার";
      const words = text.split(/\s+/);
      if (words.length > 0) {
        let firstWord = words[0];
        firstWord = firstWord.replace(/[কে|এর|র]$/, "");
        if (firstWord.length > 1 && !firstWord.includes("আজ") && !firstWord.includes("গত")) {
          customerName = firstWord;
        }
      }

      if (parsedNumbers.length === 1) {
        totalAmount = parsedNumbers[0];
        if (text.includes("জমা") || text.includes("পরিশোধ") || text.includes("পেইড") || text.includes("দিল")) {
          status = "Paid";
          amountPaid = totalAmount;
        } else {
          status = "Due";
          amountPaid = 0;
        }
      } else if (parsedNumbers.length >= 2) {
        totalAmount = parsedNumbers[0];
        amountPaid = parsedNumbers[1];
        status = "Due";
      }
    } else {
      const words = text.split(/\s+/);
      if (words.length > 0) {
        const firstWord = words[0];
        if (firstWord.length > 2 && firstWord !== "gave" && firstWord !== "took" && firstWord !== "paid") {
          customerName = firstWord;
        }
      }

      if (parsedNumbers.length === 1) {
        totalAmount = parsedNumbers[0];
        const lowerText = text.toLowerCase();
        if (lowerText.includes("paid") || lowerText.includes("cash") || lowerText.includes("received")) {
          status = "Paid";
          amountPaid = totalAmount;
        } else {
          status = "Due";
          amountPaid = 0;
        }
      } else if (parsedNumbers.length >= 2) {
        totalAmount = parsedNumbers[0];
        amountPaid = parsedNumbers[1];
        status = "Due";
      }
    }

    const items: TransactionItem[] = [
      {
        name: language === "bn" ? "সাধারণ সদাই" : "Store Items",
        qty: "১ স্লট",
        price: totalAmount,
      },
    ];

    return {
      customerName,
      phone,
      date: language === "bn" ? "২৬ জুলাই, ২০২৬" : "26 July, 2026",
      items,
      totalAmount,
      amountPaid,
      status,
      smsDraft: "",
    };
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/orders");
      if (response.ok) {
        const data = await response.json();
        const mapped = data.map((order: any) => ({
          id: order._id,
          customerName: order.customerId ? order.customerId.name : "অপরিচিত কাস্টমার",
          phone: order.customerId ? order.customerId.phone : null,
          date: new Date(order.createdAt).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
          items: order.items.map((it: any) => ({
            name: it.name,
            qty: `${it.quantity}টি`,
            price: it.unitPrice,
          })),
          totalAmount: order.total,
          amountPaid: order.paidAmount,
          status: order.bakiAmount > 0 ? "Due" : "Paid",
          smsDraft: "",
        }));
        setTransactions(mapped);
      } else {
        throw new Error("Failed to load");
      }
    } catch (err) {
      console.warn("Backend not active. Using mock static transactions list.");
      setTransactions((prev) => (prev.length === 0 ? initialTransactions : prev));
    }
  };

  const addTransaction = (tx: Omit<Transaction, "id">) => {
    const newTx: Transaction = {
      ...tx,
      id: `tx-${Date.now()}`,
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  const parseAndAddTransaction = async (transcript: string, phoneInput?: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch("http://localhost:5000/api/orders/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, phone: phoneInput }),
      });

      if (!response.ok) {
        throw new Error("Backend response error");
      }

      const data = await response.json();

      if (data.requiresPhone) {
        const phone = prompt(
          language === "bn"
            ? `কাস্টমার "${data.parsedData.customerName}" নতুন। অনুগ্রহ করে ফোন নম্বর দিন:`
            : `Customer "${data.parsedData.customerName}" is new. Please enter phone number:`
        );
        if (phone) {
          await parseAndAddTransaction(transcript, phone);
        } else {
          setIsProcessing(false);
        }
        return;
      }

      if (data.limitExceeded) {
        alert(data.message);
        setIsProcessing(false);
        return;
      }

      if (data.success) {
        await fetchTransactions();
        alert(t("addTxSuccess"));
      }
    } catch (err) {
      console.warn("API Server down. Processing locally with offline fallback parser.", err);
      const parsedData = parseLedgerTextLocal(transcript);

      const customerTransactions = transactions.filter(
        (tx) => tx.customerName === parsedData.customerName
      );
      const cumulativeDue = customerTransactions.reduce(
        (sum, tx) => sum + (tx.totalAmount - tx.amountPaid),
        0
      );
      const newBakiEffect = parsedData.status === "Due" ? (parsedData.totalAmount - parsedData.amountPaid) : 0;
      const CREDIT_LIMIT = 1000;

      if (parsedData.status === "Due" && cumulativeDue + newBakiEffect > CREDIT_LIMIT) {
        alert(
          language === "bn"
            ? `বকেয়া সীমা অতিক্রম করেছে! কাস্টমার ${parsedData.customerName} এর মোট বকেয়া ${cumulativeDue + newBakiEffect} ৳ যা সীমা (${CREDIT_LIMIT} ৳) ছাড়িয়েছে। আর বাকি দেওয়া যাবে না।`
            : `Credit Limit Exceeded! Total dues for ${parsedData.customerName} would be ${cumulativeDue + newBakiEffect} ৳ (Limit: ${CREDIT_LIMIT} ৳). Strictly no more credit.`
        );
        setIsProcessing(false);
        return;
      }

      addTransaction(parsedData);
      alert(t("addTxSuccess"));
    } finally {
      setIsProcessing(false);
    }
  };

  const saveExternalParsedTransaction = async (parsedData: any) => {
    setIsProcessing(true);
    try {
      const response = await fetch("http://localhost:5000/api/orders/save-external", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parsedData }),
      });

      if (!response.ok) {
        throw new Error("Backend response error");
      }

      const data = await response.json();

      if (data.requiresPhone) {
        const phone = prompt(
          language === "bn"
            ? `কাস্টমার "${data.parsedData.customerName}" নতুন। অনুগ্রহ করে ফোন নম্বর দিন:`
            : `Customer "${data.parsedData.customerName}" is new. Please enter phone number:`
        );
        if (phone) {
          await saveExternalParsedTransaction({ ...parsedData, phone });
        } else {
          setIsProcessing(false);
        }
        return;
      }

      if (data.limitExceeded) {
        alert(data.message);
        setIsProcessing(false);
        return;
      }

      if (data.success) {
        await fetchTransactions();
        alert(t("addTxSuccess"));
      }
    } catch (err) {
      console.warn("API Server down. Unable to save external data to backend.", err);
      // Fallback: just add to local state
      addTransaction(parsedData);
      alert(t("addTxSuccess"));
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [language]);

  const t = (key: string): string => {
    const dict = translations[language];
    return (dict as any)[key] || key;
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        transactions,
        addTransaction,
        parseAndAddTransaction,
        saveExternalParsedTransaction,
        isRecording,
        setIsRecording,
        isProcessing,
        setIsProcessing,
        showInsights,
        setShowInsights,
        showAuth,
        setShowAuth,
        shopName,
        setShopName,
        voicePin,
        setVoicePin,
        t,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
