const axios = require('axios');
const crypto = require('crypto');
const prompts = require('./_utils/prompts');

const HMAC_SECRET = process.env.HMAC_SECRET;

function encodeIndex(index, gameId, questionId) {
  const hmac = crypto.createHmac('sha256', HMAC_SECRET);
  hmac.update(`${gameId}:${questionId}:${index}`);
  return hmac.digest('hex');
}

module.exports = async (req, res) => {
  const { gameId, questionId } = req.query;

  const topics = ['animals', 'space', 'history', 'technology', 'food', 'travel', 'music'];
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];
  const prompt = prompts.aiTurnPrompt(randomTopic);

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

    const encodedLieIndex = encodeIndex(lieIndex, gameId, questionId);
    res.status(200).json({ statements, encodedLieIndex });
  } catch (error) {
    console.error('AI error:', error.response?.data || error.message);
    res.status(500).json({ error: 'AI failed to generate statements' });
  }
};
