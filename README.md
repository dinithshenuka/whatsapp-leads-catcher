# WhatsApp Leads Catcher

A Node.js and TypeScript application that automatically captures incoming WhatsApp messages and saves them as leads into a local SQLite database. Built using [`whatsapp-web.js`](https://docs.wwebjs.dev/).

## Features

- **Existing Leads Sync:** Automatically scans all your existing WhatsApp chats on startup and saves them as leads (skipping groups).
- **Automated Lead Capture:** Listens to incoming WhatsApp messages and saves the sender's phone number and name into a database.
- **SQLite Database:** Lightweight, local, and uses `INSERT OR IGNORE` to guarantee zero duplicates even if you run it multiple times.
- **Session Management:** Uses `LocalAuth` to save your WhatsApp Web session, so you don't have to scan the QR code every time you restart the app.
- **TypeScript:** Fully typed for better developer experience and maintainability.
- **Graceful Shutdown:** Safely destroys the WhatsApp client and cleans up the background browser process when stopping the app.

## Prerequisites

- **Node.js**: v18.0.0 or higher.
- **pnpm**: Recommended package manager.
- **Google Chrome / Chromium**: Puppeteer requires a browser executable to run the WhatsApp Web client behind the scenes.

## Installation

1. Clone the repository and navigate to the directory:
   ```bash
   cd whatsapp-leads-catcher
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Ensure the browser for Puppeteer is installed. (You may need to run `npx puppeteer browsers install chrome` if you face issues with Puppeteer).

4. Environment setup (optional):
   The `.env` file handles configuration (like the Puppeteer executable path). Make sure your `.env` contains the correct `PUPPETEER_EXECUTABLE_PATH` to point to the downloaded Chrome binary.

## Usage

Start the development server:

```bash
pnpm run dev
```

On the first run, a QR code will be printed in your terminal. Open the WhatsApp app on your phone, go to **Linked Devices**, and scan the QR code to authenticate.

Once authenticated, the console will display `WhatsApp Client is ready! Listening for incoming messages...`. Any new incoming messages will be automatically saved to `leads.db`.

## Project Structure

- `src/index.ts` - Main entrypoint, handles bootstrap and graceful shutdown.
- `src/config/env.ts` - Centralized environment variables configuration.
- `src/db/index.ts` - SQLite database connection and operations.
- `src/handlers/message.ts` - Business logic for parsing and handling incoming messages.
- `src/services/whatsapp.ts` - WhatsApp client initialization and event listeners.

## Building for Production

Compile the TypeScript code to JavaScript:

```bash
pnpm run build
```

Run the compiled code:

```bash
pnpm run start
```
