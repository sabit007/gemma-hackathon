"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Copy, Check, Send } from "lucide-react";

interface SmsDraftBoxProps {
  smsText: string;
  phone?: string;
}

export default function SmsDraftBox({ smsText, phone }: SmsDraftBoxProps) {
  const { t } = useApp();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(smsText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy text", err);
    }
  };

  const handleSend = () => {
    // Generate sms: link
    const cleanPhone = phone ? phone.replace(/[^0-9+]/g, "") : "";
    const encodedText = encodeURIComponent(smsText);
    const smsUrl = `sms:${cleanPhone}?body=${encodedText}`;
    window.open(smsUrl, "_blank");
  };

  if (!smsText) return null;

  return (
    <div className="border-t-2 border-dashed border-black mt-4 pt-4 select-none">
      <div className="bg-gray-50 border-2 border-black p-3 shadow-sm flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            {t("smsDraftTitle")}
          </span>
          {phone && (
            <span className="text-xs font-mono font-bold bg-black text-white px-1.5 py-0.5">
              {phone}
            </span>
          )}
        </div>
        
        <p className="text-sm font-semibold italic text-black break-words bg-white p-2 border border-black">
          "{smsText}"
        </p>

        <div className="flex gap-2 justify-end mt-1">
          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 border-2 border-black text-xs font-bold transition-all select-none cursor-pointer active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${
              copied
                ? "bg-black text-white"
                : "bg-white text-black hover:bg-gray-100 shadow-brutal-sm"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{t("smsCopied")}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>কপি করুন</span>
              </>
            )}
          </button>

          {/* Send Button */}
          <button
            onClick={handleSend}
            className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-black text-xs font-bold bg-black text-white hover:bg-white hover:text-black transition-all select-none cursor-pointer shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{t("smsSend")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
