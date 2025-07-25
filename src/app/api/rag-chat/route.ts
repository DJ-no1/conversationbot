import { NextRequest, NextResponse } from "next/server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

// Accepts a PDF file upload, extracts and returns its text
export async function POST(request: NextRequest) {
    try {
        // Expecting a PDF file upload (multipart/form-data)
        const formData = await request.formData();
        const file = formData.get("file");
        if (!file || typeof file === "string") {
            return NextResponse.json({ error: "No PDF file uploaded" }, { status: 400 });
        }

        // Use PDFLoader to extract text from the PDF
        const loader = new PDFLoader(file as Blob);
        const docs = await loader.load();
        // Combine all page texts
        const text = docs.map((d: { pageContent: string }) => d.pageContent).join("\n\n");
        return NextResponse.json({ text });
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: errorMsg }, { status: 500 });
    }
}
