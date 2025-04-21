# 🎭 Two Truths & a Lie with AI

**Two Truths & a Lie with AI** is a fun, turn-based web game where you and an AI take turns challenging each other with two truths and a lie. The opponent must guess which statement is the lie. It's a clever game of deception and deduction!

## 🧠 Gameplay

- You enter three statements — two truths and one lie.
- The AI guesses which one is the lie (and explains its reasoning).
- Then, the AI gives three statements, and *you* guess the lie.
- First to 5 points wins!

---

## 🌐 Live Demo

Play the game here:  
➡️ [https://two-truths-and-a-lie-with-ai.vercel.app](https://two-truths-and-a-lie-with-ai.vercel.app)

---

## 📁 Project Structure

This project has 2 branches. **Branch main** is on serverless:

### 1. **Always-On Server Mode**

- Run everything with a Node.js server (`express`) and serve frontend and backend together.
- Useful for local development and custom deployment (e.g., on a VPS).

```bash
# Install dependencies
npm install

# Run the server (defaults to http://localhost:3000)
npm start
```

### 2. **Serverless (Vercel) Deployment**

- Each API endpoint is a serverless function inside `/api/`.
- Vercel builds and deploys both the static frontend and the backend functions automatically.
- Just push to a branch and Vercel takes care of the rest.

#### 🪄 Deploy to Vercel

1. Link your repo with [Vercel](https://vercel.com/import).
2. Add environment variables (see below).
3. Done! ✅

---

## ⚙️ Environment Variables

Set these in `.env.local` (for local dev) or in your Vercel project dashboard.

```env
# Switch between local Ollama or OpenRouter AI backend
USE_LOCAL_AI=true  # or false

# If using OpenRouter (cloud AI)
OPENROUTER_API_KEY=your-api-key

# Optional: secret used to obfuscate which statement is the lie
HMAC_SECRET=your-base64-secret
```

To generate a strong secret:
```bash
openssl rand -base64 32
```

If your generated secret is split over multiple lines, you can remove the newline and paste it as a single line.

---

## 🔐 Stateless Design with Obfuscation

We intentionally avoided persistent storage to simplify deployment and make the game stateless. Here's how:

- When the player provides three statements, we compute an **HMAC-based obfuscated string** of the lie's index and return it to the client.
- Later, when the player guesses the AI's lie, the guess is validated using that obfuscated value.
- This means we never need to store the correct answer — it's encoded securely and statelessly.

---

## 🧪 Local Development

Run the server:

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

If you're using **local Ollama**, make sure it's running with a model like `llama3`:

```bash
ollama run llama3
```

---

## 🧠 AI Integration

You can choose between:

- **OpenRouter** (`meta-llama/llama-4-scout:free`) – Free but rate-limited
- **Local Ollama** (`llama3`) – No limits, runs on your machine

This is controlled by the `USE_LOCAL_AI` setting.

---

## 🛠 Tech Stack

- Frontend: Vanilla JS + HTML + CSS
- Backend: Node.js with Express or Vercel Serverless
- AI: OpenRouter (cloud) or Ollama (local)
- Security: HMAC for tamper-proof obfuscation

---

## 🧹 Todos / Ideas

- [ ] Add categories or difficulty levels
- [ ] Save high scores locally
- [ ] Leaderboard support
- [ ] Chat-style interface for AI responses

---

## 📄 License

MIT — Feel free to play, remix, and share!
