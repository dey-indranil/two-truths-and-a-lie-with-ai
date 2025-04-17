const express = require('express');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// POST - player provides 3 statements and the index of the lie
app.post('/player-turn', async (req, res) => {
  const { statements, lieIndex } = req.body;
  const prompt = `Here are three statements numbered 0,1,2: 
1. ${statements[0]}
2. ${statements[1]}
3. ${statements[2]}

Which one is the lie? I am going to parse your reply. Your reply should strictly be in the format {ai-reply:<0 or 1 or 2>, reason:<2 or 3 sentences on why you think this is a lie"> }`;


  try {
    const aiResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'meta-llama/llama-4-scout:free',
      messages: [{ role: 'user', content: prompt }]
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Two Truths Game'
      }
    });

    const text = aiResponse.data.choices[0].message.content;
    const aiGuessIndexMatch = text.match(/ai-reply\s*:\s*(\d)/i);
    const aiGuessIndex = parseInt(aiGuessIndexMatch[1], 10);
    const reasonMatch = text.match(/reason\s*:\s*(.*)/i);
    const reason = reasonMatch ? reasonMatch[1].trim() : 'No reason provided.';

    const correct = aiGuessIndex === lieIndex;

    res.json({
      aiGuess: statements[aiGuessIndex] || 'N/A',
      aiGuessIndex,
      correct,
      reason
    });
    
  } catch (error) {
    console.error('AI error:', error.response?.data || error.message);
    res.status(500).json({ error: 'AI failed to respond' });
  }
});

// GET - server provides 2 truths and a lie from AI
app.get('/ai-turn', async (req, res) => {
  const prompt = `Give me 2 truths and 1 lie. Label the lie clearly as [LIE]. Format each statement on its own line.`;

  try {
    const aiResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'meta-llama/llama-4-scout:free',
      messages: [{ role: 'user', content: prompt }]
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Two Truths Game'
      }
    });

    const text = aiResponse.data.choices[0].message.content;
    const lines = text.split('\n').filter(Boolean);
    const statements = lines.map(line => line.replace(/\[LIE\]/i, '').trim());
    const lieIndex = lines.findIndex(line => /\[LIE\]/i.test(line));

    res.json({ statements, lieIndex });
  } catch (error) {
    console.error('AI error:', error.response?.data || error.message);
    res.status(500).json({ error: 'AI failed to generate statements' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
