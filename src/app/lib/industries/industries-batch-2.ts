// Industries content batch 2 — 4 verticals (ten were taken down in L1б).
import type { IndustryContent } from '../types';

export const industriesBatch2: IndustryContent[] = [
  // ============================================================
  // FITNESS & SPORTS
  // ============================================================
  {
    slug: 'fitness-gyms',
    category: 'Fitness & Sports',
    name: 'Gyms & fitness centers',
    hero: {
      title: 'Tour bookings, trial classes, member onboarding — one widget',
      subtitle: 'Prospects ask about membership, classes, or trials. The widget captures intent and collects the details your team needs for the next step.',
    },
    exampleConversations: [
      {
        lang: 'en',
        user: 'Want to see your gym before signing up, also curious about your spin classes — can I book a tour and a trial?',
        extracted: { inquiry_type: 'tour_and_trial', trial_or_tour: 'both', membership_interest: 'considering', goal: 'general_fitness' },
      },
    ],
    fields: ['inquiry_type', 'goal', 'membership_interest', 'trial_or_tour', 'date_window'],
    proofPoints: ['An inquiry-type field separates a tour, a trial class and a membership question', 'Trial and tour dates are collected in the same conversation'],
  },
  {
    slug: 'fitness-yoga-studios',
    category: 'Fitness & Sports',
    name: 'Yoga & pilates studios',
    hero: {
      title: 'From "do you have a beginner class on weekday mornings?" to a booked class',
      subtitle: 'Students describe what they\'re looking for — class type, level, instructor — and book in one flow.',
    },
    exampleConversations: [
      {
        lang: 'en',
        user: 'Looking for a beginner-friendly vinyasa class, weekday mornings work best',
        extracted: { class_type: 'vinyasa', level: 'beginner', time_window: 'weekday_mornings', first_class: true },
      },
    ],
    fields: ['class_type', 'level', 'preferred_instructor', 'date_window', 'first_class'],
    proofPoints: ['Class type, level and instructor are filled from one message', 'The instructor list can come from your own endpoint and appear as cards the student picks from'],
  },


  // ============================================================
  // AUTOMOTIVE
  // ============================================================
  {
    slug: 'automotive-repair',
    category: 'Automotive',
    name: 'Auto repair shops',
    hero: {
      eyebrow: 'For auto repair',
      title: '"My check engine light is on" → booked diagnostic',
      subtitle:
        'Customers describe the symptom; the widget captures vehicle make/model/year and collects a time for a diagnostic.',
    },
    exampleConversations: [
      {
        lang: 'en',
        user: 'Check engine light came on yesterday in my 2019 Toyota RAV4, also feels like it\'s hesitating when accelerating',
        extracted: { vehicle_make: 'Toyota', vehicle_model: 'RAV4', vehicle_year: 2019, symptom: 'check_engine_and_hesitation', urgency: 'medium' },
      },
    ],
    fields: ['vehicle_make', 'vehicle_model', 'vehicle_year', 'symptom', 'urgency', 'preferred_mechanic', 'date_window'],
    proofPoints: ['Vehicle make, model and year are filled from one sentence', 'Your own mechanics endpoint can offer the available mechanics as cards'],
  },
  {
    slug: 'automotive-driving-schools',
    category: 'Automotive',
    name: 'Driving schools',
    hero: {
      title: 'Lesson packages, road tests, refresher courses — one widget',
      subtitle: 'Students describe their goal — first license, refresher, foreign license conversion — and book accordingly.',
    },
    exampleConversations: [
      {
        lang: 'pl',
        user: 'Chcę zrobić prawo jazdy kategorii B, jestem początkujący, wolałbym instruktora mówiącego po polsku',
        extracted: { license_type: 'B', experience: 'none', language: 'pl', package: 'full_course' },
      },
    ],
    fields: ['license_type', 'experience', 'package', 'language', 'preferred_instructor', 'date_window'],
    proofPoints: ['Licence type and the student\'s language are collected from one message', 'Preferred instructor and date window are collected in the same conversation'],
  },
];
