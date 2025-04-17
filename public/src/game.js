let playerScore = 0;
let aiScore = 0;
let isPlayerTurn = true;

const inputArea = document.getElementById('input-area');
const instructions = document.getElementById('instructions');
const submitBtn = document.getElementById('submit-btn');
const results = document.getElementById('results');
const scoreboard = document.getElementById('scoreboard');

function renderInputFields() {
  inputArea.innerHTML = '';
  results.innerText = '';
  if (isPlayerTurn) {
    instructions.innerText = 'Enter two truths and one lie. AI will try to guess the lie.';
    for (let i = 0; i < 3; i++) {
      inputArea.innerHTML += `<input type="text" id="stmt${i}" placeholder="Statement ${i + 1}"><br>`;
    }
  } else {
    instructions.innerText = 'AI is preparing statements. Please wait...';
    fetch('/ask-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Give me two truths and one lie. Label the lie as LIE:' })
    })
    .then(res => res.json())
    .then(data => {
      const statements = data.answer.match(/- (.*?)(?=\n|$)/g) || data.answer.split('\n');
      inputArea.innerHTML = statements.map((s, i) => `<div><input type="radio" name="guess" value="${i}"> ${s}</div>`).join('');
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
    const prompt = `These are 3 statements: ${statements.join(' | ')}. Guess which one is a lie.`;
    fetch('/ask-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    })
    .then(res => res.json())
    .then(data => {
      results.innerText = `AI guessed: "${data.answer}"`;
      if (data.answer.includes('1') || data.answer.includes(statements[0])) aiScore++;
      updateScore();
      isPlayerTurn = false;
      renderInputFields();
    });
  } else {
    const selected = document.querySelector('input[name="guess"]:checked');
    if (!selected) return alert('Pick one!');
    const pickedIndex = parseInt(selected.value);
    // We'll assume AI lies on last one for now
    if (pickedIndex === 2) playerScore++;
    results.innerText = 'You guessed: ' + pickedIndex;
    updateScore();
    isPlayerTurn = true;
    renderInputFields();
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
renderInputFields();
updateScore();
