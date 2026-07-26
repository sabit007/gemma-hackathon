"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { Languages, BookOpen } from "lucide-react";

export default function Navbar() {
  const { language, setLanguage, shopName, t } = useApp();

  const toggleLanguage = () => {
    setLanguage(language === "bn" ? "en" : "bn");
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b-4 border-black py-4 px-6 shadow-sm">
      <div className="max-w-lg mx-auto flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center gap-2 select-none">
          <div className="bg-black text-white p-1.5 border border-black">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-none tracking-tight">
              {shopName || t("title")}
            </h1>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest leading-none mt-0.5">
              {t("subtitle")}
            </p>
          </div>
        </div>

        {/* Language Pill Switch Button */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-black font-bold text-sm bg-white text-black hover:bg-black hover:text-white transition-all select-none cursor-pointer shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          <Languages className="w-4 h-4" />
          <span>{t("langSwitch")}</span>
        </button>
      </div>
    </header>
  );
}
