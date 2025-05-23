let playerScore = 0;
let aiScore = 0;
let isPlayerTurn = true;
let gameId = crypto.randomUUID();
let questionId = 0;

const inputArea = document.getElementById('input-area');
const instructions = document.getElementById('instructions');
const submitBtn = document.getElementById('submit-btn');
const nextRoundBtn = document.getElementById('next-round-btn');
const results = document.getElementById('results');
const scoreboard = document.getElementById('scoreboard');
const API_BASE_URL = window.location.origin.includes('localhost')
  ? 'http://localhost:3000/api'
  : 'https://two-truths-and-a-lie-with-ai.vercel.app/api';

let encodedLieIndex = null;

function renderInputFields() {
  inputArea.innerHTML = '';
  results.innerText = '';

  if (isPlayerTurn) {
    instructions.innerText = 'Enter two truths and one lie. Select the lie.';
    for (let i = 0; i < 3; i++) {
      inputArea.innerHTML += `
        <div class="statement-block">
          <input type="radio" name="lie" value="${i}">
          <input type="text" id="stmt${i}" placeholder="Statement ${i + 1}" />
        </div>`;
    }
  } else {
    instructions.innerText = 'AI is preparing statements. Please wait...';

    fetch(`${API_BASE_URL}/ai-turn?gameId=${gameId}&questionId=${questionId}`)
    .then(async res => {
      const data = await res.json();
    
      if (!res.ok) {
        // Server returned error (e.g., 500 or 429)
        throw new Error(data.error || 'Unknown server error');
      }
    
      if (data.error) {
        // Server responded with error in payload
        throw new Error(data.error);
      }
      const { statements, encodedLieIndex: encoded } = data;
      encodedLieIndex = encoded;
      instructions.innerText = 'AI has provided its statements. Pick the lie.';
      inputArea.innerHTML = statements.map((s, i) => `
        <div class="statement-block">
          <input type="radio" name="guess" value="${i}">
          <span id="stmt${i}">${s}</span>
        </div>
      `).join('');

    })
    .catch(err => {
      console.error('Error during AI guess:', err);
      results.innerHTML = `
        <strong>❌ Error:</strong> ${err.message}<br>
        <em>The server failed to process your request. Please try again later.</em>
      `;
      submitBtn.disabled = true;
      nextRoundBtn.style.display = 'inline-block';
    });
  }
}

function handleSubmit() {
  if (isPlayerTurn) {
    const statements = [
      document.getElementById('stmt0').value,
      document.getElementById('stmt1').value,
      document.getElementById('stmt2').value
    ];
    const lieRadio = document.querySelector('input[name="lie"]:checked');
    if (!lieRadio) return alert('Please select the lie!');
    const lieIndex = parseInt(lieRadio.value);

    fetch(`${API_BASE_URL}/player-turn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statements, lieIndex, gameId, questionId })
    })
    .then(async res => {
      const data = await res.json();
    
      if (!res.ok) {
        // Server returned error (e.g., 500 or 429)
        throw new Error(data.error || 'Unknown server error');
      }
    
      if (data.error) {
        // Server responded with error in payload
        throw new Error(data.error);
      }
    
      const aiLie = data.aiReply;
      const reason = data.reason;
    
      results.innerHTML = `
        <strong>AI guessed:</strong> "${aiLie}"<br>
        <strong>Reason:</strong> ${reason}<br>
        <strong>${data.correct ? '✅ Correct!' : '❌ Incorrect!'}</strong>
      `;
    
      if (data.correct) aiScore++;
      updateScore();
      submitBtn.disabled = true;
      nextRoundBtn.style.display = 'inline-block';
      isPlayerTurn = false;
    })
    .catch(err => {
      console.error('Error during AI guess:', err);
      results.innerHTML = `
        <strong>❌ Error:</strong> ${err.message}<br>
        <em>The server failed to process your request. Please try again later.</em>
      `;
      submitBtn.disabled = true;
      nextRoundBtn.style.display = 'inline-block';
    });  
  } else {
    const statements = [
      document.getElementById('stmt0')?.textContent,
      document.getElementById('stmt1')?.textContent,
      document.getElementById('stmt2')?.textContent
    ];
    const selected = document.querySelector('input[name="guess"]:checked');
    if (!selected) return alert('Pick one!');
    const pickedIndex = parseInt(selected.value);

    fetch(`${API_BASE_URL}/guess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statements, guessIndex: pickedIndex, encodedLieIndex, gameId, questionId })
    })
    .then(res => res.json())
    .then(data => {
      const { correct, correctStatement } = data;
    
      results.innerHTML = `
        <strong>You guessed:</strong> Statement ${pickedIndex + 1}<br>
        <strong>${correct ? '✅ Correct!' : '❌ Incorrect!'}</strong><br>
        ${!correct ? `<strong>The correct lie was:</strong> "${correctStatement}"` : ''}
      `;    
      if (correct) playerScore++;
      updateScore();
      submitBtn.disabled = true;
      nextRoundBtn.style.display = 'inline-block';
      isPlayerTurn = true;
    })
    .catch(err => {
      console.error('Error checking guess:', err);
      results.innerHTML = '<strong>❌ Error checking your guess.</strong>';
    });
  }
}

function updateScore() {
  scoreboard.innerText = `Player: ${playerScore} | AI: ${aiScore}`;
  if (playerScore >= 5) {
    alert('🎉 You win!');
    resetGame();
  } else if (aiScore >= 5) {
    alert('🤖 AI wins!');
    resetGame();
  }
}

function resetGame() {
  playerScore = 0;
  aiScore = 0;
  questionId = 0;
  gameId = crypto.randomUUID();
  isPlayerTurn = true;
  renderInputFields();
  updateScore();
}

submitBtn.addEventListener('click', handleSubmit);
nextRoundBtn.addEventListener('click', () => {
  questionId++;
  submitBtn.disabled = false;
  nextRoundBtn.style.display = 'none';
  renderInputFields();
});

renderInputFields();
updateScore();
