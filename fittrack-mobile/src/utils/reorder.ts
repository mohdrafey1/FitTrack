/**
 * Pure index maths for drag-to-reorder.
 *
 * Kept out of the component so it can be reasoned about — and tested — on its
 * own. Both functions are worklets: they run on the UI thread inside gesture
 * callbacks, so they must not close over anything from the JS thread.
 */

/** Map of row key → its index in the list. */
export type Positions = Record<string, number>;

export function buildPositions(keys: string[]): Positions {
  const positions: Positions = {};
  keys.forEach((key, index) => {
    positions[key] = index;
  });
  return positions;
}

/**
 * Reindex so the row at `from` lands on `to`, with everything between it
 * shifting one place to fill the gap.
 *
 * This is a move, not a swap: dragging a row across three others has to push
 * all three, otherwise a fast drag scrambles the list.
 */
export function movePosition(positions: Positions, from: number, to: number): Positions {
  'worklet';
  const next: Positions = {};
  for (const key of Object.keys(positions)) {
    const at = positions[key];
    if (at === from) next[key] = to;
    else if (from < to && at > from && at <= to) next[key] = at - 1;
    else if (from > to && at >= to && at < from) next[key] = at + 1;
    else next[key] = at;
  }
  return next;
}

/** Row keys sorted by their current index. */
export function keysInOrder(positions: Positions): string[] {
  'worklet';
  const keys = Object.keys(positions);
  keys.sort((a, b) => positions[a] - positions[b]);
  return keys;
}
