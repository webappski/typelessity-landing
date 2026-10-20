// Industries content batch 2 — 4 verticals (ten were taken down in L1б). L8 (2026-10-20): see batch 1.
import type { IndustryContent } from '../types';

const WIDGETS_ARTICLE = { slug: 'best-ai-booking-widgets-2026', title: 'Best AI booking widgets 2026: comparison and decision guide' };

export const industriesBatch2: IndustryContent[] = [
  // ============================================================
  // FITNESS & SPORTS
  // ============================================================
  {
    slug: 'fitness-gyms',
    category: 'Fitness & Sports',
    name: 'Gyms & fitness centers',
    audience: 'gyms',
    description: 'Tour and trial-class requests by chat for gyms: prospects say what they want, and the assistant sends your team the request with the details.',
    hero: {
      subtitle: 'Typelessity adds tour and trial-class requests by chat to your gym’s website. Prospects ask about membership, classes or a trial; the assistant captures what they want and collects the details your team needs for the next step.',
    },
    article: WIDGETS_ARTICLE,
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
    audience: 'yoga and pilates studios',
    description: 'Class booking by chat for yoga and pilates studios: students name the class, level and time, and the assistant sends you the request.',
    hero: {
      subtitle: 'Typelessity adds class booking by chat to your studio’s website. Students describe what they are looking for — class type, level, instructor — and the assistant collects it from one message and sends you the request.',
    },
    quote: 'Do you have a beginner class on weekday mornings?',
    challenges: [
      'Class names are not the student’s words. “Beginner-friendly, weekday mornings” is a level and a time window, not a line of the timetable.',
      'A first class is a different request from a regular one. Level and “first class” are details the instructor wants before the visit, not after it.',
      'Some students come for one teacher. The instructor is a field with options, not a note typed into a free-text box.',
    ],
    article: WIDGETS_ARTICLE,
    exampleConversations: [
      {
        lang: 'en',
        user: 'Looking for a beginner-friendly vinyasa class, weekday mornings work best',
        extracted: { class_type: 'vinyasa', level: 'beginner', time_window: 'weekday_mornings', first_class: true },
      },
    ],
    fields: ['class_type', 'level', 'preferred_instructor', 'date_window', 'first_class'],
    proofPoints: ['Class type, level and instructor are filled from one message', 'The instructor list can come from your own endpoint and appear as cards the student picks from'],
    industryFAQ: [
      {
        q: 'Does it work with the booking system my studio already uses?',
        a: 'It sits in front of it: it replaces the intake form, not the system behind it. If your system has an API, your web developer connects it and the request goes straight in. If not, every request reaches you by email. There is no ready-made connector for named systems yet.',
      },
      {
        q: 'Can students write in their own language?',
        a: 'Yes, students can speak or type in their own language. The assistant replies in the language you set for your business.',
      },
      {
        q: 'Can a student pick an instructor?',
        a: 'Yes. The instructor list can come from your own endpoint and appear as cards the student picks from.',
      },
      {
        q: 'Does it know that someone is coming for a first class?',
        a: 'Yes. Whether it is the first class is one of the details it collects, next to the class type and the level.',
      },
    ],
  },

  // ============================================================
  // AUTOMOTIVE
  // ============================================================
  {
    slug: 'automotive-repair',
    category: 'Automotive',
    name: 'Auto repair shops',
    audience: 'auto repair shops',
    description: 'Online booking for auto repair shops by chat: drivers describe the symptom and the car, and the assistant sends you a request with make, model and year.',
    hero: {
      eyebrow: 'For auto repair',
      subtitle:
        'Typelessity adds online booking by chat to your repair shop’s website. Customers describe the symptom in their own words; the assistant collects the make, model and year and a time for a diagnostic, and sends you the request.',
    },
    quote: 'My check engine light is on',
    challenges: [
      'The customer describes a symptom, not a job. “Check engine light and it hesitates when I accelerate” is a diagnostic for your shop, not a line in a dropdown.',
      'Make, model and year decide the parts and the time. They are three fields that one sentence can fill.',
      'Urgency is part of the request. A car that can wait and a car that cannot should reach you as different requests.',
    ],
    article: WIDGETS_ARTICLE,
    exampleConversations: [
      {
        lang: 'en',
        user: 'Check engine light came on yesterday in my 2019 Toyota RAV4, also feels like it\'s hesitating when accelerating',
        extracted: { vehicle_make: 'Toyota', vehicle_model: 'RAV4', vehicle_year: 2019, symptom: 'check_engine_and_hesitation', urgency: 'medium' },
      },
    ],
    fields: ['vehicle_make', 'vehicle_model', 'vehicle_year', 'symptom', 'urgency', 'preferred_mechanic', 'date_window'],
    proofPoints: ['Vehicle make, model and year are filled from one sentence', 'Your own mechanics endpoint can offer the available mechanics as cards'],
    industryFAQ: [
      {
        q: 'Does it work with the booking system my shop already uses?',
        a: 'It sits in front of it: it replaces the intake form, not the system behind it. If your system has an API, your web developer connects it and the request goes straight in. If not, every request reaches you by email. There is no ready-made connector for named systems yet.',
      },
      {
        q: 'Can customers write in their own language?',
        a: 'Yes, customers can speak or type in their own language. The assistant replies in the language you set for your business.',
      },
      {
        q: 'Can the mechanic list come from our system?',
        a: 'Yes. Your own mechanics endpoint can offer the available mechanics as cards the customer picks from.',
      },
    ],
  },
  {
    slug: 'automotive-driving-schools',
    category: 'Automotive',
    name: 'Driving schools',
    audience: 'driving schools',
    description: 'Lesson booking by chat for driving schools: students name the licence, package and instructor, and the assistant sends you the request.',
    hero: {
      subtitle: 'Typelessity adds lesson booking by chat to your driving school’s website. Students describe their goal — a first licence, a refresher, a foreign licence conversion — and the assistant collects the licence type, the package and the instructor they want, and sends you the request.',
    },
    challenges: [
      'Students arrive with a goal, not a package. “Category B, complete beginner” points to a course, but the student rarely knows what it is called.',
      'The instructor’s language can be part of the choice. The example collects the student’s language together with the licence type.',
      'A refresher and a first licence are different requests. The experience field tells them apart before anyone calls back.',
    ],
    article: WIDGETS_ARTICLE,
    exampleConversations: [
      {
        lang: 'pl',
        user: 'Chcę zrobić prawo jazdy kategorii B, jestem początkujący, wolałbym instruktora mówiącego po polsku',
        extracted: { license_type: 'B', experience: 'none', language: 'pl', package: 'full_course' },
      },
    ],
    fields: ['license_type', 'experience', 'package', 'language', 'preferred_instructor', 'date_window'],
    proofPoints: ['Licence type and the student\'s language are collected from one message', 'Preferred instructor and date window are collected in the same conversation'],
    industryFAQ: [
      {
        q: 'Does it work with the booking system my driving school already uses?',
        a: 'It sits in front of it: it replaces the intake form, not the system behind it. If your system has an API, your web developer connects it and the request goes straight in. If not, every request reaches you by email. There is no ready-made connector for named systems yet.',
      },
      {
        q: 'Can students write in their own language?',
        a: 'Yes, students can speak or type in their own language; the example above is in Polish. The assistant replies in the language you set for your business.',
      },
      {
        q: 'Can a student ask for an instructor who speaks their language?',
        a: 'Yes. The student’s language and a preferred instructor are collected in the same conversation.',
      },
    ],
  },
];
