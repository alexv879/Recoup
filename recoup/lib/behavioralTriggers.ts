// Behavioral trigger logic for invoice creation and sending
import { Notification, User, Invoice } from '@/types/models';
import { db, Timestamp, COLLECTIONS } from '@/lib/firebase';
import { sendNotificationEmail } from '@/lib/sendgrid';
import { emitEvent } from '@/lib/analytics/emitter';

// Helper function to list invoices from Firestore
async function listInvoices(userId: string, status?: string): Promise<Invoice[]> {
    let query = db.collection(COLLECTIONS.INVOICES).where('freelancerId', '==', userId);

    if (status) {
        query = query.where('status', '==', status);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => doc.data() as Invoice);
}

// Trigger 1: Incomplete Invoice Creation
export async function triggerIncompleteInvoiceCreation(user: User) {
    const invoices = await listInvoices(user.userId);
    if (!invoices || invoices.length === 0) {
        // User opened onboarding email but did not create invoice in 24h
        const notification: Notification = {
            notificationId: `${user.userId}-incomplete-invoice-${Date.now()}`,
            userId: user.userId,
            type: 'behavioral_trigger_incomplete_invoice',
            title: 'Need help creating your first invoice?',
            message: `Hi ${user.name}, you opened our onboarding email but haven't created your first invoice yet. Click "New Invoice" in the dashboard to get started!`,
            read: false,
            actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/invoices/new`,
            createdAt: Timestamp.now(),
        };
        await db.collection(COLLECTIONS.NOTIFICATIONS).add(notification);
        if (user.email) {
            await sendNotificationEmail({
                toEmail: user.email,
                subject: notification.title,
                message: notification.message,
                actionUrl: notification.actionUrl,
            });
        }
        await emitEvent({
            type: 'behavioral_trigger_incomplete_invoice',
            userId: user.userId,
            timestamp: Date.now(),
        });
    }
}

// Trigger 2: Invoice Created but Not Sent
export async function triggerInvoiceCreatedNotSent(user: User) {
    const invoices = await listInvoices(user.userId, 'draft');
    if (invoices.length > 0) {
        for (const invoice of invoices) {
            const notification: Notification = {
                notificationId: `${user.userId}-invoice-not-sent-${invoice.invoiceId}`,
                userId: user.userId,
                type: 'behavioral_trigger_invoice_created_not_sent',
                title: 'Your invoice is ready to send 📤',
                message: `Hi ${user.name}, you created an invoice for ${invoice.clientName} for £${invoice.amount}. One more step: send it!`,
                read: false,
                actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/invoices/${invoice.invoiceId}`,
                createdAt: Timestamp.now(),
            };
            await db.collection(COLLECTIONS.NOTIFICATIONS).add(notification);
            if (user.email) {
                await sendNotificationEmail({
                    toEmail: user.email,
                    subject: notification.title,
                    message: notification.message,
                    actionUrl: notification.actionUrl,
                });
            }
            await emitEvent({
                type: 'behavioral_trigger_invoice_created_not_sent',
                userId: user.userId,
                timestamp: Date.now(),
                invoiceId: invoice.invoiceId,
            });
        }
    }
}
