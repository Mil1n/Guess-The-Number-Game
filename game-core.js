(function exposeGameCore(global) {
  const difficultyLabels = {
    easy: 'Easy',
    normal: 'Normal',
    hard: 'Hard',
    expert: 'Expert',
    daily: 'Daily',
  };

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

    if (mode === 'expert' || mode === 'daily') {
      return Math.max(3, baseLimit - 2);
    }

    return baseLimit;
  }

  function hasAttemptLimit(mode) {
    return mode !== 'normal';
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

  function getRecordKey(from, to, mode) {
    return `${from}:${to}:${mode}`;
  }

  function getTemperatureText(distance, from, to) {
    const rangeSize = to - from + 1;
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

  function getProgressText(distance, previousDistance) {
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

  function updatePossibleRange(currentRange, guess, secret) {
    if (guess < secret) {
      return { low: Math.max(currentRange.low, guess + 1), high: currentRange.high };
    }

    if (guess > secret) {
      return { low: currentRange.low, high: Math.min(currentRange.high, guess - 1) };
    }

    return { low: guess, high: guess };
  }

  function hashString(value) {
    let hash = 2166136261;

    for (const character of value) {
      hash ^= character.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
  }

  function getDailySecret(date, from = 1, to = 100) {
    const key = date.toISOString().slice(0, 10);
    return from + (hashString(key) % (to - from + 1));
  }

  function createEmptyStats() {
    return {
      games: 0,
      wins: 0,
      currentStreak: 0,
      bestStreak: 0,
      totalWinningAttempts: 0,
    };
  }

  function recordGameResult(stats, didWin, attempts) {
    const nextStats = { ...createEmptyStats(), ...stats };
    nextStats.games += 1;

    if (didWin) {
      nextStats.wins += 1;
      nextStats.currentStreak += 1;
      nextStats.bestStreak = Math.max(nextStats.bestStreak, nextStats.currentStreak);
      nextStats.totalWinningAttempts += attempts;
    } else {
      nextStats.currentStreak = 0;
    }

    return nextStats;
  }

  const api = {
    difficultyLabels,
    randomNumber,
    calculateBaseLimit,
    calculateAttemptLimit,
    hasAttemptLimit,
    getAttemptWord,
    formatAttempts,
    getRecordKey,
    getTemperatureText,
    getProgressText,
    updatePossibleRange,
    getDailySecret,
    createEmptyStats,
    recordGameResult,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.GameCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
