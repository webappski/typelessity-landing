// Industries content — batch 1: 1 vertical (the other seven were taken down in L1б).
// Each entry follows the IndustryContent shape from lib/types.ts.

import type { IndustryContent } from '../types';

export const industries: IndustryContent[] = [
  // ============================================================
  // BEAUTY & WELLNESS
  // ============================================================
  {
    slug: 'beauty-hair-salons',
    category: 'Beauty & Wellness',
    name: 'Hair salons',
    hero: {
      eyebrow: 'For hair salons & barbershops',
      title: '"I want a balayage, can you fit me in Saturday?"',
      subtitle:
        'Clients describe the service they want in their own words — balayage, fade, root touch-up, perm — and Typelessity matches it to your service menu and collects the stylist, date and time in the same conversation.',
    },
    exampleConversations: [
      {
        lang: 'es',
        user: 'Quiero mechas balayage y un corte, mi pelo es largo, sábado por la tarde',
        extracted: { service: ['balayage', 'haircut'], hair_length: 'long', date: 'saturday', time_window: 'afternoon' },
      },
    ],
    fields: ['service', 'hair_length', 'preferred_stylist', 'date_window', 'time_window', 'first_visit'],
    proofPoints: ['Free-text service requests are matched to the options in your service field', 'Stylist, date and time are collected in the same conversation and reviewed by the client before sending'],
  },
];
