
"use client";

import { useState, useRef, useEffect } from "react";
import WaveformVisualizer from "@/components/WaveformVisualizer";
import dynamic from "next/dynamic";
const ChatInterface = dynamic(() => import("@/components/ChatInterface"), { ssr: false });
import type { Message } from "@/components/ChatInterface";

export default function Home() {
  // Force dark mode on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.classList.add("dark");
    }
  }, []);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputMode, setInputMode] = useState<"text" | "voice">("text");
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState<string>("");
  const [ttsRate, setTtsRate] = useState(1);
  const [ttsPitch, setTtsPitch] = useState(1);
  const [ttsVolume, setTtsVolume] = useState(1);
  const [ttsVoice, setTtsVoice] = useState<string>("");

  // Send message to bot via HTTP POST
  const handleSend = async (msg: string) => {
    setMessages((prev) => [...prev, { sender: "user", text: msg }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      if (data.response) {
        setMessages((prev) => [...prev, { sender: "bot", text: data.response }]);
      } else {
        setMessages((prev) => [...prev, { sender: "bot", text: data.error || "Error from API" }]);
      }
    } catch (err: any) {
      setMessages((prev) => [...prev, { sender: "bot", text: err.message || "Network error" }]);
    }
    setLoading(false);
  };

  // Voice input (speech-to-text)
  const recognitionRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<any>(null);
  const ttsUtteranceRef = useRef<any>(null);

  // Helper: Start silence timer
  const startSilenceTimer = () => {
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    silenceTimeoutRef.current = setTimeout(() => {
      if (interimText.trim()) {
        handleSend(interimText.trim());
        setInterimText("");
      }
      setIsRecording(false);
    }, 4000);
  };

  // Helper: Stop silence timer
  const stopSilenceTimer = () => {
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
  };

  // Start voice recording
  const onStartVoice = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition not supported');
      return;
    }
    setIsRecording(true);
    setInterimText("");
    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = 0; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      setInterimText(interim);
      if (interim) startSilenceTimer();
      if (final) {
        setInterimText("");
        stopSilenceTimer();
        handleSend(final);
        setIsRecording(false);
      }
    };
    recognition.onerror = () => {
      setIsRecording(false);
      setInterimText("");
      stopSilenceTimer();
    };
    recognition.onend = () => {
      setIsRecording(false);
      setInterimText("");
      stopSilenceTimer();
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  // Stop voice recording
  const onStopVoice = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
    setInterimText("");
    stopSilenceTimer();
  };

  // TTS: Speak text with controls
  // Helper to restart TTS with new settings if changed during playback
  const restartTTS = () => {
    if (!ttsUtteranceRef.current) return;
    const utter = ttsUtteranceRef.current;
    const text = utter.text;
    const voiceName = utter.voice?.name;
    window.speechSynthesis.cancel();
    speak(text, voiceName);
  };

  const speak = (text: string, voiceName?: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new window.SpeechSynthesisUtterance(text);
    utter.rate = ttsRate;
    utter.pitch = ttsPitch;
    utter.volume = ttsVolume;
    if (voiceName) {
      const voices = window.speechSynthesis.getVoices();
      const match = voices.find(v => v.name === voiceName);
      if (match) utter.voice = match;
    }
    utter.onend = () => {
      // After TTS finishes, auto-start mic only if in voice mode
      if (inputMode === "voice") {
        onStartVoice();
      }
    };
    ttsUtteranceRef.current = utter;
    window.speechSynthesis.speak(utter);
  };

  // Watch for live changes to ttsRate/ttsPitch/ttsVolume/ttsVoice and restart TTS if speaking
  useEffect(() => {
    if (window.speechSynthesis && window.speechSynthesis.speaking && ttsUtteranceRef.current) {
      restartTTS();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ttsRate, ttsPitch, ttsVolume, ttsVoice]);

  // If user interacts with input, stop recording
  const onUserInput = () => {
    if (isRecording) onStopVoice();
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-white dark:bg-[#09090b] transition-colors duration-300">
      <h1 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">Conversational Bot</h1>
      {isRecording && <WaveformVisualizer isRecording={isRecording} />}
      <div className="flex gap-4 mb-2 items-end">
        <label className="text-xs text-zinc-500 flex flex-col items-start">
          TTS Speed
          <div className="flex items-center gap-2">
            <input type="range" min="0.5" max="2" step="0.1" value={ttsRate} onChange={e => setTtsRate(Number(e.target.value))} />
            <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300 w-8 text-right">{ttsRate.toFixed(1)}</span>
          </div>
        </label>
        <label className="text-xs text-zinc-500 flex flex-col items-start">
          Pitch
          <div className="flex items-center gap-2">
            <input type="range" min="0" max="2" step="0.1" value={ttsPitch} onChange={e => setTtsPitch(Number(e.target.value))} />
            <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300 w-8 text-right">{ttsPitch.toFixed(1)}</span>
          </div>
        </label>
        <label className="text-xs text-zinc-500 flex flex-col items-start">
          Volume
          <div className="flex items-center gap-2">
            <input type="range" min="0" max="1" step="0.05" value={ttsVolume} onChange={e => setTtsVolume(Number(e.target.value))} />
            <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300 w-8 text-right">{ttsVolume.toFixed(2)}</span>
          </div>
        </label>
      </div>
      <ChatInterface
        onSend={handleSend}
        messages={messages}
        loading={loading}
        inputMode={inputMode}
        setInputMode={setInputMode}
        onStartVoice={onStartVoice}
        onStopVoice={onStopVoice}
        isRecording={isRecording}
        interimText={interimText}
        ttsRate={ttsRate}
        ttsPitch={ttsPitch}
        ttsVolume={ttsVolume}
        ttsVoice={ttsVoice}
        setTtsVoice={setTtsVoice}
        speak={speak}
        onUserInput={onUserInput}
      />
    </main>
  );
}
