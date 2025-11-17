# UK SAAS LEGAL DOCUMENTATION - COMPLETE CHECKLIST

**Quick Reference Guide for UK SaaS Companies**

---

## Files Created

You now have **7 complete legal documents** ready to customize and deploy:

| Document | Filename | Purpose | Key Sections |
|----------|----------|---------|--------------|
| **Terms of Service** | `terms-of-service.md` | Legal agreement with users | Acceptable use, billing, IP, liability, GDPR |
| **Privacy Policy** | `privacy-policy.md` | Data collection & usage transparency | Data types, usage, retention, GDPR, cookies |
| **Data Processing Agreement** | `data-processing-agreement.md` | GDPR processor obligations | Subprocessors, security, data breach, DSAR |
| **Cookie Policy** | `cookie-policy.md` | Transparent cookie disclosure | Essential, analytics, marketing, consent |
| **Data Retention Policy** | `data-retention-policy.md` | How long data is kept | Retention schedule, deletion process, 7-year tax |
| **DSAR Process** | `dsar-process.md` | How to handle data requests | 30-day timeline, verification, export formats |
| **Cookie Banner Code** | `cookie-consent-banner.md` | Consent banner implementation | HTML, CSS, JavaScript, configuration |

---

## Quick Setup Checklist

### Phase 1: Customize Templates (2-3 hours)
- [ ] Replace `[Your SaaS Name]` with your company name
- [ ] Replace `[yourdomain].co.uk` with your domain
- [ ] Replace `[Your Address]` with your business address
- [ ] Replace `[Your Phone Number]` with support phone (optional)
- [ ] Add your email addresses: `privacy@`, `legal@`, `support@`
- [ ] Replace `[Date]` with today's date
- [ ] Customize data types & retention periods (if different from template)
- [ ] Add your subprocessors to DPA Schedule B (Stripe, SendGrid, etc.)

### Phase 2: Legal Review (1-2 weeks)
- [ ] Have a UK solicitor review all documents
- [ ] Adjust liability clauses per your insurance
- [ ] Confirm governing law (England & Wales is standard for UK SaaS)
- [ ] Review indemnification clauses
- [ ] Update refund policy if needed
- [ ] Verify subprocessor list matches your architecture

### Phase 3: Implementation (1-2 weeks)
- [ ] Upload docs to `/legal` or `/terms` page on website
- [ ] Create links in footer to all policies
- [ ] Implement cookie consent banner on website
- [ ] Set up automated DSAR process (email + dashboard)
- [ ] Create privacy@[domain] email (monitored inbox)
- [ ] Add privacy controls to user account dashboard

### Phase 4: Testing & Compliance (1 week)
- [ ] Test cookie banner in Chrome, Firefox, Safari, mobile
- [ ] Verify Google Analytics fires only after consent
- [ ] Test DSAR submission + data export
- [ ] Test account deletion + data removal
- [ ] Verify backup deletion after 30 days
- [ ] Check subprocessor deletion on account deletion

### Phase 5: Launch (1 day)
- [ ] Publish all legal docs to website
- [ ] Update homepage footer links
- [ ] Deploy cookie consent banner
- [ ] Notify existing users (email with links)
- [ ] Monitor for questions/issues

---

## GDPR Compliance Checklist

### Data Protection Principles
- [ ] **Lawfulness:** Clear legal basis for each data collection
- [ ] **Transparency:** Privacy notice at collection point
- [ ] **Purpose Limitation:** Only use data for stated purposes
- [ ] **Data Minimization:** Only collect data you need
- [ ] **Accuracy:** Allow users to correct data
- [ ] **Storage Limitation:** Delete data per retention schedule
- [ ] **Integrity & Confidentiality:** Encryption, access controls
- [ ] **Accountability:** Document your compliance

### User Rights
- [ ] **Access Right:** DSAR process within 30 days
- [ ] **Rectification Right:** Allow correction of inaccurate data
- [ ] **Erasure Right:** Delete on request (except legal holds)
- [ ] **Restrict Right:** Limit processing on request
- [ ] **Portability Right:** Export data in portable format
- [ ] **Object Right:** Opt out of marketing/analytics
- [ ] **Automated Decision Making:** None (unless disclosed)

### Processor Obligations
- [ ] **Subprocessor List:** Maintained & updated
- [ ] **Data Security:** Encryption, backups, access controls
- [ ] **Breach Notification:** Notify users within 72 hours of discovery
- [ ] **Audit Trail:** Document all processing activities
- [ ] **Data Deletion:** Secure deletion of backed-up data within 30 days

---

## Key Dates & Deadlines

| Task | Deadline | Note |
|------|----------|------|
| DSAR response | 30 calendar days | From receipt; can extend +60 if complex |
| Identity verification | 10 business days | During DSAR verification |
| Data deletion post-closure | 30 calendar days | Except legal holds (7-year invoices) |
| Cookie consent | Before tracking | Required for analytics & marketing |
| Privacy notice | At collection | Before requesting data |
| DPA signature | Before processing | Required for EU/UK customers |
| Breach notification | 72 hours | To ICO if likely to affect users |
| Subprocessor notice | 30 days in advance | Before engaging new processor |

---

## Common Issues & Solutions

### Issue 1: "User wants their data deleted but we have unpaid invoices"
**Solution:** Retain invoice for 7 years (legal requirement); delete other personal data within 30 days

### Issue 2: "Google Analytics in US - GDPR compliant?"
**Solution:** Yes, if using Standard Contractual Clauses (SCCs) in DPA; ensure data minimization

### Issue 3: "Stripe stores card details - our responsibility?"
**Solution:** Stripe is PCI-compliant processor; include in subprocessor list in DPA

### Issue 4: "Customer never consented to cookies - are we liable?"
**Solution:** Deploy cookie banner immediately; get explicit consent for analytics/marketing going forward

### Issue 5: "Customer submits DSAR for data from 5 years ago"
**Solution:** Provide all data still in backups/archives; note data no longer in system if deleted per retention policy

### Issue 6: "DSAR requests keep arriving - can we refuse?"
**Solution:** Allow one per 12 months free; can charge reasonable fee (£10-25) for duplicates

---

## File Integration Guide

### On Your Website

**Footer Section**
```
© [Year] [Your SaaS Name]
[Link to Terms of Service]
[Link to Privacy Policy]
[Link to Cookie Policy]
[Link to Data Processing Agreement]
Contact: privacy@[yourdomain].co.uk
```

**Account Settings (Inside Dashboard)**
```
Settings → Privacy & Data
├─ Download My Data (DSAR)
├─ Delete My Account
├─ Cookie Preferences
├─ Privacy Policy
└─ Data Processing Agreement
```

**Legal Page Structure**
```
[yourdomain].co.uk/legal/
├─ /terms-of-service
├─ /privacy-policy
├─ /cookie-policy
├─ /data-processing-agreement
├─ /data-retention-policy
└─ /dsar-process
```

---

## Useful External Resources

### UK Information Commissioner's Office (ICO)
- **Website:** ico.org.uk
- **GDPR Guidance:** ico.org.uk/for-organisations/data-protection
- **DSAR Guide:** ico.org.uk/for-organisations/data-protection/data-protection-rights-and-responsibilities/subject-access-rights
- **Cookies Guidance:** ico.org.uk/for-organisations/data-protection/guidance-for-organisations/using-cookies

### Government Resources
- **HMRC Retention Requirements:** www.gov.uk/guidance/keep-records
- **Data Protection Act 2018:** legislation.gov.uk/ukpga/2018/12
- **UK GDPR Guidance:** www.gov.uk/government/publications/uk-gdpr-guidance

### Legal Template Providers
- **Termly:** termly.io (Good for quick setup)
- **TermsFeed:** termsfeed.com (Highly customizable)
- **Iubenda:** iubenda.com (Complex sites, excellent GDPR)

---

## Customization Checklist by SaaS Type

### SaaS with Payment Processing
- [ ] Specify Stripe (or your processor) in DPA Schedule B
- [ ] Include "non-refundable subscription" clause in ToS
- [ ] Note 7-year invoice retention for HMRC
- [ ] Specify payment data handling in Privacy Policy

### SaaS with User-Generated Content
- [ ] Clarify IP ownership (usually: you own platform, users own content)
- [ ] Add content takedown process
- [ ] Specify user data in deletion policy
- [ ] Note copyright/trademark policies in ToS

### SaaS with Email Marketing Integration
- [ ] Include SendGrid (or your ESP) in subprocessor list
- [ ] Add unsubscribe mechanism in Privacy Policy
- [ ] Specify CAN-SPAM compliance (if US customers)
- [ ] Add opt-out process in DSAR document

### SaaS with Analytics/Tracking
- [ ] Include Google Analytics in subprocessor list
- [ ] Add analytics cookies to Cookie Policy
- [ ] Note IP address collection in Privacy Policy
- [ ] Implement cookie banner with analytics toggle

### SaaS with 3rd-Party Integrations
- [ ] List ALL subprocessors in DPA Schedule B
- [ ] Specify data shared with each integration
- [ ] Add integration data handling to Privacy Policy
- [ ] Note subprocessor changes in DPA notification clause

---

## Annual Compliance Tasks

- [ ] **Quarterly:** Audit data retention; delete old data per policy
- [ ] **Quarterly:** Review DSAR requests; ensure 30-day response met
- [ ] **Semi-annually:** Test backup deletion process (confirm data actually deleted)
- [ ] **Semi-annually:** Review subprocessor list; remove unused services
- [ ] **Annually:** GDPR compliance audit (third-party recommended)
- [ ] **Annually:** Update privacy policy if practices change
- [ ] **Annually:** Certify data security measures (SOC 2, ISO 27001, etc.)

---

## Next Steps

1. **Download all files** from your cloud storage or create copies
2. **Customize** each document with your company details
3. **Get legal review** from a UK solicitor (highly recommended)
4. **Implement** on your website (footer links, privacy page, dashboard)
5. **Deploy** cookie consent banner on website
6. **Set up** privacy email inbox and DSAR process
7. **Test** DSAR submission + data export
8. **Monitor** compliance ongoing

---

## Support & Questions

If you have questions about:
- **GDPR compliance:** Contact ICO (ico.org.uk)
- **UK Tax law:** HMRC (hmrc.gov.uk)
- **Legal interpretation:** Consult a UK solicitor specializing in data protection
- **Technical implementation:** See `cookie-consent-banner.md` for code samples

---

## Disclaimer

**IMPORTANT:** These templates are provided as general guidance and are not legal advice. Laws change frequently, and your specific business may have unique requirements. **Always have a qualified UK solicitor review your legal documents before publishing.** The Information Commissioner's Office (ICO) provides detailed guidance at ico.org.uk.

---

**Complete Documentation Package Version:** 1.0  
**Created:** [Date]  
**Status:** Ready for customization and legal review