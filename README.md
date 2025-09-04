# EPUB Viewer

Simple React + TypeScript web app that lets users upload an EPUB file and display its text content.

### Features

- Displays book covers extracted from the EPUB in the library
- Renders chapters with basic EPUB structure and avoids splitting words across pages
- Remembers the last read page in `localStorage`
- Persists uploaded books and highlight notes in `localStorage`
- Explains selected text with an OpenAI powered helper

## Development

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and add your OpenAI API key as `OPENAI_API_KEY`.
3. Run `npm run build` to compile TypeScript.
4. Start a local server with `npm run dev` for hot reload or `npm start` for a one-time run.
5. Open [http://localhost:3000](http://localhost:3000) in a browser.
