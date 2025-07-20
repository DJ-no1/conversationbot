"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function RagChat({ onSend, messages, loading }: {
    onSend: (msg: string) => void;
    messages: { sender: "user" | "bot"; text: string }[];
    loading: boolean;
}) {
    const [input, setInput] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSend = () => {
        if (input.trim()) {
            onSend(input);
            setInput("");
        }
    };

    useEffect(() => {
        if (inputRef.current) inputRef.current.focus();
    }, []);

    return (
        <div className="w-full max-w-xl mx-auto flex flex-col gap-4 dark:bg-[#18181b] bg-white p-6 rounded-lg shadow-lg transition-colors duration-300 mt-8">
            <div className="bg-zinc-900 dark:bg-zinc-900 rounded-lg p-4 h-80 overflow-y-auto flex flex-col gap-2 border border-zinc-800">
                {messages.length === 0 && (
                    <div className="text-zinc-400 text-center">No messages yet.</div>
                )}
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`rounded-lg px-3 py-2 max-w-xs break-words text-sm shadow-sm ${msg.sender === "user" ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-100 border border-zinc-700"}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex gap-2">
                <input
                    ref={inputRef}
                    className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring dark:bg-zinc-800 dark:text-white dark:border-zinc-700"
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
                    placeholder="Ask about the PDF..."
                    disabled={loading}
                />
                <Button onClick={handleSend} disabled={loading || !input.trim()} className="dark:bg-blue-700 dark:text-white">
                    Send
                </Button>
            </div>
        </div>
    );
}
