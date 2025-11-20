/**
 * AI Service - Multi-Model AI Strategy
 * Gemini 80%, Claude 15%, OpenAI 5%
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { logger } from '@/utils/logger';

// Initialize AI clients
const geminiClient = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
const claudeClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });
const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

/**
 * Get Gemini model (80% of AI operations)
 */
export function getGemini() {
  return geminiClient.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
}

/**
 * Get Claude model (15% of AI operations)
 */
export function getClaude() {
  return claudeClient;
}

/**
 * Get OpenAI model (5% of AI operations)
 */
export function getOpenAI() {
  return openaiClient;
}

/**
 * Call Gemini AI with prompt
 */
export async function callGemini(prompt: string, options?: {
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  try {
    const model = getGemini();
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: options?.maxTokens || 2000,
        temperature: options?.temperature || 0.7,
      },
    });

    const response = await result.response;
    return response.text();
  } catch (error) {
    logger.error({ error }, 'Gemini API error');
    throw error;
  }
}

/**
 * Call Claude AI with prompt
 */
export async function callClaude(prompt: string, options?: {
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  try {
    const claude = getClaude();
    const message = await claude.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: options?.maxTokens || 2000,
      temperature: options?.temperature || 0.7,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = message.content.find((block) => block.type === 'text');
    return textContent && 'text' in textContent ? textContent.text : '';
  } catch (error) {
    logger.error({ error }, 'Claude API error');
    throw error;
  }
}

/**
 * Call OpenAI with prompt
 */
export async function callOpenAI(prompt: string, options?: {
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: options?.maxTokens || 2000,
      temperature: options?.temperature || 0.7,
      messages: [{ role: 'user', content: prompt }],
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    logger.error({ error }, 'OpenAI API error');
    throw error;
  }
}

/**
 * Select AI model based on multi-model strategy
 * Gemini 80%, Claude 15%, OpenAI 5%
 */
export function selectAIModel(): 'gemini' | 'claude' | 'openai' {
  const random = Math.random();

  if (random < 0.80) {
    return 'gemini';
  } else if (random < 0.95) {
    return 'claude';
  } else {
    return 'openai';
  }
}

/**
 * Call AI with automatic fallback
 * Tries Gemini → Claude → OpenAI
 */
export async function callAIWithFallback(prompt: string, options?: {
  maxTokens?: number;
  temperature?: number;
}): Promise<{ response: string; model: string }> {
  // Try Gemini first
  try {
    const response = await callGemini(prompt, options);
    return { response, model: 'gemini' };
  } catch (geminiError) {
    logger.warn({ error: geminiError }, 'Gemini failed, trying Claude');

    // Fallback to Claude
    try {
      const response = await callClaude(prompt, options);
      return { response, model: 'claude' };
    } catch (claudeError) {
      logger.warn({ error: claudeError }, 'Claude failed, trying OpenAI');

      // Last resort: OpenAI
      try {
        const response = await callOpenAI(prompt, options);
        return { response, model: 'openai' };
      } catch (openaiError) {
        logger.error({
          geminiError,
          claudeError,
          openaiError,
        }, 'All AI services failed');
        throw new Error('All AI services are unavailable');
      }
    }
  }
}
