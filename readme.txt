# Project Overview

This project appears to be a conversational AI bot built with Next.js, TypeScript, and various supporting libraries. Below is a summary of the project structure and the purpose of key files and folders.

## Root Files
- **components.json**: Likely contains configuration or metadata for project components.
- **eslint.config.mjs**: ESLint configuration for code linting.
- **next-env.d.ts**: TypeScript definitions for Next.js.
- **next.config.ts**: Next.js configuration file.
- **package.json**: Project dependencies and scripts.
- **pnpm-lock.yaml**: Lockfile for pnpm package manager.
- **postcss.config.mjs**: PostCSS configuration for CSS processing.
- **README.md**: Main project documentation (see this file for more details).
- **server.js**: Custom server logic (if used).
- **tsconfig.json**: TypeScript configuration.

## Public Folder
Contains static assets such as SVG files and icons:
- **file.svg, globe.svg, next.svg, vercel.svg, window.svg**

## src/app Folder
- **favicon.ico**: App icon.
- **globals.css**: Global CSS styles.
- **layout.tsx**: Main layout component for the app.
- **page.tsx**: Main page component.

### API Routes (src/app/api)
- **assembly/route.ts**: API route for assembly-related features.
- **chat/route.ts**: API route for chat functionality.
- **parse-pdf/route.ts**: API route for PDF parsing.
- **rag-chat/route.ts**: API route for RAG (Retrieval-Augmented Generation) chat.

### Pages
- **assembly/page.tsx**: Assembly feature page.
- **rag/page.tsx**: RAG feature page.

## src/components Folder
- **ChatInterface.tsx**: Chat interface component.
- **PdfUpload.tsx**: PDF upload component.
- **RagChat.tsx**: RAG chat component.
- **WaveformVisualizer.tsx**: Audio waveform visualization component.
- **ui/button.tsx**: UI button component.

## src/lib Folder
- **utils.ts**: Utility functions for the project.

## .env File
Contains environment variables for API keys and configuration (do not share this file publicly).

---

This summary provides an overview of the project structure and the main purpose of each file and folder. For more details, refer to the individual files or the main README.md.
