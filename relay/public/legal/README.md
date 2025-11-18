# Recoup Legal Documentation

This directory contains all legal documents for the Recoup payment automation platform.

## Overview

All legal documents are UK-specific and comply with relevant UK legislation including:
- UK General Data Protection Regulation (UK GDPR)
- Data Protection Act 2018
- Privacy and Electronic Communications Regulations (PECR) 2003
- Late Payment of Commercial Debts (Interest) Act 1998
- Consumer Contracts Regulations 2013
- Consumer Rights Act 2015

## Documents

### Core Legal Documents

1. **[Terms of Service](terms-of-service.html)**
   - Governs use of the Recoup platform
   - UK-specific terms for freelancer payment automation
   - Late Payment Act 1998 compliance
   - Version: 1.0 | Effective: 18 November 2025

2. **[Privacy Policy](privacy-policy.html)**
   - UK GDPR compliant privacy notice
   - Comprehensive data processing disclosure
   - Third-party service provider transparency
   - Version: 1.0 | Effective: 18 November 2025

3. **[Cookie Policy](cookie-policy.html)**
   - PECR Regulation 6 compliance
   - Detailed cookie categorization
   - Opt-out mechanisms
   - Version: 1.0 | Effective: 18 November 2025

4. **[Data Processing Agreement (DPA)](dpa.html)**
   - UK GDPR Article 28 compliance
   - Controller-Processor relationship
   - Sub-processor disclosure
   - Version: 1.0 | Effective: 18 November 2025

5. **[Service Level Agreement (SLA)](sla.html)**
   - Uptime and support commitments
   - Service credit policy
   - Third-party dependencies
   - Version: 1.0 | Effective: 18 November 2025

### Guidance Documents

6. **[IR35 Compliance Checklist](ir35-compliance-checklist.html)**
   - Off-payroll working rules guidance
   - Interactive 36-point checklist
   - Risk assessment framework
   - Version: 1.0 | Effective: 18 November 2025

## Version Control

All legal documents use version control to ensure transparency and compliance:

- **Version Format**: MAJOR.MINOR (e.g., 1.0, 1.1, 2.0)
- **Change Tracking**: All changes documented in CHANGELOG.md
- **User Notification**: 30 days advance notice for material changes
- **Historical Access**: Previous versions available upon request

See `/relay/lib/legal/CHANGELOG.md` for detailed version history.

## Implementation

### Cookie Consent Banner

The cookie consent banner is implemented as a React component:

```tsx
import { CookieConsentBanner } from '@/components/legal/CookieConsentBanner';

// Add to root layout
<CookieConsentBanner />
```

Location: `/relay/components/legal/CookieConsentBanner.tsx`

### Cookie Consent Service

Utility functions for managing cookie preferences:

```typescript
import { hasConsent, canTrackAnalytics } from '@/services/legal/cookieConsentService';

if (canTrackAnalytics()) {
  // Initialize analytics
}
```

Location: `/relay/services/legal/cookieConsentService.ts`

### Version Control System

Programmatic access to legal document versions:

```typescript
import { getCurrentVersion, getAllCurrentDocuments } from '@/lib/legal/versionControl';

const currentToS = getCurrentVersion('terms-of-service');
const allDocs = getAllCurrentDocuments();
```

Location: `/relay/lib/legal/versionControl.ts`

## Compliance Features

### UK GDPR Compliance
✅ Data Processing Agreements
✅ Privacy Notices
✅ Data Subject Rights
✅ International Transfer Safeguards
✅ Breach Notification Procedures
✅ Lawful Basis Documentation

### PECR Compliance
✅ Cookie Consent Banner
✅ Detailed Cookie Policy
✅ Opt-out Mechanisms
✅ Third-party Cookie Disclosure

### Other UK Legislation
✅ Late Payment Act 1998 provisions
✅ Consumer Contracts Regulations 2013
✅ IR35 guidance for freelancers
✅ Unfair Contract Terms Act 1977
✅ Consumer Rights Act 2015

## Updating Legal Documents

### Process

1. **Draft Changes**: Create updated document version
2. **Review**: Legal review (internal or external solicitor)
3. **Version Control**: Update version number and CHANGELOG.md
4. **User Notification**: Email notification 30 days before effective date
5. **Implementation**: Deploy updated document on effective date
6. **Archive**: Keep previous version available

### Checklist for Updates

- [ ] Increment version number
- [ ] Update effective date and last updated date
- [ ] Document changes in CHANGELOG.md
- [ ] Update version control registry in `/relay/lib/legal/versionControl.ts`
- [ ] Schedule user notification (30 days advance for material changes)
- [ ] Archive previous version
- [ ] Test cookie consent banner if changes affect cookies
- [ ] Update any references in application code

## Contact Information

**Legal Inquiries**: legal@recoup.com
**Privacy/GDPR**: privacy@recoup.com or dpo@recoup.com
**Cookie Questions**: cookies@recoup.com
**Security**: security@recoup.com
**General Support**: support@recoup.com

## Regulatory Information

**Data Controller**: Recoup Ltd
**ICO Registration**: [Registration Number]
**Company Number**: [Company Registration Number]
**VAT Number**: [VAT Registration Number]
**Registered Address**: [Full Address]

## License & Copyright

All legal documents © 2025 Recoup Ltd. All rights reserved.

These documents are proprietary to Recoup and may not be copied, reproduced, or used
for other businesses without express written permission.

## Disclaimer

While we strive to ensure all legal documents are accurate and compliant, they should
be reviewed by qualified legal professionals for your specific circumstances. These
documents are provided as-is without warranty.

For complex legal matters, please consult a qualified solicitor.

---

*Last Updated: 18 November 2025*
*Next Review: 18 November 2026*
