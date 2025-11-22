# GDPR Data Mapping & Privacy Controls

## Overview

This document provides a comprehensive mapping of all personal data processed by Recoup, in compliance with the EU General Data Protection Regulation (GDPR) and UK Data Protection Act 2018.

**Controller:** Recoup Ltd
**Data Protection Officer:** [Your DPO Contact]
**Last Updated:** November 2025
**Review Frequency:** Quarterly

---

## Table of Contents

1. [Legal Basis for Processing](#legal-basis-for-processing)
2. [Data Inventory](#data-inventory)
3. [Data Flows](#data-flows)
4. [Data Subject Rights](#data-subject-rights)
5. [Data Retention](#data-retention)
6. [Security Controls](#security-controls)
7. [Third-Party Processors](#third-party-processors)
8. [Data Breach Procedures](#data-breach-procedures)
9. [Privacy by Design](#privacy-by-design)
10. [International Transfers](#international-transfers)

---

## Legal Basis for Processing

### 1. Contract Performance (Art. 6(1)(b) GDPR)

Processing necessary for the performance of our contract with freelancer users:

- **User account management** - Creating and maintaining user accounts
- **Invoice generation** - Creating and sending invoices to clients
- **Payment processing** - Processing payments through Stripe
- **Service delivery** - Providing core invoicing and collections features
- **Customer support** - Responding to user inquiries and technical issues

### 2. Legal Obligation (Art. 6(1)(c) GDPR)

Processing required to comply with legal obligations:

- **VAT records** - Maintaining VAT transaction records (HMRC requirement)
- **Financial records** - 6-year retention for HMRC compliance
- **Anti-money laundering** - Identity verification for certain thresholds
- **Tax reporting** - Submitting VAT returns to HMRC MTD API

### 3. Legitimate Interest (Art. 6(1)(f) GDPR)

Processing necessary for legitimate interests (balanced against user rights):

- **Fraud prevention** - Detecting and preventing fraudulent activity
- **Analytics** - Product improvement and user experience optimization
- **Security** - Monitoring and logging for security purposes
- **Direct marketing** - Sending product updates and feature announcements (with easy opt-out)

### 4. Consent (Art. 6(1)(a) GDPR)

Explicit consent obtained for:

- **Optional cookies** - Non-essential cookies (marketing, analytics)
- **Email marketing** - Promotional emails beyond service updates
- **Data sharing** - Sharing data with third-party integrations (Xero, QuickBooks - if requested)

---

## Data Inventory

### 1. User Personal Data

**Firestore Collection:** `users`

| Field | Type | Purpose | Legal Basis | Retention |
|-------|------|---------|-------------|-----------|
| `userId` | String | User identification | Contract | Account lifetime + 6 years |
| `email` | String | Communication, login | Contract | Account lifetime + 6 years |
| `name` | String | Display name, invoices | Contract | Account lifetime + 6 years |
| `phoneNumber` | String | Contact, SMS notifications | Contract | Account lifetime + 6 years |
| `address` | Object | Invoice address | Contract | Account lifetime + 6 years |
| `vatRegistrationNumber` | String | VAT compliance | Legal Obligation | 6 years after last use |
| `companyName` | String | Business identity | Contract | Account lifetime + 6 years |
| `bankDetails` | Object (encrypted) | Payment collection | Contract | Until removed + 6 years |
| `stripeCustomerId` | String | Payment processing | Contract | Account lifetime + 6 years |
| `createdAt` | Timestamp | Account history | Legitimate Interest | Account lifetime + 6 years |
| `lastLogin` | Timestamp | Security monitoring | Legitimate Interest | Rolling 90 days |
| `ipAddress` | String | Security, fraud prevention | Legitimate Interest | 90 days |
| `preferences` | Object | User settings | Contract | Account lifetime |
| `subscriptionTier` | String | Billing | Contract | Account lifetime + 6 years |

**Encryption:** Bank details encrypted using AES-256
**Access Control:** RBAC with role-based permissions

### 2. Client/Debtor Data

**Firestore Collection:** `clients`

| Field | Type | Purpose | Legal Basis | Retention |
|-------|------|---------|-------------|-----------|
| `clientId` | String | Client identification | Contract | 6 years after last invoice |
| `name` | String | Invoice generation | Contract | 6 years after last invoice |
| `email` | String | Invoice delivery | Contract | 6 years after last invoice |
| `phoneNumber` | String | Collection communications | Contract | 6 years after last invoice |
| `address` | Object | Invoice delivery | Contract | 6 years after last invoice |
| `companyName` | String | Business identity | Contract | 6 years after last invoice |
| `companyNumber` | String | Credit checks | Legitimate Interest | 6 years after last invoice |
| `vatNumber` | String | B2B invoicing | Legal Obligation | 6 years after last invoice |
| `paymentHistory` | Array | Credit assessment | Legitimate Interest | 6 years after last payment |
| `creditScore` | Number | Risk assessment | Legitimate Interest | Rolling 12 months |

**Special Notes:**
- Client data is owned by the freelancer user (data processor relationship)
- Users can export or delete client data at any time
- Client data is isolated per user (multi-tenancy)

### 3. Invoice & Financial Data

**Firestore Collection:** `invoices`

| Field | Type | Purpose | Legal Basis | Retention |
|-------|------|---------|-------------|-----------|
| `invoiceId` | String | Invoice identification | Contract | 6 years after creation |
| `userId` | String | User association | Contract | 6 years after creation |
| `clientId` | String | Client association | Contract | 6 years after creation |
| `invoiceNumber` | String | Invoice reference | Legal Obligation | 6 years after creation |
| `lineItems` | Array | Services/goods sold | Legal Obligation | 6 years after creation |
| `subtotal` | Number | Financial record | Legal Obligation | 6 years after creation |
| `vatAmount` | Number | VAT compliance | Legal Obligation | 6 years after creation |
| `total` | Number | Financial record | Legal Obligation | 6 years after creation |
| `dueDate` | Date | Payment terms | Contract | 6 years after creation |
| `paidDate` | Date | Payment record | Legal Obligation | 6 years after creation |
| `paymentMethod` | String | Financial record | Legal Obligation | 6 years after creation |
| `bankTransferDetails` | Object | Payment verification | Contract | 6 years after creation |

**Retention:** 6 years from end of accounting period (HMRC requirement)

### 4. VAT Records

**Firestore Collections:** `vat_returns`, `vat_transactions`

| Field | Type | Purpose | Legal Basis | Retention |
|-------|------|---------|-------------|-----------|
| `userId` | String | User association | Legal Obligation | 6 years |
| `period` | Object | VAT period | Legal Obligation | 6 years |
| `vatReturn` | Object | HMRC submission | Legal Obligation | 6 years |
| `submittedAt` | Timestamp | Audit trail | Legal Obligation | 6 years |
| `hmrcResponse` | Object | HMRC confirmation | Legal Obligation | 6 years |

**Retention:** 6 years minimum (HMRC legal requirement)

### 5. HMRC OAuth Tokens

**Firestore Collection:** `hmrc_tokens`

| Field | Type | Purpose | Legal Basis | Retention |
|-------|------|---------|-------------|-----------|
| `userId` | String | User association | Contract | Until disconnected |
| `access_token` | String (encrypted) | HMRC API access | Legal Obligation | Until expired/refreshed |
| `refresh_token` | String (encrypted) | Token refresh | Legal Obligation | Until disconnected |
| `expires_at` | Timestamp | Token management | Legal Obligation | Until disconnected |

**Encryption:** All tokens encrypted at rest
**Retention:** Deleted when user disconnects HMRC or deletes account

### 6. Payment Data (via Stripe)

**NOT stored in Recoup** - Handled by Stripe (PCI-DSS Level 1 certified)

| Data | Stored Where | Purpose |
|------|--------------|---------|
| Card numbers | Stripe only | Payment processing |
| Bank account numbers | Stripe only (tokenized in Recoup) | Direct Debit |
| Payment history | Stripe + Recoup (reference only) | Transaction records |

**Stripe as Processor:** Data Processing Agreement in place

### 7. Email Communications

**Provider:** SendGrid

| Field | Type | Purpose | Legal Basis | Retention |
|-------|------|---------|-------------|-----------|
| `emailId` | String | Email tracking | Contract | 90 days |
| `recipientEmail` | String | Delivery | Contract | 90 days |
| `subject` | String | Communication record | Contract | 90 days |
| `sentAt` | Timestamp | Audit trail | Legitimate Interest | 90 days |
| `openedAt` | Timestamp | Analytics | Legitimate Interest | 90 days |
| `clickedLinks` | Array | Analytics | Legitimate Interest | 90 days |

**Retention:** 90 days (rolling)
**DPA:** Data Processing Agreement with SendGrid

### 8. SMS Communications

**Provider:** Twilio

| Field | Type | Purpose | Legal Basis | Retention |
|-------|------|---------|-------------|-----------|
| `smsId` | String | SMS tracking | Contract | 90 days |
| `recipientPhone` | String | Delivery | Contract | 90 days |
| `message` | String | Communication record | Contract | 90 days |
| `sentAt` | Timestamp | Audit trail | Contract | 90 days |
| `deliveryStatus` | String | Delivery confirmation | Contract | 90 days |

**Retention:** 90 days (rolling)
**DPA:** Data Processing Agreement with Twilio

### 9. Analytics Data

**Provider:** Mixpanel / PostHog

| Data Type | Purpose | Legal Basis | Retention |
|-----------|---------|-------------|-----------|
| User events | Product improvement | Legitimate Interest | 90 days |
| Session data | UX optimization | Legitimate Interest | 90 days |
| Device info | Compatibility | Legitimate Interest | 90 days |
| IP address (anonymized) | Fraud prevention | Legitimate Interest | 30 days |

**Privacy:** IP addresses anonymized
**Consent:** Cookie banner for analytics cookies

### 10. Error Logs

**Provider:** Sentry

| Field | Type | Purpose | Legal Basis | Retention |
|-------|------|---------|-------------|-----------|
| `errorId` | String | Error tracking | Legitimate Interest | 30 days |
| `userId` (hashed) | String | User impact assessment | Legitimate Interest | 30 days |
| `stackTrace` | String | Debugging | Legitimate Interest | 30 days |
| `timestamp` | Timestamp | Error timeline | Legitimate Interest | 30 days |

**Privacy:** Personal data redacted from error messages
**Retention:** 30 days (rolling)

---

## Data Flows

### 1. User Registration Flow

```
User → Clerk (Authentication)
     → Firestore (User Profile)
     → SendGrid (Welcome Email)
     → Stripe (Customer Creation)
```

**Personal Data:**
- Email address
- Name
- Phone number (optional)
- IP address (for security)

**Legal Basis:** Contract performance + Legitimate interest (security)

### 2. Invoice Creation Flow

```
User → Recoup (Invoice Data)
     → Firestore (Invoice Storage)
     → SendGrid (Email to Client)
     → Twilio (SMS notification, optional)
     → AI Parser (OCR, if image uploaded)
```

**Personal Data:**
- Client name, email, phone, address
- Invoice financial data
- Line items

**Legal Basis:** Contract performance

### 3. Payment Collection Flow

```
Client → Stripe (Payment Processing)
      → Webhook → Recoup (Payment Record)
      → Firestore (Payment Status Update)
      → SendGrid (Receipt Email)
```

**Personal Data:**
- Payment amount
- Payment date
- Payment method (type only, not card details)

**Legal Basis:** Contract performance + Legal obligation (record keeping)

### 4. HMRC VAT Submission Flow

```
User → Recoup (VAT Return)
     → HMRC MTD API (VAT Submission)
     → Firestore (Submission Record)
     → SendGrid (Confirmation Email)
```

**Personal Data:**
- VAT Registration Number
- VAT return data
- Business financial data

**Legal Basis:** Legal obligation (HMRC compliance)

### 5. Collections Escalation Flow

```
Recoup (Cron) → Firestore (Overdue Invoices)
              → SendGrid (Reminder Emails)
              → Twilio (SMS Reminders)
              → Lob (Physical Letters)
              → Collections Agency API (if escalated)
```

**Personal Data:**
- Debtor name, address, contact details
- Invoice amounts
- Payment history

**Legal Basis:** Contract performance + Legitimate interest (debt recovery)

---

## Data Subject Rights

### 1. Right of Access (Art. 15)

**Implementation:**
- API endpoint: `GET /api/gdpr/data-export`
- Returns JSON export of all user data
- Includes: Profile, invoices, clients, VAT returns, payments
- Response time: Within 30 days (usually instant)

**Code:**
```typescript
// app/api/gdpr/data-export/route.ts
export async function GET(request: NextRequest) {
  const { userId } = auth();
  const userData = await exportAllUserData(userId);
  return NextResponse.json(userData);
}
```

### 2. Right to Rectification (Art. 16)

**Implementation:**
- Users can edit profile via Settings page
- API endpoints for updating all data fields
- Audit log tracks all changes
- Changes sync across all systems

**Code:**
```typescript
// app/api/users/[userId]/route.ts - PATCH handler
```

### 3. Right to Erasure / "Right to be Forgotten" (Art. 17)

**Implementation:**
- API endpoint: `DELETE /api/gdpr/delete-account`
- Hard delete after 6-year retention period
- Soft delete before then (anonymization)
- Cannot delete if legal obligation to retain (e.g., VAT records)

**Process:**
1. User requests deletion via Settings
2. Account marked as `deleted: true`
3. Personal data anonymized:
   - Name → `[Deleted User <random_id>]`
   - Email → `deleted_<random_id>@recoup.com`
   - Phone → `[Deleted]`
   - Address → `[Deleted]`
4. Financial records retained (anonymized) for 6 years
5. After 6 years: Hard delete via automated cron job

**Exceptions:**
- VAT records (6-year legal requirement)
- Financial records (6-year legal requirement)
- Ongoing legal disputes

### 4. Right to Data Portability (Art. 20)

**Implementation:**
- Export in JSON, CSV, and PDF formats
- API endpoint: `GET /api/gdpr/data-export?format=json|csv|pdf`
- Includes all user-created data
- Machine-readable format

**Data Included:**
- User profile
- All invoices
- All clients
- All payments
- VAT returns
- Communication history

### 5. Right to Object (Art. 21)

**Implementation:**
- Opt-out of marketing emails via unsubscribe link
- Opt-out of SMS via reply "STOP"
- Opt-out of analytics cookies via cookie banner
- Cannot opt-out of essential processing (contract performance, legal obligation)

**Opt-Out Mechanisms:**
- Email: Unsubscribe link in every marketing email
- SMS: Reply "STOP" to any SMS
- Cookies: Cookie preferences in footer
- Direct marketing: Email preferences in Settings

### 6. Right to Restrict Processing (Art. 18)

**Implementation:**
- Users can request processing restriction via support
- Account marked as `processing_restricted: true`
- Only essential processing continues (legal obligations)
- Other processing paused until restriction lifted

### 7. Rights Related to Automated Decision-Making (Art. 22)

**Automated Decisions in Recoup:**
- Credit scoring (for collections)
- Invoice escalation (automated reminders)
- Fraud detection (payment verification)

**Safeguards:**
- Human review available for all automated decisions
- Users can contest automated decisions
- Transparency: Decision logic documented
- No high-risk automated decisions without human oversight

---

## Data Retention

### Retention Schedule

| Data Category | Retention Period | Legal Basis | Deletion Method |
|---------------|------------------|-------------|-----------------|
| User profiles | Account lifetime + 6 years | Legal obligation (HMRC) | Hard delete |
| Invoices | 6 years from end of tax year | Legal obligation (HMRC) | Hard delete |
| VAT records | 6 years from submission | Legal obligation (HMRC) | Hard delete |
| Payment records | 6 years from payment | Legal obligation (HMRC) | Hard delete |
| Client data | 6 years from last invoice | Legal obligation (HMRC) | Hard delete |
| Email logs | 90 days | Legitimate interest | Automatic deletion |
| SMS logs | 90 days | Legitimate interest | Automatic deletion |
| Analytics data | 90 days | Legitimate interest | Automatic deletion |
| Error logs | 30 days | Legitimate interest | Automatic deletion |
| Login logs | 90 days | Security | Automatic deletion |
| HMRC tokens | Until disconnected | Contract | Immediate deletion |

### Automated Deletion

**Cron Job:** `DELETE /api/cron/delete-expired-data`
**Schedule:** Daily at 02:00 UTC

**Logic:**
```typescript
// Delete data older than retention period
await deleteExpiredData({
  emailLogs: 90, // days
  smsLogs: 90,
  analytics: 90,
  errorLogs: 30,
  loginLogs: 90,
  deletedAccounts: 2190, // 6 years
});
```

---

## Security Controls

See [ISO-27001-SECURITY-CONTROLS.md](./ISO-27001-SECURITY-CONTROLS.md) for comprehensive security documentation.

### Summary of Key Controls:

1. **Encryption**
   - At rest: AES-256 (Firebase/Firestore)
   - In transit: TLS 1.3
   - Sensitive fields: Additional application-level encryption

2. **Access Control**
   - RBAC with role-based permissions
   - MFA required for admin accounts
   - Principle of least privilege

3. **Authentication**
   - Clerk SSO with industry best practices
   - Password hashing (bcrypt, 10+ rounds)
   - Session management with secure tokens

4. **Network Security**
   - Firewall rules (Vercel/Firebase)
   - Rate limiting (Upstash Redis)
   - DDoS protection

5. **Monitoring**
   - Sentry error tracking
   - Audit logging for all data access
   - Security event alerts

6. **Backup & Recovery**
   - Daily Firestore backups
   - Point-in-time recovery
   - Disaster recovery plan

---

## Third-Party Processors

### Data Processing Agreements (DPAs)

| Processor | Purpose | Data Shared | DPA Status | Location |
|-----------|---------|-------------|------------|----------|
| **Clerk** | Authentication | Email, name, password hash | ✅ In place | USA (Standard Contractual Clauses) |
| **Firebase/Firestore** | Database | All user data | ✅ In place (Google Cloud DPA) | EU & USA (multi-region) |
| **Stripe** | Payments | Payment data, email | ✅ In place | USA (Privacy Shield successor) |
| **SendGrid** | Email | Email addresses, names | ✅ In place | USA (Standard Contractual Clauses) |
| **Twilio** | SMS | Phone numbers | ✅ In place | USA (Standard Contractual Clauses) |
| **OpenAI** | AI parsing | Invoice images (temporary) | ✅ In place | USA (no persistent storage) |
| **Sentry** | Error tracking | Error logs (anonymized) | ✅ In place | USA (IP anonymization enabled) |
| **Mixpanel/PostHog** | Analytics | User events (anonymized) | ✅ In place | USA/EU (data residency options) |
| **Lob** | Physical mail | Names, addresses | ✅ In place | USA (Standard Contractual Clauses) |

### International Transfers

**Mechanisms:**
- Standard Contractual Clauses (SCCs) for USA transfers
- Adequacy decisions for EU transfers
- Privacy Shield successor frameworks where applicable
- Data residency options (Firebase EU region)

### Sub-Processors

All processors required to notify Recoup of any sub-processors and obtain approval.

---

## Data Breach Procedures

### Detection

- **Automated monitoring** via Sentry, Firebase Security Rules
- **User reports** via support channels
- **Third-party notifications** from processors
- **Security audits** (quarterly)

### Response Timeline

| Time | Action |
|------|--------|
| **0-1 hour** | Detect and contain breach |
| **1-4 hours** | Assess scope and severity |
| **4-24 hours** | Notify DPO and management |
| **24-72 hours** | Notify ICO if high risk (required by law) |
| **72 hours** | Notify affected users if high risk |

### Severity Classification

**High Risk:**
- Unencrypted personal data exposed
- Financial data compromised
- Large number of users affected (>100)
- Sensitive data (health, financial, children)

**Medium Risk:**
- Encrypted data exposed
- Limited user impact (<100)
- No sensitive data

**Low Risk:**
- Internal incident, no external exposure
- Minimal user impact
- No personal data compromised

### Notification Template

**To Users:**
```
Subject: Security Incident Notification

Dear [User],

We are writing to inform you of a security incident that may have affected your Recoup account.

What happened: [Description]
What data was affected: [List]
What we've done: [Mitigation steps]
What you should do: [User actions]

We sincerely apologize for this incident. If you have any questions, please contact our Data Protection Officer at dpo@recoup.com.

Regards,
Recoup Security Team
```

**To ICO:**
Use ICO's online breach reporting tool within 72 hours.

---

## Privacy by Design

### 1. Data Minimization

**Principle:** Collect only what's necessary.

**Implementation:**
- Optional fields for non-essential data
- Don't collect data "just in case"
- Regular audits to remove unused data fields

**Example:**
- Phone number: Optional (only required if user wants SMS notifications)
- Company number: Optional (only for credit checks)
- Profile photo: Not collected (unnecessary for invoicing)

### 2. Purpose Limitation

**Principle:** Use data only for stated purposes.

**Implementation:**
- Clear purpose for each data field
- No secondary uses without consent
- Purpose documented in privacy policy

### 3. Storage Limitation

**Principle:** Don't keep data longer than necessary.

**Implementation:**
- Automated deletion cron jobs
- Clear retention periods
- Regular data cleanup

### 4. Privacy-Enhancing Technologies

**Implemented:**
- End-to-end encryption for bank details
- Anonymization of analytics data
- Pseudonymization of error logs
- Secure multi-party computation (future: for collections agency data sharing)

### 5. Default Privacy Settings

**Defaults:**
- Marketing emails: **Opt-in** (not pre-checked)
- Analytics cookies: **Opt-in** required
- SMS notifications: **Off** by default
- Data sharing with third parties: **Requires explicit consent**

---

## Privacy Policy & Cookie Policy

### Privacy Policy

**Location:** https://recoup.com/privacy
**Last Updated:** November 2025
**Review Frequency:** Annually or when processing changes

**Sections:**
1. What data we collect
2. How we use it
3. Legal basis for processing
4. Who we share it with (processors)
5. How long we keep it
6. Your rights
7. How to contact us
8. How to complain to ICO

### Cookie Policy

**Location:** https://recoup.com/cookies
**Last Updated:** November 2025

**Cookie Categories:**
1. **Essential cookies** (no consent required)
   - Authentication (Clerk session)
   - CSRF protection
   - Load balancing

2. **Analytics cookies** (consent required)
   - Mixpanel/PostHog
   - Google Analytics (if used)

3. **Marketing cookies** (consent required)
   - Ad retargeting (if used)

**Consent Management:**
- Cookie banner on first visit
- Granular consent options
- Easy to withdraw consent
- Consent stored in `user_consent` field

---

## Compliance Checklist

### GDPR Compliance Status

- ✅ Privacy policy published and accessible
- ✅ Cookie policy published and accessible
- ✅ Cookie consent banner implemented
- ✅ Data Processing Agreements with all processors
- ✅ Data mapping completed (this document)
- ✅ Data retention schedule defined
- ✅ Automated data deletion implemented
- ✅ User rights implemented (access, rectification, erasure, portability)
- ✅ Breach notification procedures documented
- ✅ Privacy by design principles applied
- ✅ Security controls implemented (ISO 27001)
- ✅ Staff training on GDPR (for team members)
- ⏳ DPO appointed (required when team >10)
- ⏳ DPIA for high-risk processing (collections agencies)

---

## Contact & Complaints

### Data Protection Officer

**Email:** dpo@recoup.com
**Response Time:** Within 30 days

### Complaints to ICO

**Information Commissioner's Office (ICO)**
**Website:** https://ico.org.uk/make-a-complaint/
**Phone:** 0303 123 1113
**Address:** Wycliffe House, Water Lane, Wilmslow, Cheshire, SK9 5AF

---

**Document Version:** 1.0
**Effective Date:** November 2025
**Next Review:** February 2026
