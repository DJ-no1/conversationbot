
"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
const ChatInterface = dynamic(() => import("@/components/ChatInterface"), { ssr: false });
import type { Message } from "@/components/ChatInterface";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputMode, setInputMode] = useState<"text" | "voice">("text");
  const [isRecording, setIsRecording] = useState(false);

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
  const onStartVoice = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition not supported');
      return;
    }
    setIsRecording(true);
    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      handleSend(transcript);
      setIsRecording(false);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
  };
  const onStopVoice = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">Conversational Bot</h1>
      <ChatInterface
        onSend={handleSend}
        messages={messages}
        loading={loading}
        inputMode={inputMode}
        setInputMode={setInputMode}
        onStartVoice={onStartVoice}
        onStopVoice={onStopVoice}
        isRecording={isRecording}
      />
    </main>
  );
}
