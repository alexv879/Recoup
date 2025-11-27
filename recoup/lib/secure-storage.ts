/**
 * Secure Storage Service
 *
 * Provides encrypted storage and retrieval for sensitive data in Firestore
 * Automatically encrypts/decrypts based on data type
 *
 * **Usage:**
 * ```typescript
 * import { secureInvoiceStorage, secureMessageStorage } from '@/lib/secure-storage';
 *
 * // Store invoice with encrypted fields
 * await secureInvoiceStorage.create(userId, invoiceData);
 *
 * // Retrieve invoice with decrypted fields
 * const invoice = await secureInvoiceStorage.get(userId, invoiceId);
 * ```
 */

import { db, COLLECTIONS, Timestamp, FieldValue } from '@/lib/firebase';
import { encryptField, decryptField, ENCRYPTED_FIELDS } from '@/lib/encryption';
import { logError, logWarn } from '@/utils/logger';

/**
 * Base secure storage class
 */
abstract class SecureStorage<T extends Record<string, any>> {
    constructor(
        protected collectionName: string,
        protected encryptedFields: (keyof T)[]
    ) {}

    /**
     * Create document with encrypted fields
     * Note: Field-level encryption should be done by caller before calling this method
     */
    async create(userId: string, data: T): Promise<string> {
        try {
            const docRef = await db.collection(this.collectionName).add({
                ...data,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            });
            return docRef.id;
        } catch (error) {
            logError(`Failed to create encrypted ${this.collectionName} document`, error);
            throw error;
        }
    }

    /**
     * Update document with encrypted fields
     * Note: Field-level encryption should be done by caller before calling this method
     */
    async update(userId: string, docId: string, data: Partial<T>): Promise<void> {
        try {
            await db.collection(this.collectionName).doc(docId).update({
                ...data,
                updatedAt: Timestamp.now(),
            });
        } catch (error) {
            logError(`Failed to update encrypted ${this.collectionName} document`, error);
            throw error;
        }
    }

    /**
     * Get document with decrypted fields
     * Note: Field-level decryption should be done by caller after calling this method
     */
    async get(userId: string, docId: string): Promise<T | null> {
        try {
            const doc = await db.collection(this.collectionName).doc(docId).get();
            if (!doc.exists) return null;

            const data = doc.data() as T;
            return data;
        } catch (error) {
            logError(`Failed to get encrypted ${this.collectionName} document`, error);
            throw error;
        }
    }

    /**
     * Query documents with decrypted fields
     * Note: Field-level decryption should be done by caller after calling this method
     */
    async query(userId: string, filters: { field: string; operator: FirebaseFirestore.WhereFilterOp; value: any }[]): Promise<T[]> {
        try {
            let query: FirebaseFirestore.Query = db.collection(this.collectionName);

            for (const filter of filters) {
                query = query.where(filter.field, filter.operator, filter.value);
            }

            const snapshot = await query.get();
            return snapshot.docs.map(doc => {
                const data = doc.data() as T;
                return data;
            });
        } catch (error) {
            logError(`Failed to query encrypted ${this.collectionName} documents`, error);
            throw error;
        }
    }
}

/**
 * Secure invoice storage
 */
class InvoiceSecureStorage extends SecureStorage<any> {
    constructor() {
        super(COLLECTIONS.INVOICES, ENCRYPTED_FIELDS.INVOICE as any);
    }

    /**
     * Create invoice with encrypted client data
     */
    async createInvoice(userId: string, invoice: any): Promise<string> {
        // Encrypt sensitive fields
        const encryptedInvoice = {
            ...invoice,
            clientName: invoice.clientName ? encryptField(invoice.clientName, userId) : '',
            clientEmail: invoice.clientEmail ? encryptField(invoice.clientEmail, userId) : '',
            clientPhone: invoice.clientPhone ? encryptField(invoice.clientPhone, userId) : '',
            clientAddress: invoice.clientAddress ? encryptField(invoice.clientAddress, userId) : '',
            notes: invoice.notes ? encryptField(invoice.notes, userId) : '',
        };

        return this.create(userId, encryptedInvoice);
    }

    /**
     * Get invoice with decrypted client data
     */
    async getInvoice(userId: string, invoiceId: string): Promise<any> {
        const invoice = await this.get(userId, invoiceId);
        if (!invoice) return null;

        // Decrypt fields
        return {
            ...invoice,
            clientName: invoice.clientName ? decryptField(invoice.clientName, userId) : '',
            clientEmail: invoice.clientEmail ? decryptField(invoice.clientEmail, userId) : '',
            clientPhone: invoice.clientPhone ? decryptField(invoice.clientPhone, userId) : '',
            clientAddress: invoice.clientAddress ? decryptField(invoice.clientAddress, userId) : '',
            notes: invoice.notes ? decryptField(invoice.notes, userId) : '',
        };
    }
}

/**
 * Secure message/communication storage
 */
class MessageSecureStorage extends SecureStorage<any> {
    constructor() {
        super(COLLECTIONS.COLLECTION_ATTEMPTS, ENCRYPTED_FIELDS.COMMUNICATION as any);
    }

    /**
     * Store encrypted message
     */
    async storeMessage(userId: string, message: {
        invoiceId: string;
        attemptType: 'email_reminder' | 'sms_reminder' | 'whatsapp_message' | 'ai_call' | 'physical_letter';
        recipientPhone?: string;
        recipientEmail?: string;
        messageBody?: string;
        emailContent?: string;
        smsContent?: string;
        recordingUrl?: string;
        result: string;
        resultDetails?: string;
    }): Promise<string> {
        // Encrypt all communication content
        const encrypted = {
            ...message,
            recipientPhone: message.recipientPhone ? encryptField(message.recipientPhone, userId) : undefined,
            recipientEmail: message.recipientEmail ? encryptField(message.recipientEmail, userId) : undefined,
            messageBody: message.messageBody ? encryptField(message.messageBody, userId) : undefined,
            emailContent: message.emailContent ? encryptField(message.emailContent, userId) : undefined,
            smsContent: message.smsContent ? encryptField(message.smsContent, userId) : undefined,
            recordingUrl: message.recordingUrl ? encryptField(message.recordingUrl, userId) : undefined,
        };

        return this.create(userId, encrypted);
    }

    /**
     * Get decrypted message
     */
    async getMessage(userId: string, messageId: string): Promise<any> {
        const message = await this.get(userId, messageId);
        if (!message) return null;

        return {
            ...message,
            recipientPhone: message.recipientPhone ? decryptField(message.recipientPhone, userId) : undefined,
            recipientEmail: message.recipientEmail ? decryptField(message.recipientEmail, userId) : undefined,
            messageBody: message.messageBody ? decryptField(message.messageBody, userId) : undefined,
            emailContent: message.emailContent ? decryptField(message.emailContent, userId) : undefined,
            smsContent: message.smsContent ? decryptField(message.smsContent, userId) : undefined,
            recordingUrl: message.recordingUrl ? decryptField(message.recordingUrl, userId) : undefined,
        };
    }
}

/**
 * Secure API key/integration storage
 */
class IntegrationSecureStorage extends SecureStorage<any> {
    constructor() {
        super('integrations', ENCRYPTED_FIELDS.INTEGRATION as any);
    }

    /**
     * Store encrypted API keys
     */
    async storeIntegration(userId: string, integration: {
        provider: string;
        apiKey?: string;
        apiSecret?: string;
        webhookSecret?: string;
        accessToken?: string;
        refreshToken?: string;
        expiresAt?: Date;
    }): Promise<string> {
        const encrypted = {
            ...integration,
            apiKey: integration.apiKey ? encryptField(integration.apiKey, userId) : undefined,
            apiSecret: integration.apiSecret ? encryptField(integration.apiSecret, userId) : undefined,
            webhookSecret: integration.webhookSecret ? encryptField(integration.webhookSecret, userId) : undefined,
            accessToken: integration.accessToken ? encryptField(integration.accessToken, userId) : undefined,
            refreshToken: integration.refreshToken ? encryptField(integration.refreshToken, userId) : undefined,
        };

        return this.create(userId, encrypted);
    }

    /**
     * Get decrypted integration
     */
    async getIntegration(userId: string, integrationId: string): Promise<any> {
        const integration = await this.get(userId, integrationId);
        if (!integration) return null;

        return {
            ...integration,
            apiKey: integration.apiKey ? decryptField(integration.apiKey, userId) : undefined,
            apiSecret: integration.apiSecret ? decryptField(integration.apiSecret, userId) : undefined,
            webhookSecret: integration.webhookSecret ? decryptField(integration.webhookSecret, userId) : undefined,
            accessToken: integration.accessToken ? decryptField(integration.accessToken, userId) : undefined,
            refreshToken: integration.refreshToken ? decryptField(integration.refreshToken, userId) : undefined,
        };
    }
}

/**
 * Secure user data storage
 */
class UserSecureStorage extends SecureStorage<any> {
    constructor() {
        super(COLLECTIONS.USERS, ENCRYPTED_FIELDS.USER as any);
    }

    /**
     * Update user with encrypted PII
     */
    async updateUserPII(userId: string, data: {
        fullName?: string;
        phoneNumber?: string;
        businessAddress?: string;
        taxId?: string;
    }): Promise<void> {
        const encrypted = {
            fullName: data.fullName ? encryptField(data.fullName, userId) : undefined,
            phoneNumber: data.phoneNumber ? encryptField(data.phoneNumber, userId) : undefined,
            businessAddress: data.businessAddress ? encryptField(data.businessAddress, userId) : undefined,
            taxId: data.taxId ? encryptField(data.taxId, userId) : undefined,
        };

        // Remove undefined values
        Object.keys(encrypted).forEach(key => {
            if (encrypted[key as keyof typeof encrypted] === undefined) {
                delete encrypted[key as keyof typeof encrypted];
            }
        });

        await db.collection(COLLECTIONS.USERS).doc(userId).update({
            ...encrypted,
            updatedAt: Timestamp.now(),
        });
    }

    /**
     * Get user with decrypted PII
     */
    async getUser(userId: string): Promise<any> {
        const doc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
        if (!doc.exists) return null;

        const data = doc.data();
        return {
            ...data,
            fullName: data?.fullName ? decryptField(data.fullName, userId) : undefined,
            phoneNumber: data?.phoneNumber ? decryptField(data.phoneNumber, userId) : undefined,
            businessAddress: data?.businessAddress ? decryptField(data.businessAddress, userId) : undefined,
            taxId: data?.taxId ? decryptField(data.taxId, userId) : undefined,
        };
    }
}

// Export singleton instances
export const secureInvoiceStorage = new InvoiceSecureStorage();
export const secureMessageStorage = new MessageSecureStorage();
export const secureIntegrationStorage = new IntegrationSecureStorage();
export const secureUserStorage = new UserSecureStorage();
