/**
 * AI Feature Tier Checking Utility
 * Validates user access to AI features based on their subscription tier
 */

import { UserTier, hasFeatureAccess } from '@/types/user';
import { canAccessFeature, getUpgradeMessage, AITask } from '@/lib/ai/model-router';
import { logInfo } from '@/utils/logger';

/**
 * Check result
 */
export interface TierCheckResult {
  allowed: boolean;
  message?: string;
  upgradeUrl?: string;
}

/**
 * Check if user can access AI feature
 */
export function checkAIFeatureAccess(
  userTier: UserTier,
  task: AITask
): TierCheckResult {
  const allowed = canAccessFeature(task, userTier);

  if (allowed) {
    return { allowed: true };
  }

  const message = getUpgradeMessage(task, userTier);

  logInfo('AI feature access denied', {
    userTier,
    task,
    message
  });

  return {
    allowed: false,
    message: message || 'This feature is not available on your current plan',
    upgradeUrl: '/pricing'
  };
}

/**
 * Middleware helper to check tier access
 * Returns null if allowed, or an error response if not
 */
export function requireTier(
  userTier: UserTier,
  task: AITask
): { status: number; body: any } | null {
  const check = checkAIFeatureAccess(userTier, task);

  if (check.allowed) {
    return null;
  }

  return {
    status: 403,
    body: {
      error: 'Feature not available',
      message: check.message,
      upgradeUrl: check.upgradeUrl,
      requiredTier: getRequiredTier(task)
    }
  };
}

/**
 * Get required tier for a task
 */
function getRequiredTier(task: AITask): UserTier {
  // Pro tier features
  if (task === 'ir35_assessment' || task === 'voice_calling') {
    return 'pro';
  }

  // Starter tier features (advanced categorization)
  if (task === 'expense_categorization') {
    return 'starter';
  }

  // Free tier features
  return 'free';
}

/**
 * Get feature description
 */
export function getFeatureDescription(task: AITask): string {
  const descriptions: Record<AITask, string> = {
    invoice_ocr: 'Extract invoice data from images using AI',
    receipt_ocr: 'Extract receipt data from images using AI',
    expense_categorization: 'Automatically categorize expenses according to UK HMRC rules',
    ir35_assessment: 'AI-powered IR35 contract assessment (Pro tier)',
    customer_chat: 'Chat with AI assistant about your invoices and expenses',
    voice_calling: 'Automated voice calling for late payment collection (Pro tier)'
  };

  return descriptions[task] || 'AI-powered feature';
}

/**
 * Get all available features for a tier
 */
export function getAvailableFeatures(userTier: UserTier): AITask[] {
  const allTasks: AITask[] = [
    'invoice_ocr',
    'receipt_ocr',
    'expense_categorization',
    'ir35_assessment',
    'customer_chat',
    'voice_calling'
  ];

  return allTasks.filter((task) => canAccessFeature(task, userTier));
}

/**
 * Get unavailable features for a tier (for upsell)
 */
export function getUnavailableFeatures(userTier: UserTier): AITask[] {
  const allTasks: AITask[] = [
    'invoice_ocr',
    'receipt_ocr',
    'expense_categorization',
    'ir35_assessment',
    'customer_chat',
    'voice_calling'
  ];

  return allTasks.filter((task) => !canAccessFeature(task, userTier));
}
