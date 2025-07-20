"use client";

import { useState } from "react";
import ChatInterface, { Message } from "@/components/ChatInterface";

export default function AssemblyChatInterface() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string>("");

    // Send message to Assembly API (STT/AI/TTS)
    const handleSend = async (msg: string) => {
        setMessages((prev) => [...prev, { sender: "user", text: msg }]);
        setLoading(true);
        setAudioUrl("");
        try {
            const res = await fetch("/api/assembly", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: msg }),
            });
            const data = await res.json();
            if (data.response) {
                setMessages((prev) => [...prev, { sender: "bot", text: data.response }]);
                if (data.audioUrl) setAudioUrl(data.audioUrl);
            } else if (data.transcript) {
                setMessages((prev) => [...prev, { sender: "bot", text: data.transcript }]);
                if (data.audioUrl) setAudioUrl(data.audioUrl);
            } else {
                setMessages((prev) => [...prev, { sender: "bot", text: data.error || "Error from API" }]);
            }
        } catch (err) {
            let errorMsg = "Network error";
            if (err instanceof Error) errorMsg = err.message;
            setMessages((prev) => [...prev, { sender: "bot", text: errorMsg }]);
        }
        setLoading(false);
    };

    return (
        <div>
            <ChatInterface
                onSend={handleSend}
                messages={messages}
                loading={loading}
                inputMode="text"
                setInputMode={() => { }}
                onStartVoice={() => { }}
                onStopVoice={() => { }}
                isRecording={false}
            />
            {audioUrl && (
                <div
                    style={{
                        marginTop: 16,
                        textAlign: "center",
                        background: "linear-gradient(90deg, #38bdf8 0%, #22d3ee 100%)",
                        borderRadius: 12,
                        padding: 16,
                        color: "#0f172a",
                        boxShadow: "0 2px 8px #0ea5e9aa"
                    }}
                >
                    <strong style={{ color: "#0e7490", fontWeight: 700, fontSize: 18 }}>AI Response (Spoken):</strong>
                    <audio controls src={audioUrl} style={{ marginLeft: 16, marginTop: 12, background: "#e0f2fe", borderRadius: 8, width: 320 }} />
                </div>
            )}
        </div>
    );
}

