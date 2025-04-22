const axios = require('axios');
const crypto = require('crypto');
const prompts = require('./_utils/prompts');
const { getAIResponse } = require('./_utils/ai');

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
    const aiResponse = getAIResponse(prompt);
    const responseData = aiResponse.data;
    console.log('AI response:', responseData);
    if (!responseData.choices || !responseData.choices[0]?.message?.content) {
      const errorMessage = responseData.error?.message || 'Unexpected AI response structure';
      return res.status(500).json({ error: `🤖 AI Error: ${errorMessage}` });
    }
    
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
