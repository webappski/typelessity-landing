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
      title: 'Clients describe their goal. The widget collects a request for a session.',
      subtitle:
        'Weight loss, strength, mobility, sport-specific — clients describe what they want; the widget collects their goal, experience level and availability for an intro session.',
    },
    exampleConversations: [
      {
        lang: 'en',
        user: 'I want to start strength training, I\'m a beginner, looking for twice a week sessions in the morning',
        extracted: { goal: 'strength', experience: 'beginner', frequency: '2x_week', time_window: 'morning' },
      },
    ],
    fields: ['goal', 'experience_level', 'frequency', 'preferred_trainer', 'session_type', 'time_window'],
    proofPoints: ['Goal and experience level are filled from one message', 'Session type is a select field with your own options'],
  },
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
  {
    slug: 'fitness-martial-arts',
    category: 'Fitness & Sports',
    name: 'Martial arts schools',
    hero: {
      title: 'Trial classes booked in one conversation',
      subtitle: 'Prospects describe their interest — BJJ, Muay Thai, kids classes — and book a trial with the right instructor.',
    },
    exampleConversations: [
      {
        lang: 'en',
        user: 'My 8-year-old wants to try BJJ, looking for a kids trial class on a weekend',
        extracted: { discipline: 'bjj', student_age: 8, trial_type: 'kids_trial', experience: 'none', date_window: 'weekend' },
      },
    ],
    fields: ['discipline', 'experience', 'student_age', 'trial_type', 'date_window'],
    proofPoints: ['Adult, kids and family classes are one select field with your own options', 'Student age is a number field with the minimum and maximum you set'],
  },
  {
    slug: 'fitness-sports-coaching',
    category: 'Fitness & Sports',
    name: 'Tennis, golf & sports coaching',
    hero: {
      title: 'Lessons, clinics, and court bookings — conversational',
      subtitle: 'Players describe their level, goal, and availability; the widget collects a request for a coach or court.',
    },
    exampleConversations: [
      {
        lang: 'en',
        user: 'Played tennis casually for years, want to work on my backhand, looking for a private lesson Saturday morning',
        extracted: { sport: 'tennis', level: 'intermediate', goal: 'technique_backhand', session_or_court: 'lesson', date_window: 'saturday_morning' },
      },
    ],
    fields: ['sport', 'level', 'goal', 'preferred_coach', 'session_or_court', 'date_window'],
    proofPoints: ['Sport and level are filled from one message', 'Coach and court availability can come from your own endpoints and appear as cards'],
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
      title: 'Clients describe the home. The widget collects the job.',
      subtitle:
        'Bedrooms, bathrooms, square footage, deep clean vs. regular, frequency — all extracted from one message.',
    },
    exampleConversations: [
      {
        lang: 'en',
        user: 'I have a 3-bedroom 2-bathroom apartment, need a deep clean before move-out next Friday',
        extracted: { bedrooms: 3, bathrooms: 2, service: 'deep_clean', context: 'move_out', date: 'next_friday' },
      },
    ],
    fields: ['bedrooms', 'bathrooms', 'sqft', 'service_type', 'frequency', 'context', 'date_window', 'pets'],
    proofPoints: ['Bedrooms and bathrooms are number fields filled from one sentence', 'Move-in/out versus recurring is a select field with your own options'],
  },
  {
    slug: 'home-handyman',
    category: 'Home Services',
    name: 'Handyman & home repair',
    hero: {
      title: 'From "my faucet is leaking" to a scheduled visit',
      subtitle: 'Clients describe the problem; the widget extracts the trade and urgency and collects a time for a visit.',
    },
    exampleConversations: [
      {
        lang: 'en',
        user: 'Kitchen faucet has been dripping for a week, getting worse, ideally this week',
        extracted: { problem_description: 'kitchen_faucet_drip', trade: 'plumbing', urgency: 'medium', date_window: 'this_week' },
      },
    ],
    fields: ['problem_description', 'trade', 'urgency', 'date_window'],
    proofPoints: ['The problem description is collected as free text for your team', 'Trade and urgency are select fields with your own options'],
  },
  {
    slug: 'home-hvac',
    category: 'Home Services',
    name: 'HVAC & plumbing',
    hero: {
      title: 'Service calls described in plain words',
      subtitle: 'Clients describe the symptom — "AC not cooling," "water heater making noise" — and the widget collects it for your dispatcher.',
    },
    exampleConversations: [
      {
        lang: 'en',
        user: 'AC stopped cooling this morning, unit is about 8 years old, need someone same day if possible',
        extracted: { system_type: 'ac', symptom: 'not_cooling', urgency: 'same_day', unit_age: '8y' },
      },
    ],
    fields: ['system_type', 'symptom', 'urgency', 'unit_age', 'preferred_window'],
    proofPoints: ['System type and symptom are filled from the client\'s own words', 'Urgency is a select field with your own options'],
  },
  {
    slug: 'home-landscaping',
    category: 'Home Services',
    name: 'Landscaping & gardening',
    hero: {
      title: 'Quotes, recurring service, one-off projects — one flow',
      subtitle: 'Clients describe their property and need; the widget collects what your estimator, recurring crew or project lead needs.',
    },
    exampleConversations: [
      {
        lang: 'en',
        user: 'Quarter-acre yard, want bi-weekly mowing and one-time spring cleanup, would like a quote',
        extracted: { property_size: 'quarter_acre', service_type: ['mowing', 'spring_cleanup'], frequency: 'biweekly', project_or_recurring: 'both' },
      },
    ],
    fields: ['property_size', 'service_type', 'frequency', 'project_or_recurring', 'date_window'],
    proofPoints: ['Property size and service type are filled from one message', 'Project versus recurring is a select field with your own options'],
  },
  {
    slug: 'home-moving',
    category: 'Home Services',
    name: 'Moving companies',
    hero: {
      title: 'Move-day scheduling, conversational',
      subtitle: 'Clients describe their move — origin, destination, size, packing service — and request an estimate visit.',
    },
    exampleConversations: [
      {
        lang: 'en',
        user: 'Moving from a 2-bedroom apartment in Chicago to Indianapolis end of June, would also like packing service',
        extracted: { origin: 'Chicago', destination: 'Indianapolis', home_size: '2br_apartment', packing_service: true, move_date: 'end_of_june' },
      },
    ],
    fields: ['origin', 'destination', 'home_size', 'packing_service', 'storage_needed', 'move_date'],
    proofPoints: ['Origin and destination are address fields', 'Estimate visit and move date are collected in the same conversation'],
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
    slug: 'automotive-detailing',
    category: 'Automotive',
    name: 'Auto detailing',
    hero: {
      title: 'Wash, full detail, ceramic coating — described and booked',
      subtitle: 'Customers describe the package they want and the vehicle; the widget collects both, plus add-ons and where the service happens.',
    },
    exampleConversations: [
      {
        lang: 'en',
        user: 'Full interior and exterior detail on a mid-size SUV, would also like ceramic coating add-on, mobile service if possible',
        extracted: { package: 'full_detail', vehicle_size: 'mid_suv', add_ons: ['ceramic_coating'], preferred_location: 'mobile' },
      },
    ],
    fields: ['package', 'vehicle_size', 'add_ons', 'preferred_location', 'date_window'],
    proofPoints: ['Add-ons are a multiselect field with your own options', 'Mobile versus in-shop is a select field'],
  },
  {
    slug: 'automotive-test-drives',
    category: 'Automotive',
    name: 'Dealership test drives',
    hero: {
      title: 'From the car they like to a booked test drive',
      subtitle: 'Prospects describe the vehicle they\'re interested in; the widget collects a request for a test drive with a salesperson.',
    },
    exampleConversations: [
      {
        lang: 'en',
        user: 'Interested in a Mazda CX-5 Premium trim, considering financing, have a 2018 Civic to trade in, Saturday afternoon',
        extracted: { vehicle_interest: 'Mazda CX-5', trim_level: 'Premium', trade_in: '2018 Civic', finance_or_lease: 'finance', date_window: 'saturday_afternoon' },
      },
    ],
    fields: ['vehicle_interest', 'trim_level', 'trade_in', 'finance_or_lease', 'preferred_salesperson', 'date_window'],
    proofPoints: ['Vehicle of interest and trim level are filled from one message', 'A trade-in vehicle is a field like any other'],
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
