# Conversational Bot - Project Overview & Flow

This project is a modern conversational bot webapp built with Next.js, React, and TypeScript. It features:

- Text and voice input (STT - Speech-to-Text)
- Bot responses with Text-to-Speech (TTS) and live controls for speed, pitch, volume, and voice
- Visual waveform and volume feedback during voice input
- Live transcription, silence detection, and auto-send
- Persistent chat history (in-memory, can be extended)

## Main Files & Structure

**src/app/page.tsx**

- The main entry point for the app UI.
- Handles global state: messages, loading, input mode, TTS/STT settings.
- Implements the logic for sending messages, starting/stopping voice recognition, and TTS playback.
- Renders the `ChatInterface` and `WaveformVisualizer` components.

**src/components/ChatInterface.tsx**

- The main chat UI component.
- Displays chat history, interim transcription, and input controls.
- Handles text/voice input switching, message sending, and TTS voice selection.
- Accepts props for TTS/STT controls and callbacks.
- Triggers TTS for bot messages and allows live changes to TTS settings.

**src/components/WaveformVisualizer.tsx**

- Shows a live waveform and volume bar when recording voice input.
- Uses the Web Audio API to visualize microphone input.
- Displays a timer for the current recording session.

**API Endpoints**

- `src/app/api/chat/route.ts`: Handles POST requests for chat messages, returns bot responses.
- (You can extend with more endpoints for PDF parsing, RAG, etc.)

**Other Files**

- `src/app/components/ui/button.tsx`: Button UI component.
- `src/app/globals.css`: Global styles.
- `public/`: Static assets (SVGs, icons).

## Component Flow

1. **User opens the app** (`/src/app/page.tsx`)

   - Dark mode is forced on mount.
   - State is initialized for chat, TTS/STT, and UI.

2. **User interacts with the chat**

   - Can type a message or switch to voice mode.
   - In voice mode, clicking the button starts speech recognition and shows the waveform visualizer.
   - Live transcription is shown as the user speaks.
   - If the user is silent for 4 seconds, the interim text is auto-sent.
   - User can edit the transcribed text before sending if desired.

3. **Bot responds**

   - The message is sent to `/api/chat` and the response is added to the chat.
   - TTS automatically reads the bot's response using the selected voice, speed, pitch, and volume.
   - User can change TTS settings live; changes take effect immediately, even during playback.
   - Changing the voice will replay the last bot message in the new voice.

4. **WaveformVisualizer**
   - Shows a real-time waveform and volume bar while recording.
   - Displays a timer for the current recording session.

## Developer Notes

- All TTS/STT settings are controlled via React state and passed as props.
- The app is designed for easy extension (e.g., add persistent storage, more input modes, or advanced bot logic).
- For best results, use Chrome (for webkitSpeechRecognition support).
- The code is modular and easy to test or modify for new features.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
