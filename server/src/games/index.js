// games/index.js — registry of playable games. GameManager looks games up here,
// keeping the engine reusable across Texas History units.

import missionControl from './missionControl.js';

export const GAMES = {
  [missionControl.id]: missionControl,
};

export function getGame(id) {
  return GAMES[id] || null;
}
