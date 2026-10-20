// Industries content batch 3 — 2 verticals (twelve were taken down in L1б). L8 (2026-10-20): see batch 1.
import type { IndustryContent } from '../types';

const WIDGETS_ARTICLE = { slug: 'best-ai-booking-widgets-2026', title: 'Best AI booking widgets 2026: comparison and decision guide' };

export const industriesBatch3: IndustryContent[] = [
  // ============================================================
  // EDUCATION
  // ============================================================
  {
    slug: 'education-tutoring',
    category: 'Education',
    name: 'Tutoring services',
    audience: 'tutoring services',
    description: 'Tutoring requests by chat: parents describe subject, grade and schedule in one message, and the assistant sends you the request with the details.',
    hero: {
      eyebrow: 'For tutoring agencies',
      subtitle:
        'Typelessity adds tutoring requests by chat to your agency’s website. Parents describe what their child needs — subject, grade level, exam prep, language preference — in one message, and the assistant sends you the request with the details.',
    },
    article: WIDGETS_ARTICLE,
    exampleConversations: [
      {
        lang: 'en',
        user: 'My daughter is in 9th grade, struggling with algebra, needs help twice a week before finals',
        extracted: { subject: 'algebra', grade: 9, frequency: '2x_week', context: 'exam_prep' },
      },
    ],
    fields: ['subject', 'grade_level', 'goal', 'frequency', 'language', 'in_person_or_remote', 'date_window'],
    proofPoints: ['Subject and grade level are filled from one message', 'Remote versus in person is a select field with your own options'],
  },

  // ============================================================
  // HOSPITALITY
  // ============================================================
  {
    slug: 'hospitality-restaurants',
    category: 'Hospitality',
    name: 'Restaurants',
    audience: 'restaurants',
    description: 'Table reservations by chat on your restaurant’s website: guests say “table for 4 on Saturday at 8” and the assistant sends you the request.',
    hero: {
      eyebrow: 'For restaurants',
      subtitle:
        'Typelessity adds table reservations by chat to your restaurant’s website. Guests describe the reservation in plain language — party size, date, time, an occasion, a seat by the window — and the assistant collects it from one message and sends your team the request.',
    },
    quote: 'Table for 4 on Saturday at 8',
    challenges: [
      'A reservation is five small details. Party size, date, time, occasion and seating: a form asks for them one by one, a guest can say them in one sentence.',
      'Occasion and seating change how the table is prepared. A birthday or a window seat is easy to say and easy to lose in a free-text note.',
      'Requests come in while the kitchen is busy. The request reaches you with the details filled in, so nobody has to call the guest back to ask for the date.',
    ],
    article: WIDGETS_ARTICLE,
    exampleConversations: [
      {
        lang: 'en',
        user: 'Table for 4 on Saturday at 8pm for a birthday, would love a window seat if possible',
        extracted: { party_size: 4, date: 'saturday', time: '20:00', occasion: 'birthday', seating_preference: 'window' },
      },
    ],
    fields: ['party_size', 'date', 'time', 'occasion', 'seating_preference'],
    proofPoints: ['Party size, date and time are filled from one message', 'Occasion and seating preference are optional fields you can add'],
    industryFAQ: [
      {
        q: 'Does it work with the booking system my restaurant already uses?',
        a: 'It sits in front of it: it replaces the intake form, not the system behind it. If your system has an API, your web developer connects it and the request goes straight in. If not, every request reaches you by email. There is no ready-made connector for named systems yet.',
      },
      {
        q: 'Can guests write in their own language?',
        a: 'Yes, guests can speak or type in their own language. The assistant replies in the language you set for your business.',
      },
      {
        q: 'Can a guest mention a birthday or a seat by the window?',
        a: 'Yes. Occasion and seating preference are optional fields you can add; they are filled from the same message as the party size and the time.',
      },
    ],
  },
];
