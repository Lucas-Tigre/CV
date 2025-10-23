// mocks/supabaseService.js
import { jest } from '@jest/globals';

export const getLeaderboard = jest.fn(async () => {
  return [
    { username: 'Jules', score: 1000 },
    { username: 'HAL', score: 900 },
  ];
});

export const submitScore = jest.fn(async () => {
  return {};
});
