// Everything the eye sees: the felt table, the two hands, the played cards, the
// life bars, the banners and the title, win and loss screens. Pure canvas, no
// images: every suit is drawn from its shape, so the game loads nothing at all.

import {
  COURT,
  FIELD,
  FONT,
  PALETTE,
  REVEAL_SECONDS,
  START_LIFE,
  SUITS,
} from './config.js';
import { isCourt } from './deck.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

const CARD_W = 104;
const CARD_H = 146;
const PLAYED_W = 132;
const PLAYED_H = 184;
const BACK_W = 84;
const BACK_H = 118;
const HAND_Y = 548;
const FOE_Y = 96;
const STAGE_Y = 252;

/** A rounded rectangle path, for cards and panels. */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** The four suit marks, drawn in the current fill colour. */
function drawSymbol(ctx, symbol, cx, cy, size) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  if (symbol === 'flame') {
    ctx.moveTo(0, -size);
    ctx.bezierCurveTo(size * 0.9, -size * 0.2, size * 0.75, size * 0.7, 0, size * 0.9);
    ctx.bezierCurveTo(-size * 0.75, size * 0.7, -size * 0.9, -size * 0.2, 0, -size);
  } else if (symbol === 'drop') {
    ctx.moveTo(0, -size);
    ctx.bezierCurveTo(size * 0.85, size * 0.1, size * 0.7, size, 0, size);
    ctx.bezierCurveTo(-size * 0.7, size, -size * 0.85, size * 0.1, 0, -size);
  } else if (symbol === 'leaf') {
    ctx.moveTo(0, -size);
    ctx.bezierCurveTo(size * 0.95, -size * 0.4, size * 0.8, size * 0.75, 0, size * 0.9);
    ctx.bezierCurveTo(-size * 0.8, size * 0.75, -size * 0.95, -size * 0.4, 0, -size);
    ctx.moveTo(0, -size * 0.9);
    ctx.lineTo(0, size);
  } else {
    // stone: a cut gem
    ctx.moveTo(-size * 0.8, -size * 0.4);
    ctx.lineTo(0, -size);
    ctx.lineTo(size * 0.8, -size * 0.4);
    ctx.lineTo(size * 0.7, size * 0.6);
    ctx.lineTo(-size * 0.7, size * 0.6);
    ctx.closePath();
  }
  ctx.fill();
  ctx.restore();
}

function suitOf(card) {
  return SUITS[card.suit];
}

/** One face-up card. `lift` raises it (hover), `small` shrinks the furniture. */
function drawCard(ctx, card, x, y, w, h, lift = 0) {
  const suit = suitOf(card);
  const court = isCourt(card);
  ctx.save();
  ctx.translate(0, -lift);
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 5;
  roundRect(ctx, x, y, w, h, 10);
  ctx.fillStyle = PALETTE.cardFace;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = court ? 4 : 2;
  ctx.strokeStyle = court ? PALETTE.trim : PALETTE.ink;
  ctx.stroke();
  // Suit colour band across the top.
  ctx.save();
  roundRect(ctx, x + 3, y + 3, w - 6, h * 0.2, 8);
  ctx.clip();
  ctx.fillStyle = suit.colour;
  ctx.fillRect(x + 3, y + 3, w - 6, h * 0.2);
  ctx.restore();
  // Big value, top left, in the suit's dark colour.
  ctx.fillStyle = suit.dark;
  ctx.font = `800 ${Math.round(h * 0.3)}px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(String(card.value), x + 10, y + h * 0.24);
  // Small suit mark, top right.
  ctx.fillStyle = suit.colour;
  drawSymbol(ctx, suit.symbol, x + w - 20, y + h * 0.32, 11);
  // Large suit mark in the middle.
  ctx.fillStyle = suit.colour;
  drawSymbol(ctx, suit.symbol, x + w / 2, y + h * 0.56, h * 0.19);
  // Suit name along the bottom, and the court power under it.
  ctx.fillStyle = PALETTE.ink;
  ctx.font = `700 ${Math.round(h * 0.085)}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(suit.name.toUpperCase(), x + w / 2, y + h * 0.8);
  if (court) {
    ctx.fillStyle = suit.dark;
    ctx.font = `700 ${Math.round(h * 0.075)}px ${FONT}`;
    ctx.fillText(COURT[card.suit].title.toUpperCase(), x + w / 2, y + h * 0.9);
  }
  ctx.restore();
}

/** One face-down card: the court's red back with a gold diamond. */
function drawCardBack(ctx, x, y, w, h) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;
  roundRect(ctx, x, y, w, h, 8);
  ctx.fillStyle = PALETTE.cardBack;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 2;
  ctx.strokeStyle = PALETTE.trim;
  ctx.stroke();
  roundRect(ctx, x + 6, y + 6, w - 12, h - 12, 6);
  ctx.strokeStyle = 'rgba(201,162,39,0.7)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = PALETTE.trim;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y + h / 2 - 16);
  ctx.lineTo(x + w / 2 + 12, y + h / 2);
  ctx.lineTo(x + w / 2, y + h / 2 + 16);
  ctx.lineTo(x + w / 2 - 12, y + h / 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.cardFace;
  ctx.font = `800 13px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EC', x + w / 2, y + h / 2 + 26);
  ctx.restore();
}

/** A life bar with a number: the visible score of the duel. */
function drawLifeBar(ctx, x, y, w, life, label, colour) {
  ctx.save();
  ctx.font = `800 20px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = PALETTE.text;
  ctx.fillText(label, x, y + 12);
  const barX = x + 150;
  const barW = w - 150;
  roundRect(ctx, barX, y, barW, 24, 12);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fill();
  const frac = Math.max(0, life / START_LIFE);
  if (frac > 0) {
    roundRect(ctx, barX + 2, y + 2, (barW - 4) * frac, 20, 10);
    ctx.fillStyle = colour;
    ctx.fill();
  }
  ctx.fillStyle = PALETTE.text;
  ctx.font = `800 16px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(`${life} / ${START_LIFE}`, barX + barW / 2, y + 13);
  ctx.restore();
}

function drawPanel(ctx, x, y, w, h) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  roundRect(ctx, x, y, w, h, 16);
  ctx.fillStyle = PALETTE.panel;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 2;
  ctx.strokeStyle = PALETTE.trim;
  ctx.stroke();
  ctx.restore();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let shownYouLife = START_LIFE;
  let shownFoeLife = START_LIFE;

  function fitCanvas() {
    const scale = Math.min(
      canvas.clientWidth / FIELD.width,
      canvas.clientHeight / FIELD.height,
    );
    const w = Math.round(FIELD.width * scale);
    const h = Math.round(FIELD.height * scale);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx.setTransform(w / FIELD.width, 0, 0, h / FIELD.height, 0, 0);
  }

  function drawTable(state) {
    // Felt, vignette, gold trim.
    ctx.fillStyle = PALETTE.felt;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    const glow = ctx.createRadialGradient(640, 340, 80, 640, 360, 760);
    glow.addColorStop(0, 'rgba(255,240,200,0.10)');
    glow.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.strokeStyle = PALETTE.trim;
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, FIELD.width - 20, FIELD.height - 20);
    ctx.strokeStyle = 'rgba(201,162,39,0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(20, 20, FIELD.width - 40, FIELD.height - 40);
    // Header: who, which trick, how many cards left.
    ctx.fillStyle = PALETTE.text;
    ctx.font = `800 22px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('RIVAL · CINDER WARDEN', 40, 40);
    ctx.textAlign = 'center';
    ctx.fillText(`TRICK ${state.trick}`, 640, 40);
    ctx.textAlign = 'right';
    ctx.fillText(`DECK ${state.deck.length}`, 1240, 40);
    // Life bars.
    drawLifeBar(ctx, 40, 62, 320, shownFoeLife, 'RIVAL LIFE', PALETTE.rival);
    drawLifeBar(ctx, 40, 516, 320, shownYouLife, 'YOUR LIFE', PALETTE.you);
    // The log, bottom right: clipped to its column, never past the edge.
    ctx.textAlign = 'left';
    ctx.font = `400 14px ${FONT}`;
    ctx.fillStyle = PALETTE.muted;
    const lines = state.log.slice(-3);
    lines.forEach((line, i) => {
      let shown = line;
      while (shown.length > 1 && ctx.measureText(shown).width > 300) {
        shown = shown.slice(0, -1);
      }
      if (shown.length < line.length) shown = `${shown.slice(0, -1)}…`;
      ctx.fillText(shown, 940, 540 + i * 20);
    });
    ctx.font = `400 13px ${FONT}`;
    ctx.fillStyle = 'rgba(185,196,187,0.75)';
    ctx.fillText('Click a card to play · keys 1–5 · R restarts', 940, 612);
  }

  function drawHands(state, hoverIndex, screen) {
    // The rival's hand: face-down backs, fanned across the top.
    const foeCount = state.foeHand.length;
    const foeSpan = Math.min(foeCount * (BACK_W + 10), 620);
    const foeX0 = 640 - foeSpan / 2;
    const foeStep = foeCount > 1 ? foeSpan / foeCount : 0;
    for (let i = 0; i < foeCount; i += 1) {
      drawCardBack(ctx, foeX0 + i * foeStep, FOE_Y, BACK_W, BACK_H);
    }
    // The player's hand: face-up, fanned across the bottom.
    const youCount = state.youHand.length;
    const step = youCount > 1 ? Math.min(118, 560 / (youCount - 1)) : 0;
    const span = youCount > 1 ? step * (youCount - 1) + CARD_W : CARD_W;
    const x0 = 640 - span / 2;
    state.youHand.forEach((card, i) => {
      const lift = screen === SCREEN_PLAY && hoverIndex === i ? 18 : 0;
      drawCard(ctx, card, x0 + i * step, HAND_Y, CARD_W, CARD_H, lift);
    });
    return { handX0: x0, handStep: step };
  }

  function drawStage(state, screen) {
    if (!state.youPlayed || !state.foePlayed) return;
    const p = state.phase === 'reveal'
      ? Math.min(1, state.phaseTime / REVEAL_SECONDS)
      : 1;
    // Cards slide from their hands to the centre as the reveal runs.
    const youX = 640 - PLAYED_W - 60 + (1 - p) * -160;
    const foeX = 640 + 60 + (1 - p) * 160;
    const y = STAGE_Y + (1 - p) * 40;
    ctx.save();
    ctx.globalAlpha = p;
    drawCard(ctx, state.youPlayed, youX, y, PLAYED_W, PLAYED_H);
    drawCard(ctx, state.foePlayed, foeX, y, PLAYED_W, PLAYED_H);
    ctx.restore();
    ctx.fillStyle = PALETTE.trim;
    ctx.font = `800 26px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VS', 640, y + PLAYED_H / 2);
    if (state.phase === 'result' && state.result) {
      const r = state.result;
      const headline = r.winner === 'you'
        ? 'YOU WIN THE TRICK'
        : r.winner === 'foe' ? 'RIVAL WINS THE TRICK' : 'A TIE — NO DAMAGE';
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 10;
      ctx.fillStyle = r.winner === 'you' ? PALETTE.win : r.winner === 'foe' ? PALETTE.lose : PALETTE.text;
      ctx.font = `800 34px ${FONT}`;
      ctx.fillText(headline, 640, y + PLAYED_H + 42);
      ctx.restore();
      ctx.fillStyle = PALETTE.text;
      ctx.font = `400 17px ${FONT}`;
      const detail = r.lines[r.lines.length - 1];
      ctx.fillText(detail, 640, y + PLAYED_H + 72);
    }
  }

  function drawTitle(state, wins, played) {
    drawPanel(ctx, 340, 130, 600, 380);
    ctx.fillStyle = PALETTE.trim;
    ctx.font = `800 64px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('EMBER COURT', 640, 230);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `400 20px ${FONT}`;
    ctx.fillText('A duel of cinders. Outplay the Cinder Warden,', 640, 272);
    ctx.fillText('card by card, until one of you is at zero life.', 640, 300);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `400 16px ${FONT}`;
    ctx.fillText('Higher card wins the trick · Ember scorches Leaf,', 640, 342);
    ctx.fillText('Leaf drinks Tide, Tide douses Ember · the 9s', 640, 366);
    ctx.fillText('are court cards with powers of their own.', 640, 390);
    ctx.fillStyle = PALETTE.you;
    ctx.font = `800 22px ${FONT}`;
    ctx.fillText('Click or press Enter to play', 640, 442);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `400 15px ${FONT}`;
    ctx.fillText(
      played > 0 ? `You have won ${wins} of ${played} duels here.` : 'Your first duel awaits.',
      640, 482,
    );
  }

  function drawOver(state, wins, played) {
    const won = state.winner === 'you';
    drawPanel(ctx, 340, 170, 600, 330);
    ctx.fillStyle = won ? PALETTE.win : PALETTE.lose;
    ctx.font = `800 58px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(won ? 'VICTORY' : 'DEFEAT', 640, 258);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `400 20px ${FONT}`;
    ctx.fillText(
      won ? 'The court is yours — the Warden bows out.' : 'The embers fade — the Warden keeps the court.',
      640, 300,
    );
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `400 17px ${FONT}`;
    ctx.fillText(
      `${state.tricksWon} tricks won · ${state.tricksLost} lost · ${state.trick} tricks played · life left ${state.youLife}–${state.foeLife}`,
      640, 336,
    );
    ctx.fillStyle = PALETTE.you;
    ctx.font = `800 22px ${FONT}`;
    ctx.fillText('Press R to play again', 640, 392);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `400 15px ${FONT}`;
    ctx.fillText(`You have won ${wins} of ${played} duels here.`, 640, 436);
  }

  /** Paint one frame. `snap` jumps the life bars to their true values at once. */
  function draw(state, screen, hoverIndex, wins, played, snap = false) {
    fitCanvas();
    if (snap) {
      shownYouLife = state.youLife;
      shownFoeLife = state.foeLife;
    } else {
      shownYouLife += (state.youLife - shownYouLife) * 0.2;
      shownFoeLife += (state.foeLife - shownFoeLife) * 0.2;
      if (Math.abs(shownYouLife - state.youLife) < 0.05) shownYouLife = state.youLife;
      if (Math.abs(shownFoeLife - state.foeLife) < 0.05) shownFoeLife = state.foeLife;
    }
    ctx.clearRect(0, 0, FIELD.width, FIELD.height);
    drawTable(state);
    const hand = drawHands(state, hoverIndex, screen);
    drawStage(state, screen);
    if (screen === SCREEN_TITLE) drawTitle(state, wins, played);
    if (screen === SCREEN_OVER) drawOver(state, wins, played);
    return hand;
  }

  return { draw };
}
