# HMRC Making Tax Digital (MTD) Integration Guide

## Overview

Recoup integrates directly with HMRC's Making Tax Digital (MTD) API, allowing UK freelancers to submit VAT returns digitally without manual data entry on the HMRC website.

**Key Benefits:**
- ✅ Submit VAT returns directly from Recoup
- ✅ Retrieve VAT obligations and deadlines automatically
- ✅ View VAT liabilities and payment status
- ✅ Full audit trail of submissions
- ✅ Compliant with UK MTD regulations (mandatory for VAT-registered businesses)

---

## What is Making Tax Digital (MTD)?

Making Tax Digital is HMRC's initiative to digitize the UK tax system. For VAT-registered businesses:

- **Mandatory since April 2022** for all VAT-registered businesses
- Businesses must keep digital records and submit returns via MTD-compatible software
- Manual VAT returns through HMRC website are no longer allowed
- Non-compliance can result in penalties

**Recoup is MTD-compatible software**, enabling you to meet these legal requirements.

---

## Prerequisites

Before connecting HMRC to Recoup:

1. **VAT Registration Number (VRN)** - You must be registered for VAT with HMRC
2. **HMRC Government Gateway Account** - Used to authorize Recoup access
3. **VAT Return Records** - Keep digital records of all sales and purchases (Recoup does this automatically)

---

## Setup Instructions

### 1. Add Your VAT Registration Number

1. Go to **Settings** → **Tax Settings** in Recoup
2. Enter your **VAT Registration Number (VRN)** (9 digits, e.g., 123456789)
3. Select your **VAT Scheme** (Standard or Flat Rate)
4. Save your settings

### 2. Connect HMRC Account

1. Go to **Settings** → **Integrations** → **HMRC MTD**
2. Click **Connect HMRC Account**
3. You'll be redirected to HMRC's secure login page
4. Sign in with your **Government Gateway credentials**
5. Authorize Recoup to access your VAT information
6. You'll be redirected back to Recoup with a success message

**Security Note:** Recoup uses OAuth 2.0 (the same secure method used by banking apps). We never see your HMRC password.

### 3. Verify Connection

After connecting, Recoup will automatically:
- ✅ Retrieve your VAT obligations (upcoming returns)
- ✅ Display submission deadlines
- ✅ Show any outstanding VAT liabilities

---

## How to Submit a VAT Return

### Automatic VAT Calculation

Recoup automatically calculates your VAT return based on your invoices and expenses:

1. Go to **Tax** → **VAT Returns**
2. Select the **VAT period** (e.g., Q1 2024: Jan-Mar)
3. Review the **9-box VAT return**:
   - Box 1: VAT due on sales
   - Box 2: VAT due on EU acquisitions
   - Box 3: Total VAT due
   - Box 4: VAT reclaimed on purchases
   - Box 5: Net VAT (pay to HMRC or reclaim)
   - Box 6: Total sales (ex VAT)
   - Box 7: Total purchases (ex VAT)
   - Box 8: Goods supplied to EU (ex VAT)
   - Box 9: Goods acquired from EU (ex VAT)

### Submit to HMRC

1. Review all figures carefully (you cannot change them after submission)
2. Click **Submit to HMRC**
3. Recoup sends your return directly to HMRC via the MTD API
4. You'll receive:
   - **Form Bundle Number** - HMRC's submission reference
   - **Processing Date** - When HMRC processed your return
   - **Payment Indicator** - Whether you owe VAT or are due a refund

### After Submission

- Your VAT return is marked as **Submitted** in Recoup
- You can download a **PDF receipt** for your records
- If you owe VAT, pay HMRC by the **payment deadline** (usually 1 month + 7 days after period end)
- Recoup stores a full audit trail of your submission

---

## VAT Obligations

Recoup automatically retrieves your VAT obligations from HMRC:

- **Open Obligations** - Returns not yet submitted (shown with deadline)
- **Fulfilled Obligations** - Returns already submitted (shown with submission date)

### Viewing Obligations

1. Go to **Tax** → **VAT Obligations**
2. See all upcoming and past VAT returns
3. Each obligation shows:
   - Period dates (e.g., Jan 1 - Mar 31)
   - Submission deadline
   - Status (Open or Fulfilled)
   - Period key (e.g., 24A1 for 2024 Q1)

---

## VAT Liabilities

View what you owe HMRC or are due to reclaim:

1. Go to **Tax** → **VAT Liabilities**
2. See all outstanding VAT payments
3. Each liability shows:
   - Tax period
   - Original amount
   - Outstanding amount (after any payments)
   - Payment deadline
   - Type (VAT Return Debit/Credit Charge)

---

## Flat Rate Scheme (FRS)

If you're on the **Flat Rate Scheme**, Recoup automatically calculates your VAT using:

- Your business sector's **flat rate percentage** (e.g., 14.5% for IT contractors)
- Gross turnover (sales including VAT)
- No input VAT reclaimed (except capital assets over £2,000)

### How to Enable FRS

1. Go to **Settings** → **Tax Settings**
2. Select **Flat Rate Scheme**
3. Choose your **business sector** from the dropdown
4. Recoup will apply the correct percentage to all VAT calculations

**FRS Sectors Supported:**
- Computer and IT consultancy (14.5%)
- Accountancy/bookkeeping (14.5%)
- Architecture/engineering (14.5%)
- Advertising (11%)
- Management consultancy (14%)
- And 50+ more sectors...

---

## Sandbox vs Production

### Test Environment (Sandbox)

For development and testing:
- Set `HMRC_ENV=test` in environment variables
- Uses HMRC's sandbox API (no real VAT submissions)
- Test data only (does not affect your actual VAT account)
- Perfect for testing integrations

### Production Environment (Live)

For real VAT submissions:
- Set `HMRC_ENV=production` in environment variables
- Uses HMRC's live API
- **All submissions are legally binding**
- Only use when ready to submit real VAT returns

---

## Token Management

Recoup handles HMRC authentication tokens automatically:

- **Access Token** - Valid for 4 hours
- **Refresh Token** - Valid for 18 months
- Recoup automatically refreshes tokens before they expire
- You stay connected without needing to re-authorize

### Re-authorization Required

You'll need to reconnect HMRC if:
- 18 months have passed since initial authorization
- You manually disconnect HMRC in Settings
- You change your HMRC Government Gateway password

---

## Disconnecting HMRC

To disconnect your HMRC account:

1. Go to **Settings** → **Integrations** → **HMRC MTD**
2. Click **Disconnect HMRC**
3. Confirm the action
4. Your HMRC tokens are permanently deleted

**Note:** Past VAT submissions remain in Recoup's audit log, but you won't be able to submit new returns until you reconnect.

---

## Troubleshooting

### Error: "User not connected to HMRC"

**Solution:** Go to Settings → Integrations → HMRC MTD and click "Connect HMRC Account"

### Error: "VAT registration number not set"

**Solution:** Go to Settings → Tax Settings and enter your 9-digit VRN

### Error: "Invalid credentials" (401/403)

**Solution:** Your HMRC token has expired. Disconnect and reconnect your HMRC account.

### Error: "HMRC API Error: INVALID_REQUEST"

**Possible causes:**
- VAT return already submitted for this period
- Period key is incorrect
- Data validation failed (check all amounts are positive)

**Solution:** Review the error details and ensure all data is correct before resubmitting.

### Error: "Rate limit exceeded" (429)

**Solution:** HMRC limits API requests. Wait 60 seconds and try again.

---

## Security & Compliance

### Data Security

- ✅ **OAuth 2.0** - Industry-standard secure authentication
- ✅ **Encrypted tokens** - Stored securely in Firestore with encryption at rest
- ✅ **No password storage** - We never see or store your HMRC password
- ✅ **Audit logging** - Full trail of all HMRC API interactions
- ✅ **SOC 2 compliant** - Enterprise-grade security controls

### HMRC API Scopes

Recoup requests these permissions:
- `read:vat` - View your VAT obligations and liabilities
- `write:vat` - Submit VAT returns on your behalf

**We do not access:**
- Your income tax data
- Corporation tax data
- PAYE data
- Any non-VAT information

### Audit Trail

Every HMRC interaction is logged:
- Timestamp of submission
- VAT return data submitted
- HMRC response (form bundle number, processing date)
- User who submitted the return
- All logs are immutable (cannot be changed or deleted)

---

## API Endpoints

For developers integrating with Recoup's HMRC functionality:

### Authentication
- `GET /api/hmrc/auth/connect` - Initiate OAuth flow
- `GET /api/hmrc/auth/callback` - Handle OAuth callback
- `POST /api/hmrc/auth/disconnect` - Revoke HMRC access
- `GET /api/hmrc/auth/status` - Check connection status

### VAT Operations
- `GET /api/hmrc/vat/obligations` - Retrieve VAT obligations
- `GET /api/hmrc/vat/liabilities` - Retrieve VAT liabilities
- `POST /api/hmrc/vat/submit` - Submit VAT return

---

## Developer Setup

For local development of HMRC integration:

### 1. Register HMRC Developer Application

1. Go to: https://developer.service.hmrc.gov.uk
2. Create account and verify email
3. Create new application:
   - **Name:** Recoup (Local Dev)
   - **Description:** Invoice and VAT management for UK freelancers
   - **Redirect URIs:** `http://localhost:3000/api/hmrc/auth/callback`
   - **API Subscriptions:** Add "VAT (MTD)"
4. Copy **Client ID** and **Client Secret**

### 2. Configure Environment Variables

Add to `.env.local`:

```bash
HMRC_ENV=test
HMRC_CLIENT_ID=your-client-id-here
HMRC_CLIENT_SECRET=your-client-secret-here
HMRC_REDIRECT_URI=http://localhost:3000/api/hmrc/auth/callback
```

### 3. Test with HMRC Sandbox

The sandbox environment uses test data:
- Test VRN: `123456789`
- Test obligations and liabilities are pre-populated
- Submissions don't affect real VAT accounts

### 4. Run Tests

```bash
npm test __tests__/lib/hmrc-mtd-client.test.ts
```

---

## FAQ

**Q: Is MTD mandatory for my business?**
A: Yes, if you're VAT-registered in the UK. It became mandatory in April 2022 for all VAT-registered businesses.

**Q: How often do I need to submit VAT returns?**
A: Most businesses submit quarterly (every 3 months). Check your VAT obligations in Recoup or on the HMRC website.

**Q: What if I miss the deadline?**
A: HMRC charges penalties for late submissions:
- £100 fine for submissions up to 1 month late
- Additional £200-400 for longer delays
- Daily penalties of £10/day after 3 months

**Q: Can Recoup pay HMRC on my behalf?**
A: No. Recoup submits your VAT return, but you must pay HMRC separately via bank transfer, direct debit, or debit card on the HMRC website.

**Q: What happens if I make a mistake?**
A: Contact HMRC immediately. You may be able to correct errors in your next return (if under £10,000) or submit an amended return.

**Q: Can I use Recoup if I'm not VAT registered?**
A: Yes! You can use all of Recoup's invoicing and collections features. The HMRC integration is only needed if you're VAT-registered.

---

## Support

Need help with HMRC integration?

- 📧 Email: support@recoup.com
- 💬 In-app chat: Settings → Help & Support
- 📚 Help Center: https://help.recoup.com/hmrc-mtd
- 🎥 Video Tutorial: [How to Connect HMRC MTD](https://www.youtube.com/recoup)

**HMRC Support:**
- ☎️ Phone: 0300 200 3700 (Monday-Friday, 8am-6pm)
- 🌐 Website: https://www.gov.uk/making-tax-digital

---

## Technical References

- [HMRC MTD VAT API Documentation](https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/vat-api/1.0)
- [OAuth 2.0 Guide](https://developer.service.hmrc.gov.uk/api-documentation/docs/authorisation)
- [MTD for VAT Regulations](https://www.gov.uk/government/publications/making-tax-digital/overview-of-making-tax-digital)
- [Flat Rate Scheme Percentages](https://www.gov.uk/vat-flat-rate-scheme/how-much-you-pay)

---

**Last Updated:** November 2025
**MTD API Version:** 1.0
**Recoup Version:** 1.0.0
