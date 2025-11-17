/**
 * Email Template: Free Tier → Starter Migration
 * 
 * Purpose: Notify free tier users about new Starter plan with 30-day trial
 * 
 * Based on: pricing-implementation-framework.md §4
 * 
 * Phase 2 Task 8
 */

export interface FreeTierMigrationEmailData {
    name: string;
    email: string;
    userId: string;
}

export function getFreeTierMigrationEmailSubject(): string {
    return '🎉 Unlock More Collections with Your Free Trial';
}

export function getFreeTierMigrationEmailHtml(data: FreeTierMigrationEmailData): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Starter Plan Trial</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                🎉 Great News!
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
                We've redesigned our pricing to give you even more value! Your free account has been upgraded to our new <strong style="color: #3B82F6;">Starter plan</strong>, and we're giving you a <strong>30-day free trial</strong> to try all the features.
              </p>

              <!-- What's Included -->
              <div style="background-color: #f1f5f9; border-left: 4px solid #3B82F6; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <h2 style="margin: 0 0 15px; color: #1e293b; font-size: 20px; font-weight: 600;">
                  ✨ What's Included in Starter
                </h2>
                <ul style="margin: 0; padding-left: 20px; color: #475569;">
                  <li style="margin-bottom: 10px;"><strong>10 collections per month</strong> (upgrade anytime for more)</li>
                  <li style="margin-bottom: 10px;"><strong>Email reminders</strong> for overdue invoices</li>
                  <li style="margin-bottom: 10px;"><strong>Invoice management</strong> & tracking</li>
                  <li style="margin-bottom: 10px;"><strong>Payment claims</strong> system</li>
                  <li style="margin-bottom: 10px;"><strong>Email support</strong> (48-hour response)</li>
                </ul>
              </div>

              <p style="margin: 20px 0; color: #1e293b; font-size: 16px; line-height: 1.6;">
                After your trial, Starter is just <strong style="color: #10b981; font-size: 20px;">£19/month</strong> (or save 20% with annual billing at £182/year).
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="https://relay.app/dashboard?welcome_trial=true" style="display: inline-block; background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 18px; font-weight: 600; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);">
                      Start Your 30-Day Trial
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0; color: #64748b; font-size: 14px; line-height: 1.6; text-align: center;">
                No credit card required. Cancel anytime during trial.
              </p>

              <!-- Upgrade Option -->
              <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0 0 15px; color: #475569; font-size: 14px;">
                  <strong>Need more than 10 collections?</strong> Check out our <a href="https://relay.app/pricing" style="color: #3B82F6; text-decoration: none;">Growth plan (50 collections for £39/mo)</a> or <a href="https://relay.app/pricing" style="color: #3B82F6; text-decoration: none;">Pro plan (unlimited for £75/mo)</a>.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8fafc; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; color: #64748b; font-size: 14px;">
                Have questions? <a href="mailto:support@relay.app" style="color: #3B82F6; text-decoration: none;">Contact us</a>
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

export function getFreeTierMigrationEmailText(data: FreeTierMigrationEmailData): string {
    return `
Hi ${data.name},

Great news! We've redesigned our pricing to give you even more value. Your free account has been upgraded to our new Starter plan, and we're giving you a 30-day free trial to try all the features.

WHAT'S INCLUDED IN STARTER:
• 10 collections per month (upgrade anytime for more)
• Email reminders for overdue invoices
• Invoice management & tracking
• Payment claims system
• Email support (48-hour response)

After your trial, Starter is just £19/month (or save 20% with annual billing at £182/year).

START YOUR 30-DAY TRIAL:
https://relay.app/dashboard?welcome_trial=true

No credit card required. Cancel anytime during trial.

NEED MORE THAN 10 COLLECTIONS?
Check out our Growth plan (50 collections for £39/mo) or Pro plan (unlimited for £75/mo):
https://relay.app/pricing

Have questions? Contact us at support@relay.app

Best regards,
The Relay Team
  `.trim();
}
