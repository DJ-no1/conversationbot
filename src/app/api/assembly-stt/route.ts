import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
    try {
        const { audio } = await req.json();
        if (!audio) {
            return NextResponse.json({ error: "No audio provided" }, { status: 400 });
        }

        // Send audio to AssemblyAI
        const response = await fetch("https://api.assemblyai.com/v2/transcript", {
            method: "POST",
            headers: {
                "authorization": process.env.ASSEMBLYAI_API_KEY || "e88752099053436c9532291e53a11c11",
                "content-type": "application/json",
            },
            body: JSON.stringify({
                audio_url: audio,
                // You can add more AssemblyAI options here
            }),
        });
        const data = await response.json();
        if (data.error) {
            return NextResponse.json({ error: data.error }, { status: 500 });
        }
        return NextResponse.json({ transcript: data.text || "", status: data.status });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
    }
}
