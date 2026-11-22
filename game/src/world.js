// The match itself: the shared deck, the two hands, the life totals, the tricks
// and the phases between them. No drawing and no browser here, so the same code
// runs the live game, the autopilot and the screenshot scenes.
// Phases: 'choose' (waiting for the player's card), 'reveal' (cards fly to the
// table), 'result' (the banner and the damage land), 'over' (someone is at 0).

import {
  HAND_SIZE,
  REVEAL_SECONDS,
  RESULT_SECONDS,
  START_LIFE,
} from './config.js';
import { buildDeck, cardKey, shuffleDeck } from './deck.js';
import { bestCardIndex, resolveTrick, worstCardIndex } from './rules.js';
import { pickInt } from './random.js';

export const PHASE_CHOOSE = 'choose';
export const PHASE_REVEAL = 'reveal';
export const PHASE_RESULT = 'result';
export const PHASE_OVER = 'over';

/** The cards the foe could still hold: everything not in a known hand or played. */
export function unknownCards(state) {
  const known = new Set();
  for (const card of state.youHand) known.add(card.id);
  for (const card of state.foeHand) known.add(card.id);
  for (const card of state.discard) known.add(card.id);
  if (state.youPlayed) known.add(state.youPlayed.id);
  if (state.foePlayed) known.add(state.foePlayed.id);
  const all = buildDeck();
  return all.filter((card) => !known.has(card.id));
}

export function createWorld(random) {
  const state = {
    youLife: START_LIFE,
    foeLife: START_LIFE,
    youHand: [],
    foeHand: [],
    deck: [],
    discard: [],
    trick: 1,
    phase: PHASE_CHOOSE,
    phaseTime: 0,
    youPlayed: null,
    foePlayed: null,
    result: null,
    log: [],
    winner: null,
    tricksWon: 0,
    tricksLost: 0,
  };

  function drawInto(hand) {
    if (state.deck.length === 0) {
      if (state.discard.length === 0) return;
      state.deck = shuffleDeck(state.discard.splice(0), random);
    }
    hand.push(state.deck.pop());
    hand.sort((a, b) => cardKey(a) - cardKey(b));
  }

  function reset() {
    state.youLife = START_LIFE;
    state.foeLife = START_LIFE;
    rivalSkill = 'best';
    state.deck = shuffleDeck(buildDeck(), random);
    state.discard = [];
    state.youHand = [];
    state.foeHand = [];
    state.trick = 1;
    state.phase = PHASE_CHOOSE;
    state.phaseTime = 0;
    state.youPlayed = null;
    state.foePlayed = null;
    state.result = null;
    state.log = ['The court is set. Twenty life each — play a card to open.'];
    state.winner = null;
    state.tricksWon = 0;
    state.tricksLost = 0;
    for (let i = 0; i < HAND_SIZE; i += 1) {
      drawInto(state.youHand);
      drawInto(state.foeHand);
    }
  }

  /** The rival picks a card: the best blind play, with a little nerve. */
  let rivalSkill = 'best';
  function setRivalSkill(skill) {
    rivalSkill = skill;
  }

  function rivalChoose() {
    const pool = unknownCards(state);
    if (rivalSkill === 'random') return pickInt(random, state.foeHand.length);
    if (rivalSkill === 'worst') return worstCardIndex(state.foeHand, pool, random);
    return bestCardIndex(state.foeHand, pool, random);
  }

  /** Play the player's card at `index`; the rival answers at once. */
  function playCard(index) {
    if (state.phase !== PHASE_CHOOSE) return false;
    if (index < 0 || index >= state.youHand.length) return false;
    const foeIndex = rivalChoose();
    state.foePlayed = state.foeHand.splice(foeIndex, 1)[0];
    state.youPlayed = state.youHand.splice(index, 1)[0];
    state.phase = PHASE_REVEAL;
    state.phaseTime = 0;
    return true;
  }

  /** Let the autopilot play for the player: 'best', 'random' or 'worst'. */
  function autoPlay(skill) {
    if (state.phase !== PHASE_CHOOSE) return false;
    const pool = unknownCards(state);
    let index;
    if (skill === 'worst') index = worstCardIndex(state.youHand, pool, random);
    else if (skill === 'random') index = pickInt(random, state.youHand.length);
    else index = bestCardIndex(state.youHand, pool, random);
    return playCard(index);
  }

  /** Settle the trick on the table: damage, healing, the log, the next draw. */
  function settleTrick() {
    const result = resolveTrick(state.youPlayed, state.foePlayed);
    state.result = result;
    state.youLife = Math.max(0, state.youLife - result.damageToYou + result.healYou);
    state.foeLife = Math.max(0, state.foeLife - result.damageToFoe + result.healFoe);
    if (state.youLife > START_LIFE) state.youLife = START_LIFE;
    if (state.foeLife > START_LIFE) state.foeLife = START_LIFE;
    if (result.winner === 'you') state.tricksWon += 1;
    else if (result.winner === 'foe') state.tricksLost += 1;
    state.log.push(...result.lines);
    if (state.log.length > 6) state.log.splice(0, state.log.length - 6);
  }

  function finishTrick() {
    const result = state.result;
    state.discard.push(state.youPlayed, state.foePlayed);
    state.youPlayed = null;
    state.foePlayed = null;
    state.result = null;
    if (state.youLife <= 0 || state.foeLife <= 0) {
      state.winner = state.youLife <= 0 ? 'foe' : 'you';
      state.phase = PHASE_OVER;
      state.phaseTime = 0;
      state.log.push(
        state.winner === 'you'
          ? 'Victory — the court is yours.'
          : 'Defeat — the embers fade.',
      );
      return;
    }
    drawInto(state.youHand);
    drawInto(state.foeHand);
    // Bulwark: the loser of the trick discards a card and draws anew.
    if (result && result.discardYou && state.youHand.length > 0) {
      const lost = state.youHand.splice(pickInt(random, state.youHand.length), 1)[0];
      state.discard.push(lost);
      drawInto(state.youHand);
    }
    if (result && result.discardFoe && state.foeHand.length > 0) {
      const lost = state.foeHand.splice(pickInt(random, state.foeHand.length), 1)[0];
      state.discard.push(lost);
      drawInto(state.foeHand);
    }
    state.trick += 1;
    state.phase = PHASE_CHOOSE;
    state.phaseTime = 0;
  }

  /**
   * One fixed step. Returns a bit flag of what happened, so the caller can
   * react (sounds, mainly) without the world knowing about screens.
   */
  function step(dt) {
    let events = 0;
    if (state.phase === PHASE_REVEAL) {
      state.phaseTime += dt;
      if (state.phaseTime >= REVEAL_SECONDS) {
        settleTrick();
        state.phase = PHASE_RESULT;
        state.phaseTime = 0;
        events |= 1;
      }
    } else if (state.phase === PHASE_RESULT) {
      state.phaseTime += dt;
      if (state.phaseTime >= RESULT_SECONDS) {
        finishTrick();
        events |= 2;
      }
    }
    return events;
  }

  /** Run the match forward with scripted play until `until` says stop. */
  function runUntil(until, youSkill, foeSkill, maxSteps = 4000) {
    for (let i = 0; i < maxSteps; i += 1) {
      if (until(state)) return true;
      if (state.phase === PHASE_CHOOSE) {
        if (youSkill === 'foe') {
          // The rival drives both seats (used to stage the title backdrop).
          const pool = unknownCards(state);
          const index = foeSkill === 'random'
            ? pickInt(random, state.youHand.length)
            : bestCardIndex(state.youHand, pool, random);
          playCard(index);
        } else {
          autoPlay(youSkill);
        }
      } else {
        step(1 / 60);
      }
    }
    return until(state);
  }

  reset();
  return { state, reset, playCard, autoPlay, rivalChoose, setRivalSkill, step, runUntil };
}

export const EVENT_SETTLED = 1;
export const EVENT_TRICK_DONE = 2;
