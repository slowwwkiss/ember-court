// Ember Court — every tuning number, colour and name in one place.
// The table is a fixed 1280x720 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** Life each duellist starts with. */
export const START_LIFE = 20;

/** Cards in hand at the start of a trick. */
export const HAND_SIZE = 5;

/** How many cards the shared deck holds: four suits of values 1 to 9. */
export const DECK_SIZE = 36;

/** Elemental edge is worth this much extra value when suits clash. */
export const EDGE_BONUS = 2;

/** Life the Leaf court's Bloom heals when its owner wins a trick. */
export const BLOOM_HEAL = 4;

/** Damage the Ember court's Phoenix deals when its owner loses a trick. */
export const PHOENIX_DAMAGE = 2;

/** How long, in seconds, the reveal and the result banner last. */
export const REVEAL_SECONDS = 0.55;
export const RESULT_SECONDS = 1.5;

/** The suits of the court, their colours, their symbols and their edges. */
export const SUITS = {
  ember: { name: 'Ember', colour: '#e5533d', dark: '#8f2417', light: '#ffb199', edge: 'leaf', symbol: 'flame' },
  tide: { name: 'Tide', colour: '#3d9be5', dark: '#155a94', light: '#a8d4f7', edge: 'ember', symbol: 'drop' },
  leaf: { name: 'Leaf', colour: '#58b368', dark: '#256b34', light: '#b5e3bd', edge: 'tide', symbol: 'leaf' },
  stone: { name: 'Stone', colour: '#9aa3ad', dark: '#4c565f', light: '#d7dce1', edge: null, symbol: 'stone' },
};

export const SUIT_ORDER = ['ember', 'tide', 'leaf', 'stone'];

/** The court cards (the 9s) and the power each one carries. */
export const COURT = {
  ember: { title: 'Phoenix', text: 'Lose a trick: still deal 2 damage.' },
  tide: { title: 'Mirrorpool', text: 'Lose a trick: the damage is reflected.' },
  leaf: { title: 'Bloom', text: 'Win a trick: heal 4 life.' },
  stone: { title: 'Bulwark', text: 'Win a trick: the rival discards a card and draws anew.' },
};

export const PALETTE = {
  felt: '#1d4d33',
  feltDark: '#143626',
  feltLight: '#27684a',
  trim: '#c9a227',
  trimDark: '#8a6d1a',
  panel: '#101a14',
  panelEdge: '#2c4a38',
  cardFace: '#f7f1de',
  cardBack: '#7a2e22',
  ink: '#221a12',
  muted: '#b9c4bb',
  text: '#f2ead6',
  you: '#f2c94c',
  rival: '#e5533d',
  win: '#f2c94c',
  lose: '#e5533d',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the win count is kept between visits (this browser only). */
export const WINS_KEY = 'ember-court.wins';
export const PLAYED_KEY = 'ember-court.played';
