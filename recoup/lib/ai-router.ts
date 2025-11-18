/**
 * Multi-Model AI Router
 * Intelligently routes requests to Gemini (80%), Claude (15%), or OpenAI (5%)
 * Achieves 77% cost reduction: £200/mo → £45/mo
 *
 * Per IMPROVEMENTS_SUMMARY.md lines 13-17:
 * - Gemini 2.5 Pro: Routine operations (chat, email drafts) - £9/month
 * - Claude 3.7 Sonnet: Complex/sensitive cases - £6/month
 * - OpenAI Realtime: Voice calls only - £30/month
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { logger } from '@/utils/logger';

// Initialize clients (lazy initialization)
let gemini: GoogleGenerativeAI | null = null;
let claude: Anthropic | null = null;
let openai: OpenAI | null = null;

function getGemini(): GoogleGenerativeAI {
  if (!gemini) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    gemini = new GoogleGenerativeAI(apiKey);
  }
  return gemini;
}

function getClaude(): Anthropic {
  if (!claude) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }
    claude = new Anthropic({ apiKey });
  }
  return claude;
}

function getOpenAI(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

// AI Model Selection Strategy
export enum AIModel {
  GEMINI = 'gemini',
  CLAUDE = 'claude',
  OPENAI = 'openai',
}

export enum AITaskType {
  // Gemini tasks (80% - routine operations)
  EMAIL_DRAFT = 'email_draft',
  CHAT_RESPONSE = 'chat_response',
  INVOICE_SUMMARY = 'invoice_summary',
  PAYMENT_REMINDER = 'payment_reminder',
  BASIC_ANALYSIS = 'basic_analysis',

  // Claude tasks (15% - complex/sensitive)
  LEGAL_REVIEW = 'legal_review',
  DISPUTE_RESOLUTION = 'dispute_resolution',
  FCA_COMPLIANCE_CHECK = 'fca_compliance_check',
  COMPLEX_NEGOTIATION = 'complex_negotiation',
  SENSITIVE_COMMUNICATION = 'sensitive_communication',

  // OpenAI tasks (5% - voice only)
  VOICE_CALL = 'voice_call',
  VOICE_TRANSCRIPTION = 'voice_transcription',
}

/**
 * Select the best AI model based on task type
 */
export function selectModel(taskType: AITaskType): AIModel {
  const geminiTasks = [
    AITaskType.EMAIL_DRAFT,
    AITaskType.CHAT_RESPONSE,
    AITaskType.INVOICE_SUMMARY,
    AITaskType.PAYMENT_REMINDER,
    AITaskType.BASIC_ANALYSIS,
  ];

  const claudeTasks = [
    AITaskType.LEGAL_REVIEW,
    AITaskType.DISPUTE_RESOLUTION,
    AITaskType.FCA_COMPLIANCE_CHECK,
    AITaskType.COMPLEX_NEGOTIATION,
    AITaskType.SENSITIVE_COMMUNICATION,
  ];

  const openaiTasks = [
    AITaskType.VOICE_CALL,
    AITaskType.VOICE_TRANSCRIPTION,
  ];

  if (geminiTasks.includes(taskType)) {
    return AIModel.GEMINI;
  } else if (claudeTasks.includes(taskType)) {
    return AIModel.CLAUDE;
  } else if (openaiTasks.includes(taskType)) {
    return AIModel.OPENAI;
  }

  // Default to Gemini for cost efficiency
  return AIModel.GEMINI;
}

export interface AIRequest {
  prompt: string;
  taskType: AITaskType;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface AIResponse {
  content: string;
  model: AIModel;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: number; // Estimated cost in GBP
  latency: number; // Response time in ms
}

/**
 * Generate AI completion using the optimal model
 */
export async function generateCompletion(request: AIRequest): Promise<AIResponse> {
  const startTime = Date.now();
  const selectedModel = selectModel(request.taskType);

  logger.info('AI Router', {
    taskType: request.taskType,
    selectedModel,
    promptLength: request.prompt.length,
  });

  try {
    let response: AIResponse;

    switch (selectedModel) {
      case AIModel.GEMINI:
        response = await generateWithGemini(request);
        break;
      case AIModel.CLAUDE:
        response = await generateWithClaude(request);
        break;
      case AIModel.OPENAI:
        response = await generateWithOpenAI(request);
        break;
      default:
        throw new Error(`Unknown model: ${selectedModel}`);
    }

    response.latency = Date.now() - startTime;

    logger.info('AI Response', {
      model: response.model,
      latency: response.latency,
      tokens: response.usage.totalTokens,
      cost: response.cost,
    });

    return response;

  } catch (error) {
    logger.error('AI generation failed', {
      model: selectedModel,
      taskType: request.taskType,
      error: error instanceof Error ? error.message : String(error),
    });

    // Fallback strategy: try alternative model
    if (selectedModel !== AIModel.GEMINI) {
      logger.info('Falling back to Gemini');
      const fallbackResponse = await generateWithGemini(request);
      fallbackResponse.latency = Date.now() - startTime;
      return fallbackResponse;
    }

    throw error;
  }
}

/**
 * Generate with Gemini 2.5 Pro (80% of operations)
 */
async function generateWithGemini(request: AIRequest): Promise<AIResponse> {
  const client = getGemini();
  const model = client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = request.systemPrompt
    ? `${request.systemPrompt}\n\n${request.prompt}`
    : request.prompt;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: request.temperature || 0.7,
      maxOutputTokens: request.maxTokens || 2048,
    },
  });

  const response = result.response;
  const text = response.text();

  // Estimate token usage (Gemini doesn't always provide exact counts)
  const promptTokens = Math.ceil(prompt.length / 4);
  const completionTokens = Math.ceil(text.length / 4);
  const totalTokens = promptTokens + completionTokens;

  // Gemini pricing: £0.00015/1K input tokens, £0.0006/1K output tokens
  const cost = (promptTokens * 0.00015 / 1000) + (completionTokens * 0.0006 / 1000);

  return {
    content: text,
    model: AIModel.GEMINI,
    usage: {
      promptTokens,
      completionTokens,
      totalTokens,
    },
    cost,
    latency: 0, // Set by caller
  };
}

/**
 * Generate with Claude 3.7 Sonnet (15% of operations - complex/sensitive)
 */
async function generateWithClaude(request: AIRequest): Promise<AIResponse> {
  const client = getClaude();

  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: request.prompt,
    },
  ];

  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: request.maxTokens || 4096,
    temperature: request.temperature || 0.7,
    system: request.systemPrompt,
    messages,
  });

  const content = response.content[0];
  const text = content.type === 'text' ? content.text : '';

  // Claude pricing: £0.003/1K input tokens, £0.015/1K output tokens
  const cost =
    (response.usage.input_tokens * 0.003 / 1000) +
    (response.usage.output_tokens * 0.015 / 1000);

  return {
    content: text,
    model: AIModel.CLAUDE,
    usage: {
      promptTokens: response.usage.input_tokens,
      completionTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens,
    },
    cost,
    latency: 0, // Set by caller
  };
}

/**
 * Generate with OpenAI (5% of operations - voice only)
 */
async function generateWithOpenAI(request: AIRequest): Promise<AIResponse> {
  const client = getOpenAI();

  const messages: OpenAI.ChatCompletionMessageParam[] = [];

  if (request.systemPrompt) {
    messages.push({
      role: 'system',
      content: request.systemPrompt,
    });
  }

  messages.push({
    role: 'user',
    content: request.prompt,
  });

  const response = await client.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages,
    temperature: request.temperature || 0.7,
    max_tokens: request.maxTokens || 2048,
  });

  const text = response.choices[0]?.message?.content || '';

  // OpenAI pricing: £0.01/1K input tokens, £0.03/1K output tokens (GPT-4 Turbo)
  const promptTokens = response.usage?.prompt_tokens || 0;
  const completionTokens = response.usage?.completion_tokens || 0;
  const cost = (promptTokens * 0.01 / 1000) + (completionTokens * 0.03 / 1000);

  return {
    content: text,
    model: AIModel.OPENAI,
    usage: {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
    },
    cost,
    latency: 0, // Set by caller
  };
}

/**
 * Generate email draft using AI (routes to Gemini)
 */
export async function generateEmailDraft(params: {
  recipientName: string;
  invoiceNumber: string;
  amount: number;
  daysPastDue: number;
  tone: 'friendly' | 'firm' | 'final';
}): Promise<string> {
  const toneDescriptions = {
    friendly: 'polite and understanding',
    firm: 'professional and assertive',
    final: 'serious and urgent',
  };

  const systemPrompt = `You are a professional debt collection assistant for UK businesses.
Generate payment reminder emails that are FCA compliant, respectful, and effective.`;

  const prompt = `Generate a ${toneDescriptions[params.tone]} payment reminder email for:

Recipient: ${params.recipientName}
Invoice: ${params.invoiceNumber}
Amount: £${params.amount.toFixed(2)}
Days Overdue: ${params.daysPastDue}

Requirements:
- Professional and ${toneDescriptions[params.tone]} tone
- Include clear payment request
- Mention consequences if applicable
- FCA compliant (Treating Customers Fairly)
- No threats or harassment
- UK English spelling
- Maximum 200 words

Generate only the email body, no subject line.`;

  const response = await generateCompletion({
    prompt,
    systemPrompt,
    taskType: AITaskType.EMAIL_DRAFT,
    temperature: 0.7,
    maxTokens: 500,
  });

  return response.content;
}

/**
 * Analyze invoice for FCA compliance (routes to Claude)
 */
export async function analyzeForCompliance(params: {
  communicationType: 'email' | 'sms' | 'letter' | 'call';
  content: string;
  debtorCircumstances?: string;
}): Promise<{
  compliant: boolean;
  issues: string[];
  recommendations: string[];
}> {
  const systemPrompt = `You are an FCA compliance expert specializing in UK debt collection regulations.
Analyze communications for compliance with:
- FCA CONC rules (Consumer Credit sourcebook)
- Treating Customers Fairly (TCF) principles
- Vulnerable customer protections
- Fair debt collection practices`;

  const prompt = `Analyze this ${params.communicationType} for FCA compliance:

Content:
${params.content}

${params.debtorCircumstances ? `Debtor circumstances:\n${params.debtorCircumstances}\n` : ''}

Provide analysis in JSON format:
{
  "compliant": boolean,
  "issues": ["issue 1", "issue 2"],
  "recommendations": ["recommendation 1", "recommendation 2"]
}`;

  const response = await generateCompletion({
    prompt,
    systemPrompt,
    taskType: AITaskType.FCA_COMPLIANCE_CHECK,
    temperature: 0.3, // Lower temperature for analytical tasks
    maxTokens: 1000,
  });

  try {
    return JSON.parse(response.content);
  } catch (error) {
    logger.error('Failed to parse compliance analysis', { error });
    return {
      compliant: false,
      issues: ['Failed to analyze compliance'],
      recommendations: ['Manual review required'],
    };
  }
}

/**
 * Track AI usage for cost monitoring
 */
export async function trackAIUsage(params: {
  userId: string;
  model: AIModel;
  taskType: AITaskType;
  tokens: number;
  cost: number;
}): Promise<void> {
  // This would be stored in Firestore for monitoring
  logger.info('AI Usage', params);

  // TODO: Implement Firestore tracking
  // await firestore.collection('ai_usage').add({
  //   ...params,
  //   timestamp: new Date(),
  // });
}
