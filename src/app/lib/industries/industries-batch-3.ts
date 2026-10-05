// Industries content batch 3 — 14 more verticals (final batch).
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
  {
    slug: 'education-language-schools',
    category: 'Education',
    name: 'Language schools',
    hero: {
      title: 'Placement, courses, and trials — conversational',
      subtitle: 'Prospective students describe their goal and current level; the widget collects what a placement test or trial class needs.',
    },
    exampleConversations: [
      {
        lang: 'en',
        user: 'Want to learn German, beginner-ish — took a year in high school but forgot everything, prefer small groups',
        extracted: { target_language: 'de', current_level: 'A1', goal: 'general', group_or_private: 'group' },
      },
    ],
    fields: ['target_language', 'current_level', 'goal', 'group_or_private', 'schedule_preference'],
    proofPoints: ['Current level is captured in the student\'s own words', 'Group versus private is a select field with your own options'],
  },
  {
    slug: 'education-music-schools',
    category: 'Education',
    name: 'Music schools & instructors',
    hero: {
      title: 'Trial lessons, instrument matching, recurring schedules',
      subtitle: 'Students describe their instrument, level, and goal; the widget collects the details for a trial lesson.',
    },
    exampleConversations: [
      {
        lang: 'en',
        user: 'My 10-year-old daughter wants to start piano, complete beginner, looking for a trial lesson after school',
        extracted: { instrument: 'piano', level: 'beginner', student_age: 10, lesson_format: 'in_person', date_window: 'after_school' },
      },
    ],
    fields: ['instrument', 'level', 'student_age', 'preferred_teacher', 'lesson_format', 'date_window'],
    proofPoints: ['Instrument, level and student age are filled from one message', 'The teacher list can come from your own endpoint and appear as cards'],
  },
  {
    slug: 'education-test-prep',
    category: 'Education',
    name: 'Test prep (SAT/IELTS/etc)',
    hero: {
      title: 'Test goals captured before the first call',
      subtitle: 'Students describe the test, target score, and timeline; the widget collects them and a time for a diagnostic.',
    },
    exampleConversations: [
      {
        lang: 'en',
        user: 'Need to hit IELTS 7.5 by November for my master\'s application, currently around 6.5 from a practice test',
        extracted: { test_type: 'IELTS', target_score: '7.5', test_date: 'november', current_level: '6.5', preferred_format: 'either' },
      },
    ],
    fields: ['test_type', 'target_score', 'test_date', 'current_level', 'preferred_format'],
    proofPoints: ['Test type, target score and test date are filled from one message', 'Preferred format is a select field with your own options'],
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
  {
    slug: 'hospitality-hotels',
    category: 'Hospitality',
    name: 'Hotels & B&Bs',
    hero: {
      title: 'Inquiries that turn into bookings',
      subtitle: 'Guests describe their stay — dates, party, room type, special requests — and the widget collects the details your front desk needs.',
    },
    exampleConversations: [
      {
        lang: 'en',
        user: 'Two adults and a kid, check-in June 12 for four nights, looking for a room with a balcony, late check-in needed',
        extracted: { check_in: '2026-06-12', check_out: '2026-06-16', guests: { adults: 2, children: 1 }, room_type: 'balcony', special_requests: ['late_check_in'] },
      },
    ],
    fields: ['check_in', 'check_out', 'guests', 'room_type', 'special_requests', 'package_interest'],
    proofPoints: ['Check-in and check-out dates and guest counts are filled from one message', 'Special requests are collected as free text for your front desk'],
  },
  {
    slug: 'hospitality-event-venues',
    category: 'Hospitality',
    name: 'Event venues',
    hero: {
      title: 'Event inquiries that don\'t require a form',
      subtitle: 'Hosts describe their event — type, date, headcount, catering — and the widget collects what your event manager needs.',
    },
    exampleConversations: [
      {
        lang: 'en',
        user: 'Planning a 80-person corporate retreat for September 19, need catering and AV, budget around 15k',
        extracted: { event_type: 'corporate_retreat', date: '2026-09-19', headcount: 80, catering_interest: true, av_needs: true, budget_range: '15k' },
      },
    ],
    fields: ['event_type', 'date', 'headcount', 'catering_interest', 'av_needs', 'budget_range'],
    proofPoints: ['Event type, date and headcount are filled from one message', 'Budget range is an optional field'],
  },
  {
    slug: 'hospitality-tours',
    category: 'Hospitality',
    name: 'Tours & activities',
    hero: {
      title: 'Tour bookings in any language',
      subtitle: 'Guests describe what they want to do; the widget collects the tour, the group size and the language.',
    },
    exampleConversations: [
      {
        lang: 'it',
        user: 'Vorremmo un tour storico privato del centro per 4 persone, in italiano, sabato mattina, circa 3 ore',
        extracted: { tour_type: 'historical_private', group_size: 4, language: 'it', date: 'saturday_morning', duration: '3h' },
      },
    ],
    fields: ['tour_type', 'date', 'group_size', 'language', 'duration', 'pickup_location'],
    proofPoints: ['Guests can write in any of 25+ languages; the tour language is a field', 'Date, group size and duration are filled from one message'],
  },

  // ============================================================
  // REAL ESTATE
  // ============================================================
  {
    slug: 'realestate-residential',
    category: 'Real Estate',
    name: 'Residential real estate',
    hero: {
      eyebrow: 'For real estate agencies',
      title: 'Buyers describe what they want. The widget collects a request for a viewing.',
      subtitle:
        'Bedrooms, neighborhood, price range, must-haves — all extracted. A viewing request is collected with the details your agent needs.',
    },
    exampleConversations: [
      {
        lang: 'en',
        user: 'Looking for a 3-bedroom in Brookline under 900k, school district matters, ideally closing within 3 months',
        extracted: { property_type: 'house', bedrooms: 3, neighborhood: 'Brookline', price_range: '<900k', buy_or_rent: 'buy', timeline: '3mo', must_haves: ['school_district'] },
      },
    ],
    fields: ['property_type', 'bedrooms', 'neighborhood', 'price_range', 'buy_or_rent', 'timeline', 'date_window'],
    proofPoints: ['Bedrooms, neighborhood and price range are filled from one message', 'The fields arrive at your CRM as JSON, shaped by your field mapping'],
  },
  {
    slug: 'realestate-commercial',
    category: 'Real Estate',
    name: 'Commercial real estate',
    hero: {
      title: 'Tenant inquiries, qualified at intake',
      subtitle: 'Prospective tenants describe their business and space needs; the widget collects what your broker needs.',
    },
    exampleConversations: [
      {
        lang: 'en',
        user: 'Software startup, 15 people growing to 30, need around 3500 sqft of office in downtown, lease ideally',
        extracted: { business_type: 'software_startup', space_type: 'office', sqft: 3500, location: 'downtown', lease_or_buy: 'lease', headcount_growth: '15-to-30' },
      },
    ],
    fields: ['space_type', 'sqft', 'location', 'business_type', 'lease_or_buy', 'move_in_timeline'],
    proofPoints: ['Space type, size and location are filled from one message', 'The fields arrive at your CRM as JSON, shaped by your field mapping'],
  },
  {
    slug: 'realestate-property-management',
    category: 'Real Estate',
    name: 'Property management',
    hero: {
      title: 'Tenant requests, maintenance, viewings — one widget',
      subtitle: 'Prospective and current tenants describe their need; the widget collects the request type, the unit and the urgency.',
    },
    exampleConversations: [
      {
        lang: 'en',
        user: 'Tenant in unit 4B, heater isn\'t working since last night, getting really cold, please send someone',
        extracted: { inquiry_type: 'maintenance', unit_id: '4B', urgency: 'high', description: 'heater_not_working' },
      },
    ],
    fields: ['inquiry_type', 'unit_id', 'urgency', 'description', 'date_window'],
    proofPoints: ['Request type is a select field with your own options (leasing, maintenance, accounting)', 'Unit and description are filled from one message'],
  },

  // ============================================================
  // PET SERVICES
  // ============================================================
  {
    slug: 'pet-veterinary',
    category: 'Pet Services',
    name: 'Veterinary clinics',
    hero: {
      eyebrow: 'For veterinary clinics',
      title: 'Pet owners describe what\'s wrong. The widget collects a request for a visit.',
      subtitle:
        'Species, breed, age, symptom, urgency — captured in one message.',
    },
    exampleConversations: [
      {
        lang: 'en',
        user: 'My 6-year-old golden retriever has been limping on his left front leg since yesterday, not weight-bearing',
        extracted: { species: 'dog', breed: 'golden_retriever', pet_age: 6, symptom: 'limping_left_front', urgency: 'high' },
      },
    ],
    fields: ['species', 'breed', 'pet_age', 'symptom', 'urgency', 'preferred_vet', 'date_window'],
    proofPoints: ['Species, breed and age are filled from one message', 'Urgency is a select field with your own options'],
  },
  {
    slug: 'pet-grooming',
    category: 'Pet Services',
    name: 'Pet grooming',
    hero: {
      title: 'Bath, groom, full package — by breed and size',
      subtitle: 'Owners describe their pet and service; the widget collects breed, size and service for your groomer.',
    },
    exampleConversations: [
      {
        lang: 'en',
        user: 'Mini poodle, about 12 pounds, needs a full groom — bath, haircut, nails — sensitive to dryers if possible',
        extracted: { species: 'dog', breed: 'mini_poodle', size: '12lb', service: 'full_groom', add_ons: ['nail_trim'], special_notes: 'dryer_sensitive' },
      },
    ],
    fields: ['species', 'breed', 'size', 'service', 'preferred_groomer', 'date_window'],
    proofPoints: ['Breed and size are filled from one message', 'Add-ons are a multiselect field with your own options'],
  },
  {
    slug: 'pet-training',
    category: 'Pet Services',
    name: 'Pet training',
    hero: {
      title: 'Behavior described, trainer matched, session booked',
      subtitle: 'Owners describe the issue — pulling on leash, separation anxiety, basic obedience — and the widget collects the issue and the goal for your trainer.',
    },
    exampleConversations: [
      {
        lang: 'en',
        user: 'Year-old labrador, pulls really hard on walks and barks at other dogs, want private sessions',
        extracted: { species: 'dog', breed: 'labrador', pet_age: 1, behavior_concern: ['leash_pulling', 'reactivity'], training_goal: 'leash_manners', group_or_private: 'private' },
      },
    ],
    fields: ['species', 'pet_age', 'behavior_concern', 'training_goal', 'group_or_private', 'date_window'],
    proofPoints: ['Behavior concerns are a multiselect field with your own options', 'Group versus private is a select field'],
  },
];
