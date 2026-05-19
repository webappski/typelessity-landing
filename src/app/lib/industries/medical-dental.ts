// industries/medical-dental.ts — content for /industries/medical-dental
// Each industry exports the same shape so app/industries/[slug]/page.tsx can render uniformly.

import type { IndustryContent } from '../types';

export const medicalDental: IndustryContent = {
  slug: 'medical-dental',
  category: 'Medical',
  name: 'Dental clinics',
  hero: {
    eyebrow: 'For dental practices',
    title: 'Patients book in their own words — not yours',
    subtitle:
      'Replace your booking form with a conversation. Patients describe their need ("I have a toothache, can you see me Friday?") and Typelessity extracts specialty, urgency, doctor preference, and time window in one round-trip.',
    cta: { primary: 'See live demo', secondary: 'Book a 15-min call' },
  },
  exampleConversations: [
    {
      lang: 'en',
      user: 'I need a cleaning sometime next week, ideally with a hygienist who speaks Russian.',
      extracted: {
        service: 'cleaning',
        date_window: 'next_week',
        staff_role: 'hygienist',
        language_preference: 'ru',
      },
    },
    {
      lang: 'ru',
      user: 'У ребёнка молочный зуб шатается, надо к детскому стоматологу как можно скорее',
      extracted: {
        specialty: 'pediatric_dentistry',
        urgency: 'high',
        patient_age_group: 'child',
      },
    },
  ],
  fields: [
    'specialty',
    'urgency',
    'preferred_doctor',
    'doctor_gender_preference',
    'language_preference',
    'date_window',
    'time_window',
    'patient_age_group',
    'first_visit',
    'insurance_provider',
  ],
  enrichments: [
    'GET /doctors?specialty={specialty}',
    'GET /availability?doctor={doctor_id}&date={date}',
    'GET /services?specialty={specialty}',
  ],
  proofPoints: [
    '+39% start-to-confirmed conversion vs. traditional form (60-day study)',
    'Avg booking time 31s vs 84s for forms',
    '22% of bookings via voice on mobile',
  ],
  industryFAQ: [
    {
      q: 'Is patient data HIPAA / GDPR-compliant?',
      a: 'GDPR yes, with DPA, EU residency, and no model training. HIPAA not yet — we plan to add HIPAA BAA in Q3 2026.',
    },
    {
      q: 'Does it integrate with my dental practice management system?',
      a: 'Yes — we POST extracted bookings to any webhook or REST endpoint. Tested with Dentrix, Open Dental, and most EU systems.',
    },
    {
      q: 'What if a patient describes a medical emergency?',
      a: 'The extraction config flags emergency keywords ("severe pain", "bleeding", "swelling") and routes them to a priority queue with an immediate phone callback prompt.',
    },
  ],
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'AI booking widget for dental clinics',
    provider: { '@type': 'Organization', name: 'Typelessity' },
    areaServed: { '@type': 'Place', name: 'Worldwide' },
  },
};
