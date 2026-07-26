"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { X, Sparkles, TrendingUp, DollarSign, AlertCircle, Users } from "lucide-react";

export default function InsightsBottomSheet() {
  const { transactions, showInsights, setShowInsights, language, t } = useApp();

  // Dynamic calculations based on partial payments
  const totalSales = transactions.reduce((acc, curr) => acc + curr.totalAmount, 0);
  
  // Total cash collected = amount paid across all paid + partial due transactions
  const totalCollected = transactions.reduce((acc, curr) => acc + curr.amountPaid, 0);
  
  // Total due outstanding = net balance (total - paid) on all due transactions
  const totalDue = transactions
    .filter((tx) => tx.status === "Due")
    .reduce((acc, curr) => acc + (curr.totalAmount - curr.amountPaid), 0);
  
  const dueCustomers = Array.from(
    new Set(transactions.filter((tx) => tx.status === "Due").map((tx) => tx.customerName))
  ).length;

  const toggleInsights = () => {
    setShowInsights(!showInsights);
  };

  const getAiSummaryBullets = () => {
    if (language === "bn") {
      return [
        `আজকে মোট ${transactions.length}টি লেনদেন নথিভুক্ত হয়েছে।`,
        `আজকের মোট বকেয়া (বাকি) লেনদেন ${transactions.filter(t => t.status === "Due").length}টি, মোট বকেয়া পরিমাণ ${totalDue} ৳।`,
        `সবচেয়ে বেশি বাকি রেখেছেন ${
          transactions.filter((t) => t.status === "Due")[0]?.customerName || "কেউ নন"
        } (${(transactions.filter((t) => t.status === "Due")[0]?.totalAmount || 0) - (transactions.filter((t) => t.status === "Due")[0]?.amountPaid || 0)} ৳)।`,
        `নগদ আদায় আশাব্যঞ্জক (${totalCollected} ৳), যা মোট বিক্রির ${
          totalSales ? Math.round((totalCollected / totalSales) * 100) : 0
        }%।`
      ];
    } else {
      return [
        `Logged a total of ${transactions.length} ledger activities today.`,
        `Outstanding credit accounts for ${transactions.filter(t => t.status === "Due").length} sales, totaling ${totalDue} ৳ in net credit debt.`,
        `Highest outstanding debtor is ${
          transactions.filter((t) => t.status === "Due")[0]?.customerName || "None"
        } with ${(transactions.filter((t) => t.status === "Due")[0]?.totalAmount || 0) - (transactions.filter((t) => t.status === "Due")[0]?.amountPaid || 0)} ৳ in credit.`,
        `Cash flow collected represents ${
          totalSales ? Math.round((totalCollected / totalSales) * 100) : 0
        }% of the overall bookkeeping transactions.`
      ];
    }
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <button
        onClick={toggleInsights}
        className="fixed bottom-28 right-6 z-30 flex items-center gap-2 px-4 py-3 border-4 border-black font-black text-sm bg-white text-black shadow-brutal hover:bg-black hover:text-white transition-all select-none cursor-pointer active:translate-x-1 active:translate-y-1 active:shadow-none"
      >
        <Sparkles className="w-4 h-4 fill-current animate-pulse" />
        <span>{t("insightsBtn")}</span>
      </button>

      {/* Backdrop Overlay */}
      {showInsights && (
        <div
          onClick={toggleInsights}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
        />
      )}

      {/* Bottom Sheet Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white border-t-4 border-black max-w-lg mx-auto shadow-2xl transition-transform duration-300 transform select-none ${
          showInsights ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-4 border-black p-5 bg-black text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 fill-white text-white" />
            <h3 className="text-lg font-black tracking-tight uppercase">
              {t("summaryTitle")}
            </h3>
          </div>
          <button
            onClick={toggleInsights}
            className="p-1 border-2 border-white hover:bg-white hover:text-black transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[2.5px]" />
          </button>
        </div>

        {/* Dashboard Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Metric 1 */}
            <div className="border-2 border-black p-3 bg-white shadow-brutal-sm">
              <div className="flex items-center gap-1 text-gray-500 mb-1">
                <DollarSign className="w-4 h-4 text-black" />
                <span className="text-xs font-bold uppercase">{t("totalSales")}</span>
              </div>
              <p className="font-mono text-xl font-black">{totalSales} ৳</p>
            </div>

            {/* Metric 2 */}
            <div className="border-2 border-black p-3 bg-white shadow-brutal-sm">
              <div className="flex items-center gap-1 text-gray-500 mb-1">
                <TrendingUp className="w-4 h-4 text-black" />
                <span className="text-xs font-bold uppercase">{t("totalCollected")}</span>
              </div>
              <p className="font-mono text-xl font-black">{totalCollected} ৳</p>
            </div>

            {/* Metric 3 */}
            <div className="border-2 border-black p-3 bg-black text-white shadow-brutal-sm">
              <div className="flex items-center gap-1 text-gray-400 mb-1">
                <AlertCircle className="w-4 h-4 text-white" />
                <span className="text-xs font-bold uppercase">{t("totalDue")}</span>
              </div>
              <p className="font-mono text-xl font-black">{totalDue} ৳</p>
            </div>

            {/* Metric 4 */}
            <div className="border-2 border-black p-3 bg-white shadow-brutal-sm">
              <div className="flex items-center gap-1 text-gray-500 mb-1">
                <Users className="w-4 h-4 text-black" />
                <span className="text-xs font-bold uppercase">{t("dueCustomers")}</span>
              </div>
              <p className="font-mono text-xl font-black">{dueCustomers}</p>
            </div>
          </div>

          {/* AI Insights Card */}
          <div className="border-4 border-black p-5 bg-gray-50 shadow-brutal-sm relative">
            <span className="absolute -top-3.5 left-4 bg-black text-white px-2 py-0.5 border-2 border-black text-xs font-black uppercase tracking-widest">
              Gemma EOD Analysis
            </span>
            <ul className="space-y-3 mt-1.5 list-none">
              {getAiSummaryBullets().map((bullet, idx) => (
                <li key={idx} className="flex gap-2 text-sm font-semibold text-black leading-relaxed">
                  <span className="text-black font-black mt-0.5">•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Close Button */}
        <div className="border-t-2 border-black p-4 bg-white flex justify-end">
          <button
            onClick={toggleInsights}
            className="px-6 py-2 border-2 border-black font-bold text-sm bg-black text-white hover:bg-white hover:text-black transition-colors select-none cursor-pointer"
          >
            বন্ধ করুন (Close)
          </button>
        </div>
      </div>
    </>
  );
}
