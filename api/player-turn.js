const axios = require('axios');
const prompts = require('./_utils/prompts');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { gameId, questionId } = req.query;
  const { statements, lieIndex } = req.body;

  if (!statements || lieIndex === undefined) {
    return res.status(400).json({ error: 'Missing statements or lieIndex' });
  }

  const prompt = prompts.playerTurnPrompt(statements);

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

    const regex = /{ai-reply:\s*(.*?)\s*,\s*reason:\s*(.*?)}/s;
    const match = aiResponseText.match(regex);

    if (!match) {
      return res.status(400).json({ error: 'Invalid AI response format' });
    }

    let aiReply = match[1].trim().replace(/^"|"$/g, '');
    const reason = match[2].trim();

    const correct = aiReply === statements[lieIndex];

    res.json({
      gameId,
      questionId,
      aiReply,
      reason,
      correct
    });
  } catch (error) {
    console.error('AI error:', error.response?.data || error.message);
    res.status(500).json({ error: 'AI failed to respond' });
  }
};
