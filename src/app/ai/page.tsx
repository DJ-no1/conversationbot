"use client";
// This file is a client component so we can use React hooks
import { useState, useRef, useEffect } from "react";
import WaveformVisualizer from "@/components/WaveformVisualizer";
import dynamic from "next/dynamic";
const ChatInterface = dynamic(() => import("@/components/ChatInterface"), { ssr: false });
import type { Message } from "@/components/ChatInterface";

export default function DeepgramChat() {
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
    const [isPlaying, setIsPlaying] = useState(false);

    // Use only the Delia Deepgram model
    const dgModel = "aura-2-delia-en";

    // TTS controls (rate, pitch, volume) are not supported by Deepgram, but keep for UI consistency
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
                const botMessage = { sender: "bot" as const, text: data.response };
                setMessages((prev) => [...prev, botMessage]);
                // Auto-speak the bot response
                await speak(data.response);
            } else {
                setMessages((prev) => [...prev, { sender: "bot", text: data.error || "Error from API" }]);
            }
        } catch (err) {
            let errorMsg = "Network error";
            if (err instanceof Error) {
                errorMsg = err.message;
            }
            setMessages((prev) => [...prev, { sender: "bot", text: errorMsg }]);
        }
        setLoading(false);
    };

    // Voice input (speech-to-text)
    const recognitionRef = useRef<any>(null);
    const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

    const stopSilenceTimer = () => {
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    };

    const onStartVoice = () => {
        if (!("webkitSpeechRecognition" in window)) {
            alert("Speech recognition not supported");
            return;
        }
        setIsRecording(true);
        setInterimText("");
        const SpeechRecognitionCtor = (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognitionCtor();
        recognition.lang = "en-US";
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

    const onStopVoice = () => {
        recognitionRef.current?.stop();
        setIsRecording(false);
        setInterimText("");
        stopSilenceTimer();
    };

    // Deepgram TTS: Streaming playback using MediaSource
    const speak = async (text: string) => {
        if (isPlaying) return;
        setIsPlaying(true);
        try {
            const res = await fetch("/api/deepgram-tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, model: dgModel }),
            });
            if (!res.ok || !res.body) {
                const errText = await res.text();
                alert("TTS Error: " + errText);
                setIsPlaying(false);
                return;
            }
            const mediaSource = new window.MediaSource();
            const audio = new Audio();
            audio.src = URL.createObjectURL(mediaSource);
            audio.volume = ttsVolume;
            mediaSource.addEventListener("sourceopen", () => {
                const sourceBuffer = mediaSource.addSourceBuffer("audio/mpeg");
                const reader = res.body.getReader();
                function readChunk() {
                    reader.read().then(({ done, value }) => {
                        if (done) {
                            mediaSource.endOfStream();
                            return;
                        }
                        sourceBuffer.appendBuffer(value);
                        readChunk();
                    });
                }
                readChunk();
            });
            audio.onended = () => {
                setIsPlaying(false);
                URL.revokeObjectURL(audio.src);
                if (inputMode === "voice" && !isRecording) setTimeout(() => onStartVoice(), 500);
            };
            audio.onerror = (e) => {
                alert("Audio playback failed.");
                setIsPlaying(false);
                URL.revokeObjectURL(audio.src);
            };
            audio.play().catch(() => {
                alert("Autoplay prevented. Please interact with the page and try again.");
            });
        } catch (e) {
            setIsPlaying(false);
            alert("TTS Error: " + (e instanceof Error ? e.message : String(e)));
        }
    };

    const onUserInput = () => {
        if (isRecording) onStopVoice();
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-white dark:bg-[#09090b] transition-colors duration-300">
            <h1 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">
                Conversational Bot (Deepgram TTS)
                {isPlaying && <span className="ml-2 text-sm text-green-500">🔊 Speaking...</span>}
            </h1>
            {isRecording && <WaveformVisualizer isRecording={isRecording} />}
            <div className="flex gap-4 mb-2 items-end">
                <label className="text-xs text-zinc-500 flex flex-col items-start">
                    Voice Model
                    <span className="ml-0 mt-1 p-1 rounded bg-zinc-800 text-zinc-100">Delia (en)</span>
                </label>
                {/* UI for TTS controls (not functional for Deepgram rate/pitch, but volume works) */}
                <label className="text-xs text-zinc-500 flex flex-col items-start">
                    TTS Speed (UI only)
                    <div className="flex items-center gap-2">
                        <input
                            type="range"
                            min="0.5"
                            max="2"
                            step="0.1"
                            value={ttsRate}
                            onChange={e => setTtsRate(Number(e.target.value))}
                            disabled
                        />
                        <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300 w-8 text-right">{ttsRate.toFixed(1)}</span>
                    </div>
                </label>
                <label className="text-xs text-zinc-500 flex flex-col items-start">
                    Pitch (UI only)
                    <div className="flex items-center gap-2">
                        <input
                            type="range"
                            min="0"
                            max="2"
                            step="0.1"
                            value={ttsPitch}
                            onChange={e => setTtsPitch(Number(e.target.value))}
                            disabled
                        />
                        <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300 w-8 text-right">{ttsPitch.toFixed(1)}</span>
                    </div>
                </label>
                <label className="text-xs text-zinc-500 flex flex-col items-start">
                    Volume
                    <div className="flex items-center gap-2">
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={ttsVolume}
                            onChange={e => setTtsVolume(Number(e.target.value))}
                        />
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
                speak={speak}
                onUserInput={onUserInput}
            />
        </main>
    );
}
