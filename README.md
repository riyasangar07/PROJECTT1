# TruthLens AI

TruthLens AI is an AI-powered fake news detection platform that helps users verify the authenticity of news articles, social media posts, and headlines.

## Features
- **Real-time AI Text Analysis**
- **URL Scanning**
- **AI Chatbot Fact-checker**
- **Dashboard & Analytics**

## Tech Stack
- Frontend: React 18, Vite, Tailwind CSS, Framer Motion, shadcn/ui.
- Backend: Node.js, Express, Google GenAI SDK.
- LLM: Gemini 1.5 Flash (for speedy content analysis and chat).

## Development Instructions
1. Run `npm install` to install dependencies.
2. Edit `.env` to include your `GEMINI_API_KEY`.
3. Start the dev server: `npm run dev`.

## Deployment Guide

### 1. Database: Firebase
We use Firebase for Authentication and Firestore. 
1. Create a Firebase project at `console.firebase.google.com`.
2. Enable Authentication (Google, Email/Password).
3. Enable Firestore Database.
4. Copy your Firebase Config to the `.env` variables or `client` config file.

### 2. Frontend: Vercel
1. Push your repository to GitHub.
2. Log into Vercel and Import your Project.
3. Replace the Build Command with:
   `npm run build`
4. Set the Output Directory to `dist`.
5. Add your `.env` variables (e.g. `VITE_FIREBASE_API_KEY`, the production API URL).
6. Click **Deploy**.

*Note: Since the backend is separate on Render, modify the frontend code to call the full Render URL instead of relative `/api/...` endpoints if you plan to host them separately, OR host them together on Render/Railway as a monolithic Express app.*

### 3. Backend: Render
1. In Render, select **New Web Service**.
2. Connect your GitHub repository.
3. Build Command: `npm install && npm run build`
4. Start Command: `npm run start`
5. Add Environment Variables:
   - `GEMINI_API_KEY`: Your Gemini access key.
6. Click **Create Web Service**.

## Credits
Built manually utilizing React, Node.js, and Google AI infrastructure.
