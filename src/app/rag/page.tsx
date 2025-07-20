"use client";
import PdfUpload from "@/components/PdfUpload";
import RagChat from "@/components/RagChat";
import { useState } from "react";
// import { PDFLoader } from "langchain/community/document_loaders/fs/pdf"; // For server-side parsing

export default function RagPage() {
    const [parsedText, setParsedText] = useState<string>("");
    const [chatMessages, setChatMessages] = useState<{ sender: "user" | "bot"; text: string }[]>([]);
    const [chatLoading, setChatLoading] = useState(false);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [parsing, setParsing] = useState(false);

    // PDF upload handler
    const handleFileChange = (file: File) => {
        setPdfFile(file);
    };

    const handleParseSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pdfFile) return;
        setParsing(true);
        const formData = new FormData();
        formData.append("file", pdfFile);
        const res = await fetch("/api/parse-pdf", { method: "POST", body: formData });
        const data = await res.json();
        setParsedText(data.text || "");
        setChatMessages([]);
        setParsing(false);
    };

    // Chat handler: send user question to /api/rag-chat
    const handleChatSend = async (msg: string) => {
        setChatMessages(prev => [...prev, { sender: "user", text: msg }]);
        setChatLoading(true);
        try {
            const res = await fetch("/api/rag-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: msg, context: parsedText }),
            });
            const data = await res.json();
            setChatMessages(prev => [...prev, { sender: "bot", text: data.answer || data.error || "Error from LLM" }]);
        } catch (err: any) {
            setChatMessages(prev => [...prev, { sender: "bot", text: err.message || "Network error" }]);
        }
        setChatLoading(false);
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-white dark:bg-[#09090b] transition-colors duration-300">
            <h1 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-100">Upload a PDF</h1>
            <form onSubmit={handleParseSubmit} className="flex flex-col items-center w-full max-w-md">
                <PdfUpload onUpload={handleFileChange} />
                <button
                    type="submit"
                    className="mt-4 px-4 py-2 rounded bg-blue-600 text-white font-semibold disabled:opacity-60"
                    disabled={!pdfFile || parsing}
                >
                    {parsing ? "Parsing..." : "Parse PDF"}
                </button>
            </form>
            {parsedText && (
                <>
                    <div className="mt-6 p-4 bg-zinc-100 dark:bg-zinc-800 rounded text-sm w-full max-w-md break-words max-h-[60vh] overflow-auto">
                        <span className="font-semibold">PDF Parsed Text:</span>
                        <div className="mt-2 whitespace-pre-wrap">{parsedText}</div>
                    </div>
                    <RagChat onSend={handleChatSend} messages={chatMessages} loading={chatLoading} />
                </>
            )}
        </main>
    );
}
