const assert = require('node:assert/strict');
const Game = require('../game-core');

assert.equal(Game.formatAttempts(1), '1 попытка');
assert.equal(Game.formatAttempts(2), '2 попытки');
assert.equal(Game.formatAttempts(5), '5 попыток');
assert.equal(Game.formatAttempts(11), '11 попыток');
assert.equal(Game.formatAttempts(21), '21 попытка');
assert.equal(Game.formatAttempts(1, true), '1 попытку');

assert.equal(Game.calculateAttemptLimit(1, 100, 'normal'), 8);
assert.equal(Game.calculateAttemptLimit(1, 100, 'easy'), 12);
assert.equal(Game.calculateAttemptLimit(1, 100, 'hard'), 7);
assert.equal(Game.calculateAttemptLimit(1, 100, 'expert'), 6);
assert.equal(Game.hasAttemptLimit('normal'), false);
assert.equal(Game.hasAttemptLimit('daily'), true);

assert.deepEqual(Game.updatePossibleRange({ low: 1, high: 100 }, 40, 75), { low: 41, high: 100 });
assert.deepEqual(Game.updatePossibleRange({ low: 41, high: 100 }, 80, 75), { low: 41, high: 79 });
assert.deepEqual(Game.updatePossibleRange({ low: 41, high: 79 }, 75, 75), { low: 75, high: 75 });

const daily = Game.getDailySecret(new Date('2026-07-18T00:00:00Z'), 1, 100);
assert.equal(daily, Game.getDailySecret(new Date('2026-07-18T23:59:59Z'), 1, 100));
assert.ok(daily >= 1 && daily <= 100);

let stats = Game.createEmptyStats();
stats = Game.recordGameResult(stats, true, 4);
stats = Game.recordGameResult(stats, false, 0);
stats = Game.recordGameResult(stats, true, 6);
assert.deepEqual(stats, {
  games: 3,
  wins: 2,
  currentStreak: 1,
  bestStreak: 1,
  totalWinningAttempts: 10,
});

console.log('game-core tests passed');
