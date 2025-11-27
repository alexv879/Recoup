/**
 * AI Service Stub
 * Placeholder for Gemini AI integration
 *
 * This is a stub file to resolve build errors.
 * Implement actual AI service logic when ready to use this feature.
 */

export interface GeminiConfig {
  apiKey?: string;
  model?: string;
}

export interface GeminiResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Get Gemini AI instance
 * @returns Gemini AI client
 */
export function getGemini(config?: GeminiConfig) {
  // Stub implementation
  return {
    generateContent: async (prompt: string): Promise<GeminiResponse> => {
      console.warn('AI Service: getGemini() is a stub - implement actual Gemini integration');
      return {
        text: 'AI service not yet implemented',
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
      };
    },
  };
}

/**
 * Generate AI completion
 * @param prompt - The prompt to send to AI
 * @param config - Optional configuration
 * @returns AI response
 */
export async function generateCompletion(
  prompt: string,
  config?: GeminiConfig
): Promise<string> {
  console.warn('AI Service: generateCompletion() is a stub - implement actual AI logic');
  return 'AI service not yet implemented';
}
