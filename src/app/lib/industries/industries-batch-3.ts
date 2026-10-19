// Industries content batch 3 — 2 verticals (twelve were taken down in L1б).
import type { IndustryContent } from '../types';

export const industriesBatch3: IndustryContent[] = [
  // ============================================================
  // EDUCATION
  // ============================================================
  {
    slug: 'education-tutoring',
    category: 'Education',
    name: 'Tutoring services',
    hero: {
      eyebrow: 'For tutoring agencies',
      title: 'Parents describe what their child needs',
      subtitle:
        'Subject, grade level, exam prep, language preference — all extracted from one message.',
    },
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
    hero: {
      eyebrow: 'For restaurants',
      title: '"Table for 4 on Saturday at 8" — done',
      subtitle:
        'Reservations described in plain language. Party size, date, time, special occasions and seating — all extracted in one message.',
    },
    exampleConversations: [
      {
        lang: 'en',
        user: 'Table for 4 on Saturday at 8pm for a birthday, would love a window seat if possible',
        extracted: { party_size: 4, date: 'saturday', time: '20:00', occasion: 'birthday', seating_preference: 'window' },
      },
    ],
    fields: ['party_size', 'date', 'time', 'occasion', 'seating_preference'],
    proofPoints: ['Party size, date and time are filled from one message', 'Occasion and seating preference are optional fields you can add'],
  },


];
