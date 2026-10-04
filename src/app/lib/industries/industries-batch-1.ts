// Industries content — batch 1: 8 verticals.
// Each entry follows the IndustryContent shape from lib/types.ts.

import type { IndustryContent } from '../types';

export const industries: IndustryContent[] = [
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
        'Clients describe the service they want in their own words — balayage, fade, root touch-up, perm — and Typelessity matches it to your service menu and collects the stylist, date and time in the same conversation.',
    },
    exampleConversations: [
      {
        lang: 'es',
        user: 'Quiero mechas balayage y un corte, mi pelo es largo, sábado por la tarde',
        extracted: { service: ['balayage', 'haircut'], hair_length: 'long', date: 'saturday', time_window: 'afternoon' },
      },
    ],
    fields: ['service', 'hair_length', 'preferred_stylist', 'date_window', 'time_window', 'first_visit'],
    proofPoints: ['Free-text service requests are matched to the options in your service field', 'Stylist, date and time are collected in the same conversation and reviewed by the client before sending'],
  },
  {
    slug: 'beauty-nail-salons',
    category: 'Beauty & Wellness',
    name: 'Nail salons',
    hero: {
      title: 'Manicure, pedicure, gel, acrylic — your clients know what they want',
      subtitle: 'Stop forcing clients into dropdowns. They describe the service; the widget collects the service, add-ons, technician and time window in one conversation.',
    },
    exampleConversations: [
      {
        lang: 'en',
        user: 'Gel manicure with some simple nail art and a regular pedicure same day, Saturday morning would be ideal',
        extracted: { service: ['gel_manicure', 'pedicure', 'nail_art'], date: 'saturday', time_window: 'morning' },
      },
    ],
    fields: ['service', 'add_ons', 'preferred_technician', 'date_window', 'time_window'],
    proofPoints: ['Several services in one message (gel manicure plus pedicure) fill a multiselect service field together', 'Technician and time window are collected in the same conversation'],
  },
  {
    slug: 'beauty-spas',
    category: 'Beauty & Wellness',
    name: 'Spas & wellness centers',
    hero: {
      title: 'A booking flow that fits the relaxed brand',
      subtitle: 'No multi-step forms breaking the calm. Clients describe the experience they want — couples massage, hot stone, facial — and send a booking request in one conversation.',
    },
    exampleConversations: [
      {
        lang: 'en',
        user: 'Looking for a 90-minute couples massage for our anniversary, ideally Friday evening',
        extracted: { service: 'couples_massage', duration: '90min', package_or_single: 'single', occasion: 'anniversary', date_window: 'friday_evening' },
      },
    ],
    fields: ['service', 'duration', 'package_or_single', 'therapist_gender_preference', 'date_window'],
    proofPoints: ['Service, duration and date window are filled from one message', 'The client reviews every answer before the request is sent'],
  },
  {
    slug: 'beauty-tattoo-studios',
    category: 'Beauty & Wellness',
    name: 'Tattoo & piercing studios',
    hero: {
      title: 'Clients describe their piece. The widget books a consultation.',
      subtitle: 'Style, size, placement, artist preference — all extracted from one message.',
    },
    exampleConversations: [
      {
        lang: 'en',
        user: 'Small geometric design on my forearm, about 3 inches, would love to consult first',
        extracted: { style: 'geometric', size: '3in', placement: 'forearm', consultation_or_session: 'consultation' },
      },
    ],
    fields: ['style', 'size', 'placement', 'preferred_artist', 'consultation_or_session'],
    proofPoints: ['Style, size and placement are filled from one free-text description', 'Preferred artist is a select field with your artists as options'],
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
        'Prospective clients describe their situation. The widget extracts practice area, jurisdiction and urgency, and collects a request for a paid or free initial consultation.',
    },
    exampleConversations: [
      {
        lang: 'en',
        user: 'I need an immigration lawyer, my visa expires in 3 months and I want to apply for permanent residency.',
        extracted: { practice_area: 'immigration', urgency: 'medium', visa_expiry: '90d', goal: 'permanent_residency' },
      },
    ],
    fields: ['practice_area', 'jurisdiction', 'urgency', 'opposing_party_basic', 'consultation_type', 'language'],
    proofPoints: ['Practice area and jurisdiction are select fields with your own options', 'The description of the situation is collected as free text for your team'],
  },
  {
    slug: 'professional-accounting',
    category: 'Professional Services',
    name: 'Accounting & tax firms',
    hero: {
      title: 'From "I need help with my taxes" to a booked consultation',
      subtitle: 'Clients describe their situation — small business, freelancer, late filing, audit — and the widget books with the right specialist.',
    },
    exampleConversations: [
      {
        lang: 'en',
        user: 'Freelance designer in Berlin, never filed German taxes before, need help with my 2025 return',
        extracted: { service_type: 'tax_return', business_type: 'freelancer', jurisdiction: 'DE', tax_year: '2025', urgency: 'medium' },
      },
    ],
    fields: ['service_type', 'business_type', 'urgency', 'tax_year', 'jurisdiction', 'document_count_estimate'],
    proofPoints: ['Service type and business type are select fields with your own options', 'Tax year and jurisdiction are filled from the same message'],
  },
  {
    slug: 'professional-financial-advisors',
    category: 'Professional Services',
    name: 'Financial advisors',
    hero: {
      title: 'Prospect intake — without the form',
      subtitle: 'Prospects describe their situation; the widget captures their goals and the details your intake needs, and collects a request for a discovery call.',
    },
    exampleConversations: [
      {
        lang: 'en',
        user: 'Got an inheritance around 200k, want to figure out what to do with it, retirement is on my mind',
        extracted: { life_event: 'inheritance', goals: ['retirement_planning'], asset_range: '100k-500k', time_horizon: 'long' },
      },
    ],
    fields: ['life_event', 'goals', 'asset_range', 'time_horizon', 'preferred_advisor_specialty'],
    proofPoints: ['You decide which intake fields are asked, and which are not', 'The prospect reviews every answer before it is sent to you'],
  },
  {
    slug: 'professional-coaching',
    category: 'Professional Services',
    name: 'Coaching & consulting',
    hero: {
      title: 'A first conversation that feels like a first conversation',
      subtitle: 'Coaches and consultants get an intake that captures the prospect\'s real goal, not just their checkbox selections.',
    },
    exampleConversations: [
      {
        lang: 'en',
        user: 'Burned out as an engineering manager, exploring whether to go back to IC work or pivot to something different',
        extracted: { goal_area: 'career_transition', life_situation: 'burnout', session_format: 'remote' },
      },
    ],
    fields: ['goal_area', 'time_commitment', 'preferred_coach', 'session_format', 'language'],
    proofPoints: ['The prospect describes the goal in their own words; it is collected as free text for the coach', 'Session format is a select field with your own options'],
  },
];
