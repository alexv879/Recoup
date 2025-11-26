/**
 * Create Stripe Checkout Session API
 * POST /api/checkout/create-session
 *
 * Creates a Stripe Checkout session for subscription or payment
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { logInfo, logError } from '@/utils/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover',
});

export const dynamic = 'force-dynamic';

interface CreateSessionRequest {
  type: 'subscription' | 'invoice';
  priceId?: string; // For subscriptions
  invoiceId?: string; // For invoice payments
  successUrl?: string;
  cancelUrl?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Authentication
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get user from Clerk
    const { clerkClient } = await import('@clerk/nextjs/server');
    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    if (!user.primaryEmailAddress) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    // 3. Parse request body
    const body: CreateSessionRequest = await req.json();

    if (!body.type) {
      return NextResponse.json(
        { error: 'Missing required field: type' },
        { status: 400 }
      );
    }

    // 4. Get or create Stripe customer
    let stripeCustomerId: string;

    // Check if user already has a Stripe customer ID in Clerk metadata
    if (user.publicMetadata?.stripeCustomerId) {
      stripeCustomerId = user.publicMetadata.stripeCustomerId as string;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.primaryEmailAddress.emailAddress,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        metadata: {
          clerkUserId: userId,
        },
      });

      stripeCustomerId = customer.id;

      // Update Clerk user metadata with Stripe customer ID
      await clerkClient().users.updateUserMetadata(userId, {
        publicMetadata: {
          stripeCustomerId,
        },
      });
    }

    // 5. Create Checkout Session based on type
    let sessionParams: Stripe.Checkout.SessionCreateParams;

    if (body.type === 'subscription') {
      if (!body.priceId) {
        return NextResponse.json(
          { error: 'priceId required for subscription checkout' },
          { status: 400 }
        );
      }

      sessionParams = {
        customer: stripeCustomerId,
        mode: 'subscription',
        line_items: [
          {
            price: body.priceId,
            quantity: 1,
          },
        ],
        success_url: body.successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: body.cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        metadata: {
          userId,
          type: 'subscription',
        },
      };
    } else {
      // Invoice payment
      if (!body.invoiceId) {
        return NextResponse.json(
          { error: 'invoiceId required for invoice checkout' },
          { status: 400 }
        );
      }

      // Get invoice details from Firestore
      const { db } = await import('@/lib/firebase-admin');
      const invoiceRef = db.collection('invoices').doc(body.invoiceId);
      const invoiceDoc = await invoiceRef.get();

      if (!invoiceDoc.exists) {
        return NextResponse.json(
          { error: 'Invoice not found' },
          { status: 404 }
        );
      }

      const invoiceData = invoiceDoc.data();

      sessionParams = {
        customer: stripeCustomerId,
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: invoiceData?.currency?.toLowerCase() || 'gbp',
              product_data: {
                name: `Invoice ${invoiceData?.reference}`,
                description: `Payment for invoice ${invoiceData?.reference}`,
              },
              unit_amount: invoiceData?.amount || 0,
            },
            quantity: 1,
          },
        ],
        success_url: body.successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${body.invoiceId}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: body.cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${body.invoiceId}`,
        metadata: {
          userId,
          invoiceId: body.invoiceId,
          type: 'invoice_payment',
        },
      };
    }

    // 6. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create(sessionParams);

    logInfo('Stripe checkout session created', {
      sessionId: session.id,
      userId,
      type: body.type,
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });

  } catch (error: any) {
    logError('Failed to create checkout session', error);

    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
