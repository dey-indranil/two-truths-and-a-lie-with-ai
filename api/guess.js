const crypto = require('crypto');

const HMAC_SECRET = process.env.HMAC_SECRET;

function encodeIndex(index, gameId, questionId) {
  const hmac = crypto.createHmac('sha256', HMAC_SECRET);
  hmac.update(`${gameId}:${questionId}:${index}`);
  return hmac.digest('hex');
}

module.exports = (req, res) => {
  const { gameId, questionId, guessIndex, encodedLieIndex } = req.body;

  const guessedByUser = encodeIndex(guessIndex, gameId, questionId);
  const correct = guessedByUser === encodedLieIndex;

  res.status(200).json({ correct });
};
