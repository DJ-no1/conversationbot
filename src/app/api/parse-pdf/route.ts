import { NextRequest, NextResponse } from "next/server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";


export async function POST(req: NextRequest) {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }


    // Use LangChain PDFLoader to parse the PDF (file is a Blob)
    const loader = new PDFLoader(file as Blob);
    const docs = await loader.load();
    const text = docs.map((doc: any) => doc.pageContent).join("\n");

    return NextResponse.json({ text });
}
