"use client";

import AssemblyChatInterface from "@/components/AssemblyChatInterface";

export default function AssemblyChatPage() {
    return (
        <div style={{ maxWidth: 600, margin: "2rem auto", padding: 24, background: "#23232a", borderRadius: 12, boxShadow: "0 2px 8px #0008", color: "#f3f4f6" }}>
            <h2 style={{ color: "#e0e7ef", marginBottom: 24 }}>AssemblyAI Chatbot (STT → AI → Google TTS)</h2>
            <AssemblyChatInterface />
        </div>
    );
}
