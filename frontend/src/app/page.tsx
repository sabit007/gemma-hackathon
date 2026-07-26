"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import AuthScreen from "@/components/AuthScreen";
import Navbar from "@/components/Navbar";
import LedgerBoard from "@/components/LedgerBoard";
import VoiceInputPad from "@/components/VoiceInputPad";
import InsightsBottomSheet from "@/components/InsightsBottomSheet";

export default function Home() {
  const { showAuth } = useApp();

  return (
    <>
      {showAuth && <AuthScreen />}
      <div className="flex flex-col min-h-screen bg-white text-black font-sans pb-32">
        <Navbar />
        <main className="flex-1 max-w-lg w-full mx-auto px-4 py-6">
          <LedgerBoard />
        </main>
        <VoiceInputPad />
        <InsightsBottomSheet />
      </div>
    </>
  );
}
