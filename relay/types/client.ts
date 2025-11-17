// Dedicated Client type for Recoup
export interface BillingAddress {
    street: string;
    street2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
}

export interface ContactPerson {
    name: string;
    email: string;
    phone?: string;
    isPrimary?: boolean;
}

export interface Client {
    id: string;
    name: string; // Required
    email: string; // Required
    company?: string;
    phone?: string;
    taxId?: string;
    billingAddress?: BillingAddress;
    currency?: string; // GBP, EUR, USD
    paymentTerms?: number; // Days (30, 60, 90)
    preferredPaymentMethod?: string; // BACS, Card, Check
    notes?: string;
    tags?: string[];
    status?: 'active' | 'inactive' | 'archived';
    totalOwed?: number;
    lastInvoiceDate?: string;
    lastPaymentDate?: string;
    averageDaysToPayment?: number;
    clientId?: string; // Custom/external ID
    poNumber?: string;
    contacts?: ContactPerson[];
    archived?: boolean;
    createdAt?: string;
    updatedAt?: string;
    invoiceCount?: number;
    totalPaid?: number;
}
