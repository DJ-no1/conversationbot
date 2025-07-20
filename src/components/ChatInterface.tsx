"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

export type Message = {
    sender: "user" | "bot";
    text: string;
};

export default function ChatInterface({
    onSend,
    messages,
    loading,
    inputMode,
    setInputMode,
    onStartVoice,
    onStopVoice,
    isRecording,
    interimText,
    ttsRate = 1,
    ttsPitch = 1,
    ttsVolume = 1,
    ttsVoice = "",
    // setTtsVoice,
    speak,
    onUserInput,
}: {
    onSend: (msg: string) => void;
    messages: Message[];
    loading: boolean;
    inputMode: "text" | "voice";
    setInputMode: (mode: "text" | "voice") => void;
    onStartVoice: () => void;
    onStopVoice: () => void;
    isRecording: boolean;
    interimText?: string;
    ttsRate?: number;
    ttsPitch?: number;
    ttsVolume?: number;
    ttsVoice?: string;
    setTtsVoice?: (voice: string) => void;
    speak?: (text: string, voiceName?: string) => void;
    onUserInput?: () => void;
}) {
    const [input, setInput] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    // Always use useState for selectedVoice, sync with props if provided
    const [selectedVoice, setSelectedVoice] = useState<string>(ttsVoice || "");

    // Keep selectedVoice in sync with ttsVoice prop if it changes
    useEffect(() => {
        if (ttsVoice && ttsVoice !== selectedVoice) {
            setSelectedVoice(ttsVoice);
        }
    }, [ttsVoice, selectedVoice]);

    // Load available voices
    useEffect(() => {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
            const populateVoices = () => {
                const v = window.speechSynthesis.getVoices();
                setVoices(v);
                if (v.length && !selectedVoice) {
                    setSelectedVoice(v[0].name);
                }
            };
            populateVoices();
            window.speechSynthesis.onvoiceschanged = populateVoices;
        }
    }, [selectedVoice]);

    // Text-to-speech for bot messages
    // Track last spoken message index to avoid TTS loop
    const lastSpokenIndex = useRef(-1);
    useEffect(() => {
        if (messages.length === 0) return;
        const lastMsg = messages[messages.length - 1];
        if (
            lastMsg.sender === "bot" &&
            typeof window !== "undefined" &&
            "speechSynthesis" in window &&
            messages.length - 1 !== lastSpokenIndex.current
        ) {
            window.speechSynthesis.cancel();
            if (speak) {
                speak(lastMsg.text, selectedVoice);
            } else {
                const utter = new window.SpeechSynthesisUtterance(lastMsg.text);
                utter.lang = "en-US";
                utter.rate = ttsRate;
                utter.pitch = ttsPitch;
                utter.volume = ttsVolume;
                const voice = voices.find(v => v.name === selectedVoice);
                if (voice) utter.voice = voice;
                window.speechSynthesis.speak(utter);
            }
            lastSpokenIndex.current = messages.length - 1;
        }
    }, [messages, voices, selectedVoice, ttsRate, ttsPitch, ttsVolume, speak]);

    const handleSend = () => {
        if (input.trim()) {
            onSend(input);
            setInput("");
        }
    };

    useEffect(() => {
        if (inputMode === "text" && inputRef.current) {
            inputRef.current.focus();
        }
    }, [inputMode]);

    return (
        <div className="w-full max-w-xl mx-auto flex flex-col gap-4 dark:bg-[#18181b] bg-white p-6 rounded-lg shadow-lg transition-colors duration-300">
            <div className="flex justify-between items-center mb-2">
                <div className="flex gap-2">
                    <Button
                        variant={inputMode === "text" ? "default" : "outline"}
                        onClick={() => setInputMode("text")}
                        className="dark:bg-zinc-800 dark:text-white dark:border-zinc-700"
                    >
                        Text
                    </Button>
                    <Button
                        variant={inputMode === "voice" ? "default" : "outline"}
                        onClick={() => setInputMode("voice")}
                        className="dark:bg-zinc-800 dark:text-white dark:border-zinc-700"
                    >
                        Voice
                    </Button>
                </div>
                {/* Voice selection dropdown */}
                <div className="flex items-center gap-2">
                    <label htmlFor="voice-select" className="text-xs text-zinc-400 dark:text-zinc-300">TTS Voice:</label>
                    <select
                        id="voice-select"
                        className="text-xs rounded border px-2 py-1 dark:bg-zinc-800 dark:text-white dark:border-zinc-700"
                        value={selectedVoice}
                        onChange={e => {
                            setSelectedVoice(e.target.value);
                            // Speak the last bot message again with the new voice
                            if (messages.length > 0) {
                                const lastMsg = messages[messages.length - 1];
                                if (lastMsg.sender === "bot" && speak) {
                                    speak(lastMsg.text, e.target.value);
                                }
                            }
                        }}
                    >
                        {voices.map((voice) => (
                            <option key={voice.name} value={voice.name}>
                                {voice.name} {voice.lang ? `(${voice.lang})` : ""}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="bg-zinc-900 dark:bg-zinc-900 rounded-lg p-4 h-80 overflow-y-auto flex flex-col gap-2 border border-zinc-800">
                {messages.length === 0 && !interimText && (
                    <div className="text-zinc-400 text-center">No messages yet.</div>
                )}
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`rounded-lg px-3 py-2 max-w-xs break-words text-sm shadow-sm ${msg.sender === "user"
                                ? "bg-blue-600 text-white"
                                : "bg-zinc-800 text-zinc-100 border border-zinc-700"
                                }`}
                        >
                            {msg.text}
                        </div>
                    </div>
                ))}
                {/* Show interim streaming text if available */}
                {interimText && (
                    <div className="flex justify-start">
                        <div className="rounded-lg px-3 py-2 max-w-xs break-words text-sm shadow-sm bg-zinc-700 text-zinc-200 border border-zinc-600 opacity-80 animate-pulse">
                            {interimText}
                        </div>
                    </div>
                )}
            </div>
            {inputMode === "text" ? (
                <div className="flex gap-2">
                    <input
                        ref={inputRef}
                        className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring dark:bg-zinc-800 dark:text-white dark:border-zinc-700"
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === "Enter") handleSend();
                        }}
                        placeholder="Type your message..."
                        disabled={loading}
                        onFocus={onUserInput}
                        onClick={onUserInput}
                    />
                    <Button onClick={handleSend} disabled={loading || !input.trim()} className="dark:bg-blue-700 dark:text-white">
                        Send
                    </Button>
                </div>
            ) : (
                <div className="flex gap-2 items-center">
                    <Button
                        onClick={isRecording ? onStopVoice : onStartVoice}
                        variant={isRecording ? "destructive" : "default"}
                        disabled={loading}
                        className="dark:bg-red-700 dark:text-white dark:border-red-700"
                    >
                        {isRecording ? "Stop Recording" : "Start Voice"}
                    </Button>
                    {isRecording && <span className="text-xs text-red-400">Listening...</span>}
                </div>
            )}
        </div>
    );
}
