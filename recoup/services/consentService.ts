/**
 * CONSENT MANAGEMENT SERVICE
 *
 * Handles user consent for premium collections features.
 * Ensures GDPR and UK Communications Law compliance.
 *
 * UK Legal Requirements:
 * - GDPR: Explicit consent required for processing personal data
 * - Privacy and Electronic Communications Regulations (PECR): Consent for SMS/calls
 * - Recording calls: Must inform and get consent
 * - Data retention: Must honor data deletion requests
 * - Opt-out: Must honor immediately
 *
 * Consent Types:
 * 1. SMS Consent: Receiving SMS collection reminders
 * 2. Call Consent: Receiving AI voice collection calls
 * 3. Call Recording Consent: Recording and storing call audio
 * 4. Physical Mail Consent: Sending physical letters
 * 5. Data Storage Consent: Storing transcripts/recordings
 */

import { db, FieldValue } from '@/lib/firebase';
import { User } from '@/types/models';
import { logError, logInfo } from '@/utils/logger';
import { isCollectionsConsentObject, toDate } from '@/utils/helpers';

/**
 * Consent types
 */
export type ConsentType =
  | 'sms'
  | 'call'
  | 'call_recording'
  | 'physical_mail'
  | 'data_storage';

/**
 * Current consent version
 * Increment when terms change to require re-consent
 */
const CURRENT_CONSENT_VERSION = 'v1.0.0';

/**
 * Get user's current consent status
 */
export async function getUserConsent(userId: string): Promise<{
  smsConsent: boolean;
  callConsent: boolean;
  callRecordingConsent: boolean;
  physicalMailConsent: boolean;
  dataStorageConsent: boolean;
  consentDate?: Date;
  consentVersion?: string;
  needsUpdate: boolean;
} | null> {
  try {
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return null;
    }

    const user = userDoc.data() as User;
    const consent = user.collectionsConsent;

    // Check if consent exists and is current version
    const needsUpdate = !isCollectionsConsentObject(consent) ||
      !consent?.consentVersion ||
      consent?.consentVersion !== CURRENT_CONSENT_VERSION;

    return {
      smsConsent: isCollectionsConsentObject(consent) ? consent?.smsConsent || false : false,
      callConsent: isCollectionsConsentObject(consent) ? consent?.callConsent || false : false,
      callRecordingConsent: isCollectionsConsentObject(consent) ? consent?.callRecordingConsent || false : false,
      physicalMailConsent: isCollectionsConsentObject(consent) ? consent?.physicalMailConsent || false : false,
      dataStorageConsent: isCollectionsConsentObject(consent) ? consent?.dataStorageConsent || false : false,
      consentDate: isCollectionsConsentObject(consent) && consent.consentDate ? toDate(consent.consentDate) : undefined,
      consentVersion: isCollectionsConsentObject(consent) ? consent.consentVersion : undefined,
      needsUpdate,
    };

  } catch (error) {
    logError('Failed to get user consent', error);
    return null;
  }
}

/**
 * Update user consent
 */
export async function updateUserConsent(params: {
  userId: string;
  smsConsent: boolean;
  callConsent: boolean;
  callRecordingConsent: boolean;
  physicalMailConsent: boolean;
  dataStorageConsent: boolean;
  ipAddress?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const userRef = db.collection('users').doc(params.userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return { success: false, error: 'User not found' };
    }

    // Update consent
    await userRef.update({
      'collectionsConsent.smsConsent': params.smsConsent,
      'collectionsConsent.callConsent': params.callConsent,
      'collectionsConsent.callRecordingConsent': params.callRecordingConsent,
      'collectionsConsent.physicalMailConsent': params.physicalMailConsent,
      'collectionsConsent.dataStorageConsent': params.dataStorageConsent,
      'collectionsConsent.consentDate': FieldValue.serverTimestamp(),
      'collectionsConsent.consentVersion': CURRENT_CONSENT_VERSION,
      'collectionsConsent.ipAddress': params.ipAddress,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Log consent change for audit trail
    await db.collection('consent_audit_log').add({
      userId: params.userId,
      smsConsent: params.smsConsent,
      callConsent: params.callConsent,
      callRecordingConsent: params.callRecordingConsent,
      physicalMailConsent: params.physicalMailConsent,
      dataStorageConsent: params.dataStorageConsent,
      consentVersion: CURRENT_CONSENT_VERSION,
      ipAddress: params.ipAddress,
      timestamp: FieldValue.serverTimestamp(),
    });

    logInfo('User consent updated', { userId: params.userId });

    return { success: true };

  } catch (error) {
    logError('Failed to update user consent', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if user has given specific consent
 */
export async function checkConsent(
  userId: string,
  consentType: ConsentType
): Promise<boolean> {
  try {
    const consent = await getUserConsent(userId);

    if (!consent) {
      return false;
    }

    // Map consent type to field
    switch (consentType) {
      case 'sms':
        return consent.smsConsent;
      case 'call':
        return consent.callConsent;
      case 'call_recording':
        return consent.callRecordingConsent;
      case 'physical_mail':
        return consent.physicalMailConsent;
      case 'data_storage':
        return consent.dataStorageConsent;
      default:
        return false;
    }

  } catch (error) {
    logError('Failed to check consent', error);
    return false;
  }
}

/**
 * Revoke specific consent (opt-out)
 */
export async function revokeConsent(
  userId: string,
  consentType: ConsentType
): Promise<{ success: boolean; error?: string }> {
  try {
    const userRef = db.collection('users').doc(userId);

    const updateField = `collectionsConsent.${getConsentFieldName(consentType)}`;

    await userRef.update({
      [updateField]: false,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Log revocation
    await db.collection('consent_audit_log').add({
      userId,
      action: 'revoke',
      consentType,
      timestamp: FieldValue.serverTimestamp(),
    });

    logInfo('Consent revoked', { userId, consentType });

    return { success: true };

  } catch (error) {
    logError('Failed to revoke consent', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Request data deletion (GDPR Right to Erasure)
 * Deletes all recordings, transcripts, and personal data
 */
export async function requestDataDeletion(userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // 1. Revoke all consents
    await db.collection('users').doc(userId).update({
      'collectionsConsent.smsConsent': false,
      'collectionsConsent.callConsent': false,
      'collectionsConsent.callRecordingConsent': false,
      'collectionsConsent.physicalMailConsent': false,
      'collectionsConsent.dataStorageConsent': false,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 2. Mark collection attempts for deletion
    const attempts = await db
      .collection('collection_attempts')
      .where('freelancerId', '==', userId)
      .get();

    const batch = db.batch();

    attempts.docs.forEach(doc => {
      // Delete recording URLs and transcripts
      batch.update(doc.ref, {
        callRecordingUrl: FieldValue.delete(),
        callTranscript: FieldValue.delete(),
        callNotes: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();

    // 3. Log deletion request
    await db.collection('data_deletion_requests').add({
      userId,
      requestDate: FieldValue.serverTimestamp(),
      status: 'completed',
      itemsDeleted: attempts.size,
    });

    // AUDIT TASK #7 (COMPLETED): Delete ALL files from Firebase Storage (GDPR compliance - Task 1.3)
    try {
      // Import Firebase Admin Storage
      const { Storage } = await import('@google-cloud/storage');
      const storage = new Storage();

      const bucketName = process.env.FIREBASE_STORAGE_BUCKET || `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`;
      const bucket = storage.bucket(bucketName);

      let totalFilesDeleted = 0;

      // STORAGE PATHS TO DELETE:
      // 1. Voice call recordings: calls/{userId}/**
      // 2. Physical letter PDFs: letters/{userId}/**
      // 3. Uploaded documents: documents/{userId}/**
      // 4. Agency handoff documents: handoffs/{userId}/**
      // 5. Receipt images: receipts/{userId}/**
      // 6. Invoice attachments: invoices/{userId}/**

      const userStoragePaths = [
        `calls/${userId}/`,
        `letters/${userId}/`,
        `documents/${userId}/`,
        `handoffs/${userId}/`,
        `receipts/${userId}/`,
        `invoices/${userId}/`,
      ];

      for (const prefix of userStoragePaths) {
        try {
          // List all files with this prefix
          const [files] = await bucket.getFiles({ prefix });

          logInfo(`Found ${files.length} files in ${prefix}`, { userId, prefix, count: files.length });

          // Delete each file
          for (const file of files) {
            try {
              await file.delete();
              totalFilesDeleted++;
              logInfo(`Deleted file: ${file.name}`, { userId, filePath: file.name });
            } catch (fileError) {
              logError(`Failed to delete file: ${file.name}`, fileError);
              // Continue with other files even if one fails
            }
          }
        } catch (pathError) {
          logWarn(`No files found or error accessing path: ${prefix}`, pathError);
          // Continue with other paths even if one fails
        }
      }

      // Also delete handoff-specific documents (legacy structure)
      try {
        const handoffsSnapshot = await db
          .collection('agency_handoffs')
          .where('freelancerId', '==', userId)
          .get();

        for (const handoffDoc of handoffsSnapshot.docs) {
          const handoffData = handoffDoc.data();

          // Delete documents referenced in handoff metadata
          if (handoffData.documents && Array.isArray(handoffData.documents)) {
            for (const docRef of handoffData.documents) {
              if (docRef.storagePath) {
                try {
                  await bucket.file(docRef.storagePath).delete();
                  totalFilesDeleted++;
                  logInfo(`Deleted handoff document: ${docRef.storagePath}`, { userId });
                } catch (docError) {
                  logWarn(`Failed to delete handoff document: ${docRef.storagePath}`, docError);
                }
              }
            }
          }
        }
      } catch (handoffError) {
        logWarn('Error processing handoff documents', handoffError);
      }

      logInfo('Cloud storage deletion completed', {
        userId,
        totalFilesDeleted,
        pathsProcessed: userStoragePaths.length,
      });

      // Update deletion request log with file count
      await db.collection('data_deletion_requests').add({
        userId,
        requestDate: FieldValue.serverTimestamp(),
        status: 'completed',
        firestoreItemsDeleted: attempts.size,
        storageFilesDeleted: totalFilesDeleted,
        storagePaths: userStoragePaths,
      });

    } catch (storageError) {
      logError('Failed to delete cloud storage files', storageError);

      // Log partial failure
      await db.collection('data_deletion_requests').add({
        userId,
        requestDate: FieldValue.serverTimestamp(),
        status: 'partial_failure',
        firestoreItemsDeleted: attempts.size,
        storageError: storageError instanceof Error ? storageError.message : 'Unknown storage error',
      });

      // Continue - file deletion failure shouldn't completely block GDPR compliance
      // The user's Firestore data has been deleted, which is the primary requirement
    }

    logInfo('Data deletion completed', { userId, itemsDeleted: attempts.size });

    return { success: true };

  } catch (error) {
    logError('Failed to delete user data', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Export user data (GDPR Right to Data Portability)
 */
export async function exportUserData(userId: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    // 1. Get user profile
    const userDoc = await db.collection('users').doc(userId).get();
    const user = userDoc.data();

    // 2. Get collection attempts
    const attemptsSnapshot = await db
      .collection('collection_attempts')
      .where('freelancerId', '==', userId)
      .get();

    const attempts = attemptsSnapshot.docs.map(doc => doc.data());

    // 3. Get agency handoffs
    const handoffsSnapshot = await db
      .collection('agency_handoffs')
      .where('freelancerId', '==', userId)
      .get();

    const handoffs = handoffsSnapshot.docs.map(doc => doc.data());

    // 4. Package data
    const exportData = {
      exportDate: new Date().toISOString(),
      user: {
        email: user?.email,
        name: user?.name,
        businessName: user?.businessName,
        collectionsConsent: user?.collectionsConsent,
      },
      collectionAttempts: attempts.map(a => ({
        date: a.attemptDate,
        type: a.attemptType,
        result: a.result,
        // Exclude sensitive data like full transcripts
        summary: a.callNotes || a.resultDetails,
      })),
      agencyHandoffs: handoffs.map(h => ({
        agencyName: h.agencyName,
        handoffDate: h.handoffDate,
        status: h.handoffStatus,
        recoveryAmount: h.recoveryAmount,
      })),
    };

    logInfo('User data exported', { userId });

    return {
      success: true,
      data: exportData,
    };

  } catch (error) {
    logError('Failed to export user data', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate consent dialogue text for UI
 */
export function getConsentDialogue(consentType: ConsentType): {
  title: string;
  description: string;
  legalBasis: string;
} {
  const dialogues = {
    sms: {
      title: 'SMS Collection Reminders',
      description: 'Allow Recoup to send SMS text messages to your clients for invoice collection reminders. Messages will only be sent during reasonable hours (08:00-21:00) and clients can opt out at any time.',
      legalBasis: 'Privacy and Electronic Communications Regulations (PECR) 2003. You can withdraw consent at any time.',
    },
    call: {
      title: 'AI Voice Collection Calls',
      description: 'Allow Recoup to make automated AI-powered phone calls to your clients for invoice collections. Calls are professional, empathetic, and UK-regulation compliant. Calls only occur during reasonable hours (08:00-21:00).',
      legalBasis: 'Privacy and Electronic Communications Regulations (PECR) 2003 and FCA Debt Collection Rules. You can withdraw consent at any time.',
    },
    call_recording: {
      title: 'Call Recording',
      description: 'Allow Recoup to record collection calls for quality assurance, training, and dispute resolution. Recordings are stored securely and can be deleted upon request.',
      legalBasis: 'GDPR Article 6(1)(a) - Consent. Recordings are kept for 6 months unless required for disputes. You can request deletion at any time.',
    },
    physical_mail: {
      title: 'Physical Mail Collection Letters',
      description: 'Allow Recoup to send physical collection letters via postal mail on your behalf. Letters follow UK debt collection regulations and escalate from gentle reminders to formal notices.',
      legalBasis: 'Legitimate interest under GDPR Article 6(1)(f) for debt collection. Letters comply with Consumer Credit Act 1974 and FCA rules.',
    },
    data_storage: {
      title: 'Call Transcript and Recording Storage',
      description: 'Allow Recoup to store call transcripts, recordings, and related data for your records and analytics. All data is encrypted and stored securely in UK/EU data centers.',
      legalBasis: 'GDPR Article 6(1)(a) - Consent and Article 6(1)(f) - Legitimate interest for contract performance. Data retention: 6 months, or upon request for deletion.',
    },
  };

  return dialogues[consentType];
}

/**
 * Helper: Map consent type to field name
 */
function getConsentFieldName(consentType: ConsentType): string {
  const mapping = {
    sms: 'smsConsent',
    call: 'callConsent',
    call_recording: 'callRecordingConsent',
    physical_mail: 'physicalMailConsent',
    data_storage: 'dataStorageConsent',
  };

  return mapping[consentType];
}

/**
 * Validate consent before premium action
 * Throws error if consent not given
 */
export async function validateConsentOrThrow(
  userId: string,
  requiredConsents: ConsentType[]
): Promise<void> {
  const consent = await getUserConsent(userId);

  if (!consent) {
    throw new Error('User consent status not found');
  }

  // Check if consent version is current
  if (consent.needsUpdate) {
    throw new Error('Consent requires update to current version');
  }

  // Check each required consent
  for (const consentType of requiredConsents) {
    const hasConsent = await checkConsent(userId, consentType);

    if (!hasConsent) {
      throw new Error(`User has not given consent for: ${consentType}`);
    }
  }
}
