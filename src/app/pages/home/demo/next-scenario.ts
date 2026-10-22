/**
 * The index of the business the show plays after the one at `from`: the next id in the round, skipping the ids whose tab is not drawn.
 * L17 D1.3 (founder 22.10): «Freight» is `display: none` at 720 px and below, and a round that stopped on it would play a business with no
 * selected tab. The breakpoint lives in CSS only; the controller asks the page which tabs are drawn (`shown`).
 * If no other tab is drawn the round goes on to the very next id (the old behaviour), so the show never stalls.
 */
export function nextShownIndex(ids: readonly string[], from: number, shown: (id: string) => boolean): number {
  for (let step = 1; step < ids.length; step++) {
    const idx = (from + step) % ids.length;
    if (shown(ids[idx]!)) return idx;
  }
  return (from + 1) % ids.length;
}
