/**
 * AI Model Router Tests
 * Tests tier-based model selection and feature access
 */

import { getModelForTask, canAccessFeature, estimateMonthlyAICost } from '@/lib/ai/model-router';
import { UserTier } from '@/types/user';

describe('AI Model Router', () => {
  describe('getModelForTask', () => {
    it('should return Gemini 1.5 Flash for invoice OCR on all tiers', () => {
      const freeTier = getModelForTask('invoice_ocr', 'free');
      const starterTier = getModelForTask('invoice_ocr', 'starter');
      const proTier = getModelForTask('invoice_ocr', 'pro');

      expect(freeTier.model).toBe('gemini-1.5-flash');
      expect(starterTier.model).toBe('gemini-1.5-flash');
      expect(proTier.model).toBe('gemini-1.5-flash');
      expect(freeTier.provider).toBe('gemini');
    });

    it('should return Gemini for free tier expense categorization', () => {
      const config = getModelForTask('expense_categorization', 'free');

      expect(config.provider).toBe('gemini');
      expect(config.model).toBe('gemini-1.5-flash');
    });

    it('should return GPT-4o-mini for paid tier expense categorization', () => {
      const starterConfig = getModelForTask('expense_categorization', 'starter');
      const proConfig = getModelForTask('expense_categorization', 'pro');

      expect(starterConfig.provider).toBe('openai');
      expect(starterConfig.model).toBe('gpt-4o-mini');
      expect(proConfig.provider).toBe('openai');
      expect(proConfig.model).toBe('gpt-4o-mini');
    });

    it('should return Claude Sonnet 4 for Pro tier IR35 assessment', () => {
      const config = getModelForTask('ir35_assessment', 'pro');

      expect(config.provider).toBe('anthropic');
      expect(config.model).toBe('claude-sonnet-4-20250514');
    });

    it('should return OpenAI Realtime for Pro tier voice calling', () => {
      const config = getModelForTask('voice_calling', 'pro');

      expect(config.provider).toBe('openai');
      expect(config.model).toBe('gpt-4o-realtime-preview-2024-12-17');
    });
  });

  describe('canAccessFeature', () => {
    it('should allow all tiers to access invoice OCR', () => {
      expect(canAccessFeature('invoice_ocr', 'free')).toBe(true);
      expect(canAccessFeature('invoice_ocr', 'starter')).toBe(true);
      expect(canAccessFeature('invoice_ocr', 'pro')).toBe(true);
    });

    it('should allow all tiers to access expense categorization', () => {
      expect(canAccessFeature('expense_categorization', 'free')).toBe(true);
      expect(canAccessFeature('expense_categorization', 'starter')).toBe(true);
      expect(canAccessFeature('expense_categorization', 'pro')).toBe(true);
    });

    it('should only allow Pro tier to access IR35 assessment', () => {
      expect(canAccessFeature('ir35_assessment', 'free')).toBe(false);
      expect(canAccessFeature('ir35_assessment', 'starter')).toBe(false);
      expect(canAccessFeature('ir35_assessment', 'pro')).toBe(true);
    });

    it('should only allow Pro tier to access voice calling', () => {
      expect(canAccessFeature('voice_calling', 'free')).toBe(false);
      expect(canAccessFeature('voice_calling', 'starter')).toBe(false);
      expect(canAccessFeature('voice_calling', 'pro')).toBe(true);
    });
  });

  describe('estimateMonthlyAICost', () => {
    it('should correctly estimate free tier costs', () => {
      const cost = estimateMonthlyAICost('free', {
        invoices: 5,
        receipts: 10,
        expenseCategories: 10,
        chatMessages: 5
      });

      // Free tier uses Gemini for everything (cheap)
      expect(cost).toBeLessThan(0.01);
    });

    it('should correctly estimate starter tier costs', () => {
      const cost = estimateMonthlyAICost('starter', {
        invoices: 20,
        receipts: 40,
        expenseCategories: 40,
        chatMessages: 20
      });

      // Starter tier uses GPT-4o-mini for categorization (more expensive)
      expect(cost).toBeGreaterThan(0.1);
      expect(cost).toBeLessThan(1);
    });

    it('should correctly estimate pro tier costs', () => {
      const cost = estimateMonthlyAICost('pro', {
        invoices: 50,
        receipts: 100,
        expenseCategories: 100,
        ir35Assessments: 2,
        voiceCalls: 5,
        chatMessages: 50
      });

      // Pro tier includes voice calls (most expensive)
      expect(cost).toBeGreaterThan(5);
    });

    it('should not include IR35 or voice costs for non-Pro tiers', () => {
      const freeCost = estimateMonthlyAICost('free', {
        invoices: 10,
        ir35Assessments: 10, // Should be ignored
        voiceCalls: 10 // Should be ignored
      });

      const starterCost = estimateMonthlyAICost('starter', {
        invoices: 10,
        ir35Assessments: 10, // Should be ignored
        voiceCalls: 10 // Should be ignored
      });

      // Should be very low since IR35 and voice are ignored
      expect(freeCost).toBeLessThan(0.01);
      expect(starterCost).toBeLessThan(0.01);
    });
  });
});
