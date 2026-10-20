// The next date (UTC) that falls on a given weekday, as YYYY-MM-DD. The scripted conversations say «next Tuesday» and the data
// extracted from them carries that date; the prerender of the home page prints the same kind of date in its static example.
export function nextDow(dow: number, from: Date = new Date()): string {
  const d = new Date(from.getTime());
  const n = ((dow - d.getUTCDay() + 7) % 7) || 7;
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
