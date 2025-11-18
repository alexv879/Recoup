# Recoup Admin Dashboard Documentation

## Overview

The Recoup Admin Dashboard is a comprehensive operational monitoring and management system designed for day-one production operations. It provides real-time insights into user activity, payment tracking, system health, and business analytics.

## Features

### 1. Admin Authentication & Authorization

**Location:** `/middleware/adminAuth.ts`

**Admin Roles:**
- `super_admin` - Full system access (user management, system config, billing)
- `support_admin` - Customer support access (user lookup, payment overrides)
- `finance_admin` - Financial operations (revenue, analytics, payment tracking)
- `readonly_admin` - Read-only access (monitoring, analytics, audit logs)

**Permission Matrix:**
```typescript
super_admin:     users:*, payments:*, analytics:*, audit_logs:*, system:*, alerts:*, support:*
support_admin:   users:read/write, payments:read/override, audit_logs:read, support:*
finance_admin:   users:read, payments:read/write, analytics:read, audit_logs:read
readonly_admin:  users:read, payments:read, analytics:read, audit_logs:read
```

**Adding an Admin User:**
```typescript
// In Firebase console or via script:
await db.collection('users').doc(userId).update({
  isAdmin: true,
  adminRole: 'super_admin', // or 'support_admin', 'finance_admin', 'readonly_admin'
});
```

### 2. Dashboard Pages

#### Overview Dashboard (`/admin`)
- **Key Metrics:** Total users, paid users, MRR/ARR, payment volume, collection rate
- **Quick Actions:** Links to all admin sections
- **Critical Alerts:** Banner for urgent issues requiring attention

#### User Management (`/admin/users`)
- **Search:** By email, name, or user ID
- **Filters:** Subscription tier, account status, admin users
- **Stats:** Total users, active/suspended counts, founding members
- **Actions:** View user details, edit user profile

#### Payment Tracking (`/admin/payments`)
- **Real-time Metrics:** Total value, collected, overdue, collection rate
- **Charts:** Revenue trend over time
- **Breakdown:** Invoice status distribution
- **Payment Claims:** Pending verification, verified claims
- **Top Users:** By payment volume

#### Business Analytics (`/admin/analytics`)
- **User Metrics:** Total users, active users, paid users, churn rate, user growth chart
- **Revenue Metrics:** Total revenue, MRR, ARR, revenue trend chart
- **Collection Metrics:** Success rate, overdue rate, collection attempts
- **Subscription Distribution:** Tier breakdown (pie chart)

#### Audit Logs (`/admin/audit-logs`)
- **Searchable:** By action, admin user, target user, resource type
- **Filters:** Date range, action type, resource
- **Details:** All admin actions with before/after changes
- **Export:** Audit trail for compliance

#### System Alerts (`/admin/alerts`)
- **Severity Filtering:** Critical, high, medium, low, info
- **Status Management:** Active, acknowledged, investigating, resolved
- **Actions:** Acknowledge, resolve, ignore alerts
- **Auto-creation:** From Sentry errors, payment failures, API issues

#### Support Tools (`/admin/support`)
- **User Lookup:** Fast search by email/name/ID
- **Payment Override:** Manually change invoice status with audit trail
- **Recent Activity:** Quick view of user's invoices and activity

### 3. Admin API Endpoints

All admin API endpoints are protected by `requireAdmin()` and permission checks.

#### User Management
```
GET    /api/admin/users                - List all users with filters
GET    /api/admin/users/[userId]       - Get user details
PATCH  /api/admin/users/[userId]       - Update user
```

#### Payment Tracking
```
GET    /api/admin/payments              - Payment metrics and tracking
```

#### Analytics
```
GET    /api/admin/analytics             - Business analytics data
```

#### Audit Logs
```
GET    /api/admin/audit-logs            - View audit logs with filters
```

#### System Alerts
```
GET    /api/admin/alerts                - Get system alerts
POST   /api/admin/alerts                - Create manual alert
PATCH  /api/admin/alerts/[alertId]      - Update alert status
```

#### Support Tools
```
POST   /api/admin/support/user-lookup       - Search for user
POST   /api/admin/support/payment-override  - Override payment status
```

### 4. Audit Logging System

**Location:** `/middleware/adminAuth.ts` - `createAdminAuditLog()`

**Automatic Logging:**
All admin actions are automatically logged with:
- Admin user ID and email
- Action performed
- Target resource and user
- Before/after changes
- Reason (for critical actions)
- IP address and user agent
- Timestamp

**Example Audit Log:**
```typescript
{
  action: 'payment_status_overridden',
  adminUserId: 'admin_123',
  adminEmail: 'admin@recoup.com',
  targetUserId: 'user_456',
  targetResource: 'invoice',
  targetResourceId: 'inv_789',
  changes: [
    { field: 'status', oldValue: 'overdue', newValue: 'paid' }
  ],
  reason: 'Customer provided proof of payment',
  ipAddress: '192.168.1.1',
  timestamp: '2025-11-18T10:30:00Z'
}
```

### 5. Alerting System

**Location:** `/services/alertingService.ts`

**Alert Types:**
- `system_error` - Sentry errors, system failures
- `payment_failure` - Stripe payment issues
- `api_failure` - Third-party API failures (Twilio, SendGrid, etc.)
- `rate_limit` - Rate limit breaches
- `security` - Security events, suspicious activity
- `performance` - Performance degradation
- `integration` - Integration errors

**Alert Severities:**
- `critical` - Immediate action required, admins notified
- `high` - Important, should be addressed soon
- `medium` - Moderate importance
- `low` - Low priority
- `info` - Informational

**Creating Alerts:**
```typescript
import { createSystemAlert } from '@/services/alertingService';

await createSystemAlert({
  severity: 'critical',
  type: 'payment_failure',
  title: 'Stripe Payment Gateway Down',
  message: 'Unable to process payments',
  source: 'stripe',
  notifyAdmins: true,
});
```

**Auto-Resolution:**
Stale alerts (>7 days) are automatically resolved by the system.

### 6. Sentry Integration

**Location:** `/services/sentryMonitoringService.ts`

**Features:**
- Automatic error tracking and alerting
- Performance monitoring
- User context tracking
- Breadcrumb trails
- Custom error categorization

**Usage:**
```typescript
import { trackCriticalError, trackPaymentError } from '@/services/sentryMonitoringService';

// Track critical error
try {
  // risky operation
} catch (error) {
  trackCriticalError(error, { context: 'invoice_creation' });
}

// Track payment error
trackPaymentError(error, invoiceId, userId, { amount: 100 });
```

## Database Schema

### Admin Audit Logs Collection
```typescript
interface AdminAuditLog {
  auditLogId: string;
  action: string;
  actionType: 'create' | 'read' | 'update' | 'delete' | 'override' | 'export';
  adminUserId: string;
  adminEmail: string;
  targetUserId?: string;
  targetResource?: string;
  changes?: Array<{ field: string; oldValue: any; newValue: any }>;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  createdAt: Date;
}
```

### System Alerts Collection
```typescript
interface SystemAlert {
  alertId: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  type: 'system_error' | 'payment_failure' | 'api_failure' | 'rate_limit' | 'security' | 'performance' | 'integration';
  title: string;
  message: string;
  source: 'sentry' | 'stripe' | 'twilio' | 'sendgrid' | 'firebase' | 'system' | 'manual';
  status: 'active' | 'acknowledged' | 'investigating' | 'resolved' | 'ignored';
  affectedUsers?: string[];
  affectedInvoices?: string[];
  notificationSent: boolean;
  occurrenceCount: number;
  createdAt: Timestamp;
  resolvedAt?: Timestamp;
}
```

## Security Considerations

1. **Admin Access Control**
   - All admin routes protected by `requireAdmin()` middleware
   - Permission checks on every sensitive action
   - Audit logs for all admin activities

2. **Sensitive Data**
   - No passwords or API keys exposed in admin interface
   - Bank details remain encrypted
   - PII only visible to authorized admins

3. **Rate Limiting**
   - Admin API endpoints use same rate limiting as user endpoints
   - Prevents abuse even from admin accounts

4. **Session Security**
   - Uses Clerk authentication
   - Automatic session expiry
   - No persistent admin sessions

## Production Deployment

### Environment Variables
Ensure these are set in production:
```bash
NODE_ENV=production
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
FIREBASE_ADMIN_SDK_KEY=your-firebase-key
CLERK_SECRET_KEY=your-clerk-secret
```

### Initial Setup

1. **Create Admin Users:**
```typescript
// Run in Firebase console or via script
const adminUsers = [
  { userId: 'user_1', email: 'admin@recoup.com', role: 'super_admin' },
  { userId: 'user_2', email: 'support@recoup.com', role: 'support_admin' },
];

for (const admin of adminUsers) {
  await db.collection('users').doc(admin.userId).update({
    isAdmin: true,
    adminRole: admin.role,
  });
}
```

2. **Test Admin Access:**
   - Navigate to `/admin`
   - Verify authentication redirect works
   - Confirm all dashboard pages load
   - Test user search and filters

3. **Configure Alerts:**
   - Set up Sentry error tracking
   - Configure notification channels (email/Slack)
   - Test alert creation and resolution

### Monitoring Checklist

- [ ] Admin dashboard loads without errors
- [ ] All API endpoints return data
- [ ] Audit logs are being created
- [ ] System alerts are working
- [ ] Sentry integration is active
- [ ] Permission checks are enforced
- [ ] Search and filters work correctly

## Maintenance

### Daily Tasks
- Check critical alerts in `/admin/alerts`
- Review payment failures in `/admin/payments`
- Monitor user growth in `/admin/analytics`

### Weekly Tasks
- Review audit logs for suspicious activity
- Analyze user trends and churn
- Check system performance metrics

### Monthly Tasks
- Export audit logs for compliance
- Review and archive resolved alerts
- Analyze revenue and subscription metrics

## Support

For issues or questions:
- Check Sentry for error details
- Review audit logs for admin actions
- Contact development team with alert IDs or error codes

## Future Enhancements

**Planned Features:**
- [ ] Email notifications for critical alerts
- [ ] Slack integration for real-time alerts
- [ ] CSV export for all data tables
- [ ] Advanced filtering and saved searches
- [ ] Scheduled reports (daily/weekly digests)
- [ ] Real-time dashboard updates (WebSocket)
- [ ] Custom dashboards per admin role
- [ ] Bulk user operations
- [ ] Advanced analytics (cohort analysis, LTV)
- [ ] Integration with customer support tools (Intercom, Zendesk)

**Sentry API Integration:**
- [ ] Pull error rates directly from Sentry
- [ ] Display top errors in dashboard
- [ ] Link alerts to Sentry issues
- [ ] Show error trends over time

**Notification Channels:**
- [ ] Email via SendGrid
- [ ] Slack via webhook
- [ ] SMS for critical alerts (Twilio)
- [ ] Push notifications
