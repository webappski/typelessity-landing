// Industries content batch 2 — 14 more verticals.
import type { IndustryContent } from '../types';

export const industriesBatch2: IndustryContent[] = [
  // ============================================================
  // FITNESS & SPORTS
  // ============================================================
  {
    slug: 'fitness-personal-training',
    category: 'Fitness & Sports',
    name: 'Personal training',
    hero: {
      eyebrow: 'For personal trainers',
      title: 'Clients describe their goal. The widget books the session.',
      subtitle:
        'Weight loss, strength, mobility, sport-specific — clients describe what they want, the widget matches a trainer and books an intro session.',
    },
    exampleConversations: [
      {
        lang: 'en',
        user: 'I want to start strength training, I\'m a beginner, looking for twice a week sessions in the morning',
        extracted: { goal: 'strength', experience: 'beginner', frequency: '2x_week', time_window: 'morning' },
      },
    ],
    fields: ['goal', 'experience_level', 'frequency', 'preferred_trainer', 'session_type', 'time_window'],
    proofPoints: ['Goal-to-trainer matching automatic', 'Multi-session packages bookable in one flow'],
  },
  {
    slug: 'fitness-gyms',
    category: 'Fitness & Sports',
    name: 'Gyms & fitness centers',
    hero: {
      title: 'Tour bookings, trial classes, member onboarding — one widget',
      subtitle: 'Prospects ask about membership, classes, or trials. The widget captures intent and books the right next step.',
    },
    fields: ['inquiry_type', 'goal', 'membership_interest', 'trial_or_tour', 'date_window'],
    proofPoints: ['Splits info request from booking automatically', 'Class trial scheduling inline'],
  },
  {
    slug: 'fitness-yoga-studios',
    category: 'Fitness & Sports',
    name: 'Yoga & pilates studios',
    hero: {
      title: 'From "do you have prenatal yoga?" to a booked class',
      subtitle: 'Students describe what they\'re looking for — class type, level, instructor — and book in one flow.',
    },
    fields: ['class_type', 'level', 'preferred_instructor', 'date_window', 'first_class'],
    proofPoints: ['Handles 20+ class types per studio', 'First-class discount auto-applied'],
  },
  {
    slug: 'fitness-martial-arts',
    category: 'Fitness & Sports',
    name: 'Martial arts schools',
    hero: {
      title: 'Trial classes booked in one conversation',
      subtitle: 'Prospects describe their interest — BJJ, Muay Thai, kids classes — and book a trial with the right instructor.',
    },
    fields: ['discipline', 'experience', 'student_age', 'trial_type', 'date_window'],
    proofPoints: ['Adult / kids / family classes routed correctly', 'Trial-to-membership conversion tracked'],
  },
  {
    slug: 'fitness-sports-coaching',
    category: 'Fitness & Sports',
    name: 'Tennis, golf & sports coaching',
    hero: {
      title: 'Lessons, clinics, and court bookings — conversational',
      subtitle: 'Players describe their level, goal, and availability; the widget books a coach or court.',
    },
    fields: ['sport', 'level', 'goal', 'preferred_coach', 'session_or_court', 'date_window'],
    proofPoints: ['Court availability + coach availability merged', 'Group vs. private auto-suggested'],
  },

  // ============================================================
  // HOME SERVICES
  // ============================================================
  {
    slug: 'home-cleaning',
    category: 'Home Services',
    name: 'Cleaning services',
    hero: {
      eyebrow: 'For cleaning companies',
      title: 'Clients describe the home. The widget quotes and books.',
      subtitle:
        'Bedrooms, bathrooms, square footage, deep clean vs. regular, frequency — all extracted from one message. Estimated price shown inline.',
    },
    exampleConversations: [
      {
        lang: 'en',
        user: 'I have a 3-bedroom 2-bathroom apartment, need a deep clean before move-out next Friday',
        extracted: { bedrooms: 3, bathrooms: 2, service: 'deep_clean', context: 'move_out', date: 'next_friday' },
      },
    ],
    fields: ['bedrooms', 'bathrooms', 'sqft', 'service_type', 'frequency', 'context', 'date_window', 'pets'],
    proofPoints: ['Inline price estimation from extracted fields', 'Move-in/out vs. recurring routed correctly'],
  },
  {
    slug: 'home-handyman',
    category: 'Home Services',
    name: 'Handyman & home repair',
    hero: {
      title: 'From "my faucet is leaking" to a scheduled visit',
      subtitle: 'Clients describe the problem; the widget extracts urgency, trade, and books a visit with photo upload optional.',
    },
    fields: ['problem_description', 'trade', 'urgency', 'photo_attachment', 'date_window'],
    proofPoints: ['Auto-classifies into 18 trade categories', 'Emergency vs. scheduled routing'],
  },
  {
    slug: 'home-hvac',
    category: 'Home Services',
    name: 'HVAC & plumbing',
    hero: {
      title: 'Service calls described in plain words',
      subtitle: 'Clients describe the symptom — "AC not cooling," "water heater making noise" — and the widget books with the right technician.',
    },
    fields: ['system_type', 'symptom', 'urgency', 'unit_age', 'preferred_window'],
    proofPoints: ['Symptom-to-technician matching', 'Same-day urgency surfaces emergency dispatcher'],
  },
  {
    slug: 'home-landscaping',
    category: 'Home Services',
    name: 'Landscaping & gardening',
    hero: {
      title: 'Quotes, recurring service, one-off projects — one flow',
      subtitle: 'Clients describe their property and need; the widget routes to estimator, recurring crew, or project lead.',
    },
    fields: ['property_size', 'service_type', 'frequency', 'project_or_recurring', 'date_window'],
    proofPoints: ['Property-size triage', 'Seasonal service auto-suggested'],
  },
  {
    slug: 'home-moving',
    category: 'Home Services',
    name: 'Moving companies',
    hero: {
      title: 'Move-day scheduling, conversational',
      subtitle: 'Clients describe their move — origin, destination, size, packing service — and book a binding estimate visit.',
    },
    fields: ['origin', 'destination', 'home_size', 'packing_service', 'storage_needed', 'move_date'],
    proofPoints: ['Long-distance vs. local routing', 'Estimate visit + move date booked together'],
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
        'Customers describe the symptom; the widget captures vehicle make/model/year, books a diagnostic, and suggests prep info.',
    },
    fields: ['vehicle_make', 'vehicle_model', 'vehicle_year', 'symptom', 'urgency', 'preferred_mechanic', 'date_window'],
    proofPoints: ['VIN lookup integration', 'Maintenance vs. repair auto-routed'],
  },
  {
    slug: 'automotive-detailing',
    category: 'Automotive',
    name: 'Auto detailing',
    hero: {
      title: 'Wash, full detail, ceramic coating — described, priced, booked',
      subtitle: 'Customers describe the package they want and the vehicle. Inline pricing reflects vehicle size.',
    },
    fields: ['package', 'vehicle_size', 'add_ons', 'preferred_location', 'date_window'],
    proofPoints: ['Package upsell suggestions', 'Mobile vs. shop location split'],
  },
  {
    slug: 'automotive-test-drives',
    category: 'Automotive',
    name: 'Dealership test drives',
    hero: {
      title: 'Browsing to booked test drive in 30 seconds',
      subtitle: 'Prospects describe the vehicle they\'re interested in; the widget books a test drive with a salesperson.',
    },
    fields: ['vehicle_interest', 'trim_level', 'trade_in', 'finance_or_lease', 'preferred_salesperson', 'date_window'],
    proofPoints: ['Inventory check inline', 'Trade-in question integrated'],
  },
  {
    slug: 'automotive-driving-schools',
    category: 'Automotive',
    name: 'Driving schools',
    hero: {
      title: 'Lesson packages, road tests, refresher courses — one widget',
      subtitle: 'Students describe their goal — first license, refresher, foreign license conversion — and book accordingly.',
    },
    fields: ['license_type', 'experience', 'package', 'language', 'preferred_instructor', 'date_window'],
    proofPoints: ['Language-matched instructor routing', 'Package + individual lesson pricing'],
  },
];
