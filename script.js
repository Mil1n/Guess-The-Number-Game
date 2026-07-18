const guessForm = document.querySelector('#guessForm');
const guessInput = document.querySelector('#guessInput');
const message = document.querySelector('#message');
const attemptsLabel = document.querySelector('#attemptsLabel');
const rangeLabel = document.querySelector('#rangeLabel');
const modeLabel = document.querySelector('#modeLabel');
const recordLabel = document.querySelector('#recordLabel');
const newGameButton = document.querySelector('#newGameButton');
const giveUpButton = document.querySelector('#giveUpButton');
const dailyButton = document.querySelector('#dailyButton');
const difficultySelect = document.querySelector('#difficultySelect');
const rangeForm = document.querySelector('#rangeForm');
const minInput = document.querySelector('#minInput');
const maxInput = document.querySelector('#maxInput');
const historyList = document.querySelector('#historyList');
const emptyHistory = document.querySelector('#emptyHistory');
const possibleRangeLabel = document.querySelector('#possibleRangeLabel');
const recordsTableBody = document.querySelector('#recordsTableBody');
const noRecordsRow = document.querySelector('#noRecordsRow');
const gamesLabel = document.querySelector('#gamesLabel');
const winRateLabel = document.querySelector('#winRateLabel');
const streakLabel = document.querySelector('#streakLabel');
const averageAttemptsLabel = document.querySelector('#averageAttemptsLabel');
const confettiLayer = document.querySelector('#confettiLayer');

const RECORDS_STORAGE_KEY = 'guess-number-best-records';
const LEGACY_RECORD_KEY = 'guess-number-best-record';
const STATS_STORAGE_KEY = 'guess-number-stats';
const Game = window.GameCore;

let min = 1;
let max = 100;
let secret = 0;
let attempts = 0;
let maxAttempts = 0;
let isGameOver = false;
let difficulty = 'normal';
let bestRecords = loadRecords();
let playerStats = loadStats();
let guessHistory = [];
let guessedNumbers = new Set();
let previousDistance = null;
let possibleRange = { low: min, high: max };

function safelyReadJson(key, fallback) {
  const rawValue = localStorage.getItem(key);

  if (!rawValue) {
    return fallback;
  }

  try {
    return JSON.parse(rawValue) || fallback;
  } catch {
    return fallback;
  }
}

function loadRecords() {
  const records = safelyReadJson(RECORDS_STORAGE_KEY, null);

  if (records && typeof records === 'object') {
    return records;
  }

  const legacyRecord = Number(localStorage.getItem(LEGACY_RECORD_KEY));
  return legacyRecord ? { '1:100:normal': legacyRecord } : {};
}

function loadStats() {
  return { ...Game.createEmptyStats(), ...safelyReadJson(STATS_STORAGE_KEY, {}) };
}

function saveRecords() {
  localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(bestRecords));
}

function saveStats() {
  localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(playerStats));
}

function getCurrentRecord() {
  return bestRecords[Game.getRecordKey(min, max, difficulty)] || null;
}

function getModeText() {
  return Game.difficultyLabels[difficulty];
}

function getStartMessage() {
  const limitText = Game.hasAttemptLimit(difficulty) ? ` У тебя ${maxAttempts} попыток.` : ' Лимита попыток нет.';
  const expertText = difficulty === 'expert' ? ' Направление скрыто — ориентируйся по температуре.' : '';
  const dailyText = difficulty === 'daily' ? ' Это ежедневный челлендж с одинаковым числом для сегодняшней даты.' : '';

  return `Я загадал число от ${min} до ${max}. Режим ${getModeText()}.${limitText}${expertText}${dailyText} Сделай первый ход 🚀`;
}

function getWinMessage() {
  const idealAttempts = Game.calculateBaseLimit(min, max);
  return `Бинго! Это число ${secret} 🎉 Ты справился за ${Game.formatAttempts(attempts, true)}. Оптимальная стратегия укладывается примерно в ${Game.formatAttempts(idealAttempts)}.`;
}

function getLoseMessage() {
  return `Режим ${getModeText()} безжалостен: попытки закончились 😵 Загаданное число было ${secret}. Нажми «Сыграть ещё» и возьми реванш!`;
}

function updateStats() {
  const currentRecord = getCurrentRecord();
  rangeLabel.textContent = `${min}–${max}`;
  modeLabel.textContent = getModeText();
  attemptsLabel.textContent = Game.hasAttemptLimit(difficulty) ? `${attempts}/${maxAttempts}` : attempts;
  recordLabel.textContent = currentRecord ? Game.formatAttempts(currentRecord) : '—';
  possibleRangeLabel.textContent = `${possibleRange.low}–${possibleRange.high}`;
  guessInput.min = min;
  guessInput.max = max;
}

function updatePlayerStats() {
  const winRate = playerStats.games ? Math.round((playerStats.wins / playerStats.games) * 100) : 0;
  const averageAttempts = playerStats.wins ? (playerStats.totalWinningAttempts / playerStats.wins).toFixed(1) : '—';

  gamesLabel.textContent = playerStats.games;
  winRateLabel.textContent = `${winRate}%`;
  streakLabel.textContent = `${playerStats.currentStreak}/${playerStats.bestStreak}`;
  averageAttemptsLabel.textContent = averageAttempts;
}

function renderRecords() {
  const entries = Object.entries(bestRecords).sort(([firstKey], [secondKey]) => firstKey.localeCompare(secondKey));
  recordsTableBody.innerHTML = '';
  noRecordsRow.hidden = entries.length > 0;

  entries.forEach(([key, record]) => {
    const [from, to, mode] = key.split(':');
    const row = document.createElement('tr');
    row.innerHTML = `<td>${from}–${to}</td><td>${Game.difficultyLabels[mode] || mode}</td><td>${Game.formatAttempts(record)}</td>`;
    recordsTableBody.append(row);
  });
}

function setMessage(text, state = '') {
  message.textContent = text;
  message.className = `message ${state}`.trim();
}

function renderHistory() {
  historyList.innerHTML = '';
  emptyHistory.hidden = guessHistory.length > 0;

  guessHistory.forEach((entry) => {
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

function completeRound(didWin) {
  playerStats = Game.recordGameResult(playerStats, didWin, attempts);
  saveStats();
  updatePlayerStats();
}

function startGame(customMin = min, customMax = max, customDifficulty = difficultySelect.value) {
  min = customMin;
  max = customMax;
  difficulty = customDifficulty;
  difficultySelect.value = difficulty === 'daily' ? 'normal' : difficulty;
  secret = difficulty === 'daily' ? Game.getDailySecret(new Date(), min, max) : Game.randomNumber(min, max);
  attempts = 0;
  maxAttempts = Game.calculateAttemptLimit(min, max, difficulty);
  isGameOver = false;
  guessHistory = [];
  guessedNumbers = new Set();
  previousDistance = null;
  possibleRange = { low: min, high: max };
  guessInput.disabled = false;
  guessForm.querySelector('button').disabled = false;
  giveUpButton.disabled = false;
  guessInput.value = '';
  guessInput.focus();
  updateStats();
  updatePlayerStats();
  renderRecords();
  renderHistory();
  setMessage(getStartMessage());
}

function finishGame(text, state) {
  isGameOver = true;
  guessInput.disabled = true;
  guessForm.querySelector('button').disabled = true;
  giveUpButton.disabled = true;
  setMessage(text, state);
}

function handleWin() {
  const recordKey = Game.getRecordKey(min, max, difficulty);
  const currentRecord = getCurrentRecord();

  if (!currentRecord || attempts < currentRecord) {
    bestRecords[recordKey] = attempts;
    saveRecords();
  }

  completeRound(true);
  updateStats();
  renderRecords();
  createConfetti();
  finishGame(getWinMessage(), 'win');
}

function addGuessToHistory(value, hint) {
  guessHistory.push({ value, hint });
  guessedNumbers.add(value);
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

  if (guessedNumbers.has(guess)) {
    setMessage(`Ты уже пробовал число ${guess}. Повтор не засчитываю 👀`);
    guessInput.select();
    return;
  }

  attempts += 1;

  if (guess === secret) {
    addGuessToHistory(guess, 'Победа 🎉');
    possibleRange = Game.updatePossibleRange(possibleRange, guess, secret);
    handleWin();
    return;
  }

  const distance = Math.abs(secret - guess);
  const directionHint = guess < secret ? 'Слишком мало 🔽' : 'Слишком много 🔼';
  const temperatureHint = Game.getTemperatureText(distance, min, max);
  const progressHint = Game.getProgressText(distance, previousDistance);
  const visibleHint = difficulty === 'expert' || difficulty === 'daily' ? temperatureHint : `${directionHint}. ${temperatureHint}`;

  possibleRange = Game.updatePossibleRange(possibleRange, guess, secret);
  addGuessToHistory(guess, `${visibleHint}. Возможный диапазон: ${possibleRange.low}–${possibleRange.high}`);

  if (Game.hasAttemptLimit(difficulty) && attempts >= maxAttempts) {
    completeRound(false);
    updateStats();
    finishGame(getLoseMessage(), 'lose');
    return;
  }

  previousDistance = distance;

  const limitHint = Game.hasAttemptLimit(difficulty) ? ` Осталось: ${Game.formatAttempts(maxAttempts - attempts)}.` : '';
  setMessage(`${visibleHint}. ${progressHint} Возможный диапазон: ${possibleRange.low}–${possibleRange.high}.${limitHint}`);
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

  startGame(nextMin, nextMax, difficultySelect.value);
}

function handleGiveUp() {
  completeRound(false);
  finishGame(`Раунд завершён. Я загадывал число ${secret}. Новый заход может стать победным 💪`, 'lose');
}

function handleShortcut(event) {
  if (event.key === 'Escape') {
    guessInput.value = '';
    guessInput.focus();
  }

  if (event.key.toLowerCase() === 'n' && event.altKey) {
    event.preventDefault();
    startGame();
  }

  if (event.key.toLowerCase() === 'd' && event.altKey) {
    event.preventDefault();
    startGame(1, 100, 'daily');
  }
}

guessForm.addEventListener('submit', handleGuess);
newGameButton.addEventListener('click', () => startGame());
giveUpButton.addEventListener('click', handleGiveUp);
dailyButton.addEventListener('click', () => startGame(1, 100, 'daily'));
difficultySelect.addEventListener('change', () => startGame(min, max, difficultySelect.value));
rangeForm.addEventListener('submit', handleRangeChange);
document.addEventListener('keydown', handleShortcut);

startGame();
