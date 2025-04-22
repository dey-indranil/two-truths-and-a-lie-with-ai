const axios = require('axios');

async function getAIResponse(prompt) {
  const useLocalAI = process.env.USE_LOCAL_AI === 'true';
  console.log('Using local AI:', useLocalAI);
  if (useLocalAI) {
    // Local Ollama
    const res = await axios.post('http://localhost:11434/api/generate', {
      model: 'llama3.1:latest',
      prompt,
      stream: false
    });

    return res;
  } else {
    // OpenRouter (cloud)
    const res = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
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

    return res;
  }
}

module.exports = { getAIResponse };
