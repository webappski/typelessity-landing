// Industries content — batch 1: 1 vertical (the other seven were taken down in L1б).
// Each entry follows the IndustryContent shape from lib/types.ts. L8 (2026-10-20): the title and the H1 come from `audience`
// (template of seo-lead §2.7), the capsule is `hero.subtitle`, the bubble is `quote`; the texts come from the card, not from a headline.

import type { IndustryContent } from '../types';

export const industries: IndustryContent[] = [
  // ============================================================
  // BEAUTY & WELLNESS
  // ============================================================
  {
    slug: 'beauty-hair-salons',
    category: 'Beauty & Wellness',
    name: 'Hair salons',
    audience: 'hair salons',
    description: 'Online booking for hair salons by chat: clients say “balayage and a trim Tuesday morning”, the assistant fills in the details and sends you the request.',
    hero: {
      eyebrow: 'For hair salons & barbershops',
      subtitle:
        'Typelessity adds online booking by chat to your salon’s website. Clients describe the service they want in their own words — balayage, fade, root touch-up, perm — and Typelessity matches it to your service menu, then collects the stylist, date and time in the same conversation. The client checks the request before it is sent to the salon.',
    },
    quote: 'I want a balayage, can you fit me in Saturday?',
    challenges: [
      'Service names are not the client’s words. “Balayage and a trim” is one visit for the client and two lines on your menu; a dropdown makes them choose one.',
      'The stylist needs more than a date. Hair length and what was done to the hair before change the length of a visit, so a request without them is a guess.',
      'Clients write when the salon is closed. A request typed in the evening should be waiting for you with the details filled in, not a missed call.',
    ],
    article: { slug: 'best-ai-booking-beauty-salons-2026', title: 'Best AI booking widget for beauty salons and spas 2026: comparison and decision guide' },
    exampleConversations: [
      {
        lang: 'es',
        user: 'Quiero mechas balayage y un corte, mi pelo es largo, sábado por la tarde',
        extracted: { service: ['balayage', 'haircut'], hair_length: 'long', date: 'saturday', time_window: 'afternoon' },
      },
    ],
    fields: ['service', 'hair_length', 'preferred_stylist', 'date_window', 'time_window', 'first_visit'],
    proofPoints: ['Free-text service requests are matched to the options in your service field', 'Stylist, date and time are collected in the same conversation and reviewed by the client before sending'],
    industryFAQ: [
      {
        q: 'Does it work with the booking system my salon already uses?',
        a: 'It sits in front of it: it replaces the intake form, not the system behind it. If your system has an API, your web developer connects it and the request goes straight in. If not, every request reaches you by email. There is no ready-made connector for Booksy or other named systems yet.',
      },
      {
        q: 'Can clients write in their own language?',
        a: 'Yes, clients can speak or type in their own language; the example above is in Spanish. The assistant replies in the language you set for your business.',
      },
      {
        q: 'Can the stylist list come from our booking system?',
        a: 'Yes. Your own endpoint can offer the available stylists as cards the client picks from.',
      },
      {
        q: 'Is it an AI receptionist?',
        a: 'No. It does not take phone calls: it takes booking requests in a chat on your website.',
      },
    ],
  },
];
