const axios = require('axios');
const prompts = require('./_utils/prompts');
const { getAIResponse } = require('./_utils/ai');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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
    const aiResponse = await getAIResponse(prompt);
    console.log('AI response:', aiResponse);
    const responseData = aiResponse.data;
    console.log('AI response:', responseData);
    if (!responseData.choices || !responseData.choices[0]?.message?.content) {
      const errorMessage = responseData.error?.message || 'Unexpected AI response structure';
      return res.status(500).json({ error: `🤖 AI Error: ${errorMessage}` });
    }

    const aiResponseText = aiResponse.data.choices[0].message.content.trim();
    console.log('AI response text:', aiResponseText);
    const regex = /ai-reply:\s*(.*)\s*reason:\s*(.*)/s;
    const match = aiResponseText.match(regex);

    if (!match) {
      return res.status(400).json({ error: 'Invalid AI response format' });
    }

    let aiReply = match[1].trim().replace(/^"|"$/g, '');
    const reason = match[2].trim();

    const correct = aiReply.includes(statements[lieIndex].trim());

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
