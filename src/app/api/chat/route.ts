import { NextRequest, NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
// import { HumanMessage } from "langchain/schema";
// import { createGraph, runGraph } from "@langchain/langgraph"; // Uncomment and use as needed

export async function POST(req: NextRequest) {
    try {
        const { message } = await req.json();
        if (!message) {
            return NextResponse.json({ error: "No message provided" }, { status: 400 });
        }

        // Example: Google Generative AI
        const chat = new ChatGoogleGenerativeAI({
            apiKey: process.env.GOOGLE_API_KEY || "AIzaSyDsafmVLoPv1MU9LyThO1vomC6beik9gh0",
            model: "gemini-2.0-flash"
        });
        // If the model expects a string, just pass the message directly
        const result = await chat.invoke(message);
        // Optionally, add LangGraph logic here
        // const graph = createGraph(...)
        // const graphResult = await runGraph(graph, ...)

        return NextResponse.json({ response: result.content });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
    }
}
