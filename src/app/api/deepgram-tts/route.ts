import { NextRequest, NextResponse } from "next/server";

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

export async function POST(req: NextRequest) {
    if (!DEEPGRAM_API_KEY) {
        return new NextResponse("DEEPGRAM_API_KEY not configured", { status: 500 });
    }
    try {
        const { text, model = "aura-2-delia-en" } = await req.json();

        if (!text || typeof text !== "string" || !text.trim()) {
            return new NextResponse("No text provided for TTS.", { status: 400 });
        }

        console.log("TTS Request - Text:", text, "Model:", model);

        // Use default Deepgram output (WAV) for browser compatibility
        const dgRes = await fetch(
            `https://api.deepgram.com/v1/speak?model=${model}&encoding=mp3`,
            {
                method: "POST",
                headers: {
                    Authorization: `Token ${DEEPGRAM_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ text }),
            }
        );

        if (!dgRes.ok || !dgRes.body) {
            const errText = await dgRes.text();
            return new Response(`Deepgram API Error: ${errText}`, { status: dgRes.status });
        }

        // Stream Deepgram's response directly to the client
        return new Response(dgRes.body, {
            status: 200,
            headers: {
                "Content-Type": "audio/mpeg",
                "Cache-Control": "no-cache",
            },
        });

    } catch (err: any) {
        console.error("TTS API Error:", err);
        let msg = "Unknown error";
        if (err.message) {
            msg = err.message;
        }
        return new NextResponse(`TTS API Error: ${msg}`, { status: 500 });
    }
}
