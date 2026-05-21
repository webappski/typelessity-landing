export interface Faq {
  readonly question: string;
  readonly answer: string;
}

export interface Feature {
  readonly icon: string;
  readonly title: string;
  readonly description: string;
  readonly wide?: boolean;
}

export interface Phase {
  readonly number: string;
  readonly icon: string;
  readonly title: string;
  readonly description: string;
}

export interface PricingTier {
  readonly name: string;
  readonly price: string;
  readonly period?: string;
  readonly description: string;
  readonly features: readonly string[];
  readonly cta: string;
  readonly featured?: boolean;
}

export interface Stat {
  readonly value: string;
  readonly label: string;
}

export type Theme = 'light' | 'dark';
