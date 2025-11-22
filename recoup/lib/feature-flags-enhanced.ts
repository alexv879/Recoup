/**
 * Enterprise Feature Flag System
 *
 * Supports:
 * - User-specific targeting and overrides
 * - Percentage-based rollouts
 * - A/B testing with variants
 * - Time-based activation
 * - Environment-based configuration
 * - Audit logging
 * - Real-time updates
 *
 * Based on LaunchDarkly/Statsig patterns for enterprise SaaS
 */

import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// ============================================================================
// TYPES
// ============================================================================

export type FeatureFlagEnvironment = 'development' | 'staging' | 'production';

export interface FeatureFlagConfig {
  /** Unique flag identifier */
  key: string;

  /** Human-readable name */
  name: string;

  /** Description of what this flag controls */
  description: string;

  /** Whether flag is currently enabled */
  enabled: boolean;

  /** Default value when flag is off or errors occur */
  defaultValue: boolean | string | number | Record<string, any>;

  /** Percentage of users who should see this flag (0-100) */
  rolloutPercentage: number;

  /** Specific user IDs that should always see this flag */
  userWhitelist?: string[];

  /** Specific user IDs that should never see this flag */
  userBlacklist?: string[];

  /** User attributes required to see this flag */
  targetingRules?: TargetingRule[];

  /** A/B test variants (if applicable) */
  variants?: FeatureFlagVariant[];

  /** Start date/time for flag activation (ISO 8601) */
  startsAt?: string;

  /** End date/time for flag deactivation (ISO 8601) */
  expiresAt?: string;

  /** Environment where this config applies */
  environment: FeatureFlagEnvironment;

  /** Tags for organization (e.g., ['ui', 'beta', 'premium']) */
  tags?: string[];

  /** Created timestamp */
  createdAt: string;

  /** Last updated timestamp */
  updatedAt: string;

  /** User who last updated this flag */
  updatedBy?: string;
}

export interface TargetingRule {
  /** Attribute to check (e.g., 'email', 'tier', 'country') */
  attribute: string;

  /** Operator for comparison */
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'greaterThan' | 'lessThan' | 'in' | 'notIn';

  /** Value(s) to compare against */
  value: string | number | string[] | number[];
}

export interface FeatureFlagVariant {
  /** Variant identifier (e.g., 'control', 'variant_a', 'variant_b') */
  key: string;

  /** Human-readable name */
  name: string;

  /** Value returned for this variant */
  value: any;

  /** Percentage of users in this variant (must sum to 100 across all variants) */
  weight: number;

  /** Description of this variant */
  description?: string;
}

export interface FeatureFlagEvaluation {
  /** Whether flag is enabled for this user */
  enabled: boolean;

  /** Value returned (could be boolean, string, object for A/B tests) */
  value: any;

  /** Variant key if A/B testing */
  variant?: string;

  /** Reason for this evaluation result */
  reason: 'default' | 'whitelisted' | 'blacklisted' | 'targeting_rule' | 'rollout_percentage' | 'time_based' | 'disabled';

  /** Evaluation timestamp */
  evaluatedAt: string;
}

export interface FeatureFlagAuditLog {
  /** Flag key that was changed */
  flagKey: string;

  /** Type of action */
  action: 'created' | 'updated' | 'deleted' | 'toggled' | 'evaluated';

  /** User who performed action */
  userId?: string;

  /** Changes made (for updates) */
  changes?: Record<string, { from: any; to: any }>;

  /** Environment */
  environment: FeatureFlagEnvironment;

  /** Timestamp */
  timestamp: string;

  /** Additional context */
  metadata?: Record<string, any>;
}

export interface UserContext {
  /** User ID */
  userId: string;

  /** User email */
  email?: string;

  /** Subscription tier */
  tier?: string;

  /** Country code */
  country?: string;

  /** Company/organization */
  organization?: string;

  /** Account age in days */
  accountAge?: number;

  /** Custom attributes */
  customAttributes?: Record<string, any>;
}

// ============================================================================
// FIRESTORE COLLECTIONS
// ============================================================================

const FEATURE_FLAGS_COLLECTION = 'feature_flags';
const AUDIT_LOGS_COLLECTION = 'feature_flag_audit_logs';
const USER_OVERRIDES_COLLECTION = 'feature_flag_user_overrides';

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Get current environment from Node environment variable
 */
export function getCurrentEnvironment(): FeatureFlagEnvironment {
  const env = process.env.NODE_ENV || 'development';

  if (env === 'production') return 'production';
  if (env === 'staging') return 'staging';
  return 'development';
}

/**
 * Get feature flag configuration
 */
export async function getFeatureFlagConfig(
  flagKey: string,
  environment: FeatureFlagEnvironment = getCurrentEnvironment()
): Promise<FeatureFlagConfig | null> {
  try {
    const flagDoc = await db
      .collection(FEATURE_FLAGS_COLLECTION)
      .doc(`${environment}_${flagKey}`)
      .get();

    if (!flagDoc.exists) {
      return null;
    }

    return flagDoc.data() as FeatureFlagConfig;
  } catch (error) {
    console.error('Error fetching feature flag:', error);
    return null;
  }
}

/**
 * Get all feature flags for an environment
 */
export async function getAllFeatureFlags(
  environment: FeatureFlagEnvironment = getCurrentEnvironment()
): Promise<FeatureFlagConfig[]> {
  try {
    const snapshot = await db
      .collection(FEATURE_FLAGS_COLLECTION)
      .where('environment', '==', environment)
      .get();

    return snapshot.docs.map(doc => doc.data() as FeatureFlagConfig);
  } catch (error) {
    console.error('Error fetching all feature flags:', error);
    return [];
  }
}

/**
 * Evaluate a feature flag for a specific user
 */
export async function evaluateFeatureFlag(
  flagKey: string,
  userContext: UserContext,
  environment: FeatureFlagEnvironment = getCurrentEnvironment()
): Promise<FeatureFlagEvaluation> {
  const flag = await getFeatureFlagConfig(flagKey, environment);

  // Default response if flag doesn't exist
  if (!flag) {
    return {
      enabled: false,
      value: false,
      reason: 'default',
      evaluatedAt: new Date().toISOString(),
    };
  }

  // Check if flag is globally disabled
  if (!flag.enabled) {
    return {
      enabled: false,
      value: flag.defaultValue,
      reason: 'disabled',
      evaluatedAt: new Date().toISOString(),
    };
  }

  // Check time-based activation
  const now = new Date();
  if (flag.startsAt && new Date(flag.startsAt) > now) {
    return {
      enabled: false,
      value: flag.defaultValue,
      reason: 'time_based',
      evaluatedAt: new Date().toISOString(),
    };
  }

  if (flag.expiresAt && new Date(flag.expiresAt) < now) {
    return {
      enabled: false,
      value: flag.defaultValue,
      reason: 'time_based',
      evaluatedAt: new Date().toISOString(),
    };
  }

  // Check blacklist (highest priority)
  if (flag.userBlacklist?.includes(userContext.userId)) {
    return {
      enabled: false,
      value: flag.defaultValue,
      reason: 'blacklisted',
      evaluatedAt: new Date().toISOString(),
    };
  }

  // Check whitelist (second highest priority)
  if (flag.userWhitelist?.includes(userContext.userId)) {
    return handleFlagEnabled(flag, userContext.userId);
  }

  // Check targeting rules
  if (flag.targetingRules && flag.targetingRules.length > 0) {
    const passesTargeting = evaluateTargetingRules(flag.targetingRules, userContext);
    if (passesTargeting) {
      return handleFlagEnabled(flag, userContext.userId);
    }
  }

  // Check rollout percentage
  if (flag.rolloutPercentage > 0) {
    const inRollout = isUserInRollout(userContext.userId, flag.rolloutPercentage);
    if (inRollout) {
      return handleFlagEnabled(flag, userContext.userId);
    }
  }

  // Default: flag is off
  return {
    enabled: false,
    value: flag.defaultValue,
    reason: 'default',
    evaluatedAt: new Date().toISOString(),
  };
}

/**
 * Handle flag enabled - check for variants
 */
function handleFlagEnabled(
  flag: FeatureFlagConfig,
  userId: string
): FeatureFlagEvaluation {
  // If no variants, return simple enabled response
  if (!flag.variants || flag.variants.length === 0) {
    return {
      enabled: true,
      value: true,
      reason: 'whitelisted',
      evaluatedAt: new Date().toISOString(),
    };
  }

  // A/B test: assign user to a variant
  const variant = assignUserToVariant(userId, flag.variants);

  return {
    enabled: true,
    value: variant.value,
    variant: variant.key,
    reason: 'whitelisted',
    evaluatedAt: new Date().toISOString(),
  };
}

/**
 * Evaluate targeting rules against user context
 */
function evaluateTargetingRules(
  rules: TargetingRule[],
  userContext: UserContext
): boolean {
  // All rules must pass (AND logic)
  return rules.every(rule => {
    const userValue = getUserAttribute(userContext, rule.attribute);

    switch (rule.operator) {
      case 'equals':
        return userValue === rule.value;
      case 'notEquals':
        return userValue !== rule.value;
      case 'contains':
        return typeof userValue === 'string' &&
               typeof rule.value === 'string' &&
               userValue.includes(rule.value);
      case 'notContains':
        return typeof userValue === 'string' &&
               typeof rule.value === 'string' &&
               !userValue.includes(rule.value);
      case 'greaterThan':
        return typeof userValue === 'number' &&
               typeof rule.value === 'number' &&
               userValue > rule.value;
      case 'lessThan':
        return typeof userValue === 'number' &&
               typeof rule.value === 'number' &&
               userValue < rule.value;
      case 'in':
        return Array.isArray(rule.value) && rule.value.includes(userValue as any);
      case 'notIn':
        return Array.isArray(rule.value) && !rule.value.includes(userValue as any);
      default:
        return false;
    }
  });
}

/**
 * Get user attribute value from context
 */
function getUserAttribute(userContext: UserContext, attribute: string): any {
  if (attribute in userContext) {
    return (userContext as any)[attribute];
  }

  if (userContext.customAttributes && attribute in userContext.customAttributes) {
    return userContext.customAttributes[attribute];
  }

  return undefined;
}

/**
 * Determine if user is in rollout percentage
 * Uses consistent hashing to ensure same user always gets same result
 */
function isUserInRollout(userId: string, percentage: number): boolean {
  if (percentage >= 100) return true;
  if (percentage <= 0) return false;

  // Simple deterministic hash
  const hash = userId.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);

  const bucket = hash % 100;
  return bucket < percentage;
}

/**
 * Assign user to A/B test variant
 */
function assignUserToVariant(
  userId: string,
  variants: FeatureFlagVariant[]
): FeatureFlagVariant {
  // Simple hash to get deterministic variant assignment
  const hash = userId.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);

  const bucket = hash % 100;
  let cumulative = 0;

  for (const variant of variants) {
    cumulative += variant.weight;
    if (bucket < cumulative) {
      return variant;
    }
  }

  // Fallback to first variant
  return variants[0];
}

// ============================================================================
// ADMIN FUNCTIONS
// ============================================================================

/**
 * Create or update a feature flag
 */
export async function upsertFeatureFlag(
  config: Omit<FeatureFlagConfig, 'createdAt' | 'updatedAt'>,
  updatedBy: string
): Promise<FeatureFlagConfig> {
  const docId = `${config.environment}_${config.key}`;
  const flagRef = db.collection(FEATURE_FLAGS_COLLECTION).doc(docId);

  const existingDoc = await flagRef.get();
  const now = new Date().toISOString();

  const flagData: FeatureFlagConfig = {
    ...config,
    createdAt: existingDoc.exists ? (existingDoc.data()!.createdAt as string) : now,
    updatedAt: now,
    updatedBy,
  };

  await flagRef.set(flagData);

  // Log audit trail
  await logAuditEvent({
    flagKey: config.key,
    action: existingDoc.exists ? 'updated' : 'created',
    userId: updatedBy,
    environment: config.environment,
    timestamp: now,
    metadata: { config },
  });

  return flagData;
}

/**
 * Toggle a feature flag on/off
 */
export async function toggleFeatureFlag(
  flagKey: string,
  enabled: boolean,
  updatedBy: string,
  environment: FeatureFlagEnvironment = getCurrentEnvironment()
): Promise<boolean> {
  try {
    const docId = `${environment}_${flagKey}`;
    const flagRef = db.collection(FEATURE_FLAGS_COLLECTION).doc(docId);

    await flagRef.update({
      enabled,
      updatedAt: new Date().toISOString(),
      updatedBy,
    });

    await logAuditEvent({
      flagKey,
      action: 'toggled',
      userId: updatedBy,
      environment,
      timestamp: new Date().toISOString(),
      changes: {
        enabled: { from: !enabled, to: enabled },
      },
    });

    return true;
  } catch (error) {
    console.error('Error toggling feature flag:', error);
    return false;
  }
}

/**
 * Delete a feature flag
 */
export async function deleteFeatureFlag(
  flagKey: string,
  deletedBy: string,
  environment: FeatureFlagEnvironment = getCurrentEnvironment()
): Promise<boolean> {
  try {
    const docId = `${environment}_${flagKey}`;
    await db.collection(FEATURE_FLAGS_COLLECTION).doc(docId).delete();

    await logAuditEvent({
      flagKey,
      action: 'deleted',
      userId: deletedBy,
      environment,
      timestamp: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error('Error deleting feature flag:', error);
    return false;
  }
}

/**
 * Log audit event
 */
async function logAuditEvent(log: FeatureFlagAuditLog): Promise<void> {
  try {
    await db.collection(AUDIT_LOGS_COLLECTION).add(log);
  } catch (error) {
    console.error('Error logging audit event:', error);
  }
}

/**
 * Get audit logs for a flag
 */
export async function getAuditLogs(
  flagKey: string,
  limit: number = 50
): Promise<FeatureFlagAuditLog[]> {
  try {
    const snapshot = await db
      .collection(AUDIT_LOGS_COLLECTION)
      .where('flagKey', '==', flagKey)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => doc.data() as FeatureFlagAuditLog);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
}

// ============================================================================
// CONVENIENCE HELPERS
// ============================================================================

/**
 * Check if feature is enabled (simple boolean check)
 */
export async function isFeatureEnabled(
  flagKey: string,
  userContext: UserContext,
  environment?: FeatureFlagEnvironment
): Promise<boolean> {
  const evaluation = await evaluateFeatureFlag(flagKey, userContext, environment);
  return evaluation.enabled;
}

/**
 * Get feature value (for A/B tests or complex features)
 */
export async function getFeatureValue<T = any>(
  flagKey: string,
  userContext: UserContext,
  defaultValue: T,
  environment?: FeatureFlagEnvironment
): Promise<T> {
  const evaluation = await evaluateFeatureFlag(flagKey, userContext, environment);
  return evaluation.enabled ? (evaluation.value as T) : defaultValue;
}

/**
 * Get variant for A/B test
 */
export async function getFeatureVariant(
  flagKey: string,
  userContext: UserContext,
  environment?: FeatureFlagEnvironment
): Promise<string | null> {
  const evaluation = await evaluateFeatureFlag(flagKey, userContext, environment);
  return evaluation.variant || null;
}
