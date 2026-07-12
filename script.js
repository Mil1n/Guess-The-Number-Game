const guessForm = document.querySelector('#guessForm');
const guessInput = document.querySelector('#guessInput');
const message = document.querySelector('#message');
const attemptsLabel = document.querySelector('#attemptsLabel');
const rangeLabel = document.querySelector('#rangeLabel');
const recordLabel = document.querySelector('#recordLabel');
const newGameButton = document.querySelector('#newGameButton');
const giveUpButton = document.querySelector('#giveUpButton');
const difficultySelect = document.querySelector('#difficultySelect');
const rangeForm = document.querySelector('#rangeForm');
const minInput = document.querySelector('#minInput');
const maxInput = document.querySelector('#maxInput');
const historyList = document.querySelector('#historyList');
const emptyHistory = document.querySelector('#emptyHistory');
const confettiLayer = document.querySelector('#confettiLayer');

const RECORDS_STORAGE_KEY = 'guess-number-best-records';
const LEGACY_RECORD_KEY = 'guess-number-best-record';
const difficultyLabels = {
  easy: 'Easy',
  normal: 'Normal',
  hard: 'Hard',
  expert: 'Expert',
};

let min = 1;
let max = 100;
let secret = 0;
let attempts = 0;
let maxAttempts = 0;
let isGameOver = false;
let difficulty = 'normal';
let bestRecords = loadRecords();
let guesses = new Set();
let previousDistance = null;

function loadRecords() {
  try {
    const records = JSON.parse(localStorage.getItem(RECORDS_STORAGE_KEY));

    if (records && typeof records === 'object') {
      return records;
    }
  } catch {
    // If localStorage contains invalid data, fall back to an empty record table.
  }

  const legacyRecord = Number(localStorage.getItem(LEGACY_RECORD_KEY));
  return legacyRecord ? { '1:100:normal': legacyRecord } : {};
}

function saveRecords() {
  localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(bestRecords));
}

function getRecordKey(from = min, to = max, mode = difficulty) {
  return `${from}:${to}:${mode}`;
}

function getCurrentRecord() {
  return bestRecords[getRecordKey()] || null;
}

function randomNumber(from, to) {
  return Math.floor(Math.random() * (to - from + 1)) + from;
}

function calculateBaseLimit(from, to) {
  const size = to - from + 1;
  return Math.max(3, Math.ceil(Math.log2(size)) + 1);
}

function calculateAttemptLimit(from, to, mode) {
  const baseLimit = calculateBaseLimit(from, to);

  if (mode === 'easy') {
    return baseLimit + 4;
  }

  if (mode === 'hard') {
    return Math.max(3, baseLimit - 1);
  }

  if (mode === 'expert') {
    return Math.max(3, baseLimit - 2);
  }

  return baseLimit;
}

function hasAttemptLimit() {
  return difficulty !== 'normal';
}

function getAttemptWord(count, accusative = false) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return accusative ? 'попытку' : 'попытка';
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return 'попытки';
  }

  return 'попыток';
}

function formatAttempts(count, accusative = false) {
  return `${count} ${getAttemptWord(count, accusative)}`;
}

function getTemperatureText(distance) {
  const rangeSize = max - min + 1;
  const ratio = distance / rangeSize;

  if (ratio <= 0.03) {
    return 'Обжигающе горячо 🔥';
  }

  if (ratio <= 0.08) {
    return 'Очень тепло 🌡️';
  }

  if (ratio <= 0.18) {
    return 'Теплее, чем кажется ✨';
  }

  if (ratio >= 0.45) {
    return 'Ледяной промах 🧊';
  }

  return 'Пока прохладно ❄️';
}

function getProgressText(distance) {
  if (previousDistance === null) {
    return 'Запоминаю первый ориентир.';
  }

  if (distance < previousDistance) {
    return 'Становится теплее.';
  }

  if (distance > previousDistance) {
    return 'Осторожно, стало холоднее.';
  }

  return 'Дистанция до цели почти не изменилась.';
}

function updateStats() {
  const currentRecord = getCurrentRecord();
  rangeLabel.textContent = `${min}–${max}`;
  attemptsLabel.textContent = hasAttemptLimit() ? `${attempts}/${maxAttempts}` : attempts;
  recordLabel.textContent = currentRecord ? formatAttempts(currentRecord) : '—';
  guessInput.min = min;
  guessInput.max = max;
}

function setMessage(text, state = '') {
  message.textContent = text;
  message.className = `message ${state}`.trim();
}

function renderHistory() {
  historyList.innerHTML = '';
  emptyHistory.hidden = guesses.size > 0;

  [...guesses].forEach((entry) => {
    const item = document.createElement('li');
    item.innerHTML = `<strong>${entry.value}</strong><span>${entry.hint}</span>`;
    historyList.prepend(item);
  });
}

function createConfetti() {
  confettiLayer.innerHTML = '';

  Array.from({ length: 28 }, (_, index) => {
    const piece = document.createElement('span');
    piece.style.setProperty('--x', `${Math.random() * 100}%`);
    piece.style.setProperty('--delay', `${Math.random() * 0.35}s`);
    piece.style.setProperty('--duration', `${1.4 + Math.random() * 0.8}s`);
    piece.style.setProperty('--hue', `${180 + Math.random() * 170}`);
    piece.style.setProperty('--rotation', `${Math.random() * 360}deg`);
    piece.setAttribute('aria-hidden', 'true');
    piece.dataset.index = String(index);
    confettiLayer.append(piece);
  });

  window.setTimeout(() => {
    confettiLayer.innerHTML = '';
  }, 2600);
}

function startGame(customMin = min, customMax = max) {
  min = customMin;
  max = customMax;
  difficulty = difficultySelect.value;
  secret = randomNumber(min, max);
  attempts = 0;
  maxAttempts = calculateAttemptLimit(min, max, difficulty);
  isGameOver = false;
  guesses = new Set();
  previousDistance = null;
  guessInput.disabled = false;
  guessForm.querySelector('button').disabled = false;
  giveUpButton.disabled = false;
  guessInput.value = '';
  guessInput.focus();
  updateStats();
  renderHistory();

  const limitText = hasAttemptLimit() ? ` Режим ${difficultyLabels[difficulty]}: у тебя ${maxAttempts} попыток.` : '';
  const expertText = difficulty === 'expert' ? ' В Expert подсказки направления скрыты — ориентируйся по температуре.' : '';
  setMessage(`Привет, игрок! Я загадал число от ${min} до ${max}.${limitText}${expertText} Сделай первый ход 🚀`);
}

function finishGame(text, state) {
  isGameOver = true;
  guessInput.disabled = true;
  guessForm.querySelector('button').disabled = true;
  giveUpButton.disabled = true;
  setMessage(text, state);
}

function handleWin() {
  const currentRecord = getCurrentRecord();

  if (!currentRecord || attempts < currentRecord) {
    bestRecords[getRecordKey()] = attempts;
    saveRecords();
  }

  updateStats();
  createConfetti();
  finishGame(
    `Бинго! Это число ${secret} 🎉 Ты справился за ${formatAttempts(attempts, true)}. Хочешь ещё раунд?`,
    'win',
  );
}

function addGuessToHistory(value, hint) {
  guesses.add({ value, hint });
  renderHistory();
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

  if ([...guesses].some((entry) => entry.value === guess)) {
    setMessage(`Ты уже пробовал число ${guess}. Повтор не засчитываю 👀`);
    guessInput.select();
    return;
  }

  attempts += 1;

  if (guess === secret) {
    addGuessToHistory(guess, 'Победа 🎉');
    handleWin();
    return;
  }

  const distance = Math.abs(secret - guess);
  const directionHint = guess < secret ? 'Слишком мало 🔽' : 'Слишком много 🔼';
  const temperatureHint = getTemperatureText(distance);
  const progressHint = getProgressText(distance);
  const visibleHint = difficulty === 'expert' ? temperatureHint : `${directionHint}. ${temperatureHint}`;

  addGuessToHistory(guess, visibleHint);

  if (hasAttemptLimit() && attempts >= maxAttempts) {
    updateStats();
    finishGame(
      `Режим ${difficultyLabels[difficulty]} безжалостен: попытки закончились 😵 Загаданное число было ${secret}. Нажми «Сыграть ещё» и возьми реванш!`,
      'lose',
    );
    return;
  }

  previousDistance = distance;

  const limitHint = hasAttemptLimit() ? ` Осталось: ${formatAttempts(maxAttempts - attempts)}.` : '';
  setMessage(`${visibleHint}. ${progressHint}${limitHint}`);
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
giveUpButton.addEventListener('click', () => {
  finishGame(`Раунд завершён. Я загадывал число ${secret}. Новый заход может стать победным 💪`, 'lose');
});
difficultySelect.addEventListener('change', () => startGame());
rangeForm.addEventListener('submit', handleRangeChange);

startGame();
