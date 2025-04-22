const crypto = require('crypto');

const HMAC_SECRET = process.env.HMAC_SECRET;

function encodeIndex(index, gameId, questionId) {
  const hmac = crypto.createHmac('sha256', HMAC_SECRET);
  hmac.update(`${gameId}:${questionId}:${index}`);
  return hmac.digest('hex');
}
function decodeIndex(encodedLieIndex, gameId, questionId) {
  for (let i = 0; i < 3; i++) {
    const test = encodeIndex(i, gameId, questionId);
    if (test === encodedLieIndex) {
      return i;
    }
  }
  return -1; // In case of no match
}
module.exports = (req, res) => {
  const { statements, gameId, questionId, guessIndex, encodedLieIndex } = req.body;

  const actualLieIndex = decodeIndex(encodedLieIndex, gameId, questionId);
  if (actualLieIndex === -1) {
    return res.status(400).json({ error: 'Unable to decode the correct answer' });
  }
  const correct = guessIndex === actualLieIndex;
  const correctStatement = statements[actualLieIndex];

  res.status(200).json({
    correct,
    correctStatement
  });
};
