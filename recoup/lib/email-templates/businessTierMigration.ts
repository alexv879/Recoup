/**
 * Email Template: Business Tier → Pro Migration
 * 
 * Purpose: Notify business tier users about upgrade to Pro plan
 * 
 * Benefits messaging:
 * - More features (unlimited collections, AI analytics, API access)
 * - Better support (2-hour response, dedicated account manager)
 * - Price lock for first 3 months at old Business rate
 * 
 * Based on: pricing-implementation-framework.md §4
 * 
 * Phase 2 Task 8
 */

export interface BusinessTierMigrationEmailData {
    name: string;
    email: string;
    userId: string;
    currentPrice?: number; // Old Business tier price
}

export function getBusinessTierMigrationEmailSubject(): string {
    return "🚀 You've Been Upgraded to Pro - More Features, Same Price(3 Months)";
}

export function getBusinessTierMigrationEmailHtml(data: BusinessTierMigrationEmailData): string {
    const currentPrice = data.currentPrice || 49; // Default Business price

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pro Plan Upgrade</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">
                🚀 Welcome to Pro!
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #1e293b; font-size: 16px; line-height: 1.6;">
                Hi ${data.name},
              </p>

              <p style="margin: 0 0 20px; color: #1e293b; font-size: 16px; line-height: 1.6;">
                Great news! As part of our new pricing structure, we've automatically upgraded your account from <strong>Business</strong> to our new <strong style="color: #8B5CF6;">Pro plan</strong> at <strong>no extra cost for the first 3 months</strong>.
              </p>

              <!-- Special Offer Badge -->
              <div style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border: 2px solid #F59E0B; padding: 20px; margin: 30px 0; border-radius: 12px; text-align: center;">
                <h3 style="margin: 0 0 10px; color: #92400E; font-size: 22px; font-weight: 700;">
                  🎁 Special Offer: Price Lock
                </h3>
                <p style="margin: 0; color: #78350F; font-size: 16px; line-height: 1.6;">
                  Keep paying <strong style="font-size: 20px;">£${currentPrice}/month</strong> for the next 3 months<br/>
                  (Regular Pro price: £75/month)
                </p>
              </div>

              <!-- What's New -->
              <div style="background-color: #f1f5f9; border-left: 4px solid #8B5CF6; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <h2 style="margin: 0 0 15px; color: #1e293b; font-size: 20px; font-weight: 600;">
                  ✨ New Pro Features You'll Love
                </h2>
                <ul style="margin: 0; padding-left: 20px; color: #475569;">
                  <li style="margin-bottom: 10px;"><strong>Unlimited collections</strong> - no monthly caps</li>
                  <li style="margin-bottom: 10px;"><strong>Unlimited team members</strong> - scale as you grow</li>
                  <li style="margin-bottom: 10px;"><strong>AI-powered recovery strategies</strong> - boost recovery rates</li>
                  <li style="margin-bottom: 10px;"><strong>Phone call collections</strong> - full omnichannel support</li>
                  <li style="margin-bottom: 10px;"><strong>Custom escalation workflows</strong> - tailor to your needs</li>
                  <li style="margin-bottom: 10px;"><strong>API access & integrations</strong> - connect your tools</li>
                  <li style="margin-bottom: 10px;"><strong>Dedicated account manager</strong> - personalized support</li>
                  <li style="margin-bottom: 10px;"><strong>Priority support (2-hour response)</strong> - get help fast</li>
                </ul>
              </div>

              <p style="margin: 20px 0; color: #1e293b; font-size: 16px; line-height: 1.6;">
                Your upgrade is <strong>effective immediately</strong> - all Pro features are now active in your account. No action needed from you.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="https://relay.app/dashboard" style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 18px; font-weight: 600; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);">
                      Explore Your Pro Features
                    </a>
                  </td>
                </tr>
              </table>

              <!-- What Happens After 3 Months -->
              <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e2e8f0;">
                <h3 style="margin: 0 0 15px; color: #1e293b; font-size: 18px; font-weight: 600;">
                  📅 What Happens After 3 Months?
                </h3>
                <p style="margin: 0 0 15px; color: #475569; font-size: 14px; line-height: 1.6;">
                  After your 3-month price lock, Pro renews at £75/month (or £720/year with 20% annual discount). We'll send you a reminder 2 weeks before the transition.
                </p>
                <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.6;">
                  <strong>Want to save more?</strong> Switch to annual billing and save £180/year: <a href="https://relay.app/settings/billing" style="color: #8B5CF6; text-decoration: none;">Update billing settings</a>
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8fafc; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; color: #64748b; font-size: 14px;">
                Questions about your upgrade? <a href="mailto:support@relay.app" style="color: #8B5CF6; text-decoration: none;">Contact your account manager</a>
              </p>
              <p style="margin: 10px 0 0; color: #94a3b8; font-size: 12px;">
                Relay Collections | London, UK
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export function getBusinessTierMigrationEmailText(data: BusinessTierMigrationEmailData): string {
    const currentPrice = data.currentPrice || 49;

    return `
Hi ${data.name},

Great news! As part of our new pricing structure, we've automatically upgraded your account from Business to our new Pro plan at no extra cost for the first 3 months.

🎁 SPECIAL OFFER: PRICE LOCK
Keep paying £${currentPrice}/month for the next 3 months
(Regular Pro price: £75/month)

NEW PRO FEATURES YOU'LL LOVE:
• Unlimited collections - no monthly caps
• Unlimited team members - scale as you grow
• AI-powered recovery strategies - boost recovery rates
• Phone call collections - full omnichannel support
• Custom escalation workflows - tailor to your needs
• API access & integrations - connect your tools
• Dedicated account manager - personalized support
• Priority support (2-hour response) - get help fast

Your upgrade is effective immediately - all Pro features are now active in your account. No action needed from you.

EXPLORE YOUR PRO FEATURES:
https://relay.app/dashboard

WHAT HAPPENS AFTER 3 MONTHS?
After your 3-month price lock, Pro renews at £75/month (or £720/year with 20% annual discount). We'll send you a reminder 2 weeks before the transition.

Want to save more? Switch to annual billing and save £180/year:
https://relay.app/settings/billing

Questions about your upgrade? Contact your account manager at support@relay.app

Best regards,
The Relay Team
  `.trim();
}
