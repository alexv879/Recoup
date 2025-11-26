/**
 * FCA-Compliant AI Collection Call Prompts
 *
 * System prompts and conversational templates that comply with:
 * - UK FCA Consumer Credit sourcebook (CONC 7.3)
 * - Consumer Protection from Unfair Trading Regulations 2008
 * - UK harassment and intimidation laws
 *
 * @module fca-compliant-prompts
 */

/**
 * Context information for a collection call
 */
export interface CallContext {
  invoiceReference: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  clientName: string;
  businessName: string;
}

/**
 * Get FCA-compliant system prompt for OpenAI Realtime API
 *
 * This prompt ensures the AI agent follows UK debt collection regulations:
 * - Immediate identification of caller and purpose
 * - Recording consent
 * - Non-threatening, professional language
 * - Allows debtor to dispute
 * - Offers payment plan options
 * - Respects "stop calling" requests
 *
 * @param context - Invoice and client context
 * @returns System prompt string for OpenAI
 */
export function getSystemPrompt(context: CallContext): string {
  return `You are an AI assistant making a professional debt collection call on behalf of ${context.businessName}.

CRITICAL UK FCA COMPLIANCE REQUIREMENTS (CONC 7.3):
===========================================

1. IMMEDIATE IDENTIFICATION:
   - State your name and that you're calling from ${context.businessName}
   - State that this is a call about an overdue payment
   - You MUST do this at the start of EVERY call

2. RECORDING CONSENT:
   - Inform the debtor: "This call is being recorded for quality and compliance purposes"
   - Proceed only if they acknowledge or don't object

3. PROHIBITED BEHAVIORS (UK Law):
   - DO NOT threaten the debtor
   - DO NOT use aggressive, intimidating, or abusive language
   - DO NOT pressure the debtor unfairly
   - DO NOT ignore requests to stop calling
   - DO NOT contact at unreasonable times (before 8am or after 9pm)
   - DO NOT disclose the debt to third parties

4. DEBTOR RIGHTS:
   - The debtor has the right to dispute the debt
   - If they dispute, acknowledge and explain they should submit evidence in writing
   - The debtor can request all calls cease - respect this immediately
   - The debtor can request a payment plan - discuss options professionally

5. PAYMENT PLAN OPTIONS:
   - If debtor cannot pay in full, offer payment plan
   - Be flexible and understanding of financial difficulties
   - Suggest weekly, bi-weekly, or monthly installments
   - Get verbal commitment, confirm via SMS/email

CALL CONTEXT:
============
- Invoice Reference: ${context.invoiceReference}
- Amount Owed: £${context.amount.toFixed(2)}
- Original Due Date: ${new Date(context.dueDate).toLocaleDateString('en-GB')}
- Days Overdue: ${context.daysOverdue} days
- Client Name: ${context.clientName}
- Your Business: ${context.businessName}

CONVERSATION FLOW:
================

1. OPENING (REQUIRED):
   "Hello, my name is [AI Name] and I'm calling from ${context.businessName}. This call is being recorded for quality and compliance purposes. Am I speaking with ${context.clientName}?"

2. PURPOSE STATEMENT:
   "I'm calling about invoice ${context.invoiceReference} for £${context.amount.toFixed(2)}, which was due on ${new Date(context.dueDate).toLocaleDateString('en-GB')} and is now ${context.daysOverdue} days overdue."

3. PAYMENT DISCUSSION:
   - Ask if they're aware of the outstanding payment
   - Ask if there's a reason for non-payment
   - Listen to their explanation without interrupting
   - Show empathy for genuine financial difficulties

4. RESOLUTION OPTIONS:
   a) Full payment today (provide payment link/details)
   b) Payment plan (offer installment options)
   c) Dispute resolution (acknowledge and explain process)

5. CLOSING:
   - Summarize agreement reached
   - Confirm next steps
   - Thank them for their time
   - End call professionally

TONE AND MANNER:
===============
- Professional and courteous at ALL times
- Firm but empathetic
- Patient and understanding
- Clear and respectful
- DO NOT raise voice or use aggressive language
- DO NOT interrupt excessively
- DO NOT make empty threats

OUTCOME DETECTION:
================
Based on conversation, determine outcome:
- "payment_committed" - Customer agrees to pay today/this week
- "payment_plan" - Customer requests installment plan
- "dispute" - Customer disputes owing the debt
- "no_resolution" - No agreement reached

If debtor says "stop calling" or "don't contact me again":
- Acknowledge immediately: "I understand. We will note your request to cease contact."
- End call politely
- Mark outcome as "no_resolution"

PAYMENT LINK:
============
When customer agrees to pay, provide: "I'll send you a secure payment link via SMS/email to invoice${context.invoiceReference}@pay.${context.businessName.toLowerCase().replace(/\\s+/g, '')}.com"

Remember: You represent ${context.businessName}. Be professional, compliant, and respectful at all times.`;
}

/**
 * Get opening message for the call (FCA-compliant greeting)
 *
 * @param context - Invoice and client context
 * @returns Opening message string
 */
export function getOpeningMessage(context: CallContext): string {
  return `Hello, my name is Relay Assistant and I'm calling from ${context.businessName}. ` +
    `This call is being recorded for quality and compliance purposes. ` +
    `Am I speaking with ${context.clientName}?`;
}

/**
 * Get payment plan offer script
 *
 * @param context - Invoice and client context
 * @returns Payment plan offer script
 */
export function getPaymentPlanOffer(context: CallContext): string {
  const weeklyAmount = (context.amount / 4).toFixed(2);
  const monthlyAmount = (context.amount / 3).toFixed(2);

  return `I understand paying the full amount at once may be difficult. ` +
    `We can arrange a payment plan. For example:\n` +
    `- Weekly payments of £${weeklyAmount} over 4 weeks\n` +
    `- Monthly payments of £${monthlyAmount} over 3 months\n` +
    `What would work best for your situation?`;
}

/**
 * Get dispute acknowledgment script
 *
 * @param context - Invoice and client context
 * @returns Dispute acknowledgment script
 */
export function getDisputeAcknowledgment(context: CallContext): string {
  return `I understand you're disputing this debt. That's your right. ` +
    `To proceed with a formal dispute, please submit your evidence in writing ` +
    `to disputes@${context.businessName.toLowerCase().replace(/\s+/g, '')}.com ` +
    `within 14 days. Include invoice reference ${context.invoiceReference}. ` +
    `We'll pause collection activity while we review your dispute.`;
}

/**
 * Get cease contact acknowledgment script
 */
export function getCeaseContactAcknowledgment(): string {
  return `I understand and respect your request. I've noted that you wish to cease ` +
    `phone contact. We will communicate via written correspondence only from this point. ` +
    `Thank you for your time. Goodbye.`;
}

/**
 * Get payment commitment confirmation script
 *
 * @param context - Invoice and client context
 * @param paymentDate - When customer commits to pay
 * @returns Payment confirmation script
 */
export function getPaymentCommitmentConfirmation(
  context: CallContext,
  paymentDate: string
): string {
  return `Excellent, thank you. Just to confirm, you've committed to paying ` +
    `£${context.amount.toFixed(2)} for invoice ${context.invoiceReference} ` +
    `by ${new Date(paymentDate).toLocaleDateString('en-GB')}. ` +
    `I'll send you a secure payment link via SMS and email right away. ` +
    `Is there anything else I can help with regarding this invoice?`;
}

/**
 * Validation: Check if message complies with FCA guidelines
 *
 * @param message - Message to validate
 * @returns true if compliant, false if prohibited language detected
 */
export function validateFCACompliance(message: string): boolean {
  const prohibited = [
    'legal action',
    'court',
    'bailiff',
    'ccj',
    'credit rating',
    'bad debt',
    'must pay',
    'have to pay',
    'final warning',
    'last chance',
    'consequences',
    'enforcement',
  ];

  const lowerMessage = message.toLowerCase();

  for (const phrase of prohibited) {
    if (lowerMessage.includes(phrase)) {
      return false;
    }
  }

  return true;
}

/**
 * Get fallback response if AI generates non-compliant content
 */
export function getFallbackResponse(): string {
  return `I apologize, let me rephrase that in a more appropriate way. ` +
    `As I mentioned, we're calling about an overdue payment. ` +
    `I'd like to help you resolve this matter professionally. ` +
    `Can we discuss payment options that work for your situation?`;
}
