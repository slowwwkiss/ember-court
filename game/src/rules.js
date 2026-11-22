// The rules of Ember Court, with no drawing and no browser in them.
// A trick: both duellists play one card at once. A card's effective value is its
// number, plus EDGE_BONUS when its suit has the edge over the other card's suit
// (Ember scorches Leaf, Leaf drinks Tide, Tide douses Ember; Stone is neutral).
// The higher effective value wins the trick; the loser takes damage equal to the
// gap. A tie deals nothing. Then the court cards speak:
//   Phoenix (Ember 9): its owner loses a trick and still deals 2 damage.
//   Mirrorpool (Tide 9): its owner loses a trick and the damage is reflected.
//   Bloom (Leaf 9): its owner wins a trick and heals 4 life.
//   Bulwark (Stone 9): its owner loses a trick and takes no damage.

import { BLOOM_HEAL, EDGE_BONUS, PHOENIX_DAMAGE, SUITS } from './config.js';
import { cardName, isCourt } from './deck.js';

/** Does suit A have the elemental edge over suit B? */
export function hasEdge(suitA, suitB) {
  return SUITS[suitA].edge === suitB;
}

/** A card's value against one rival card, edge included. */
export function effectiveValue(card, foeCard) {
  return card.value + (hasEdge(card.suit, foeCard.suit) ? EDGE_BONUS : 0);
}

/** A one-line account of why a card's value is what it is. */
export function valueNote(card, foeCard) {
  if (hasEdge(card.suit, foeCard.suit)) {
    return `${SUITS[card.suit].name} has the edge over ${SUITS[foeCard.suit].name} (+${EDGE_BONUS})`;
  }
  return 'no edge';
}

/**
 * Resolve one trick. `you` and `foe` are the two cards played.
 * Returns { winner: 'you' | 'foe' | null, damageToYou, damageToFoe,
 * healYou, healFoe, discardYou, discardFoe, lines: [human-readable lines] }.
 */
export function resolveTrick(you, foe) {
  const effYou = effectiveValue(you, foe);
  const effFoe = effectiveValue(foe, you);
  const out = {
    winner: null,
    damageToYou: 0,
    damageToFoe: 0,
    healYou: 0,
    healFoe: 0,
    discardYou: false,
    discardFoe: false,
    lines: [],
  };
  out.lines.push(
    `You play ${cardName(you)} (${effYou}) — ${valueNote(you, foe)}.`,
  );
  out.lines.push(
    `Rival plays ${cardName(foe)} (${effFoe}) — ${valueNote(foe, you)}.`,
  );
  if (effYou === effFoe) {
    out.lines.push('A tie — the embers hold their breath. No damage.');
    return out;
  }
  const youWon = effYou > effFoe;
  out.winner = youWon ? 'you' : 'foe';
  const damage = Math.abs(effYou - effFoe);
  const loserCard = youWon ? foe : you;
  const winnerCard = youWon ? you : foe;
  const loserName = youWon ? 'Rival' : 'You';
  const winnerName = youWon ? 'You' : 'Rival';

  // The loser's court card speaks first: Mirrorpool turns the blow around.
  let reflected = false;
  if (isCourt(loserCard) && loserCard.suit === 'tide') {
    out.lines.push(`${loserName} hold Mirrorpool — the damage turns back on its maker.`);
    reflected = true;
  }
  // The winner's court card speaks next: Bloom heals, Bulwark disrupts.
  if (isCourt(winnerCard) && winnerCard.suit === 'leaf') {
    out.lines.push(`${winnerName} bloom — ${BLOOM_HEAL} life returns.`);
    if (youWon) out.healYou = BLOOM_HEAL;
    else out.healFoe = BLOOM_HEAL;
  }
  if (isCourt(winnerCard) && winnerCard.suit === 'stone') {
    out.lines.push(`${winnerName} stand behind Bulwark — ${loserName} discard a card and draw anew.`);
    if (youWon) out.discardFoe = true;
    else out.discardYou = true;
  }
  // Phoenix burns the winner even in defeat: the loser's ember still bites.
  let phoenix = 0;
  if (isCourt(loserCard) && loserCard.suit === 'ember') {
    phoenix = PHOENIX_DAMAGE;
    out.lines.push(`Phoenix rises from the loss — ${PHOENIX_DAMAGE} damage to ${winnerName.toLowerCase()}.`);
  }
  if (reflected) {
    if (youWon) out.damageToYou = damage;
    else out.damageToFoe = damage;
    out.lines.push(`${winnerName} take ${damage} damage — reflected!`);
  } else if (youWon) {
    out.damageToFoe = damage;
    out.damageToYou = phoenix;
    out.lines.push(`You win the trick — Rival takes ${damage} damage.`);
    if (phoenix > 0) out.lines.push(`Phoenix burns you for ${phoenix}.`);
  } else {
    out.damageToYou = damage;
    out.damageToFoe = phoenix;
    out.lines.push(`Rival wins the trick — you take ${damage} damage.`);
    if (phoenix > 0) out.lines.push(`Phoenix burns the Rival for ${phoenix}.`);
  }
  return out;
}

/**
 * How good is it to play `card` against a foe card drawn blind? The score is the
 * average net damage (damage dealt minus damage taken, healing counted double
 * because life is the whole game) over every card the foe could still hold.
 * The rival and the autopilot both use it; a random sample keeps it fast.
 */
export function evaluateCard(card, foePool, random, samples = 24) {
  if (foePool.length === 0) return card.value;
  let total = 0;
  const n = Math.min(samples, foePool.length);
  for (let i = 0; i < n; i += 1) {
    const foe = foePool[Math.floor(random() * foePool.length)];
    const result = resolveTrick(card, foe);
    total += result.damageToFoe - result.damageToYou
      + 2 * (result.healYou - result.healFoe)
      + (result.discardFoe ? 1.5 : 0) - (result.discardYou ? 1.5 : 0);
  }
  return total / n;
}

/** The best card in `hand` by the blind evaluation, with a little jitter. */
export function bestCardIndex(hand, foePool, random) {
  let best = 0;
  let bestScore = -Infinity;
  for (let i = 0; i < hand.length; i += 1) {
    const score = evaluateCard(hand[i], foePool, random) + random() * 0.6;
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return best;
}

/** The worst card in `hand` by the blind evaluation: the losing autopilot. */
export function worstCardIndex(hand, foePool, random) {
  let worst = 0;
  let worstScore = Infinity;
  for (let i = 0; i < hand.length; i += 1) {
    const score = evaluateCard(hand[i], foePool, random);
    if (score < worstScore) {
      worstScore = score;
      worst = i;
    }
  }
  return worst;
}
