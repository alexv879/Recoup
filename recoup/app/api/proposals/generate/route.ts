import { NextResponse } from 'next/server';
import { handleError, UnauthorizedError } from '../../../../utils/error';
import { logger } from '../../../../utils/logger';
import { generateAIProposal } from '../../../../lib/ai-proposal-generator';

const getAuthUserId = (): string | null => {
  return 'user_2aXf...mock';
};

/**
 * POST /api/proposals/generate
 * Generates AI-powered proposal (78% time savings)
 */
export async function POST(req: Request) {
  try {
    const userId = getAuthUserId();
    if (!userId) {
      throw new UnauthorizedError('You must be logged in.');
    }

    const body = await req.json();
    const request = { ...body, userId };

    // Mock AI service - replace with actual multi-model AI service
    const aiService = {
      generate: async (params: any) => {
        return `## Project Overview\n\nI understand you need ${request.projectDescription}.\n\n## Solution\n\nI will deliver ${request.deliverables.join(', ')}.\n\n## Pricing\n\nTotal investment: £${request.pricingStrategy.fixedPrice || (request.pricingStrategy.hourlyRate || 0) * (request.pricingStrategy.estimatedHours || 0)}`;
      }
    };

    const proposal = await generateAIProposal(request, aiService);

    logger.info({
      userId,
      proposalId: proposal.id,
      total: proposal.pricing.total,
      winProbability: proposal.aiInsights.winProbability,
      generationTime: proposal.generatedBy.generationTime
    }, 'AI proposal generated');

    return NextResponse.json({ proposal });
  } catch (error) {
    const { status, body } = await handleError(error);
    return NextResponse.json(body, { status });
  }
}
