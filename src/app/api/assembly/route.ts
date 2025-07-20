// Install the required packages by executing the command "npm install assemblyai stream node-record-lpcm16"

import { NextRequest, NextResponse } from 'next/server';

import { AssemblyAI } from 'assemblyai';

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.ASSEMBLY_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'AssemblyAI API key not set.' }, { status: 500 });
        }
        const client = new AssemblyAI({
            apiKey,
        });

        // Support multipart/form-data (file upload) or JSON (audioUrl)
        const contentType = req.headers.get('content-type') || '';
        let audioUrl = '';
        let fileBuffer: Buffer | null = null;

        if (contentType.includes('application/json')) {
            try {
                const { audioUrl: url } = await req.json();
                audioUrl = url;
            } catch (e) {
                return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
            }
        } else if (contentType.includes('multipart/form-data')) {
            try {
                const formData = await req.formData();
                const file = formData.get('audio');
                if (file && typeof file === 'object' && 'arrayBuffer' in file) {
                    const arrayBuffer = await file.arrayBuffer();
                    fileBuffer = Buffer.from(arrayBuffer);
                } else {
                    return NextResponse.json({ error: 'No audio file found in form data.' }, { status: 400 });
                }
            } catch (e) {
                return NextResponse.json({ error: 'Invalid form data.' }, { status: 400 });
            }
        }

        let transcript;
        try {
            if (audioUrl) {
                transcript = await client.transcripts.transcribe({
                    audio: audioUrl,
                    speech_model: 'universal',
                });
            } else if (fileBuffer) {
                transcript = await client.transcripts.transcribe({
                    audio: fileBuffer,
                    speech_model: 'universal',
                });
            } else {
                return NextResponse.json({ error: 'No audio provided.' }, { status: 400 });
            }
        } catch (e: any) {
            return NextResponse.json({ error: 'Transcription failed: ' + (e.message || e) }, { status: 500 });
        }

        // --- AI Response (using OpenAI or Gemini, fallback to echo) ---
        let aiResponse = '';
        try {
            const openaiApiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;
            if (openaiApiKey) {
                // Use OpenAI API if available
                const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${openaiApiKey}`,
                    },
                    body: JSON.stringify({
                        model: 'gpt-3.5-turbo',
                        messages: [
                            { role: 'system', content: 'You are a helpful assistant.' },
                            { role: 'user', content: transcript.text },
                        ],
                        max_tokens: 256,
                    }),
                });
                if (!aiRes.ok) {
                    const errText = await aiRes.text();
                    throw new Error('AI API error: ' + errText);
                }
                const aiData = await aiRes.json();
                aiResponse = aiData.choices?.[0]?.message?.content || '';
            } else {
                aiResponse = `Echo: ${transcript.text}`;
            }
        } catch (e: any) {
            aiResponse = `AI response failed: ${(e && e.message) ? e.message : e}. Echo: ${transcript.text}`;
        }

        // --- Google TTS (optional, returns a fake URL for now) ---
        let audioUrlTTS = '';
        try {
            // You can implement Google TTS here if you have the API key and setup
            // For now, just return empty or a placeholder
            audioUrlTTS = '';
        } catch (e: any) {
            audioUrlTTS = 'TTS failed: ' + (e && e.message ? e.message : e);
        }

        return NextResponse.json({ transcript: transcript.text, response: aiResponse, audioUrl: audioUrlTTS });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Transcription failed.' }, { status: 500 });
    }
}
