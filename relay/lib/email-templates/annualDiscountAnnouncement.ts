/**
 * Email Template: Annual Discount Announcement
 * 
 * Purpose: Encourage monthly users to switch to annual billing (20% savings)
 * 
 * Trigger: Send to monthly users after 2-3 months of active subscription
 * 
 * Based on: pricing-implementation-framework.md §5
 * 
 * Phase 2 Task 8
 */

export interface AnnualDiscountEmailData {
    name: string;
    email: string;
    userId: string;
    currentTier: 'starter' | 'growth' | 'pro';
    monthlyPrice: number;
    annualPrice: number;
    annualSavings: number;
}

export function getAnnualDiscountEmailSubject(data: AnnualDiscountEmailData): string {
    return `💰 Save £${data.annualSavings}/year with Annual Billing`;
}

export function getAnnualDiscountEmailHtml(data: AnnualDiscountEmailData): string {
    const monthsOfSavings = Math.round((data.annualSavings / data.monthlyPrice) * 10) / 10;
    const tierName = data.currentTier.charAt(0).toUpperCase() + data.currentTier.slice(1);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Annual Billing Savings</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #10B981 0%, #059669 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">
                💰 Save ${Math.round((data.annualSavings / (data.monthlyPrice * 12)) * 100)}% Today
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
                We've noticed you're loving Relay Collections! As a valued customer, we wanted to share an easy way to save money while continuing to use all the features you rely on.
              </p>

              <!-- Savings Highlight -->
              <div style="background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%); border: 3px solid #10B981; padding: 30px; margin: 30px 0; border-radius: 12px; text-align: center;">
                <h2 style="margin: 0 0 15px; color: #065F46; font-size: 24px; font-weight: 700;">
                  Switch to Annual Billing & Save
                </h2>
                <p style="margin: 0; color: #047857; font-size: 48px; font-weight: 700; line-height: 1.2;">
                  £${data.annualSavings}
                </p>
                <p style="margin: 10px 0 0; color: #065F46; font-size: 18px;">
                  per year (that's ${monthsOfSavings} months free!)
                </p>
              </div>

              <!-- Comparison Table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0; border: 1px solid #e2e8f0; border-radius: 8px;">
                <tr style="background-color: #f8fafc;">
                  <th style="padding: 15px; text-align: left; color: #64748b; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e2e8f0;">
                    Billing Cycle
                  </th>
                  <th style="padding: 15px; text-align: right; color: #64748b; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e2e8f0;">
                    Total Cost/Year
                  </th>
                  <th style="padding: 15px; text-align: right; color: #64748b; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e2e8f0;">
                    You Save
                  </th>
                </tr>
                <tr>
                  <td style="padding: 15px; color: #475569; font-size: 16px;">
                    Monthly (Current)
                  </td>
                  <td style="padding: 15px; text-align: right; color: #475569; font-size: 16px;">
                    £${data.monthlyPrice * 12}
                  </td>
                  <td style="padding: 15px; text-align: right; color: #64748b; font-size: 16px;">
                    —
                  </td>
                </tr>
                <tr style="background-color: #f0fdf4;">
                  <td style="padding: 15px; color: #065F46; font-size: 16px; font-weight: 600;">
                    Annual (Recommended)
                  </td>
                  <td style="padding: 15px; text-align: right; color: #065F46; font-size: 16px; font-weight: 600;">
                    £${data.annualPrice}
                  </td>
                  <td style="padding: 15px; text-align: right; color: #10B981; font-size: 18px; font-weight: 700;">
                    £${data.annualSavings}
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0; color: #1e293b; font-size: 16px; line-height: 1.6;">
                By switching to annual billing for your <strong>${tierName} plan</strong>, you'll save <strong>20%</strong> and lock in your rate for a full year. No surprises, no price increases.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="https://relay.app/settings/billing?switch_annual=true" style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 18px; font-weight: 600; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);">
                    Switch to Annual Billing
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0; color: #64748b; font-size: 14px; line-height: 1.6; text-align: center;">
                Change takes effect on your next billing date. Cancel anytime.
              </p>

              <!-- Benefits -->
              <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e2e8f0;">
                <h3 style="margin: 0 0 15px; color: #1e293b; font-size: 18px; font-weight: 600;">
                  ✅ Why Our Customers Love Annual Billing
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.8;">
                  <li><strong>Save money:</strong> 20% discount = £${data.annualSavings} in your pocket</li>
                  <li><strong>Locked-in pricing:</strong> No mid-year price increases</li>
                  <li><strong>Set it and forget it:</strong> No monthly billing hassles</li>
                  <li><strong>Budget better:</strong> One payment covers your whole year</li>
                </ul>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8fafc; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; color: #64748b; font-size: 14px;">
                Questions? <a href="mailto:support@relay.app" style="color: #10B981; text-decoration: none;">Contact us</a>
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

export function getAnnualDiscountEmailText(data: AnnualDiscountEmailData): string {
    const monthsOfSavings = Math.round((data.annualSavings / data.monthlyPrice) * 10) / 10;
    const tierName = data.currentTier.charAt(0).toUpperCase() + data.currentTier.slice(1);
    const discountPercent = Math.round((data.annualSavings / (data.monthlyPrice * 12)) * 100);

    return `
Hi ${data.name},

We've noticed you're loving Relay Collections! As a valued customer, we wanted to share an easy way to save money while continuing to use all the features you rely on.

💰 SWITCH TO ANNUAL BILLING & SAVE £${data.annualSavings} PER YEAR
That's ${monthsOfSavings} months free!

COMPARISON:
• Monthly (Current): £${data.monthlyPrice * 12}/year
• Annual (Recommended): £${data.annualPrice}/year
• You Save: £${data.annualSavings} (${discountPercent}% discount)

By switching to annual billing for your ${tierName} plan, you'll save 20% and lock in your rate for a full year. No surprises, no price increases.

SWITCH TO ANNUAL BILLING:
https://relay.app/settings/billing?switch_annual=true

Change takes effect on your next billing date. Cancel anytime.

WHY OUR CUSTOMERS LOVE ANNUAL BILLING:
✅ Save money: 20% discount = £${data.annualSavings} in your pocket
✅ Locked-in pricing: No mid-year price increases
✅ Set it and forget it: No monthly billing hassles
✅ Budget better: One payment covers your whole year

Questions? Contact us at support@relay.app

Best regards,
The Relay Team
  `.trim();
}
