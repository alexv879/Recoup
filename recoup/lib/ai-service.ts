/**
 * AI Service - Gemini Integration
 * Provides unified interface for Google Gemini AI
 * Used by scope-creep-protection, contract-templates, and tax-prep services
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeminiConfig {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface GeminiResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Singleton instance
let geminiInstance: GoogleGenerativeAI | null = null;

/**
 * Get Gemini AI instance
 * @param config - Optional configuration (defaults to env vars)
 * @returns Gemini AI model instance
 */
export function getGemini(config?: GeminiConfig) {
  // Initialize if not already done
  if (!geminiInstance) {
    const apiKey = config?.apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in environment variables');
    }
    geminiInstance = new GoogleGenerativeAI(apiKey);
  }

  // Get model
  const modelName = config?.model || 'gemini-2.0-flash-exp';
  const model = geminiInstance.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: config?.temperature ?? 0.7,
      maxOutputTokens: config?.maxOutputTokens ?? 2048,
    },
  });

  return {
    /**
     * Generate content from prompt
     * @param prompt - The prompt to send to Gemini
     * @returns Generated response
     */
    generateContent: async (prompt: string): Promise<GeminiResponse> => {
      try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Extract usage metadata if available
        const usage = response.usageMetadata
          ? {
              promptTokens: response.usageMetadata.promptTokenCount || 0,
              completionTokens: response.usageMetadata.candidatesTokenCount || 0,
              totalTokens: response.usageMetadata.totalTokenCount || 0,
            }
          : undefined;

        return { text, usage };
      } catch (error: any) {
        console.error('Gemini API error:', error);
        throw new Error(`Failed to generate content: ${error.message}`);
      }
    },
  };
}

/**
 * Generate AI completion (convenience function)
 * @param prompt - The prompt to send to AI
 * @param config - Optional configuration
 * @returns AI response text
 */
export async function generateCompletion(
  prompt: string,
  config?: GeminiConfig
): Promise<string> {
  const gemini = getGemini(config);
  const response = await gemini.generateContent(prompt);
  return response.text;
}

/**
 * Generate structured JSON response
 * @param prompt - The prompt to send to AI
 * @param config - Optional configuration
 * @returns Parsed JSON response
 */
export async function generateJSON<T = any>(
  prompt: string,
  config?: GeminiConfig
): Promise<T> {
  const gemini = getGemini(config);
  const response = await gemini.generateContent(
    `${prompt}\n\nRespond with valid JSON only, no markdown formatting.`
  );

  try {
    // Remove markdown code blocks if present
    let text = response.text.trim();
    if (text.startsWith('```json')) {
      text = text.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (text.startsWith('```')) {
      text = text.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    return JSON.parse(text);
  } catch (error: any) {
    console.error('Failed to parse JSON response:', response.text);
    throw new Error(`Invalid JSON response from AI: ${error.message}`);
  }
}
