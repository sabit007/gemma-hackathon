"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { Sparkles } from "lucide-react";

export default function SkeletonCard() {
  const { t } = useApp();

  return (
    <div className="border-4 border-black p-5 mb-6 bg-white shadow-brutal animate-pulse relative select-none">
      {/* Top Header skeleton */}
      <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
        <div className="space-y-2">
          <div className="h-5 w-28 bg-gray-200 border border-black" />
          <div className="h-3.5 w-20 bg-gray-200" />
        </div>
        <div className="h-4 w-24 bg-gray-200" />
      </div>

      {/* Items list skeleton */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <div className="h-4 w-40 bg-gray-200" />
          <div className="h-4 w-12 bg-gray-200" />
        </div>
        <div className="flex justify-between items-center">
          <div className="h-4 w-32 bg-gray-200" />
          <div className="h-4 w-12 bg-gray-200" />
        </div>
      </div>

      {/* Dashed line */}
      <div className="border-t border-dashed border-black my-3" />

      {/* EAI Processing Footer */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-black uppercase animate-bounce">
          <Sparkles className="w-4 h-4 text-black fill-black" />
          <span>{t("processingGemma")}</span>
        </div>
        <div className="h-8 w-20 bg-gray-200 border-2 border-black" />
      </div>
    </div>
  );
}
