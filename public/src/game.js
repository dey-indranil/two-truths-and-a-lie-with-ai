let playerScore = 0;
let aiScore = 0;
let isPlayerTurn = true;

const inputArea = document.getElementById('input-area');
const instructions = document.getElementById('instructions');
const submitBtn = document.getElementById('submit-btn');
const nextRoundBtn = document.getElementById('next-round-btn'); // ✅ Fix: declare this!
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
    instructions.innerText = 'AI is preparing statements. Please wait...';

    fetch('/ai-turn')
      .then(res => res.json())
      .then(data => {
        const statements = data.statements;
        inputArea.innerHTML = statements.map((s, i) => 
          `<div>
            <input type="radio" name="guess" value="${i}"> ${s}
          </div>`
        ).join('');
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
    if (!lieRadio) {
      alert('Please select which one is the lie!');
      return;
    }
    const lieIndex = parseInt(lieRadio.value);
    const prompt = `These are 3 statements: ${statements.join(' | ')}. Guess which one is a lie.`;

    fetch('/player-turn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, statements, lieIndex })
    })
    .then(res => res.json())
    .then(data => {
      const guessNum = data.aiGuessIndex;
      results.innerHTML = `
        <strong>AI guessed:</strong> Statement ${guessNum} - "${data.aiGuess}"<br>
        <strong>Reason:</strong> ${data.reason}<br>
        <strong>${data.correct ? '✅ Correct!' : '❌ Incorrect!'}</strong>
      `;
      if (data.correct) aiScore++;
      updateScore();
      isPlayerTurn = false;
      submitBtn.disabled = true;
      nextRoundBtn.style.display = 'inline-block';
    });
  } else {
    const selected = document.querySelector('input[name="guess"]:checked');
    if (!selected) return alert('Pick one!');
    const pickedIndex = parseInt(selected.value);
    if (pickedIndex === 2) playerScore++; // TODO: make AI lie tracking more dynamic
    results.innerText = 'You guessed: Statement ' + (pickedIndex + 1);
    updateScore();
    isPlayerTurn = true;
    submitBtn.disabled = true;
    nextRoundBtn.style.display = 'inline-block';
  }
}


function updateScore() {
  scoreboard.innerText = `Player: ${playerScore} | AI: ${aiScore}`;
  if (playerScore >= 5) {
    alert('You win!');
    resetGame();
  } else if (aiScore >= 5) {
    alert('AI wins!');
    resetGame();
  }
}

function resetGame() {
  playerScore = 0;
  aiScore = 0;
  isPlayerTurn = true;
  renderInputFields();
  updateScore();
}

submitBtn.addEventListener('click', handleSubmit);

nextRoundBtn.addEventListener('click', () => {
  nextRoundBtn.style.display = 'none';
  submitBtn.disabled = false;
  renderInputFields();
});

renderInputFields();
updateScore();
