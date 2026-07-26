"use client";

import React, { useState, useEffect, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { Mic, MicOff, Check, X } from "lucide-react";

export default function VoiceInputPad() {
  const {
    language,
    t,
    isRecording,
    setIsRecording,
    isProcessing,
    setIsProcessing,
    transactions,
    addTransaction,
    parseAndAddTransaction,
    saveExternalParsedTransaction,
  } = useApp();

  const [inputText, setInputText] = useState("");
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [speechRecognition, setSpeechRecognition] = useState<any>(null);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [originalSpeechText, setOriginalSpeechText] = useState(""); // to check if edited
  const [pendingExternalData, setPendingExternalData] = useState<any>(null);

  // Reference to keep track of the latest transcript text to avoid React stale closure in async handlers
  const inputTextRef = useRef("");
  useEffect(() => {
    inputTextRef.current = inputText;
  }, [inputText]);

  // Predefined voice prompts simulating transcription for fallback/mock
  const voicePromptsBn = [
    "রহিম মিয়াকে ৫৫০ টাকার ডাল আর আলু দিলাম বাকি",
    "করিম ভাইকে ৩ কেজি চাল দিলাম ৩২০ টাকা, ১০০ টাকা ক্যাশ দিল",
    "আজিম হোসেন ডিম আর আটা নিল জমা ৩৫০ টাকা",
    "হাসান মিয়াকে ৮৫০ টাকার সদাই দিলাম, ২০০ টাকা দিল বাকি ৬৫০",
    "সবুজ ভাই ১০০ টাকা ক্যাশ জমা দিল"
  ];

  const voicePromptsEn = [
    "Gave 550 Taka due to Rahim Mia for lentils",
    "Gave 3kg rice to Karim 320 Taka, paid 100 cash",
    "Azim paid 350 oil"
  ];

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language === "bn" ? "bn-BD" : "en-US";

        recognition.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript.trim()) {
            setInputText(currentTranscript);
            setOriginalSpeechText(currentTranscript);
          }
        };

        recognition.onerror = (e: any) => {
          console.warn("Web Speech API recognition error:", e);
        };

        setSpeechRecognition(recognition);
      }
    }
  }, [language]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: "audio/webm" };
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (e) {
        recorder = new MediaRecorder(stream);
      }

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        setRecordedAudioBlob(audioBlob);
        
        // Turn off mic tracks
        stream.getTracks().forEach((track) => track.stop());

        // Immediately upload to ngrok API to get the transcript BEFORE user confirms
        fetchTranscriptFromAudio(audioBlob);
      };

      setMediaRecorder(recorder);
      setRecordedAudioBlob(null);
      setOriginalSpeechText("");

      if (speechRecognition) {
        try {
          speechRecognition.start();
        } catch (e) {
          console.warn("Speech recognition already running", e);
        }
      }

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.warn("Microphone access denied. Falling back to voice simulation.", err);
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (speechRecognition) {
      try {
        speechRecognition.stop();
      } catch (e) {
        console.warn("Failed to stop speech recognition", e);
      }
    }

    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      setIsRecording(false);
    } else {
      // Fallback mock recording stop
      setIsRecording(false);
      handleMockMicStop();
    }
  };

  const handleMockMicStop = () => {
    const prompts = language === "bn" ? voicePromptsBn : voicePromptsEn;
    const transcriptText = prompts[Math.floor(Math.random() * prompts.length)];
    setInputText(transcriptText);
    setOriginalSpeechText(transcriptText);
  };

  const handleMicToggle = () => {
    if (isProcessing) return;

    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  // Upload original audio blob to ngrok API to just get transcript/parsed data
  const fetchTranscriptFromAudio = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("file", blob, "audio.webm");

      const response = await fetch("https://reptile-sadden-eastbound.ngrok-free.dev/process-sale", {
        method: "POST",
        headers: {
          "X-API-Key": "gemma-hackathon-2026-secret",
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server returned status code: ${response.status}`);
      }

      const result = await response.json();
      console.log("External API Parse result:", result);
      
      const transcript = result.transcript || result.text || result.rawTranscript;
      if (transcript) {
        setInputText(transcript);
        setOriginalSpeechText(transcript);
      }
      
      setPendingExternalData(result);
    } catch (err) {
      console.warn("External transcription server failed.", err);
      // Let the Web Speech API transcript remain if external API fails
    } finally {
      setIsProcessing(false);
    }
  };

  // Triggered when user clicks "Accept" (Submit form)
  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isProcessing) return;

    // If external data is ready and the user hasn't edited the transcript, we use the external data
    if (pendingExternalData && inputText.trim() === originalSpeechText.trim()) {
      await saveExternalParsedTransaction(pendingExternalData);
    } else {
      // Otherwise, parse the text directly via our backend (allows manual edits review)
      setIsProcessing(true);
      await parseAndAddTransaction(inputText);
      setIsProcessing(false);
    }

    setInputText("");
    setRecordedAudioBlob(null);
    setPendingExternalData(null);
  };

  const handleClear = () => {
    setInputText("");
    setRecordedAudioBlob(null);
    setOriginalSpeechText("");
    setPendingExternalData(null);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-4 border-black p-4 max-w-lg mx-auto shadow-[0_-8px_30px_rgba(0,0,0,0.12)] pt-12">
      <div className="flex flex-col gap-3">
        {/* Floating Action control row */}
        <div className="flex items-center justify-center relative h-10">
          <div className="absolute -top-16 flex items-center justify-center">
            {/* Pulsing Ripple Rings when Recording */}
            {isRecording && (
              <>
                <div className="absolute w-32 h-32 rounded-full border-4 border-black animate-ping opacity-25" />
                <div className="absolute w-28 h-28 rounded-full border-4 border-black animate-ping opacity-45 delay-100" />
              </>
            )}

            {/* Big Mic Button */}
            <button
              onClick={handleMicToggle}
              disabled={isProcessing}
              className={`z-10 rounded-full p-8 border-4 border-black transition-all active:scale-95 cursor-pointer shadow-brutal select-none ${
                isRecording
                  ? "bg-white text-black hover:bg-black hover:text-white"
                  : "bg-black text-white hover:bg-white hover:text-black"
              }`}
            >
              {isRecording ? (
                <MicOff className="w-10 h-10 stroke-[2.5]" />
              ) : (
                <Mic className="w-10 h-10 stroke-[2.5]" />
              )}
            </button>
          </div>
        </div>

        {/* Helper Mic status banner */}
        <div className="text-center mt-2">
          <p className="text-xs font-bold uppercase tracking-wider text-black select-none">
            {isRecording ? (
              <span className="text-red-600 animate-pulse flex items-center justify-center gap-1.5">
                ● শুনছি... কথা বলা শেষ হলে বোতামে আবার চাপুন
              </span>
            ) : (
              t("speakHint")
            )}
          </p>
        </div>

        {/* Text review / manual entry box with Accept button */}
        <form onSubmit={handleSubmitTransaction} className="flex flex-col gap-2 mt-1">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isProcessing || isRecording}
              placeholder={t("textPlaceholder")}
              className="flex-1 min-w-0 border-4 border-black px-3 py-2 bg-white text-black font-semibold text-sm rounded-none focus:outline-none focus:bg-gray-100 placeholder-gray-500"
            />
            {inputText.trim() && (
              <button
                type="button"
                onClick={handleClear}
                disabled={isProcessing || isRecording}
                className="border-4 border-black bg-white text-black px-3 py-2 font-bold transition-all select-none cursor-pointer active:translate-x-0.5 active:translate-y-0.5 hover:bg-black hover:text-white"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>

          {/* Elevated Confirm / Accept Button shown when text is captured */}
          {inputText.trim() && !isRecording && (
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full border-4 border-black bg-black text-white py-3.5 font-bold text-sm uppercase flex items-center justify-center gap-2 transition-all select-none cursor-pointer shadow-brutal active:translate-x-1 active:translate-y-1 active:shadow-none hover:bg-white hover:text-black"
            >
              <Check className="w-5 h-5 stroke-[3]" />
              <span>
                {language === "bn" ? "লেনদেন নিশ্চিত করুন" : "Accept Transaction"}
              </span>
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
