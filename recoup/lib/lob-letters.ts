/**
 * Lob Letters API integration
 * Handles physical mail sending for collection letters
 */

export interface UKAddress {
    recipientName?: string;
    name?: string;
    line1?: string;
    address_line1?: string;
    line2?: string;
    address_line2?: string;
    city?: string;
    address_city?: string;
    postcode?: string;
    address_zip?: string;
    country?: string;
    address_country?: string;
}

export interface LetterTemplate {
    template: 'final_notice' | 'courtesy_reminder' | 'formal_demand';
    variables: {
        debtorName: string;
        amount: number;
        invoiceNumber: string;
        dueDate: string;
        businessName: string;
    };
}

export interface LetterOptions {
    recipient: UKAddress;
    invoiceReference: string;
    amount: number;
    dueDate: string;
    daysPastDue: number;
    invoiceDate: string;
    template: string;
    businessName: string;
    businessAddress: string;
    invoiceId: string;
    freelancerId: string;
    sendCertified?: boolean;
}

export interface LetterResult {
    success: boolean;
    letterId?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    expectedDeliveryDate?: string;
    cost?: number;
    error?: string;
}

/**
 * Send a collection letter via Lob
 */
export async function sendCollectionLetter(options: LetterOptions): Promise<LetterResult> {
    try {
        // This is a placeholder implementation
        // In production, this would integrate with Lob API

        console.log('Sending collection letter:', options);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        return {
            success: true,
            letterId: `ltr_${Math.random().toString(36).substring(2, 15)}`,
            trackingNumber: `1Z${Math.random().toString(36).substring(2, 15).toUpperCase()}`,
            trackingUrl: `https://www.royalmail.com/track/${Math.random().toString(36).substring(2, 15)}`,
            expectedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days delivery
            cost: options.sendCertified ? 1.20 + 1.50 : 1.20, // Base + certified tracking
        };
    } catch (error) {
        console.error('Failed to send collection letter:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}