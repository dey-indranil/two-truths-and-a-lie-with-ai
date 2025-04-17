const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
const path = require('path');

// Serve everything in the public folder
app.use(express.static(path.join(__dirname, '..', 'public')));


const AI_PROVIDER = process.env.AI_PROVIDER || 'ollama';

async function askOllama(prompt) {
  const response = await axios.post('http://localhost:11434/api/generate', {
    model: 'llama3',
    prompt,
    stream: false
  });
  return response.data.response;
}

async function askOpenRouter(prompt) {
  const response = await axios.post('https://openrouter.ai/api/v1/chat/completions',
    {
      model: 'meta-llama/llama-4-scout:free',
      messages: [{ role: 'user', content: prompt }]
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Two truths and a lie with AI Dev'
      }
    }
  );
  return response.data.choices[0].message.content;
}

async function askAI(prompt) {
  if (AI_PROVIDER === 'ollama') return await askOllama(prompt);
  else return await askOpenRouter(prompt);
}

app.post('/ask-ai', async (req, res) => {
  const { prompt } = req.body;
  try {
    const answer = await askAI(prompt);
    res.json({ answer });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'AI error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
