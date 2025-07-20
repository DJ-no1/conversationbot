import { NextRequest, NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
// import { HumanMessage } from "langchain/schema";
// import { createGraph, runGraph } from "@langchain/langgraph"; // Uncomment and use as needed
import { traceable } from "langsmith/traceable";




export async function POST(req: NextRequest) {
    try {
        // Force enable LangSmith tracing at runtime
        process.env.LANGCHAIN_TRACING_V2 = "true";
        const { message } = await req.json();
        if (!message) {
            return NextResponse.json({ error: "No message provided" }, { status: 400 });
        }

        const chat = new ChatGoogleGenerativeAI({
            apiKey: process.env.GOOGLE_API_KEY || "AIzaSyDsafmVLoPv1MU9LyThO1vomC6beik9gh0",
            model: "gemini-2.0-flash"
        });
        // Use LangSmith traceable for tracing
        const tracedInvoke = traceable(async (msg: string) => await chat.invoke(msg), { name: "chat_invoke" });
        const result = await tracedInvoke(message);

        return NextResponse.json({ response: result.content });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
    }
}
