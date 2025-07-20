"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";

interface Message {
    sender: "user" | "bot";
    text: string;
}

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const [partialTranscript, setPartialTranscript] = useState("");

    const handleSend = async () => {
        if (!input.trim()) return;
        setMessages((prev) => [...prev, { sender: "user", text: input }]);
        setLoading(true);
        // Simulate bot response
        setTimeout(() => {
            setMessages((prev) => [...prev, { sender: "bot", text: `Echo: ${input}` }]);
            setLoading(false);
        }, 800);
        setInput("");
    };

    // Mic button logic: start/stop recording and stream to AssemblyAI WebSocket
    const handleMic = async () => {
        if (!isRecording) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mediaRecorder = new window.MediaRecorder(stream, { mimeType: 'audio/webm' });
                // Get AssemblyAI real-time token from secure API route
                const tokenRes = await fetch("/api/assemblyai-token", { method: "POST" });
                const tokenData = await tokenRes.json();
                if (!tokenData.token) {
                    setMessages((prev) => [...prev, { sender: "bot", text: "Failed to get AssemblyAI token." }]);
                    return;
                }
                wsRef.current = new WebSocket(`wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000&token=${tokenData.token}`);
                const ws = wsRef.current;
                ws.onopen = () => {
                    setIsRecording(true);
                    setPartialTranscript("");
                    mediaRecorderRef.current = mediaRecorder;
                    mediaRecorder.start(250);
                };
                ws.onmessage = (msg) => {
                    const res = JSON.parse(msg.data);
                    if (res.text && res.message_type === "PartialTranscript") {
                        setPartialTranscript(res.text);
                        setInput(res.text);
                    }
                    if (res.text && res.message_type === "FinalTranscript") {
                        setPartialTranscript("");
                        setInput(res.text);
                    }
                };
                ws.onerror = () => {
                    setMessages((prev) => [...prev, { sender: "bot", text: "WebSocket error." }]);
                };
                ws.onclose = () => {
                    setIsRecording(false);
                };
                mediaRecorder.ondataavailable = async (event) => {
                    if (event.data.size > 0 && ws.readyState === 1) {
                        const arrayBuffer = await event.data.arrayBuffer();
                        ws.send(arrayBuffer);
                    }
                };
                mediaRecorder.onstop = () => {
                    ws.close();
                    wsRef.current = null;
                };
            } catch (err) {
                console.error('Mic access error:', err);
                let errorMsg = "Mic access denied or not available.";
                if (err instanceof DOMException) {
                    if (err.name === "NotAllowedError") {
                        errorMsg = "Mic access denied by user or browser.";
                    } else if (err.name === "NotFoundError") {
                        errorMsg = "No microphone found on this device.";
                    } else if (err.name === "NotReadableError") {
                        errorMsg = "Mic is already in use by another application.";
                    } else if (err.name === "OverconstrainedError") {
                        errorMsg = "Mic constraints cannot be satisfied by available device.";
                    }
                } else if (typeof err === 'object' && err && 'message' in err) {
                    errorMsg = (err as any).message;
                }
                setMessages((prev) => [...prev, { sender: "bot", text: errorMsg }]);
            }
        } else {
            // Stop recording
            mediaRecorderRef.current?.stop();
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
            setIsRecording(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0e7490] p-4">
            <div className="w-full max-w-xl rounded-2xl shadow-2xl border border-slate-800 bg-[#111827]/90 backdrop-blur-md p-6">
                <div className="h-96 overflow-y-auto mb-5 flex flex-col gap-4 pr-2 custom-scrollbar">
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`px-5 py-3 rounded-2xl max-w-xs text-base font-medium shadow-md transition-all duration-200 ${msg.sender === "user"
                                    ? "bg-gradient-to-br from-sky-600 to-cyan-500 text-white rounded-br-md"
                                    : "bg-slate-800 text-cyan-200 rounded-bl-md border border-slate-700"
                                    }`}
                            >
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="px-5 py-3 rounded-2xl bg-slate-800 text-cyan-400 max-w-xs text-base font-medium animate-pulse border border-slate-700">
                                Bot is typing...
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex gap-2 items-center">
                    <button
                        type="button"
                        onClick={handleMic}
                        className={`p-3 rounded-full border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 ${isRecording
                            ? "bg-cyan-600 border-cyan-400 text-white animate-pulse"
                            : "bg-slate-900 border-slate-700 text-cyan-300 hover:bg-slate-800"
                            }`}
                        aria-label={isRecording ? "Stop recording" : "Start recording"}
                    >
                        <Mic className={`w-5 h-5 ${isRecording ? "animate-pulse" : ""}`} />
                    </button>
                    <input
                        className="flex-1 border border-slate-700 bg-slate-900 text-cyan-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 placeholder:text-slate-500"
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSend();
                        }}
                        placeholder={isRecording ? "Listening..." : "Type your message..."}
                        disabled={loading || isRecording}
                        autoFocus
                    />
                    <Button
                        onClick={handleSend}
                        disabled={loading || !input.trim() || isRecording}
                        className="bg-gradient-to-br from-cyan-600 to-sky-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:from-cyan-500 hover:to-sky-400 border-0"
                    >
                        Send
                    </Button>
                </div>
            </div>
            <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 8px;
        }
      `}</style>
        </div>
    );
}

