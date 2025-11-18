/**
 * Legal Document Version Control System
 *
 * This system tracks versions of legal documents and ensures compliance
 * with UK GDPR requirements for transparency and version management.
 *
 * UK GDPR Article 12(1) requires that information be provided in a
 * "concise, transparent, intelligible and easily accessible form".
 * Version control helps demonstrate compliance with this requirement.
 */

export interface LegalDocumentVersion {
  documentId: string;
  documentName: string;
  version: string;
  effectiveDate: string; // ISO 8601 date string
  lastUpdated: string; // ISO 8601 date string
  changes: string[]; // List of key changes
  url: string; // URL to the document
  deprecated: boolean; // Whether this version is superseded
}

export interface LegalDocumentRegistry {
  [documentId: string]: {
    currentVersion: string;
    versions: LegalDocumentVersion[];
  };
}

/**
 * Registry of all legal documents and their versions
 * This should be updated whenever legal documents change
 */
export const LEGAL_DOCUMENT_REGISTRY: LegalDocumentRegistry = {
  'terms-of-service': {
    currentVersion: '1.0',
    versions: [
      {
        documentId: 'terms-of-service',
        documentName: 'Terms of Service',
        version: '1.0',
        effectiveDate: '2025-11-18',
        lastUpdated: '2025-11-18',
        changes: [
          'Initial version',
          'UK-specific terms for freelancer payment automation',
          'Late Payment of Commercial Debts (Interest) Act 1998 compliance',
          'GDPR-compliant data processing terms',
          'Clear limitation of liability provisions',
        ],
        url: '/legal/terms-of-service.html',
        deprecated: false,
      },
    ],
  },
  'privacy-policy': {
    currentVersion: '1.0',
    versions: [
      {
        documentId: 'privacy-policy',
        documentName: 'Privacy Policy',
        version: '1.0',
        effectiveDate: '2025-11-18',
        lastUpdated: '2025-11-18',
        changes: [
          'Initial version',
          'UK GDPR compliance',
          'Comprehensive data processing disclosure',
          'Third-party service provider transparency',
          'Clear data subject rights information',
          'International transfer safeguards',
        ],
        url: '/legal/privacy-policy.html',
        deprecated: false,
      },
    ],
  },
  'cookie-policy': {
    currentVersion: '1.0',
    versions: [
      {
        documentId: 'cookie-policy',
        documentName: 'Cookie Policy',
        version: '1.0',
        effectiveDate: '2025-11-18',
        lastUpdated: '2025-11-18',
        changes: [
          'Initial version',
          'PECR compliance',
          'Detailed cookie categorization',
          'Third-party cookie disclosure',
          'Opt-out mechanisms',
        ],
        url: '/legal/cookie-policy.html',
        deprecated: false,
      },
    ],
  },
  'dpa': {
    currentVersion: '1.0',
    versions: [
      {
        documentId: 'dpa',
        documentName: 'Data Processing Agreement',
        version: '1.0',
        effectiveDate: '2025-11-18',
        lastUpdated: '2025-11-18',
        changes: [
          'Initial version',
          'UK GDPR Article 28 compliance',
          'Sub-processor disclosure',
          'Security measures documentation',
          'International transfer provisions',
          'Data breach notification procedures',
        ],
        url: '/legal/dpa.html',
        deprecated: false,
      },
    ],
  },
  'sla': {
    currentVersion: '1.0',
    versions: [
      {
        documentId: 'sla',
        documentName: 'Service Level Agreement',
        version: '1.0',
        effectiveDate: '2025-11-18',
        lastUpdated: '2025-11-18',
        changes: [
          'Initial version',
          'Uptime commitments by tier',
          'Support response times',
          'Service credit policy',
          'Third-party dependency disclosure',
        ],
        url: '/legal/sla.html',
        deprecated: false,
      },
    ],
  },
  'ir35-checklist': {
    currentVersion: '1.0',
    versions: [
      {
        documentId: 'ir35-checklist',
        documentName: 'IR35 Compliance Checklist',
        version: '1.0',
        effectiveDate: '2025-11-18',
        lastUpdated: '2025-11-18',
        changes: [
          'Initial version',
          'Comprehensive IR35 guidance for UK freelancers',
          'Interactive checklist format',
          'HMRC CEST tool integration guidance',
          'Risk assessment framework',
        ],
        url: '/legal/ir35-compliance-checklist.html',
        deprecated: false,
      },
    ],
  },
};

/**
 * Get the current version of a legal document
 */
export function getCurrentVersion(documentId: string): LegalDocumentVersion | null {
  const doc = LEGAL_DOCUMENT_REGISTRY[documentId];
  if (!doc) {
    return null;
  }

  const currentVersionNumber = doc.currentVersion;
  return doc.versions.find(v => v.version === currentVersionNumber) || null;
}

/**
 * Get all versions of a legal document (for version history)
 */
export function getAllVersions(documentId: string): LegalDocumentVersion[] {
  const doc = LEGAL_DOCUMENT_REGISTRY[documentId];
  if (!doc) {
    return [];
  }

  return doc.versions.sort((a, b) => {
    // Sort by version descending (newest first)
    return b.version.localeCompare(a.version, undefined, { numeric: true });
  });
}

/**
 * Get a specific version of a legal document
 */
export function getVersion(documentId: string, version: string): LegalDocumentVersion | null {
  const doc = LEGAL_DOCUMENT_REGISTRY[documentId];
  if (!doc) {
    return null;
  }

  return doc.versions.find(v => v.version === version) || null;
}

/**
 * Get all current legal documents
 */
export function getAllCurrentDocuments(): LegalDocumentVersion[] {
  return Object.keys(LEGAL_DOCUMENT_REGISTRY).map(documentId => getCurrentVersion(documentId)).filter(Boolean) as LegalDocumentVersion[];
}

/**
 * Check if a document has been updated since a given date
 */
export function hasBeenUpdatedSince(documentId: string, sinceDate: string): boolean {
  const current = getCurrentVersion(documentId);
  if (!current) {
    return false;
  }

  return current.lastUpdated > sinceDate;
}

/**
 * Get documents updated since a given date
 * Useful for notifying users of policy changes
 */
export function getDocumentsUpdatedSince(sinceDate: string): LegalDocumentVersion[] {
  return getAllCurrentDocuments().filter(doc => doc.lastUpdated > sinceDate);
}

/**
 * Format version history for display
 */
export function formatVersionHistory(documentId: string): string {
  const versions = getAllVersions(documentId);

  if (versions.length === 0) {
    return 'No version history available.';
  }

  return versions
    .map(v => {
      const deprecated = v.deprecated ? ' (Deprecated)' : '';
      return `
Version ${v.version}${deprecated}
Effective: ${formatDate(v.effectiveDate)}
Last Updated: ${formatDate(v.lastUpdated)}

Changes:
${v.changes.map(c => `  • ${c}`).join('\n')}
      `.trim();
    })
    .join('\n\n---\n\n');
}

/**
 * Format date for display (UK format)
 */
function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Generate a version changelog for user notification
 */
export function generateChangelog(documentId: string, fromVersion: string, toVersion: string): string {
  const versions = getAllVersions(documentId);

  const fromIndex = versions.findIndex(v => v.version === fromVersion);
  const toIndex = versions.findIndex(v => v.version === toVersion);

  if (fromIndex === -1 || toIndex === -1) {
    return '';
  }

  // Get versions between from and to (inclusive of to, exclusive of from)
  const relevantVersions = versions.slice(toIndex, fromIndex);

  if (relevantVersions.length === 0) {
    return 'No changes.';
  }

  return relevantVersions
    .map(v => {
      return `${v.version} (${formatDate(v.effectiveDate)}):\n${v.changes.map(c => `  • ${c}`).join('\n')}`;
    })
    .join('\n\n');
}

/**
 * Track when a user accepts a specific version of a document
 * This can be stored in the database for compliance audit trail
 */
export interface UserDocumentAcceptance {
  userId: string;
  documentId: string;
  version: string;
  acceptedAt: string; // ISO 8601 timestamp
  ipAddress?: string; // Optional, for audit trail
  userAgent?: string; // Optional, for audit trail
}

/**
 * Create an acceptance record
 * In production, this should be saved to the database
 */
export function createAcceptanceRecord(
  userId: string,
  documentId: string,
  ipAddress?: string,
  userAgent?: string
): UserDocumentAcceptance {
  const currentVersion = getCurrentVersion(documentId);

  if (!currentVersion) {
    throw new Error(`Document ${documentId} not found`);
  }

  return {
    userId,
    documentId,
    version: currentVersion.version,
    acceptedAt: new Date().toISOString(),
    ipAddress,
    userAgent,
  };
}

/**
 * Check if user needs to re-accept updated terms
 * Returns true if user's last acceptance is for an outdated version
 */
export function needsReacceptance(lastAcceptedVersion: string, documentId: string): boolean {
  const currentVersion = getCurrentVersion(documentId);

  if (!currentVersion) {
    return false;
  }

  return lastAcceptedVersion !== currentVersion.version;
}

/**
 * Get a summary of all legal documents for footer or legal page
 */
export function getLegalDocumentsSummary(): Array<{ name: string; url: string; version: string }> {
  return getAllCurrentDocuments().map(doc => ({
    name: doc.documentName,
    url: doc.url,
    version: doc.version,
  }));
}
