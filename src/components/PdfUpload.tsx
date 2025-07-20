"use client";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export default function PdfUpload({ onUpload }: { onUpload?: (file: File) => void }) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState<string>("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === "application/pdf") {
            setSelectedFile(file);
            setError("");
            onUpload?.(file);
        } else {
            setSelectedFile(null);
            setError("Please select a valid PDF file.");
        }
    };

    return (
        <div className="flex flex-col items-center gap-4 p-6 bg-white dark:bg-zinc-900 rounded-lg shadow-md w-full max-w-md mx-auto">
            <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
            />
            <Button onClick={() => fileInputRef.current?.click()} className="w-full">
                {selectedFile ? "Change PDF" : "Upload PDF"}
            </Button>
            {selectedFile && <div className="text-xs text-zinc-700 dark:text-zinc-200">Selected: {selectedFile.name}</div>}
            {error && <div className="text-xs text-red-500">{error}</div>}
        </div>
    );
}
