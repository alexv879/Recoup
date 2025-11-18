/**
 * Configuration for Recoup Voice Server
 * FCA-compliant voice collections via Twilio + OpenAI Realtime
 */

import * as dotenv from 'dotenv';
dotenv.config();

export const config = {
  // OpenAI Configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'gpt-4o-realtime-preview-2024-12-17', // Latest Realtime API model
    voice: 'alloy', // Professional, neutral voice
  },

  // Twilio Configuration
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
  },

  // Server Configuration
  server: {
    port: parseInt(process.env.PORT || '8080', 10),
    host: '0.0.0.0',
    env: process.env.NODE_ENV || 'development',
  },

  // FCA Compliance Requirements
  fca: {
    firmReference: process.env.FCA_FIRM_REFERENCE || '',
    companyName: process.env.COMPANY_NAME || 'Recoup Collections Ltd',
    companyAddress: process.env.COMPANY_ADDRESS || '',

    // FCA CONC 7.3: Debt collection practices
    requiredDisclosures: {
      companyIdentification: true, // Must identify company
      debtValidation: true, // Must validate debt details
      rightToDispute: true, // Must inform of dispute rights
      dataProtection: true, // Must inform of data usage (GDPR)
    },

    // Prohibited behaviors under FCA CONC
    prohibited: {
      harassment: true, // No harassment or oppressive behavior
      deception: false, // No deceptive practices
      unfairPressure: true, // No unfair pressure
      ignoreDisputes: false, // Must respond to disputes
    },
  },

  // Recoup Main App Integration
  recoup: {
    apiUrl: process.env.RECOUP_API_URL || 'http://localhost:3000',
    webhookSecret: process.env.RECOUP_WEBHOOK_SECRET || '',
  },

  // Call Settings
  call: {
    maxDurationSeconds: 300, // 5 minutes max
    silenceTimeoutSeconds: 10, // Hang up after 10s silence
    recordingEnabled: true, // Record for quality/compliance
  },
} as const;

// Validation
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.openai.apiKey) errors.push('Missing OPENAI_API_KEY');
  if (!config.twilio.accountSid) errors.push('Missing TWILIO_ACCOUNT_SID');
  if (!config.twilio.authToken) errors.push('Missing TWILIO_AUTH_TOKEN');
  if (!config.fca.firmReference) errors.push('Missing FCA_FIRM_REFERENCE');
  if (!config.recoup.webhookSecret) errors.push('Missing RECOUP_WEBHOOK_SECRET');

  return {
    valid: errors.length === 0,
    errors,
  };
}
