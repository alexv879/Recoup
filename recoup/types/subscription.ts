/**
 * Subscription & Pricing Tiers
 * Freemium model for Recoup
 */

export enum SubscriptionTier {
  FREE = 'free',
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  BUSINESS = 'business',
}

export interface SubscriptionLimits {
  // Core limits
  maxClients: number | 'unlimited';
  maxInvoicesPerMonth: number | 'unlimited';
  maxExpensesPerMonth: number | 'unlimited';
  maxReceiptsPerMonth: number | 'unlimited';
  maxTimeTrackingHours: number | 'unlimited';
  maxTimeTrackingProjects: number | 'unlimited';

  // Feature flags
  features: {
    // Basic features
    invoicing: boolean;
    expenseTracking: boolean;
    timeTracking: boolean;
    basicReports: boolean;
    mobileApp: boolean;
    emailNotifications: boolean;

    // Starter+
    recurringInvoices: boolean;
    estimates: boolean;
    smsReminders: boolean;
    clientPortal: boolean;
    advancedReports: boolean;
    customBranding: boolean;
    multiCurrency: boolean;
    projectManagement: boolean;

    // Professional+
    aiCollections: boolean;
    voiceReminders: boolean;
    smartPaymentPredictions: boolean;
    advancedTaxPrep: boolean;
    mileageTracking: boolean;
    contractTemplates: boolean;
    clientHealthScore: boolean;
    cashFlowForecasting: boolean;
    expenseCategorizationAI: boolean;
    teamCollaboration: boolean;

    // Business+
    fullAISuite: boolean;
    aggressiveCollections: boolean;
    fcaCompliance: boolean;
    vulnerabilityDetection: boolean;
    whiteLabelPortal: boolean;
    apiAccess: boolean;
    dedicatedSupport: boolean;
    customIntegrations: boolean;
  };

  // Communication limits
  emailRemindersPerMonth: number | 'unlimited';
  smsRemindersPerMonth: number | 'unlimited';
  voiceCallsPerMonth: number | 'unlimited';

  // Data & storage
  maxBankConnections: number | 'unlimited';
  maxCurrencies: number | 'unlimited';
  maxTeamMembers: number;

  // Support
  support: 'community' | 'email' | 'priority' | 'phone';
}

export const TIER_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  [SubscriptionTier.FREE]: {
    maxClients: 5,
    maxInvoicesPerMonth: 20,
    maxExpensesPerMonth: 50,
    maxReceiptsPerMonth: 10,
    maxTimeTrackingHours: 50,
    maxTimeTrackingProjects: 3,

    features: {
      invoicing: true,
      expenseTracking: true,
      timeTracking: true,
      basicReports: true,
      mobileApp: true,
      emailNotifications: true,

      recurringInvoices: false,
      estimates: false,
      smsReminders: false,
      clientPortal: false,
      advancedReports: false,
      customBranding: false,
      multiCurrency: false,
      projectManagement: false,

      aiCollections: false,
      voiceReminders: false,
      smartPaymentPredictions: false,
      advancedTaxPrep: false,
      mileageTracking: false,
      contractTemplates: false,
      clientHealthScore: false,
      cashFlowForecasting: false,
      expenseCategorizationAI: false,
      teamCollaboration: false,

      fullAISuite: false,
      aggressiveCollections: false,
      fcaCompliance: false,
      vulnerabilityDetection: false,
      whiteLabelPortal: false,
      apiAccess: false,
      dedicatedSupport: false,
      customIntegrations: false,
    },

    emailRemindersPerMonth: 'unlimited',
    smsRemindersPerMonth: 0,
    voiceCallsPerMonth: 0,

    maxBankConnections: 1,
    maxCurrencies: 1, // GBP only
    maxTeamMembers: 1,

    support: 'community',
  },

  [SubscriptionTier.STARTER]: {
    maxClients: 25,
    maxInvoicesPerMonth: 'unlimited',
    maxExpensesPerMonth: 'unlimited',
    maxReceiptsPerMonth: 'unlimited',
    maxTimeTrackingHours: 'unlimited',
    maxTimeTrackingProjects: 'unlimited',

    features: {
      invoicing: true,
      expenseTracking: true,
      timeTracking: true,
      basicReports: true,
      mobileApp: true,
      emailNotifications: true,

      recurringInvoices: true,
      estimates: true,
      smsReminders: true,
      clientPortal: true,
      advancedReports: true,
      customBranding: true,
      multiCurrency: true,
      projectManagement: true,

      aiCollections: false,
      voiceReminders: false,
      smartPaymentPredictions: false,
      advancedTaxPrep: false,
      mileageTracking: false,
      contractTemplates: false,
      clientHealthScore: false,
      cashFlowForecasting: false,
      expenseCategorizationAI: false,
      teamCollaboration: false,

      fullAISuite: false,
      aggressiveCollections: false,
      fcaCompliance: false,
      vulnerabilityDetection: false,
      whiteLabelPortal: false,
      apiAccess: false,
      dedicatedSupport: false,
      customIntegrations: false,
    },

    emailRemindersPerMonth: 'unlimited',
    smsRemindersPerMonth: 50,
    voiceCallsPerMonth: 0,

    maxBankConnections: 3,
    maxCurrencies: 3,
    maxTeamMembers: 1,

    support: 'email',
  },

  [SubscriptionTier.PROFESSIONAL]: {
    maxClients: 'unlimited',
    maxInvoicesPerMonth: 'unlimited',
    maxExpensesPerMonth: 'unlimited',
    maxReceiptsPerMonth: 'unlimited',
    maxTimeTrackingHours: 'unlimited',
    maxTimeTrackingProjects: 'unlimited',

    features: {
      invoicing: true,
      expenseTracking: true,
      timeTracking: true,
      basicReports: true,
      mobileApp: true,
      emailNotifications: true,

      recurringInvoices: true,
      estimates: true,
      smsReminders: true,
      clientPortal: true,
      advancedReports: true,
      customBranding: true,
      multiCurrency: true,
      projectManagement: true,

      aiCollections: true,
      voiceReminders: true,
      smartPaymentPredictions: true,
      advancedTaxPrep: true,
      mileageTracking: true,
      contractTemplates: true,
      clientHealthScore: true,
      cashFlowForecasting: true,
      expenseCategorizationAI: true,
      teamCollaboration: true,

      fullAISuite: false,
      aggressiveCollections: false,
      fcaCompliance: false,
      vulnerabilityDetection: false,
      whiteLabelPortal: false,
      apiAccess: false,
      dedicatedSupport: false,
      customIntegrations: false,
    },

    emailRemindersPerMonth: 'unlimited',
    smsRemindersPerMonth: 'unlimited',
    voiceCallsPerMonth: 10,

    maxBankConnections: 'unlimited',
    maxCurrencies: 'unlimited',
    maxTeamMembers: 2,

    support: 'priority',
  },

  [SubscriptionTier.BUSINESS]: {
    maxClients: 'unlimited',
    maxInvoicesPerMonth: 'unlimited',
    maxExpensesPerMonth: 'unlimited',
    maxReceiptsPerMonth: 'unlimited',
    maxTimeTrackingHours: 'unlimited',
    maxTimeTrackingProjects: 'unlimited',

    features: {
      invoicing: true,
      expenseTracking: true,
      timeTracking: true,
      basicReports: true,
      mobileApp: true,
      emailNotifications: true,

      recurringInvoices: true,
      estimates: true,
      smsReminders: true,
      clientPortal: true,
      advancedReports: true,
      customBranding: true,
      multiCurrency: true,
      projectManagement: true,

      aiCollections: true,
      voiceReminders: true,
      smartPaymentPredictions: true,
      advancedTaxPrep: true,
      mileageTracking: true,
      contractTemplates: true,
      clientHealthScore: true,
      cashFlowForecasting: true,
      expenseCategorizationAI: true,
      teamCollaboration: true,

      fullAISuite: true,
      aggressiveCollections: true,
      fcaCompliance: true,
      vulnerabilityDetection: true,
      whiteLabelPortal: true,
      apiAccess: true,
      dedicatedSupport: true,
      customIntegrations: true,
    },

    emailRemindersPerMonth: 'unlimited',
    smsRemindersPerMonth: 'unlimited',
    voiceCallsPerMonth: 'unlimited',

    maxBankConnections: 'unlimited',
    maxCurrencies: 'unlimited',
    maxTeamMembers: 5,

    support: 'phone',
  },
};

export interface PricingPlan {
  tier: SubscriptionTier;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  popular?: boolean;
  cta: string;
  features: string[];
  limits: SubscriptionLimits;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    tier: SubscriptionTier.FREE,
    name: 'Free',
    description: 'Perfect for getting started',
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: 'GBP',
    cta: 'Start Free',
    features: [
      'Up to 5 clients',
      '20 invoices per month',
      'Basic expense tracking (50/month)',
      'Receipt scanning (10/month)',
      'Time tracking (3 projects, 50hrs/month)',
      'Basic reports',
      'Email notifications',
      'Mobile app',
      'Community support',
    ],
    limits: TIER_LIMITS[SubscriptionTier.FREE],
  },
  {
    tier: SubscriptionTier.STARTER,
    name: 'Starter',
    description: 'For growing freelancers',
    monthlyPrice: 9,
    yearlyPrice: 86.40, // 20% off
    currency: 'GBP',
    popular: true,
    cta: 'Start 14-Day Trial',
    features: [
      'Everything in Free, plus:',
      'Up to 25 clients',
      'Unlimited invoices',
      'Unlimited expenses & receipts',
      'Unlimited time tracking',
      '✨ Recurring invoices',
      '✨ Estimates & quotes',
      '✨ SMS reminders (50/month)',
      '✨ Client portal',
      '✨ Advanced reports (P&L, cash flow)',
      'Custom branding',
      'Multi-currency (3 currencies)',
      'Email support',
    ],
    limits: TIER_LIMITS[SubscriptionTier.STARTER],
  },
  {
    tier: SubscriptionTier.PROFESSIONAL,
    name: 'Professional',
    description: 'For full-time freelancers',
    monthlyPrice: 19,
    yearlyPrice: 182.40, // 20% off
    currency: 'GBP',
    cta: 'Start 14-Day Trial',
    features: [
      'Everything in Starter, plus:',
      'Unlimited clients',
      '🤖 AI-powered collections',
      '🤖 Voice reminders (10 calls/month)',
      '🤖 Smart payment predictions',
      '🤖 AI expense categorization',
      'Advanced tax preparation',
      'Mileage tracking (automatic)',
      'Contract templates + AI review',
      'Client health scoring',
      'Cash flow forecasting (6 months)',
      'Team collaboration (1 member)',
      'Priority support',
    ],
    limits: TIER_LIMITS[SubscriptionTier.PROFESSIONAL],
  },
  {
    tier: SubscriptionTier.BUSINESS,
    name: 'Business',
    description: 'For agencies & teams',
    monthlyPrice: 49,
    yearlyPrice: 470.40, // 20% off
    currency: 'GBP',
    cta: 'Start 14-Day Trial',
    features: [
      'Everything in Professional, plus:',
      '🚀 Full AI suite (Gemini + Claude + OpenAI)',
      '🚀 Aggressive collections (unlimited)',
      '🚀 FCA compliance monitoring',
      '🚀 Vulnerability detection',
      '🚀 White-label client portal',
      '🚀 API access',
      'Team collaboration (5 members)',
      'Dedicated account manager',
      'Phone support',
      'Custom integrations',
      'Priority feature requests',
    ],
    limits: TIER_LIMITS[SubscriptionTier.BUSINESS],
  },
];
