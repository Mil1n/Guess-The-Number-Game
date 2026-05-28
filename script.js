const guessForm = document.querySelector('#guessForm');
const guessInput = document.querySelector('#guessInput');
const message = document.querySelector('#message');
const attemptsLabel = document.querySelector('#attemptsLabel');
const rangeLabel = document.querySelector('#rangeLabel');
const recordLabel = document.querySelector('#recordLabel');
const newGameButton = document.querySelector('#newGameButton');
const hardModeButton = document.querySelector('#hardModeButton');
const rangeForm = document.querySelector('#rangeForm');
const minInput = document.querySelector('#minInput');
const maxInput = document.querySelector('#maxInput');

let min = 1;
let max = 100;
let secret = 0;
let attempts = 0;
let hardMode = false;
let maxAttempts = 0;
let isGameOver = false;
let bestRecord = Number(localStorage.getItem('guess-number-best-record')) || null;

function randomNumber(from, to) {
  return Math.floor(Math.random() * (to - from + 1)) + from;
}

function calculateHardLimit(from, to) {
  const size = to - from + 1;
  return Math.max(3, Math.ceil(Math.log2(size)) + 1);
}

function updateStats() {
  rangeLabel.textContent = `${min}–${max}`;
  attemptsLabel.textContent = hardMode ? `${attempts}/${maxAttempts}` : attempts;
  recordLabel.textContent = bestRecord ? `${bestRecord} попыт.` : '—';
  guessInput.min = min;
  guessInput.max = max;
}

function setMessage(text, state = '') {
  message.textContent = text;
  message.className = `message ${state}`.trim();
}

function startGame(customMin = min, customMax = max) {
  min = customMin;
  max = customMax;
  secret = randomNumber(min, max);
  attempts = 0;
  maxAttempts = calculateHardLimit(min, max);
  isGameOver = false;
  guessInput.disabled = false;
  guessForm.querySelector('button').disabled = false;
  guessInput.value = '';
  guessInput.focus();
  updateStats();

  const hardText = hardMode ? ` Hard Mode включён: у тебя ${maxAttempts} попыток.` : '';
  setMessage(`Привет, игрок! Я загадал число от ${min} до ${max}.${hardText} Сделай первый ход 🚀`);
}

function finishGame(text, state) {
  isGameOver = true;
  guessInput.disabled = true;
  guessForm.querySelector('button').disabled = true;
  setMessage(text, state);
}

function handleWin() {
  if (!bestRecord || attempts < bestRecord) {
    bestRecord = attempts;
    localStorage.setItem('guess-number-best-record', String(bestRecord));
  }

  updateStats();
  finishGame(
    `Бинго! Это число ${secret} 🎉 Ты справился за ${attempts} попытк${attempts === 1 ? 'у' : 'и'}. Хочешь ещё раунд?`,
    'win',
  );
}

function handleGuess(event) {
  event.preventDefault();

  if (isGameOver) {
    return;
  }

  const guess = Number(guessInput.value);

  if (!Number.isInteger(guess) || guess < min || guess > max) {
    setMessage(`Держим фокус: введи целое число от ${min} до ${max} 🎯`);
    return;
  }

  attempts += 1;

  if (guess === secret) {
    handleWin();
    return;
  }

  if (hardMode && attempts >= maxAttempts) {
    updateStats();
    finishGame(`Hard Mode безжалостен: попытки закончились 😵 Нажми «Сыграть ещё» и возьми реванш!`, 'lose');
    return;
  }

  const hint = guess < secret ? 'Слишком мало 🔽' : 'Слишком много 🔼';
  const hardHint = hardMode ? ` Осталось попыток: ${maxAttempts - attempts}.` : '';
  setMessage(`${hint} Интрига рядом, пробуй ещё!${hardHint}`);
  guessInput.select();
  updateStats();
}

function handleRangeChange(event) {
  event.preventDefault();

  const nextMin = Number(minInput.value);
  const nextMax = Number(maxInput.value);

  if (!Number.isInteger(nextMin) || !Number.isInteger(nextMax) || nextMin >= nextMax) {
    setMessage('Диапазон должен быть из целых чисел, где «От» меньше «До» ⚙️');
    return;
  }

  startGame(nextMin, nextMax);
}

guessForm.addEventListener('submit', handleGuess);
newGameButton.addEventListener('click', () => startGame());
hardModeButton.addEventListener('click', () => {
  hardMode = !hardMode;
  hardModeButton.textContent = `Hard Mode: ${hardMode ? 'вкл' : 'выкл'}`;
  startGame();
});
rangeForm.addEventListener('submit', handleRangeChange);

startGame();
