"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import LedgerCard from "./LedgerCard";
import SkeletonCard from "./SkeletonCard";
import { BookOpen } from "lucide-react";

export default function LedgerBoard() {
  const { transactions, isProcessing, t, language } = useApp();

  return (
    <div className="w-full">
      {/* Title Header */}
      <div className="flex items-center gap-2 mb-6 border-b-4 border-black pb-2 select-none">
        <BookOpen className="w-5 h-5 text-black stroke-[2.5px]" />
        <h2 className="text-2xl font-black tracking-tight text-black uppercase">
          {language === "bn" ? "হিসাব খাতা" : "Ledger Records"}
        </h2>
        <span className="ml-auto font-mono text-xs font-bold border-2 border-black bg-black text-white px-2 py-0.5">
          {transactions.length} ITEMS
        </span>
      </div>

      {/* Loading state at the top of feed */}
      {isProcessing && <SkeletonCard />}

      {/* Transaction List */}
      {transactions.length === 0 ? (
        <div className="border-4 border-black border-dashed p-8 text-center bg-white shadow-brutal select-none">
          <p className="font-bold text-gray-500">{t("noTransactions")}</p>
        </div>
      ) : (
        <div className="space-y-1">
          {transactions.map((tx) => (
            <LedgerCard key={tx.id} transaction={tx} />
          ))}
        </div>
      )}
    </div>
  );
}
