"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { Mic, MicOff, Lock, Unlock, Store, KeyRound, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";

export default function AuthScreen() {
  const {
    t,
    setShowAuth,
    shopName,
    setShopName,
    voicePin,
    setVoicePin,
    language
  } = useApp();

  // Mode: "setup" or "verify"
  const [mode, setMode] = useState<"setup" | "verify">("setup");
  const [shopNameInput, setShopNameInput] = useState("");
  const [voicePinInput, setVoicePinInput] = useState("");
  
  // Recording states for Setup inputs
  const [isRecordingName, setIsRecordingName] = useState(false);
  const [isRecordingPin, setIsRecordingPin] = useState(false);

  // Verification states
  const [authState, setAuthState] = useState<"idle" | "verifying" | "success" | "failed">("idle");
  const [spokenPin, setSpokenPin] = useState("");
  const [verificationInput, setVerificationInput] = useState(""); // manual backup typing
  const [isFading, setIsFading] = useState(false);

  // Speech Recognition instance references
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  // Check if credentials exist in MongoDB on mount
  const checkShopStatus = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/shop");
      if (response.ok) {
        const data = await response.json();
        if (data.exists) {
          setShopName(data.shop.name);
          setVoicePin(data.shop.voicePin);
          setMode("verify");
          return;
        }
      }
      throw new Error("No database shop found");
    } catch (err) {
      console.warn("Could not load shop from database, falling back to local credentials.", err);
      if (shopName && voicePin) {
        setMode("verify");
      } else {
        setMode("setup");
      }
    }
  };

  useEffect(() => {
    checkShopStatus();
  }, [shopName, voicePin]);

  // Normalize spoken numbers into standard english digit strings
  const normalizePin = (text: string) => {
    const bnDigits = { "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4", "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9" };
    const wordsMap: Record<string, string> = {
      "one": "1", "two": "2", "three": "3", "four": "4", "five": "5",
      "six": "6", "seven": "7", "eight": "8", "nine": "9", "zero": "0",
      "এক": "1", "দুই": "2", "তিন": "3", "চার": "4", "পাচ": "5", "পাঁচ": "5",
      "ছয়": "6", "সাত": "7", "আট": "8", "নয়": "9", "নয়": "9", "শূন্য": "0"
    };

    let clean = "";
    const tokens = text.toLowerCase().trim().replace(/[-\s]+/g, "");

    // 1. Direct character check
    for (const char of tokens) {
      if (char >= "0" && char <= "9") {
        clean += char;
      } else if (char in bnDigits) {
        clean += bnDigits[char as keyof typeof bnDigits];
      }
    }

    // 2. Word matching check if character check yields empty
    if (!clean) {
      // Split words and match
      const words = text.toLowerCase().split(/\s+/);
      words.forEach((w) => {
        const cleanedWord = w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
        if (cleanedWord in wordsMap) {
          clean += wordsMap[cleanedWord];
        }
      });
    }

    return clean || tokens; // fallback to raw string if no digits parsed
  };

  // Convert English digits to Bangla view for the ui display
  const convertDigitsToBn = (digits: string) => {
    const pinMapBn = { "0": "০", "1": "১", "2": "২", "3": "৩", "4": "৪", "5": "৫", "6": "৬", "7": "৭", "8": "৮", "9": "৯" };
    let display = "";
    for (const char of digits) {
      display += (pinMapBn as any)[char] || char;
    }
    return display;
  };

  // Start real browser speech transcription for Shop Name input
  const startVoiceShopName = () => {
    if (isRecordingName) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser. Please type manually.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = language === "bn" ? "bn-BD" : "en-US";
    rec.interimResults = false;

    rec.onstart = () => {
      setIsRecordingName(true);
      setShopNameInput("");
    };

    rec.onresult = (event: any) => {
      const resultText = event.results[0][0].transcript;
      setShopNameInput(resultText);
    };

    rec.onend = () => {
      setIsRecordingName(false);
    };

    rec.onerror = (e: any) => {
      console.error(e);
      setIsRecordingName(false);
    };

    rec.start();
  };

  // Start real browser speech transcription for Voice PIN input
  const startVoicePin = () => {
    if (isRecordingPin) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser. Please type manually.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = language === "bn" ? "bn-BD" : "en-US";
    rec.interimResults = false;

    rec.onstart = () => {
      setIsRecordingPin(true);
      setVoicePinInput("");
    };

    rec.onresult = (event: any) => {
      const resultText = event.results[0][0].transcript;
      const normalized = normalizePin(resultText);
      const displayPin = convertDigitsToBn(normalized);
      setVoicePinInput(displayPin);
    };

    rec.onend = () => {
      setIsRecordingPin(false);
    };

    rec.onerror = (e: any) => {
      console.error(e);
      setIsRecordingPin(false);
    };

    rec.start();
  };

  // Handle saving the setup profile in MongoDB and local context
  const handleSaveSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopNameInput.trim() || !voicePinInput.trim()) return;

    const cleanPin = normalizePin(voicePinInput.trim());

    try {
      const response = await fetch("http://localhost:5000/api/shop/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: shopNameInput.trim(), voicePin: cleanPin }),
      });

      if (response.ok) {
        const data = await response.json();
        setShopName(data.shop.name);
        setVoicePin(data.shop.voicePin);
        setMode("verify");
        setAuthState("idle");
        setVerificationInput("");
        setSpokenPin("");
        return;
      }
      throw new Error("Database register failed");
    } catch (err) {
      console.warn("Backend register failed. Saving profile locally (offline mode).", err);
      setShopName(shopNameInput.trim());
      setVoicePin(cleanPin);
      setMode("verify");
      setAuthState("idle");
      setVerificationInput("");
      setSpokenPin("");
    }
  };

  // Verify Voice Spoken PIN using ACTUAL browser Speech Recognition
  const handleVerifyVoice = () => {
    if (authState === "verifying") return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser. Please use the backup PIN typist.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = language === "bn" ? "bn-BD" : "en-US";
    rec.interimResults = false;

    rec.onstart = () => {
      setAuthState("verifying");
      setSpokenPin("");
    };

    rec.onresult = async (event: any) => {
      const resultText = event.results[0][0].transcript;
      const parsedSpokenPin = normalizePin(resultText);
      const displaySpoken = convertDigitsToBn(parsedSpokenPin);
      
      setSpokenPin(displaySpoken);

      try {
        const response = await fetch("http://localhost:5000/api/shop/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ voicePin: parsedSpokenPin }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setAuthState("success");
            setTimeout(() => {
              setIsFading(true);
              setTimeout(() => {
                setShowAuth(false);
              }, 300);
            }, 1000);
            return;
          }
        }
        throw new Error("Verification check failed");
      } catch (err) {
        console.warn("Database verification failed. Validating offline.", err);
        if (parsedSpokenPin === voicePin) {
          setAuthState("success");
          setTimeout(() => {
            setIsFading(true);
            setTimeout(() => {
              setShowAuth(false);
            }, 300);
          }, 1000);
        } else {
          setAuthState("failed");
          setTimeout(() => {
            setAuthState("idle");
          }, 2500);
        }
      }
    };

    rec.onend = () => {
      // If no result was parsed, reset state back to idle
      setAuthState((prev) => (prev === "verifying" ? "idle" : prev));
    };

    rec.onerror = (e: any) => {
      console.error(e);
      setAuthState("failed");
      setTimeout(() => {
        setAuthState("idle");
      }, 2000);
    };

    rec.start();
  };

  // Verify manual backup typed PIN
  const handleManualVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationInput.trim()) return;

    const cleanInput = normalizePin(verificationInput.trim());

    try {
      const response = await fetch("http://localhost:5000/api/shop/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voicePin: cleanInput }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAuthState("success");
          setTimeout(() => {
            setIsFading(true);
            setTimeout(() => {
              setShowAuth(false);
            }, 300);
          }, 800);
          return;
        }
      }
      throw new Error("Verification failed");
    } catch (err) {
      console.warn("Database manual verification failed. Validating offline.", err);
      if (cleanInput === voicePin) {
        setAuthState("success");
        setTimeout(() => {
          setIsFading(true);
          setTimeout(() => {
            setShowAuth(false);
          }, 300);
        }, 800);
      } else {
        setAuthState("failed");
        setVerificationInput("");
        setTimeout(() => {
          setAuthState("idle");
        }, 2000);
      }
    }
  };

  const handleResetProfile = () => {
    if (confirm(language === "bn" ? "আপনি কি আপনার ভয়েস প্রোফাইল মুছে নতুন করে সেটআপ করতে চান?" : "Are you sure you want to delete and reset your voice profile?")) {
      setShopName("");
      setVoicePin("");
      setShopNameInput("");
      setVoicePinInput("");
      setMode("setup");
      setAuthState("idle");
      setVerificationInput("");
      setSpokenPin("");
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-white p-6 transition-opacity duration-300 ${
        isFading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="w-full max-w-md border-4 border-black p-8 bg-white shadow-brutal flex flex-col items-center select-none">
        
        {/* Setup Screen Mode */}
        {mode === "setup" ? (
          <div className="w-full flex flex-col items-center">
            {/* Header Badge */}
            <div className="mb-4 p-3 border-2 border-black bg-black text-white rounded-none">
              <Store className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-black text-black text-center mb-1 uppercase tracking-tight">
              {language === "bn" ? "ভয়েস প্রোফাইল সেটআপ" : "Voice Profile Setup"}
            </h2>
            <p className="text-xs font-bold text-gray-500 mb-6 uppercase tracking-wider text-center border-b-2 border-black pb-3 w-full">
              {language === "bn" ? "দোকানের নাম ও ভয়েস পিন রেকর্ড করুন" : "Set up Shop credentials by voice"}
            </p>

            <form onSubmit={handleSaveSetup} className="w-full space-y-5">
              {/* Shop Name Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-black block">
                  {language === "bn" ? "১. দোকানের নাম বলুন বা লিখুন:" : "1. Say or Type Shop Name:"}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={shopNameInput}
                    onChange={(e) => setShopNameInput(e.target.value)}
                    placeholder={language === "bn" ? "যেমন: রহিম স্টোর" : "e.g. Rahim Store"}
                    className="flex-1 border-4 border-black px-3 py-2 bg-white font-bold text-sm focus:outline-none focus:bg-gray-100"
                  />
                  <button
                    type="button"
                    onClick={startVoiceShopName}
                    className={`border-4 border-black p-2 font-bold transition-all active:scale-95 cursor-pointer shadow-brutal-sm ${
                      isRecordingName ? "bg-red-600 text-white animate-pulse" : "bg-white text-black hover:bg-gray-100"
                    }`}
                  >
                    <Mic className="w-5 h-5 stroke-[2.5]" />
                  </button>
                </div>
                {isRecordingName && (
                  <p className="text-[10px] font-bold text-red-600 animate-pulse">
                    ● {language === "bn" ? "দোকানের নাম শুনছি..." : "Listening to shop name..."}
                  </p>
                )}
              </div>

              {/* Spoken Voice PIN Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-black block">
                  {language === "bn" ? "২. ভয়েস পিন বলুন বা লিখুন (৪ সংখ্যা):" : "2. Say or Type Voice PIN (4 digits):"}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={voicePinInput}
                    onChange={(e) => setVoicePinInput(e.target.value)}
                    placeholder={language === "bn" ? "যেমন: ১২৩৪" : "e.g. 1234"}
                    className="flex-1 border-4 border-black px-3 py-2 bg-white font-bold text-sm focus:outline-none focus:bg-gray-100 font-mono"
                  />
                  <button
                    type="button"
                    onClick={startVoicePin}
                    className={`border-4 border-black p-2 font-bold transition-all active:scale-95 cursor-pointer shadow-brutal-sm ${
                      isRecordingPin ? "bg-red-600 text-white animate-pulse" : "bg-white text-black hover:bg-gray-100"
                    }`}
                  >
                    <Mic className="w-5 h-5 stroke-[2.5]" />
                  </button>
                </div>
                {isRecordingPin && (
                  <p className="text-[10px] font-bold text-red-600 animate-pulse">
                    ● {language === "bn" ? "ভয়েস পিন শুনছি..." : "Listening to voice PIN..."}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 border-4 border-black bg-black text-white font-bold text-md uppercase hover:bg-white hover:text-black transition-colors shadow-brutal cursor-pointer active:translate-x-1 active:translate-y-1 active:shadow-none mt-2"
              >
                {language === "bn" ? "ভয়েস প্রোফাইল সেভ করুন" : "Save Voice Profile"}
              </button>
            </form>
          </div>
        ) : (
          /* Verification Screen Mode */
          <div className="w-full flex flex-col items-center">
            {/* Header Lock Badge */}
            <div className="mb-4 p-3 border-2 border-black bg-black text-white rounded-none">
              {authState === "success" ? (
                <ShieldCheck className="w-8 h-8" />
              ) : authState === "failed" ? (
                <XCircle className="w-8 h-8 text-red-500" />
              ) : authState === "verifying" ? (
                <Mic className="w-8 h-8 animate-bounce" />
              ) : (
                <Lock className="w-8 h-8" />
              )}
            </div>

            <h2 className="text-xl font-bold text-black uppercase tracking-tight text-center">
              {shopName}
            </h2>
            <p className="text-xs font-semibold text-gray-500 mb-6 uppercase tracking-wider text-center border-b-2 border-black pb-3 w-full">
              {language === "bn" ? "কণ্ঠস্বর যাচাই করুন" : "Voice security lock"}
            </p>

            <div className="w-full space-y-6 flex flex-col items-center text-center">
              {/* Visual Prompt */}
              <p className="text-sm font-bold text-gray-700 min-h-[20px]">
                {authState === "verifying" && t("matchingVoice")}
                {authState === "success" && t("voiceVerified")}
                {authState === "failed" && (language === "bn" ? "ভয়েস পিন মেলেনি! আবার চেষ্টা করুন।" : "PIN Mismatched! Try again.")}
                {authState === "idle" && (language === "bn" ? `ভয়েস পিন (${voicePin}) বলুন` : `Speak Voice PIN (${voicePin})`)}
              </p>

              {/* Large floating mic button */}
              <div className="relative flex items-center justify-center p-3 select-none">
                {authState === "verifying" && (
                  <>
                    <div className="absolute w-28 h-28 rounded-full border-4 border-black animate-ping opacity-25" />
                    <div className="absolute w-24 h-24 rounded-full border-4 border-black animate-ping opacity-45 delay-100" />
                  </>
                )}
                <button
                  onClick={handleVerifyVoice}
                  disabled={authState === "verifying" || authState === "success"}
                  className={`rounded-full p-6 border-4 border-black transition-all active:scale-95 cursor-pointer shadow-brutal ${
                    authState === "verifying" ? "bg-white text-black" : "bg-black text-white hover:bg-white hover:text-black"
                  }`}
                >
                  <Mic className="w-8 h-8 stroke-[2.5]" />
                </button>
              </div>

              {/* Show spoken text transcription */}
              {spokenPin && (
                <div className="border-2 border-black p-2 bg-gray-50 font-black text-sm select-none animate-bounce">
                  {language === "bn" ? "কথিত পিন:" : "Spoken PIN:"} "{spokenPin}"
                </div>
              )}

              {/* Manual Backup Input Form */}
              <div className="w-full border-t border-dashed border-black pt-4">
                <form onSubmit={handleManualVerifySubmit} className="flex gap-2">
                  <input
                    type="password"
                    pattern="[0-9০-৯]*"
                    maxLength={10}
                    value={verificationInput}
                    onChange={(e) => setVerificationInput(e.target.value)}
                    disabled={authState === "verifying" || authState === "success"}
                    placeholder={language === "bn" ? "বিকল্প: এখানে পিন টাইপ করুন" : "Backup: Type PIN here"}
                    className="flex-1 border-4 border-black px-3 py-2 bg-white font-mono font-bold text-sm focus:outline-none focus:bg-gray-100"
                  />
                  <button
                    type="submit"
                    disabled={!verificationInput.trim() || authState === "verifying" || authState === "success"}
                    className="border-4 border-black bg-black text-white px-4 py-2 font-bold text-sm uppercase transition-all select-none cursor-pointer active:translate-x-0.5 active:translate-y-0.5 active:shadow-none hover:bg-white hover:text-black disabled:opacity-55 disabled:cursor-not-allowed"
                  >
                    OK
                  </button>
                </form>
              </div>

              {/* Reset credentials shortcut */}
              <button
                onClick={handleResetProfile}
                className="text-xs font-bold text-gray-400 hover:text-black uppercase tracking-wider underline cursor-pointer mt-2 select-none"
              >
                {language === "bn" ? "রিসেট প্রোফাইল" : "Reset Profile"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
