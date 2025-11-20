/**
 * AI Model Router - Tier-Based Model Selection
 *
 * Research-backed model selection:
 * - Gemini 1.5 Flash: 90-96% OCR accuracy, £0.000075/call
 * - GPT-4o-mini: 87% categorization accuracy, £0.00015/call
 * - Claude Sonnet 4: Complex legal reasoning, £0.003/call
 * - OpenAI Realtime: Voice calling, £1.50/5min call
 *
 * Pricing Sources:
 * - Gemini: ai.google.dev/pricing
 * - OpenAI: openai.com/api/pricing
 * - Anthropic: anthropic.com/pricing
 */

import { UserTier } from '@/types/user';
import { logInfo } from '@/utils/logger';

export type AITask =
  | 'invoice_ocr'
  | 'receipt_ocr'
  | 'expense_categorization'
  | 'ir35_assessment'
  | 'customer_chat'
  | 'voice_calling';

export type AIProvider = 'gemini' | 'openai' | 'anthropic';

export interface ModelConfig {
  provider: AIProvider;
  model: string;
  costPerCall: number; // GBP
  requiredTier: UserTier;
  estimatedTokens?: number;
}

/**
 * Model configurations by task and user tier
 * Optimized for quality vs cost based on research
 */
const MODEL_CONFIGS: Record<AITask, Record<UserTier, ModelConfig>> = {
  // INVOICE OCR - All tiers use Gemini 1.5 Flash (best OCR accuracy)
  invoice_ocr: {
    free: {
      provider: 'gemini',
      model: 'gemini-1.5-flash',
      costPerCall: 0.000075,
      requiredTier: 'free',
      estimatedTokens: 1000
    },
    starter: {
      provider: 'gemini',
      model: 'gemini-1.5-flash',
      costPerCall: 0.000075,
      requiredTier: 'free',
      estimatedTokens: 1000
    },
    pro: {
      provider: 'gemini',
      model: 'gemini-1.5-flash',
      costPerCall: 0.000075,
      requiredTier: 'free',
      estimatedTokens: 1000
    }
  },

  // RECEIPT OCR - All tiers use Gemini 1.5 Flash
  receipt_ocr: {
    free: {
      provider: 'gemini',
      model: 'gemini-1.5-flash',
      costPerCall: 0.000075,
      requiredTier: 'free',
      estimatedTokens: 800
    },
    starter: {
      provider: 'gemini',
      model: 'gemini-1.5-flash',
      costPerCall: 0.000075,
      requiredTier: 'free',
      estimatedTokens: 800
    },
    pro: {
      provider: 'gemini',
      model: 'gemini-1.5-flash',
      costPerCall: 0.000075,
      requiredTier: 'free',
      estimatedTokens: 800
    }
  },

  // EXPENSE CATEGORIZATION - Free uses Gemini, Paid tiers use GPT-4o-mini
  expense_categorization: {
    free: {
      provider: 'gemini',
      model: 'gemini-1.5-flash',
      costPerCall: 0.000075,
      requiredTier: 'free',
      estimatedTokens: 500
    },
    starter: {
      provider: 'openai',
      model: 'gpt-4o-mini',
      costPerCall: 0.00015,
      requiredTier: 'starter',
      estimatedTokens: 500
    },
    pro: {
      provider: 'openai',
      model: 'gpt-4o-mini',
      costPerCall: 0.00015,
      requiredTier: 'starter',
      estimatedTokens: 500
    }
  },

  // IR35 ASSESSMENT - Pro tier only, uses Claude Sonnet 4
  ir35_assessment: {
    free: {
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514',
      costPerCall: 0,
      requiredTier: 'pro',
      estimatedTokens: 0
    },
    starter: {
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514',
      costPerCall: 0,
      requiredTier: 'pro',
      estimatedTokens: 0
    },
    pro: {
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514',
      costPerCall: 0.003,
      requiredTier: 'pro',
      estimatedTokens: 1000
    }
  },

  // CUSTOMER CHAT - Free uses Gemini, Paid tiers use GPT-4o-mini
  customer_chat: {
    free: {
      provider: 'gemini',
      model: 'gemini-1.5-flash',
      costPerCall: 0.0001,
      requiredTier: 'free',
      estimatedTokens: 400
    },
    starter: {
      provider: 'openai',
      model: 'gpt-4o-mini',
      costPerCall: 0.0002,
      requiredTier: 'starter',
      estimatedTokens: 400
    },
    pro: {
      provider: 'openai',
      model: 'gpt-4o-mini',
      costPerCall: 0.0002,
      requiredTier: 'starter',
      estimatedTokens: 400
    }
  },

  // VOICE CALLING - Pro tier only, uses OpenAI Realtime API
  voice_calling: {
    free: {
      provider: 'openai',
      model: 'gpt-4o-realtime-preview-2024-12-17',
      costPerCall: 0,
      requiredTier: 'pro',
      estimatedTokens: 0
    },
    starter: {
      provider: 'openai',
      model: 'gpt-4o-realtime-preview-2024-12-17',
      costPerCall: 0,
      requiredTier: 'pro',
      estimatedTokens: 0
    },
    pro: {
      provider: 'openai',
      model: 'gpt-4o-realtime-preview-2024-12-17',
      costPerCall: 1.5,
      requiredTier: 'pro',
      estimatedTokens: 0 // Audio-based, not token-based
    }
  }
};

/**
 * Get the appropriate AI model for a task based on user tier
 */
export function getModelForTask(task: AITask, userTier: UserTier): ModelConfig {
  const config = MODEL_CONFIGS[task][userTier];

  logInfo('AI model selected', {
    task,
    userTier,
    provider: config.provider,
    model: config.model,
    estimatedCost: config.costPerCall
  });

  return config;
}

/**
 * Check if user can access a specific AI feature
 */
export function canAccessFeature(task: AITask, userTier: UserTier): boolean {
  const config = MODEL_CONFIGS[task][userTier];
  const tierHierarchy: Record<UserTier, number> = { free: 0, starter: 1, pro: 2 };

  const hasAccess = tierHierarchy[userTier] >= tierHierarchy[config.requiredTier];

  logInfo('Feature access check', {
    task,
    userTier,
    requiredTier: config.requiredTier,
    hasAccess
  });

  return hasAccess;
}

/**
 * Get upgrade message if user doesn't have access
 */
export function getUpgradeMessage(task: AITask, userTier: UserTier): string | null {
  if (canAccessFeature(task, userTier)) {
    return null;
  }

  const config = MODEL_CONFIGS[task][userTier];
  const requiredTier = config.requiredTier;

  const messages: Record<string, string> = {
    ir35_assessment:
      'IR35 assessment is a Pro tier feature. Upgrade to Pro (£19/mo) to access AI-powered contract analysis.',
    voice_calling:
      'Voice calling is a Pro tier feature. Upgrade to Pro (£19/mo) to automatically call late-paying clients.',
    expense_categorization:
      'Advanced expense categorization is available on Starter (£9/mo) or Pro (£19/mo) plans.'
  };

  return (
    messages[task] ||
    `This feature requires ${requiredTier} tier or higher. Please upgrade to continue.`
  );
}

/**
 * Estimate monthly AI costs for a user based on typical usage
 */
export function estimateMonthlyAICost(
  userTier: UserTier,
  usage: {
    invoices?: number;
    receipts?: number;
    expenseCategories?: number;
    ir35Assessments?: number;
    voiceCalls?: number;
    chatMessages?: number;
  }
): number {
  let totalCost = 0;

  if (usage.invoices) {
    const config = getModelForTask('invoice_ocr', userTier);
    totalCost += config.costPerCall * usage.invoices;
  }

  if (usage.receipts) {
    const config = getModelForTask('receipt_ocr', userTier);
    totalCost += config.costPerCall * usage.receipts;
  }

  if (usage.expenseCategories) {
    const config = getModelForTask('expense_categorization', userTier);
    totalCost += config.costPerCall * usage.expenseCategories;
  }

  if (usage.ir35Assessments && userTier === 'pro') {
    const config = getModelForTask('ir35_assessment', userTier);
    totalCost += config.costPerCall * usage.ir35Assessments;
  }

  if (usage.voiceCalls && userTier === 'pro') {
    const config = getModelForTask('voice_calling', userTier);
    totalCost += config.costPerCall * usage.voiceCalls;
  }

  if (usage.chatMessages) {
    const config = getModelForTask('customer_chat', userTier);
    totalCost += config.costPerCall * usage.chatMessages;
  }

  return totalCost;
}

/**
 * Get typical monthly cost estimate by tier
 */
export function getTypicalMonthlyCost(userTier: UserTier): number {
  const typicalUsage = {
    free: {
      invoices: 5,
      receipts: 10,
      expenseCategories: 10,
      ir35Assessments: 0,
      voiceCalls: 0,
      chatMessages: 5
    },
    starter: {
      invoices: 20,
      receipts: 40,
      expenseCategories: 40,
      ir35Assessments: 0,
      voiceCalls: 0,
      chatMessages: 20
    },
    pro: {
      invoices: 50,
      receipts: 100,
      expenseCategories: 100,
      ir35Assessments: 2,
      voiceCalls: 5,
      chatMessages: 50
    }
  };

  return estimateMonthlyAICost(userTier, typicalUsage[userTier]);
}
