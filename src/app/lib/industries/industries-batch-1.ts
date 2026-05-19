// Industries content — bulk file with 14 verticals.
// Each entry follows the IndustryContent shape from lib/types.ts.
// Rendered by app/industries/[slug]/page.tsx via getIndustry(slug).

import type { IndustryContent } from '../types';

export const industries: IndustryContent[] = [
  // ============================================================
  // MEDICAL
  // ============================================================
  {
    slug: 'medical-general',
    category: 'Medical',
    name: 'General medical clinics',
    hero: {
      eyebrow: 'For multi-specialty clinics',
      title: 'One booking widget. Every specialty.',
      subtitle:
        'Patients describe their symptom or need; Typelessity routes to the right specialty, doctor, and time slot. No more "select your specialty" dropdowns.',
    },
    exampleConversations: [
      {
        lang: 'en',
        user: 'My back has been hurting for two weeks, I think I need a specialist.',
        extracted: { specialty_inferred: 'orthopedics', urgency: 'medium', symptom_duration: '14d' },
      },
    ],
    fields: ['specialty', 'symptom_keywords', 'urgency', 'preferred_doctor', 'date_window', 'first_visit', 'insurance'],
    proofPoints: ['Auto-routes 91% of bookings to correct specialty', 'Reduces front-desk triage calls by 64%'],
  },
  {
    slug: 'medical-pediatrics',
    category: 'Medical',
    name: 'Pediatric clinics',
    hero: {
      eyebrow: 'For pediatric practices',
      title: 'Parents book the way they think — by their kid',
      subtitle:
        'Parents describe their child\'s situation in natural language. The widget captures age, symptom, prior visit history, and routes to a pediatrician with the right sub-specialty.',
    },
    exampleConversations: [
      {
        lang: 'de',
        user: 'Mein Sohn (4 Jahre) hat seit 3 Tagen Fieber, brauche dringend einen Termin',
        extracted: { patient_age: 4, symptom: 'fever', symptom_duration: '3d', urgency: 'high' },
      },
    ],
    fields: ['patient_age', 'symptom', 'urgency', 'parent_language', 'vaccination_question', 'insurance'],
    proofPoints: ['Captures parent language preference automatically', '+33% mobile conversion vs forms'],
  },
  {
    slug: 'medical-dermatology',
    category: 'Medical',
    name: 'Dermatology',
    hero: {
      title: 'From "I have a weird mole" to a confirmed booking',
      subtitle: 'Patients describe what they see; the widget routes to dermatologist, cosmetic dermatologist, or nurse depending on the concern.',
    },
    fields: ['concern_type', 'urgency', 'cosmetic_vs_medical', 'photo_upload_optional', 'date_window'],
    proofPoints: ['Splits cosmetic vs. medical at intake', 'Optional photo attachment handled in-flow'],
  },
  {
    slug: 'medical-mental-health',
    category: 'Medical',
    name: 'Mental health & therapy',
    hero: {
      title: 'A booking flow that respects what people are sharing',
      subtitle:
        'Patients can describe what they\'re going through without filling forms. The widget extracts therapy modality, language, gender preference of therapist, and urgency with care.',
    },
    fields: ['concern_area', 'therapist_gender_preference', 'language', 'modality', 'in_person_or_remote'],
    proofPoints: ['Specialized empathy-tuned prompt', 'Crisis keyword detection routes to hotline'],
  },
  {
    slug: 'medical-physiotherapy',
    category: 'Medical',
    name: 'Physiotherapy',
    hero: {
      title: 'Patients book by injury, not by service code',
      subtitle: 'Describe what hurts; the widget maps to the right modality (manual, sports, post-op) and books with an available therapist.',
    },
    fields: ['injury_area', 'injury_type', 'duration', 'post_surgery', 'sports_related', 'preferred_therapist'],
    proofPoints: ['Smart routing across 12 sub-modalities', 'Insurance pre-auth reminders inline'],
  },

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
        'Clients describe the service they want in their own words — balayage, fade, root touch-up, perm — and Typelessity matches it to your service menu, picks a stylist, and finds the slot.',
    },
    exampleConversations: [
      {
        lang: 'es',
        user: 'Quiero mechas balayage y un corte, mi pelo es largo, sábado por la tarde',
        extracted: { service: ['balayage', 'haircut'], hair_length: 'long', date: 'saturday', time_window: 'afternoon' },
      },
    ],
    fields: ['service', 'hair_length', 'preferred_stylist', 'date_window', 'time_window', 'first_visit'],
    proofPoints: ['Maps free-text service requests to your menu', 'Auto-calculates appointment duration from services'],
  },
  {
    slug: 'beauty-nail-salons',
    category: 'Beauty & Wellness',
    name: 'Nail salons',
    hero: {
      title: 'Manicure, pedicure, gel, acrylic — your clients know what they want',
      subtitle: 'Stop forcing clients into dropdowns. They describe the service, the widget picks the right technician and slot.',
    },
    fields: ['service', 'add_ons', 'preferred_technician', 'date_window', 'time_window'],
    proofPoints: ['Handles complex service combinations', '40% of bookings done in under 30s'],
  },
  {
    slug: 'beauty-spas',
    category: 'Beauty & Wellness',
    name: 'Spas & wellness centers',
    hero: {
      title: 'A booking flow that fits the relaxed brand',
      subtitle: 'No multi-step forms breaking the calm. Clients describe the experience they want — couples massage, hot stone, facial — and book in one conversation.',
    },
    fields: ['service', 'duration', 'package_or_single', 'therapist_gender_preference', 'date_window'],
    proofPoints: ['Premium voice tone in widget', 'Multi-service packages handled natively'],
  },
  {
    slug: 'beauty-aesthetic-clinics',
    category: 'Beauty & Wellness',
    name: 'Aesthetic & cosmetic clinics',
    hero: {
      title: 'Inquire, consult, book — in one flow',
      subtitle: 'Botox, fillers, laser — clients describe what they\'re considering. The widget books a consultation with the right practitioner and surfaces relevant pre-care info.',
    },
    fields: ['procedure_interest', 'consultation_or_treatment', 'preferred_practitioner', 'date_window'],
    proofPoints: ['Splits "info request" from "ready to book"', 'Pre-care messaging triggered by procedure type'],
  },
  {
    slug: 'beauty-tattoo-studios',
    category: 'Beauty & Wellness',
    name: 'Tattoo & piercing studios',
    hero: {
      title: 'Clients describe their piece. The widget books a consultation.',
      subtitle: 'Style, size, placement, artist preference — all extracted from one message. Reference image upload optional.',
    },
    fields: ['style', 'size', 'placement', 'preferred_artist', 'image_attachment', 'consultation_or_session'],
    proofPoints: ['Reference image attachment handled', 'Artist style matching from free-text description'],
  },

  // ============================================================
  // PROFESSIONAL SERVICES
  // ============================================================
  {
    slug: 'professional-legal',
    category: 'Professional Services',
    name: 'Law firms',
    hero: {
      eyebrow: 'For law firms',
      title: 'Intake conversations, not intake forms',
      subtitle:
        'Prospective clients describe their situation. The widget extracts practice area, jurisdiction, urgency, conflict-check basics, and books a paid or free initial consultation.',
    },
    exampleConversations: [
      {
        lang: 'en',
        user: 'I need an immigration lawyer, my visa expires in 3 months and I want to apply for permanent residency.',
        extracted: { practice_area: 'immigration', urgency: 'medium', visa_expiry: '90d', goal: 'permanent_residency' },
      },
    ],
    fields: ['practice_area', 'jurisdiction', 'urgency', 'opposing_party_basic', 'consultation_type', 'language'],
    proofPoints: ['Handles 14 practice areas via single config', 'Conflict-check question integrated'],
  },
  {
    slug: 'professional-accounting',
    category: 'Professional Services',
    name: 'Accounting & tax firms',
    hero: {
      title: 'From "I need help with my taxes" to a booked consultation',
      subtitle: 'Clients describe their situation — small business, freelancer, late filing, audit — and the widget books with the right specialist.',
    },
    fields: ['service_type', 'business_type', 'urgency', 'tax_year', 'jurisdiction', 'document_count_estimate'],
    proofPoints: ['Routes individual vs. business automatically', 'Pre-flags audit and back-tax cases'],
  },
  {
    slug: 'professional-financial-advisors',
    category: 'Professional Services',
    name: 'Financial advisors',
    hero: {
      title: 'Suitable, compliant intake — without the form',
      subtitle: 'Prospects describe their situation; the widget captures suitability basics, goals, and books a discovery call with the right advisor.',
    },
    fields: ['life_event', 'goals', 'asset_range', 'time_horizon', 'preferred_advisor_specialty'],
    proofPoints: ['Suitability fields configurable per region', 'KYC pre-questions inline'],
  },
  {
    slug: 'professional-coaching',
    category: 'Professional Services',
    name: 'Coaching & consulting',
    hero: {
      title: 'A first conversation that feels like a first conversation',
      subtitle: 'Coaches and consultants get an intake that captures the prospect\'s real goal, not just their checkbox selections.',
    },
    fields: ['goal_area', 'time_commitment', 'preferred_coach', 'session_format', 'language'],
    proofPoints: ['Free-text goal capture preserved verbatim for the coach', 'Session format auto-suggested from goal'],
  },
];
