// The screenshot scenes behind ?shot=title|play|win|loss. Each one plays the real
// rules forward from a fresh world, steered by the autopilots, so the frame is
// what a real duel looks like — and the same seed always gives the same frame.
// A scene that does not land (a match ending early, the wrong winner) is tried
// again from the next shuffle; the RNG is seeded, so the retries are repeatable.

import { PHASE_OVER, PHASE_RESULT } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

/** Play on until the match reaches the given phase and trick, or it ends. */
function playTo(world, skill, rivalSkill, minTrick, wantPhase) {
  world.setRivalSkill(rivalSkill);
  return world.runUntil(
    (state) => state.phase === wantPhase && state.trick >= minTrick,
    skill,
    rivalSkill,
  );
}

function stagePlay(world) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    world.reset();
    const landed = playTo(world, 'best', 'best', 4, PHASE_RESULT);
    if (landed && world.state.phase === PHASE_RESULT) {
      return { screen: SCREEN_PLAY, wins: 0, played: 0 };
    }
  }
  world.reset();
  playTo(world, 'best', 'best', 1, PHASE_RESULT);
  return { screen: SCREEN_PLAY, wins: 0, played: 0 };
}

function stageOver(world, wantWinner, youSkill, rivalSkill) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    world.reset();
    world.setRivalSkill(rivalSkill);
    const ended = world.runUntil(
      (state) => state.phase === PHASE_OVER && state.trick >= 5,
      youSkill,
      rivalSkill,
    );
    if (ended && world.state.winner === wantWinner) {
      return { screen: SCREEN_OVER, wins: wantWinner === 'you' ? 1 : 0, played: 1 };
    }
  }
  // Last resort: the duel as it fell, whatever the winner — still a real frame.
  world.reset();
  world.setRivalSkill(rivalSkill);
  world.runUntil((state) => state.phase === PHASE_OVER, youSkill, rivalSkill);
  return {
    screen: SCREEN_OVER,
    wins: world.state.winner === 'you' ? 1 : 0,
    played: 1,
  };
}

/**
 * Set `world` to the named scene and return the screen to draw over it and the
 * win record to show. Any other name is the title.
 */
export function stageShot(name, world) {
  if (name === 'play') return stagePlay(world);
  if (name === 'win') return stageOver(world, 'you', 'best', 'random');
  if (name === 'loss') return stageOver(world, 'foe', 'worst', 'best');
  world.reset();
  return { screen: SCREEN_TITLE, wins: 0, played: 0 };
}
