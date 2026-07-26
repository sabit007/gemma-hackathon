"use client";

import React from "react";
import { Transaction, useApp } from "@/context/AppContext";
import SmsDraftBox from "./SmsDraftBox";
import { Check, Calendar, AlertOctagon } from "lucide-react";

interface LedgerCardProps {
  transaction: Transaction;
}

export default function LedgerCard({ transaction }: LedgerCardProps) {
  const { transactions, language, t } = useApp();
  const { customerName, phone, date, items, totalAmount, amountPaid, status } = transaction;

  // Filter all transactions (Due + Paid) for this customer to calculate overall ledger
  const customerTransactions = transactions.filter(
    (tx) => tx.customerName === customerName
  );

  // Overall outstanding balance: sum of (total - paid) across all transactions
  const cumulativeDue = customerTransactions.reduce(
    (sum, tx) => sum + (tx.totalAmount - tx.amountPaid),
    0
  );

  // Unpaid or repaid transactions (non-zero net effect)
  const ledgerHistory = customerTransactions.filter(
    (tx) => tx.totalAmount - tx.amountPaid !== 0
  );
  
  // Count how many outstanding/repayment ledger activities exist
  const dueCount = ledgerHistory.length;
  
  // Credit Limit threshold check
  const CREDIT_LIMIT = 1000;
  const isLimitExceeded = status === "Due" && cumulativeDue > CREDIT_LIMIT;

  // Generate dynamic SMS draft based on overall/cumulative baki
  let dynamicSmsDraft = "";
  if (status === "Due") {
    dynamicSmsDraft = language === "bn"
      ? `${customerName} ভাই, সহজ হিসাব ডায়েরি থেকে বলছি। আপনার মোট বকেয়া (বাকি) ${cumulativeDue} টাকা। অনুগ্রহ করে পরিশোধ করবেন। ধন্যবাদ!`
      : `Dear ${customerName}, reminder from Shohoj Hisab. Your total outstanding due is ${cumulativeDue} ৳. Please settle at your earliest. Thank you!`;
  }

  // Net due for this specific card
  const netDueThisCard = totalAmount - amountPaid;

  return (
    <div className={`border-4 border-black p-5 mb-6 shadow-brutal relative select-none bg-white`}>
      {/* Credit Limit Alert Banner (Top of Card) */}
      {isLimitExceeded && (
        <div className="mb-4 bg-black text-white p-3 border-2 border-black flex items-start gap-2.5 animate-pulse">
          <AlertOctagon className="w-5 h-5 text-white shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-black tracking-tight uppercase leading-snug">
              {language === "bn"
                ? "⛔ বকেয়া সীমা অতিক্রম করেছে!"
                : "⛔ CREDIT LIMIT EXCEEDED!"}
            </p>
            <p className="text-xs font-semibold leading-tight mt-0.5 text-gray-200">
              {language === "bn"
                ? `কাস্টমার ${customerName} এর বকেয়া ${cumulativeDue} ৳ যা সীমা (${CREDIT_LIMIT} ৳) ছাড়িয়েছে। আর বাকি দেওয়া যাবে না।`
                : `Total dues are ${cumulativeDue} ৳ (Limit: ${CREDIT_LIMIT} ৳). Settle outstanding dues first.`}
            </p>
          </div>
        </div>
      )}

      {/* Receipt header */}
      <div className="flex items-start justify-between border-b-2 border-black pb-3 mb-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-black">
            {customerName}
          </h3>
          {phone && (
            <p className="text-xs font-mono text-gray-500 font-bold mt-0.5">
              {phone}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500 font-bold">
          <Calendar className="w-3.5 h-3.5 text-black" />
          <span>{date}</span>
        </div>
      </div>

      {/* Render items list if items exist */}
      {items && items.length > 0 && (
        <div className="space-y-2 mb-4">
          {items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-baseline text-sm">
              <div className="flex gap-2">
                <span className="font-semibold text-black">{item.name}</span>
                <span className="text-xs text-gray-500 font-bold">({item.qty})</span>
              </div>
              <span className="font-mono font-bold text-black">{item.price} ৳</span>
            </div>
          ))}
        </div>
      )}

      {/* Render repayment description if it's a cash repayment slip */}
      {(!items || items.length === 0) && amountPaid > 0 && (
        <div className="mb-4 text-sm font-bold text-gray-700 italic select-none">
          {language === "bn"
            ? "💸 বকেয়া পরিশোধ বাবদ নগদ ক্যাশ জমা"
            : "💸 Cash received for outstanding due settle"}
        </div>
      )}

      {/* Dashed line */}
      <div className="border-t border-dashed border-black my-3" />

      {/* Cost breakdown for this slip */}
      <div className="space-y-1.5 text-sm mb-4">
        <div className="flex justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase">
            {language === "bn" ? "মোট বিল:" : "Total Bill:"}
          </span>
          <span className="font-semibold">{totalAmount} ৳</span>
        </div>
        <div className="flex justify-between text-black">
          <span className="text-xs font-bold text-gray-500 uppercase">
            {language === "bn" ? "নগদ জমা:" : "Cash Paid:"}
          </span>
          <span className="font-semibold">{amountPaid} ৳</span>
        </div>
        {status === "Due" && (
          <div className="flex justify-between border-t border-black/10 pt-1 text-black">
            <span className="text-xs font-bold uppercase">
              {language === "bn" ? "রশিদ বাকি:" : "Slip Due:"}
            </span>
            <span className="font-bold font-mono">{netDueThisCard} ৳</span>
          </div>
        )}
      </div>

      {/* Date-wise breakdown history ledger box */}
      {status === "Due" && dueCount > 1 && (
        <div className="mb-4 border-2 border-black p-3 bg-gray-50 text-xs font-bold space-y-1">
          <div className="border-b-2 border-black pb-1 mb-1 text-gray-500 uppercase tracking-wider">
            {language === "bn" ? "অপরিশোধিত বকেয়া খতিয়ান" : "Unpaid Dues Ledger"}
          </div>
          {ledgerHistory.map((tx) => {
            const netEffect = tx.totalAmount - tx.amountPaid;
            return (
              <div key={tx.id} className="flex justify-between font-mono font-bold text-black">
                <span>
                  {tx.date}{" "}
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                    {netEffect < 0
                      ? (language === "bn" ? "(জমা)" : "(Repaid)")
                      : (language === "bn" ? "(বাকি)" : "(Due)")}
                  </span>
                </span>
                <span>
                  {netEffect < 0 ? "-" : "+"}
                  {Math.abs(netEffect)} ৳
                </span>
              </div>
            );
          })}
          <div className="border-t border-dashed border-black pt-1 flex justify-between font-black text-black">
            <span>{language === "bn" ? "মোট বকেয়া বাকি:" : "Overall Dues Balance:"}</span>
            <span className="font-mono">{cumulativeDue} ৳</span>
          </div>
        </div>
      )}

      {/* Dashed line */}
      {status === "Due" && dueCount > 1 && (
        <div className="border-t border-dashed border-black my-3" />
      )}

      {/* Bottom Summary: Status */}
      <div className="flex items-center justify-between">
        {/* Status Badge */}
        <div>
          {status === "Paid" ? (
            <span className="inline-flex items-center gap-1 bg-white text-black px-2.5 py-1 border-2 border-black font-bold text-xs uppercase">
              <Check className="w-3.5 h-3.5 stroke-[3px]" />
              {t("statusPaid")}
            </span>
          ) : (
            <span className="inline-flex items-center bg-black text-white px-2.5 py-1 border-2 border-black font-bold text-xs uppercase">
              {t("statusDue")}
            </span>
          )}
        </div>

        {/* Display overall remaining due or slip amount */}
        <div className="text-right">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 mr-2">
            {status === "Due"
              ? (language === "bn" ? "বাকি আছে:" : "Remaining:")
              : (language === "bn" ? "পরিশোধিত:" : "Paid Taka:")}
          </span>
          <span
            className={`font-mono text-lg font-black px-2 py-0.5 border-2 border-black ${
              status === "Due" ? "bg-black text-white" : "bg-white text-black"
            }`}
          >
            {status === "Due" ? cumulativeDue : totalAmount} ৳
          </span>
        </div>
      </div>

      {/* SMS Draft popup box if Due */}
      {status === "Due" && dynamicSmsDraft && (
        <SmsDraftBox smsText={dynamicSmsDraft} phone={phone} />
      )}
    </div>
  );
}
