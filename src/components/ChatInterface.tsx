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
}: {
    onSend: (msg: string) => void;
    messages: Message[];
    loading: boolean;
    inputMode: "text" | "voice";
    setInputMode: (mode: "text" | "voice") => void;
    onStartVoice: () => void;
    onStopVoice: () => void;
    isRecording: boolean;
}) {
    const [input, setInput] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    // Text-to-speech for bot messages
    useEffect(() => {
        if (messages.length === 0) return;
        const lastMsg = messages[messages.length - 1];
        if (lastMsg.sender === "bot" && typeof window !== "undefined" && "speechSynthesis" in window) {
            const utter = new window.SpeechSynthesisUtterance(lastMsg.text);
            utter.lang = "en-US";
            window.speechSynthesis.speak(utter);
        }
    }, [messages]);

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
        <div className="w-full max-w-xl mx-auto flex flex-col gap-4">
            <div className="flex justify-between items-center mb-2">
                <div className="flex gap-2">
                    <Button
                        variant={inputMode === "text" ? "default" : "outline"}
                        onClick={() => setInputMode("text")}
                    >
                        Text
                    </Button>
                    <Button
                        variant={inputMode === "voice" ? "default" : "outline"}
                        onClick={() => setInputMode("voice")}
                    >
                        Voice
                    </Button>
                </div>
            </div>
            <div className="bg-muted rounded-lg p-4 h-80 overflow-y-auto flex flex-col gap-2 border border-border">
                {messages.length === 0 && (
                    <div className="text-muted-foreground text-center">No messages yet.</div>
                )}
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`rounded-lg px-3 py-2 max-w-xs break-words text-sm shadow-sm ${msg.sender === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-background text-foreground border"
                                }`}
                        >
                            {msg.text}
                        </div>
                    </div>
                ))}
            </div>
            {inputMode === "text" ? (
                <div className="flex gap-2">
                    <input
                        ref={inputRef}
                        className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring"
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === "Enter") handleSend();
                        }}
                        placeholder="Type your message..."
                        disabled={loading}
                    />
                    <Button onClick={handleSend} disabled={loading || !input.trim()}>
                        Send
                    </Button>
                </div>
            ) : (
                <div className="flex gap-2 items-center">
                    <Button
                        onClick={isRecording ? onStopVoice : onStartVoice}
                        variant={isRecording ? "destructive" : "default"}
                        disabled={loading}
                    >
                        {isRecording ? "Stop Recording" : "Start Voice"}
                    </Button>
                    {isRecording && <span className="text-xs text-destructive">Listening...</span>}
                </div>
            )}
        </div>
    );
}
