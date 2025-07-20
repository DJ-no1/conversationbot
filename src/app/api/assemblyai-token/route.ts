import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.ASSEMBLYAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Missing ASSEMBLYAI_API_KEY in environment variables." }, { status: 500 });
        }
        const response = await fetch("https://api.assemblyai.com/v2/realtime/token", {
            method: "POST",
            headers: {
                authorization: apiKey,
                "content-type": "application/json",
            },
        });
        const data = await response.json();
        if (!data.token) {
            return NextResponse.json({ error: `Failed to get AssemblyAI token: ${JSON.stringify(data)}` }, { status: 500 });
        }
        return NextResponse.json({ token: data.token });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
    }
}
