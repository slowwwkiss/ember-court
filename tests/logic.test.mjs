// Ember Court — logic tests (Node). Run: node tests/logic.test.mjs
// Exercises the deck, the trick rules (including every court power), the
// rival's evaluation, and whole matches between the three skills, so a
// change that breaks the game shows up here before it reaches a browser.
import { buildDeck, deckIsWhole, isCourt } from '../game/src/deck.js';
import {
  effectiveValue,
  evaluateCard,
  resolveTrick,
  worstCardIndex,
} from '../game/src/rules.js';
import { createWorld } from '../game/src/world.js';
import { createRandom } from '../game/src/random.js';

let failures = 0;
function check(name, ok, extra = '') {
  if (ok) console.log(`PASS ${name}`);
  else {
    failures += 1;
    console.log(`FAIL ${name}${extra ? ` — ${extra}` : ''}`);
  }
}

const deck = buildDeck();
check('deck is whole 36', deck.length === 36 && deckIsWhole(deck));

const ember9 = { suit: 'ember', value: 9, id: 1 };
const leaf5 = { suit: 'leaf', value: 5, id: 2 };
const r1 = resolveTrick(ember9, leaf5);
check('ember 9 vs leaf 5: you win, foe takes 6', r1.winner === 'you' && r1.damageToFoe === 6);
check('ember 9 is a court card', isCourt(ember9));
check('ember beats leaf by 2', effectiveValue(ember9, leaf5) === 11);

// Phoenix: you play tide 9 vs ember 7. Tide 9: 9+2 edge over ember = 11 vs 7,
// you win by 4 — and the loser's ember 7 is not a court card, so no phoenix.
const tide9 = { suit: 'tide', value: 9, id: 3 };
const ember7 = { suit: 'ember', value: 7, id: 0 };
const r2 = resolveTrick(tide9, ember7);
check('tide 9 vs ember 7: you win, foe takes 4', r2.winner === 'you' && r2.damageToFoe === 4);

const leaf9 = { suit: 'leaf', value: 9, id: 7 };
const ember4 = { suit: 'ember', value: 4, id: 8 };
// Mirrorpool: you play leaf 3 vs foe tide 9: foe wins (9 vs 5, leaf edge over
// tide is +2) and Mirrorpool does NOT trigger — it only speaks when its owner
// loses. You take 4.
const leaf3 = { suit: 'leaf', value: 3, id: 4 };
const r3 = resolveTrick(leaf3, tide9);
check('leaf 3 vs tide 9: foe wins, you take 4, no reflect on a win', r3.winner === 'foe' && r3.damageToYou === 4 && r3.damageToFoe === 0);
// Mirrorpool DOES trigger when its owner loses: you play leaf 9 vs foe tide 9.
// Leaf 9 vs tide 9: leaf edge over tide +2 => 11 vs 9, you win by 2; foe's
// Mirrorpool reflects the 2 back onto you. (Bloom also heals you 4.)
const r3b = resolveTrick(leaf9, tide9);
check('leaf 9 vs tide 9: you win, mirrorpool reflects 2 to you, bloom heals 4', r3b.winner === 'you' && r3b.damageToYou === 2 && r3b.damageToFoe === 0 && r3b.healYou === 4);
// Bulwark: you play stone 9 vs ember 2: you win by 7, foe takes 7, and the
// loser discards a card.
const ember2 = { suit: 'ember', value: 2, id: 5 };
const stone9you = { suit: 'stone', value: 9, id: 6 };
const r4 = resolveTrick(stone9you, ember2);
check('stone 9 vs ember 2: you win by 7, foe discards', r4.winner === 'you' && r4.damageToFoe === 7 && r4.discardFoe === true && r4.discardYou === false);
// Bulwark does trigger when its owner wins: you play ember 2 vs foe
// stone 9 — foe wins by 7, you take the full 7, and Bulwark makes YOU discard.
const r4b = resolveTrick(ember2, stone9you);
check('ember 2 vs stone 9: foe wins, you take 7, bulwark discards you', r4b.winner === 'foe' && r4b.damageToYou === 7 && r4b.discardYou === true);
// Bloom: you play leaf 9 vs ember 4: leaf edge over... ember scorches leaf,
// so leaf 9 counts 9 vs ember 4+2=6, you win by 3, heal 4.
const r5 = resolveTrick(leaf9, ember4);
check('leaf 9 vs ember 4: you win by 3, heal 4', r5.winner === 'you' && r5.damageToFoe === 3 && r5.healYou === 4);
// A tie deals nothing.
const s5a = { suit: 'stone', value: 5, id: 9 };
const s5b = { suit: 'stone', value: 5, id: 10 };
const r6 = resolveTrick(s5a, s5b);
check('tie deals nothing', r6.winner === null && r6.damageToYou === 0 && r6.damageToFoe === 0);
// Phoenix: you play ember 9 vs foe tide 8. Tide 8: 8+2 edge over ember = 10
// vs 9, foe wins by 1, you take 1 — and the loser's Phoenix burns the foe 2.
const tide8 = { suit: 'tide', value: 8, id: 11 };
const r7 = resolveTrick(ember9, tide8);
check('ember 9 vs tide 8: foe wins by 1, phoenix burns 2', r7.winner === 'foe' && r7.damageToYou === 1 && r7.damageToFoe === 2);

function runMatch(youSkill, rivalSkill, seed) {
  const world = createWorld(createRandom(seed));
  world.setRivalSkill(rivalSkill);
  const ended = world.runUntil(
    (state) => state.phase === 'over',
    youSkill,
    rivalSkill,
  );
  return { ended, winner: world.state.winner, tricks: world.state.trick };
}

let youWins = 0;
let foeWins = 0;
let unfinished = 0;
let trickTotal = 0;
let trickMin = 99;
let trickMax = 0;
for (let seed = 1; seed <= 30; seed += 1) {
  const m = runMatch('best', 'best', seed);
  if (!m.ended) unfinished += 1;
  else if (m.winner === 'you') youWins += 1;
  else foeWins += 1;
  trickTotal += m.tricks;
  trickMin = Math.min(trickMin, m.tricks);
  trickMax = Math.max(trickMax, m.tricks);
}
console.log(`best-vs-best 30 matches: you ${youWins}, foe ${foeWins}, unfinished ${unfinished}`);
check('all best-vs-best matches finish', unfinished === 0);
check('best-vs-best is roughly even (you win 8..22)', youWins >= 8 && youWins <= 22);

let winStaged = 0;
for (let seed = 101; seed <= 120; seed += 1) {
  const m = runMatch('best', 'random', seed);
  if (m.ended && m.winner === 'you') winStaged += 1;
}
console.log(`best-vs-random 20 matches: you win ${winStaged}`);
check('best-vs-random wins almost always (>=15)', winStaged >= 15);

let foeWinsWorst = 0;
for (let seed = 201; seed <= 220; seed += 1) {
  const m = runMatch('worst', 'best', seed);
  if (m.ended && m.winner === 'foe') foeWinsWorst += 1;
}
console.log(`worst-vs-best 20 matches: foe wins ${foeWinsWorst}`);
check('worst-vs-best loses almost always (>=17)', foeWinsWorst >= 17);

const avg = (trickTotal / 30).toFixed(1);
console.log(`avg tricks per match: ${avg} (min ${trickMin}, max ${trickMax})`);
check('matches last 4..30 tricks', trickMin >= 4 && trickMax <= 30);

// The evaluator prefers a court card that wins over a plain card that loses.
const pool = [ember2, leaf3, tide8];
const score = evaluateCard(leaf9, pool, () => 0.5);
check('evaluator values the leaf 9 above zero', score > 0);
check('worstCardIndex picks the weakest card', worstCardIndex([ember9, ember2], pool, () => 0.5) === 1);

if (failures > 0) {
  console.log(`${failures} FAILURES`);
  process.exit(1);
}
console.log('ALL OK');
