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
    // Show temporary loading message
    instructions.innerText = 'AI is preparing statements. Please wait...';

    fetch(`/ai-turn/${gameId}/${questionId}`)
      .then(res => res.json())
      .then(data => {
        const { intro, statements } = data;

        // Replace instructions with AI intro
        instructions.innerText = intro || 'AI has provided its statements. Pick the lie.';

        // Render AI statements with radio buttons
        inputArea.innerHTML = statements.map((s, i) => `
          <div class="statement-block">
            <input type="radio" name="guess" value="${i}">
            <span>${s}</span>
          </div>
        `).join('');
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

    fetch(`/player-turn/${gameId}/${questionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statements, lieIndex })
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
    const selected = document.querySelector('input[name="guess"]:checked');
    if (!selected) return alert('Pick one!');
    const pickedIndex = parseInt(selected.value);

    fetch(`/ai-turn/${gameId}/${questionId}/guess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guessIndex: pickedIndex })
    })
    .then(res => res.json())
    .then(data => {
      results.innerHTML = `
        <strong>You guessed:</strong> Statement ${pickedIndex + 1}<br>
        <strong>Actual lie:</strong> "${data.actualLie}"<br>
        <strong>${data.correct ? '✅ Correct!' : '❌ Incorrect!'}</strong>
      `;
      if (data.correct) playerScore++;
      updateScore();
      submitBtn.disabled = true;
      nextRoundBtn.style.display = 'inline-block';
      isPlayerTurn = true;
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
