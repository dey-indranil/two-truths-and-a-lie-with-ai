const express = require('express');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));


// In-memory store for game sessions and questions
const gameSessions = {}; // { [gameId]: { [questionId]: { statements, lieIndex } } }

// POST - player provides 3 statements and the index of the lie
app.post('/player-turn/:gameId/:questionId', async (req, res) => {
  const { gameId, questionId } = req.params;
  const { statements, lieIndex } = req.body;
  const prompt = `Here are three statements from a player: 
        1. ${statements[0]}
        2. ${statements[1]}
        3. ${statements[2]}

        Which one is the lie? 
        I am going to parse your reply. 
        Your reply should strictly be 
        in the format {ai-reply:<one of the 3 sentences you think is a lie>, reason:<2 or 3 sentences on why you think this is a lie"> }`;

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

    const aiResponseText = aiResponse.data.choices[0].message.content.trim();

    // Regex to match the ai-reply and reason sections
    const regex = /{ai-reply:\s*(.*?)\s*,\s*reason:\s*(.*?)}/s;
    const match = aiResponseText.match(regex);

    if (match) {
      let aiReply = match[1].trim();  // Extract the lie statement
      const reason = match[2].trim();   // Extract the reason

      // Remove quotation marks from the AI's response
      aiReply = aiReply.replace(/^"|"$/g, '').trim();
      const correct = aiReply === statements[lieIndex]; // Check if AI's response matches the actual lie

      if (!gameSessions[gameId]) gameSessions[gameId] = {};
      gameSessions[gameId][questionId] = { statements, lieIndex };

      return res.json({
        aiReply,  // Send the exact lie statement
        reason,   // Send the reason
        correct
      });
    } else {
      return res.status(400).json({ error: 'Invalid AI response format' });
    }

  } catch (error) {
    console.error('AI error:', error.response?.data || error.message);
    res.status(500).json({ error: 'AI failed to respond' });
  }
});

// GET - server provides 2 truths and a lie from AI
app.get('/ai-turn/:gameId/:questionId', async (req, res) => {
  const { gameId, questionId } = req.params;
  const topics = ['animals', 'space', 'history', 'technology', 'food', 'travel', 'music'];
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];

  const prompt = `Give me 2 truths and 1 lie about ${randomTopic}. Label the lie as [LIE]. Format each statement on its own line.`;

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

    const rawText = aiResponse.data.choices[0].message.content;

    const cleanedLines = rawText
      .split('\n')
      .map(line => line.trim())
      .filter(line =>
        line && // non-empty
        !/^here are/i.test(line) && // skip intro like "Here are 2 truths..."
        !/let me know/i.test(line) && // skip outro
        /[.?!]$|(\[LIE\])/i.test(line) // line looks like a statement
      );

    const statements = cleanedLines
      .map(line => line.replace(/^[0-9]+\.\s*/, '').replace(/\[LIE\]/i, '').trim());

    const lieIndex = cleanedLines.findIndex(line => /\[LIE\]/i.test(line));

    if (statements.length !== 3 || lieIndex === -1) {
      return res.status(500).json({ error: 'Invalid AI response format', raw: rawText });
    }

    // Store in session
    if (!gameSessions[gameId]) gameSessions[gameId] = {};
    gameSessions[gameId][questionId] = { statements, lieIndex };

    res.json({ statements });
  } catch (error) {
    console.error('AI error:', error.response?.data || error.message);
    res.status(500).json({ error: 'AI failed to generate statements' });
  }
});


// POST - check player's guess for AI's question
app.post('/ai-turn/:gameId/:questionId/guess', (req, res) => {
  const { gameId, questionId } = req.params;
  const { guessIndex } = req.body;

  const session = gameSessions[gameId]?.[questionId];
  if (!session) {
    return res.status(400).json({ error: 'No AI turn found for this game/question' });
  }

  const correct = guessIndex === session.lieIndex;
  res.json({
    correct,
    lieIndex: session.lieIndex,
    actualLie: session.statements[session.lieIndex]
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
