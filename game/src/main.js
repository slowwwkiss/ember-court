// Boot and the one loop: input is read every frame, the world advances in fixed
// 1/60 s steps, and the renderer paints what is there. The game moves between
// three screens: title, play and game over.
// ?seed=N fixes the shuffle and the rival. ?shot=title|play|win|loss (with
// &seed=N) stages that scene instead of running the loop, paints it twice and
// sets window.__shotReady for a screenshot.

import { PLAYED_KEY, WINS_KEY } from './config.js';
import { createRandom } from './random.js';
import { EVENT_SETTLED, EVENT_TRICK_DONE, PHASE_OVER, createWorld } from './world.js';
import { ACTION_PLAY, ACTION_RESTART, ACTION_START, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';
import { sounds } from './sound.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);

function readCount(key) {
  try {
    return Number.parseInt(window.localStorage.getItem(key) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveCount(key, value) {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // Storage can be off (private windows): the record then lasts this visit only.
  }
}

let wins = readCount(WINS_KEY);
let played = readCount(PLAYED_KEY);

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, -1, scene.wins, scene.played, true);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas, onAction);
  let screen = SCREEN_TITLE;
  let last = performance.now();
  let accumulator = 0;

  function onAction(action) {
    if (action.type === ACTION_START && screen === SCREEN_TITLE) {
      screen = SCREEN_PLAY;
      announce('The duel begins. Play a card.');
    } else if (action.type === ACTION_PLAY && screen === SCREEN_PLAY) {
      if (world.playCard(action.index)) sounds.playCard();
    } else if (action.type === ACTION_RESTART) {
      world.reset();
      screen = SCREEN_TITLE;
      announce('Ember Court. A new duel awaits.');
    }
  }

  function announce(text) {
    status.textContent = text;
  }

  function frame(now) {
    const elapsed = Math.min(0.25, (now - last) / 1000);
    last = now;
    accumulator += elapsed;
    while (accumulator >= 1 / 60) {
      accumulator -= 1 / 60;
      const events = world.step(1 / 60);
      if (events & EVENT_SETTLED) {
        const result = world.state.result;
        if (result && result.winner === 'you') sounds.winTrick();
        else if (result && result.winner === 'foe') sounds.loseTrick();
        if (result) announce(result.lines[result.lines.length - 1]);
      }
      if (events & EVENT_TRICK_DONE && world.state.phase === PHASE_OVER) {
        screen = SCREEN_OVER;
        played += 1;
        if (world.state.winner === 'you') {
          wins += 1;
          sounds.victory();
        } else {
          sounds.defeat();
        }
        saveCount(WINS_KEY, wins);
        saveCount(PLAYED_KEY, played);
        announce(world.state.winner === 'you' ? 'Victory — the court is yours.' : 'Defeat — the embers fade.');
      }
    }
    if (world.state.phase === PHASE_OVER && screen !== SCREEN_OVER) screen = SCREEN_OVER;
    const hand = renderer.draw(world.state, screen, input.hoverIndex, wins, played);
    input.setHandBox(hand);
    requestAnimationFrame(frame);
  }

  announce('Ember Court. A duel of cinders — click or press Enter to play.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
