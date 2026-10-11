// The words of the Webappski free-pilot offer card, written out on purpose. They are NOT
// read from the template or the component: a spec that took its expected text from the code
// it checks would agree with whatever the code says, and a reverted badge would stay green.
// The badge string is the requirement itself (the card names Webappski, so a visitor reads
// it as the maker's AEO offer and not as a Typelessity trial); U+00B7 between the words.
// Same string, byte for byte, as typelessform/e2e/free-pilot-copy.ts (the push gate counts it in both repos).
export const BADGE = 'Webappski · Free AEO pilot';

export const COPY = [
  BADGE,
  'By application',
  '30 days of work on your AI visibility',
  'Apply for the free pilot',
  'No contract. No card. No price.',
];
