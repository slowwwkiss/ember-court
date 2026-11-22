// The deck of Ember Court: 36 cards, four suits of values 1 to 9, dealt from one
// shared deck. A card is { suit, value, id }: id is stable across shuffles so a
// card can be followed through the log and the screenshots.

import { DECK_SIZE, SUIT_ORDER } from './config.js';
import { pickInt } from './random.js';

/** Build a fresh, ordered deck. */
export function buildDeck() {
  const deck = [];
  let id = 0;
  for (const suit of SUIT_ORDER) {
    for (let value = 1; value <= 9; value += 1) {
      deck.push({ suit, value, id: id });
      id += 1;
    }
  }
  return deck;
}

/** Shuffle a deck in place with the given random function (Fisher-Yates). */
export function shuffleDeck(deck, random) {
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = pickInt(random, i + 1);
    const held = deck[i];
    deck[i] = deck[j];
    deck[j] = held;
  }
  return deck;
}

/** A short name for a card, as the log and the banners use it. */
export function cardName(card) {
  return `${card.suit[0].toUpperCase() + card.suit.slice(1)} ${card.value}`;
}

/** The 9s are court cards and carry a power; every other card is plain. */
export function isCourt(card) {
  return card.value === 9;
}

/** A card's sort key: suit first, then value, so hands read in court order. */
export function cardKey(card) {
  return SUIT_ORDER.indexOf(card.suit) * 10 + card.value;
}

/** Sanity: the deck is exactly the 36 cards the rules promise. */
export function deckIsWhole(deck) {
  if (deck.length !== DECK_SIZE) return false;
  const seen = new Set();
  for (const card of deck) {
    const key = `${card.suit}:${card.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
  }
  return seen.size === DECK_SIZE;
}
