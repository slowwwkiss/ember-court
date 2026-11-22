// Mouse and keyboard: click a card (or press 1–5) to play it, Enter to begin,
// R to start a new duel. The input layer only reports what the player did; the
// game decides whether the move is legal.

export const ACTION_PLAY = 'play';
export const ACTION_START = 'start';
export const ACTION_RESTART = 'restart';

export function createInput(canvas, onAction) {
  let hoverIndex = -1;
  let handBox = { x0: 0, step: 0, count: 0 };

  /** The renderer hands back where the hand sits, so clicks can find cards. */
  function setHandBox(box) {
    handBox = box;
  }

  function cardAt(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 1280;
    const y = ((clientY - rect.top) / rect.height) * 720;
    if (y < 548 || y > 694 || handBox.count === 0) return -1;
    // The topmost card under the cursor: the rightmost one whose span holds x.
    for (let i = handBox.count - 1; i >= 0; i -= 1) {
      const cx = handBox.x0 + i * handBox.step;
      if (x >= cx && x <= cx + 104) return i;
    }
    return -1;
  }

  function onMove(event) {
    hoverIndex = cardAt(event.clientX, event.clientY);
  }

  function onClick(event) {
    const index = cardAt(event.clientX, event.clientY);
    if (index >= 0) onAction({ type: ACTION_PLAY, index });
  }

  function onKey(event) {
    if (event.key >= '1' && event.key <= '5') {
      const index = Number(event.key) - 1;
      if (index < handBox.count) onAction({ type: ACTION_PLAY, index });
    } else if (event.key === 'Enter') {
      onAction({ type: ACTION_START });
    } else if (event.key === 'r' || event.key === 'R') {
      onAction({ type: ACTION_RESTART });
    }
  }

  canvas.addEventListener('mousemove', onMove);
  canvas.addEventListener('click', onClick);
  window.addEventListener('keydown', onKey);

  return {
    get hoverIndex() {
      return hoverIndex;
    },
    setHandBox,
  };
}
