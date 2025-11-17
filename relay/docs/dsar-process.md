# DATA SUBJECT ACCESS REQUEST (DSAR) PROCESS

**[Your SaaS Name] - GDPR Compliance Process**

---

## 1. Introduction

This document outlines the process for handling Data Subject Access Requests (DSARs) under UK GDPR. A DSAR is a formal request from an individual to access their personal data held by a business.

**Legal Requirement:** Businesses must respond to DSARs within **30 calendar days** of receipt.

---

## 2. DSAR Overview

### What is a DSAR?

A DSAR is a request from an individual ("Data Subject") asking to see:
- All personal data we hold about them
- How we collect and use their data
- Who we share their data with
- How long we retain their data

### Legal Rights

Under **UK GDPR Article 15**, individuals have the right to access their personal data free of charge (except for excessive or frivolous requests).

### Scope of DSARs

We will provide:
- ✓ All personal data held (account info, emails, invoices, etc.)
- ✓ Purpose of processing
- ✓ Categories of recipients
- ✓ Retention periods
- ✓ Data subject rights

We will NOT provide:
- ✗ Information about other individuals (unless inextricably linked)
- ✗ Trade secrets or confidential business information
- ✗ Data not in a structured format (unless portable)

---

## 3. How to Submit a DSAR

### 3.1 Submission Methods

Users can submit a DSAR through any of these channels:

**Option 1: Dashboard (Recommended)**
1. Log into account
2. Navigate to Settings → Privacy → Request Data Export
3. Click "Submit DSAR"
4. Confirm request

**Option 2: Email**
1. Send email to: **privacy@[yourdomain].co.uk**
2. Subject line: "Data Subject Access Request" or "DSAR"
3. Include:
   - Full name
   - Email address linked to account
   - Phone number (optional)
   - Proof of identity (see Section 4)

**Option 3: Support Form**
1. Visit: [yourdomain].co.uk/contact
2. Select: "Data Privacy Request"
3. Complete the form with required information

### 3.2 Required Information

To process a DSAR, we need:
- Your full legal name
- Email address associated with account
- Proof of identity (see below)
- Preferred data format (JSON, CSV, PDF)

**Note:** We cannot process anonymous requests.

---

## 4. Identity Verification

### 4.1 Proof of Identity Requirements

To prevent unauthorized data access, we require one of:

**Option 1: Government-Issued ID**
- Passport (photo page)
- Driving license
- National ID card
- Proof of age card (if valid)

**Option 2: Multiple Documents** (if no government ID available)
- Birth certificate + recent utility bill, or
- Council tax bill + bank statement

### 4.2 Verification Process

1. User submits DSAR + proof of identity (photo/scan)
2. We verify identity against government records where possible
3. If verified → proceed to data compilation
4. If unverified → request additional information (within 10 days)

---

## 5. DSAR Processing Timeline

```
┌─────────────────────────────────────────────────────────────┐
│ LEGAL DEADLINE: 30 CALENDAR DAYS FROM RECEIPT              │
└─────────────────────────────────────────────────────────────┘

Day 1-5: Receive & Verify Identity
├─ DSAR received via email, dashboard, or form
├─ Confirm receipt to user (24 hours)
├─ Verify user identity
└─ If identity unclear, request additional info

Day 5-10: Request for Clarification (if needed)
├─ If identity unverified, ask user for more info
├─ User has 10 days to provide
└─ Clock restarts once clarification received

Day 10-20: Data Compilation
├─ Locate all personal data held
├─ Compile data from all systems/databases
├─ Extract from Stripe, Firebase, SendGrid, etc.
├─ Format data (JSON, CSV, or PDF as requested)
└─ Review for accuracy & completeness

Day 20-25: Quality Assurance & Review
├─ Verify all requested data included
├─ Ensure data accuracy
├─ Remove any data not belonging to requestor
├─ Prepare metadata (purpose, recipients, retention)
└─ Prepare delivery method

Day 25-30: Deliver to User
├─ Encrypt data package
├─ Create secure download link (48-hour expiry)
├─ Send email with download instructions
├─ Log DSAR completion
└─ Retain DSAR record (per policy)

TOTAL: 30 days maximum
```

---

## 6. Data Formats & Delivery

### 6.1 Preferred Formats

We provide data in one of these formats:

**Format 1: JSON (Recommended)**
- Machine-readable structured format
- Contains all data in nested objects
- Smallest file size
- Easy to import to other systems

**Format 2: CSV (Spreadsheet)**
- Tabular format (rows/columns)
- Can be opened in Excel or Google Sheets
- Best for relational data (transactions, invoices)
- Limited for nested/complex data

**Format 3: PDF (Document)**
- Human-readable format
- No re-import capability
- Largest file size
- Best for archival

**Default:** If user doesn't specify, we provide JSON + CSV.

### 6.2 Data Delivery Method

**Secure Download Link**
1. User receives email with secure link
2. Link expires after 48 hours
3. Login required (verify same account)
4. Download file (encrypted, password-protected)
5. Email includes decryption instructions

**Alternative:** For accounts without email access, we can:
- Arrange phone verification call
- Send via registered mailing address
- Use third-party secure file transfer service

---

## 7. What Data is Included in DSAR Export

### 7.1 Personal Data Included

When you submit a DSAR, we export:

| Category | Examples |
|----------|----------|
| **Account Data** | Name, email, phone, DOB, address, username |
| **Profile Data** | Avatar, bio, preferences, settings, language |
| **Invoices & Payments** | Invoice PDFs, payment records, billing address, VAT ID |
| **Communication** | Support tickets, emails, messages, feedback |
| **Usage Data** | Login dates/times, features used, IP addresses |
| **Transaction History** | All purchases, subscriptions, refunds |
| **Consent Records** | Opt-in/opt-out history, cookie preferences |

### 7.2 Additional Information Provided

The export also includes:

- **Data Categories:** What types of data we hold
- **Processing Purposes:** Why we collect this data
- **Retention Schedule:** How long we keep each data type
- **Recipients:** Third parties with access (Stripe, SendGrid, etc.)
- **Data Subject Rights:** Your rights and how to exercise them
- **Contact Information:** How to contact us with privacy questions

---

## 8. Large or Complex Data Requests

### 8.1 Scope Limitations

If a DSAR is **excessive or unreasonable**, we may:
- Request clarification to narrow the scope
- Charge a reasonable fee (not more than £10-25)
- Charge for duplicative requests within 12 months

**Example Excessive Requests:**
- Requests for hourly user activity logs for 5+ years
- Requests for identical data more than once per year
- Requests designed to harass or overwhelm (frivolous)

### 8.2 Large Data Sets

For very large data requests (>50MB):
- We provide via secure cloud download (e.g., Google Drive, Dropbox)
- Or via USB drive sent via post (user pays postage)
- Or split into multiple files delivered over 5-7 days (within 30-day window)

---

## 9. Refusing a DSAR

We may refuse or delay a DSAR if:

| Reason | Response |
|--------|----------|
| **Identity not verified** | Request additional proof within 10 days |
| **Frivolous/excessive request** | Refuse/delay; inform user of reasons |
| **Conflicting rights** | Redact data of other individuals |
| **Legal privilege** | Withhold attorney-client communications |
| **Active investigation** | Delay if disclosure would harm investigation |

**If we refuse**, we provide:
- Clear reason in writing
- Information about your rights (appeal to ICO)
- Our contact details for queries

---

## 10. Corrections & Disputed Data

### 10.1 If Data is Inaccurate

After receiving your DSAR export, if you believe any data is wrong:

1. **Email:** privacy@[yourdomain].co.uk
2. **Subject:** "Data Correction Request"
3. **Specify:** Which data is wrong and what it should be
4. **Attach:** Supporting evidence if available

**Our Response:**
- Acknowledge within 5 days
- Investigate within 10 days
- Correct or note dispute within 30 days

### 10.2 Right to Rectification

Under GDPR, you can request correction of inaccurate data at any time (not just via DSAR).

---

## 11. Related Rights

### 11.1 Right to Erasure (Right to be Forgotten)

Request deletion of your account and data:
- **Process:** Account Settings → Delete Account
- **Timeline:** 30 days
- **Exceptions:** Invoices retained 7 years for tax compliance

### 11.2 Right to Data Portability

Get your data in a portable format to move to another provider:
- **Process:** Included in DSAR export (JSON or CSV format)
- **Timeline:** Within DSAR response (30 days)
- **Cost:** Free

### 11.3 Right to Restrict Processing

Ask us to limit how we use your data while investigating an issue:
- **How:** Email privacy@[yourdomain].co.uk
- **Timeline:** 10 days to acknowledge
- **Duration:** Until investigation complete

---

## 12. Third-Party Data (Data of Others)

### 12.1 If DSAR Includes Data About Others

If your DSAR includes data about other individuals (e.g., contact info from your phone book):

- We will redact names, emails, phone numbers of other people
- We will provide data clearly related only to you
- We will not provide unsolicited contact data of others

### 12.2 Joint Data

If data relates to multiple people (e.g., shared account), we provide:
- Data clearly attributable to you
- Shared data with third parties noted
- Redacted data of other account holders

---

## 13. DSAR Logging & Records

### 13.1 We Keep Records of:

- Date DSAR received
- Method of receipt (email, form, dashboard)
- Identity verification details
- Data compiled
- Format provided
- Date of delivery
- Any refusals/delays and reasons

**Retention:** DSAR records retained for **2 years** after completion (legal hold).

### 13.2 Audit Trail

We maintain a log of all DSARs for compliance audits and can provide summary data to:
- UK Information Commissioner's Office (ICO) if requested
- Data protection authorities during investigations

---

## 14. Timescale Extensions

### 14.1 When We Can Extend the Deadline

We may extend the 30-day deadline by up to **60 additional days** if:
- DSAR is complex or volume is large (e.g., 10+ years of data)
- We're requesting clarification from the requestor
- We're coordinating with multiple departments/systems

**We will notify you of extension within 30 days.**

### 14.2 Requesting an Extension

If we believe an extension is needed:
1. Notify user in writing (email) within 30 days
2. Explain reason and specify new deadline
3. Provide extension date (typically + 30-60 days)
4. Reassure that extension doesn't delay delivery

---

## 15. Refusing a DSAR Process Flowchart

```
┌─ DSAR Received
│
├─ Identity Verified?
│  ├─ No → Request ID; wait 10 days
│  │        └─ ID provided? No → Refuse with reason
│  └─ Yes → Proceed
│
├─ Request Clear & Reasonable?
│  ├─ No → Clarify with user; wait 10 days
│  │        └─ Clarification provided? No → Refuse/Narrow
│  └─ Yes → Proceed
│
├─ Data Exists?
│  ├─ No → Inform user; no data held
│  └─ Yes → Proceed
│
├─ Any Legal Exemptions?
│  ├─ Yes → Redact exempt data; explain
│  └─ No → Proceed
│
└─ Compile & Deliver
   ├─ Format data (JSON/CSV/PDF)
   ├─ Encrypt & secure
   ├─ Send download link
   └─ Log completion
```

---

## 16. Contact & Support

### For DSAR Submissions:
**Email:** privacy@[yourdomain].co.uk  
**Form:** [yourdomain].co.uk/contact  
**Dashboard:** Account Settings → Privacy → Request Data

### For Questions About DSAR Status:
**Email:** support@[yourdomain].co.uk  
**Phone:** [Your Phone Number]

### For Complaints About DSAR Handling:
**UK Information Commissioner's Office (ICO)**
- Website: ico.org.uk
- Phone: 0303 123 1113
- Email: casework@ico.org.uk

---

## 17. Additional Resources

- **[Your GDPR Page]:** [yourdomain].co.uk/gdpr
- **Privacy Policy:** [yourdomain].co.uk/privacy
- **Data Processing Agreement:** [yourdomain].co.uk/dpa
- **Data Retention Policy:** [yourdomain].co.uk/retention

---

## 18. DSAR Response Template (Sample Email)

```
Subject: Your Data Subject Access Request - Response

Dear [User Name],

Thank you for submitting your Data Subject Access Request on [Date].
We have completed your request and your data is ready for download.

DSAR Details:
- Request Date: [Date]
- Response Date: [Date]
- Data Format: [JSON/CSV/PDF]
- File Size: [X MB]
- Expiry Date: [Date - 48 hours from now]

To Download Your Data:
1. Click the secure link below
2. Log in with your account credentials
3. Download the encrypted file
4. Use the password provided in this email to decrypt

[SECURE DOWNLOAD LINK]

Password: [16-char random string]

What's Included:
- Account information
- Invoices and payment history
- Support communications
- Usage logs and preferences
- Data processing information

Questions?
Please reply to this email or contact: privacy@[yourdomain].co.uk

Your Right to Erasure:
If you wish to delete your account, visit: Account Settings → Delete Account

Your Rights:
You have the right to:
- Access this data (which you've just requested)
- Request correction of inaccurate data
- Request erasure (right to be forgotten)
- Restrict processing
- Port your data to another service
- Object to processing

For more information, visit: [yourdomain].co.uk/privacy

---
[Your SaaS Name] Privacy Team
```

---

**DSAR Process Version:** 1.0  
**Last Updated:** [Date]