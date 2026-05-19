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
        'Subject, grade level, exam prep, language preference — all extracted from one message. Tutor matched to student.',
    },
    exampleConversations: [
      {
        lang: 'en',
        user: 'My daughter is in 9th grade, struggling with algebra, needs help twice a week before finals',
        extracted: { subject: 'algebra', grade: 9, frequency: '2x_week', context: 'exam_prep' },
      },
    ],
    fields: ['subject', 'grade_level', 'goal', 'frequency', 'language', 'in_person_or_remote', 'date_window'],
    proofPoints: ['Tutor-to-student subject + level matching', 'Exam prep deadline awareness'],
  },
  {
    slug: 'education-language-schools',
    category: 'Education',
    name: 'Language schools',
    hero: {
      title: 'Placement, courses, and trials — conversational',
      subtitle: 'Prospective students describe their goal and current level; the widget books a placement test or trial class.',
    },
    fields: ['target_language', 'current_level', 'goal', 'group_or_private', 'schedule_preference'],
    proofPoints: ['Self-described level captured for placement', 'Group + private routing'],
  },
  {
    slug: 'education-music-schools',
    category: 'Education',
    name: 'Music schools & instructors',
    hero: {
      title: 'Trial lessons, instrument matching, recurring schedules',
      subtitle: 'Students describe their instrument, level, and goal; the widget books a trial lesson with the right teacher.',
    },
    fields: ['instrument', 'level', 'student_age', 'preferred_teacher', 'lesson_format', 'date_window'],
    proofPoints: ['Instrument + age + level → teacher match', 'Recital prep priority routing'],
  },
  {
    slug: 'education-test-prep',
    category: 'Education',
    name: 'Test prep (SAT/IELTS/etc)',
    hero: {
      title: 'Test goals captured, prep plans suggested',
      subtitle: 'Students describe the test, target score, and timeline; the widget books a diagnostic and recommends prep package.',
    },
    fields: ['test_type', 'target_score', 'test_date', 'current_level', 'preferred_format'],
    proofPoints: ['Diagnostic-first booking flow', 'Package recommendation inline'],
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
        'Reservations described in plain language. Party size, date, time, dietary needs, special occasions — all extracted in one message.',
    },
    fields: ['party_size', 'date', 'time', 'dietary_restrictions', 'occasion', 'seating_preference'],
    proofPoints: ['Special occasions trigger note to staff', 'Allergy info preserved verbatim'],
  },
  {
    slug: 'hospitality-hotels',
    category: 'Hospitality',
    name: 'Hotels & B&Bs',
    hero: {
      title: 'Inquiries that turn into bookings',
      subtitle: 'Guests describe their stay — dates, party, room type, special requests — and the widget books or routes to the front desk.',
    },
    fields: ['check_in', 'check_out', 'guests', 'room_type', 'special_requests', 'package_interest'],
    proofPoints: ['Multi-room bookings handled', 'Direct booking conversion vs. OTA'],
  },
  {
    slug: 'hospitality-event-venues',
    category: 'Hospitality',
    name: 'Event venues',
    hero: {
      title: 'Event inquiries that don\'t require a form',
      subtitle: 'Hosts describe their event — type, date, headcount, catering — and the widget routes to the right event manager.',
    },
    fields: ['event_type', 'date', 'headcount', 'catering_interest', 'av_needs', 'budget_range'],
    proofPoints: ['Event manager assignment by event type', 'Walk-through booking automated'],
  },
  {
    slug: 'hospitality-tours',
    category: 'Hospitality',
    name: 'Tours & activities',
    hero: {
      title: 'Tour bookings in any language',
      subtitle: 'Guests describe what they want to do; the widget books a tour with a guide in their language.',
    },
    fields: ['tour_type', 'date', 'group_size', 'language', 'duration', 'pickup_location'],
    proofPoints: ['Multilingual guide matching', 'Group + private routing'],
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
      title: 'Buyers describe what they want. The widget books a viewing.',
      subtitle:
        'Bedrooms, neighborhood, price range, must-haves — all extracted. Viewing scheduled with the right agent.',
    },
    fields: ['property_type', 'bedrooms', 'neighborhood', 'price_range', 'buy_or_rent', 'timeline', 'date_window'],
    proofPoints: ['Buyer profile auto-built for agent CRM', 'Multi-property viewing scheduling'],
  },
  {
    slug: 'realestate-commercial',
    category: 'Real Estate',
    name: 'Commercial real estate',
    hero: {
      title: 'Tenant inquiries, qualified at intake',
      subtitle: 'Prospective tenants describe their business and space needs; the widget routes to the right broker.',
    },
    fields: ['space_type', 'sqft', 'location', 'business_type', 'lease_or_buy', 'move_in_timeline'],
    proofPoints: ['Business-type pre-qualification', 'Multi-property tour scheduling'],
  },
  {
    slug: 'realestate-property-management',
    category: 'Real Estate',
    name: 'Property management',
    hero: {
      title: 'Tenant requests, maintenance, viewings — one widget',
      subtitle: 'Prospective and current tenants describe their need; the widget routes to leasing, maintenance, or accounting.',
    },
    fields: ['inquiry_type', 'unit_id', 'urgency', 'description', 'date_window'],
    proofPoints: ['Maintenance ticket creation inline', 'Tenant vs. prospect auto-routed'],
  },

  // ============================================================
  // OTHER
  // ============================================================
  {
    slug: 'pet-veterinary',
    category: 'Pet Services',
    name: 'Veterinary clinics',
    hero: {
      eyebrow: 'For veterinary clinics',
      title: 'Pet owners describe what\'s wrong. The widget books the vet.',
      subtitle:
        'Species, breed, age, symptom, urgency — captured in one message. Routing handles emergency vs. routine cleanly.',
    },
    fields: ['species', 'breed', 'pet_age', 'symptom', 'urgency', 'preferred_vet', 'date_window'],
    proofPoints: ['Emergency keyword detection', 'Multi-pet households handled'],
  },
  {
    slug: 'pet-grooming',
    category: 'Pet Services',
    name: 'Pet grooming',
    hero: {
      title: 'Bath, groom, full package — by breed and size',
      subtitle: 'Owners describe their pet and service; the widget prices and books with the right groomer.',
    },
    fields: ['species', 'breed', 'size', 'service', 'preferred_groomer', 'date_window'],
    proofPoints: ['Breed-aware service duration', 'Add-on suggestions'],
  },
  {
    slug: 'pet-training',
    category: 'Pet Services',
    name: 'Pet training',
    hero: {
      title: 'Behavior described, trainer matched, session booked',
      subtitle: 'Owners describe the issue — pulling on leash, separation anxiety, basic obedience — and the widget books with a specialized trainer.',
    },
    fields: ['species', 'pet_age', 'behavior_concern', 'training_goal', 'group_or_private', 'date_window'],
    proofPoints: ['Behavior-to-trainer specialty match', 'Group class vs. private routing'],
  },
];
