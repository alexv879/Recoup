import sgMail from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn('SENDGRID_API_KEY is not set');
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@recoup.app';

interface WelcomeEmailData {
  name: string;
  businessName: string;
}

export async function sendWelcomeEmail(
  to: string,
  data: WelcomeEmailData
): Promise<void> {
  try {
    const msg = {
      to,
      from: SENDGRID_FROM_EMAIL,
      subject: `Welcome to Recoup, ${data.name}! 🎉`,
      html: generateWelcomeEmailHTML(data),
      text: generateWelcomeEmailText(data),
    };

    await sgMail.send(msg);
    console.log(`Welcome email sent to ${to}`);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
}

function generateWelcomeEmailHTML(data: WelcomeEmailData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Recoup</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f9fafb;
    }
    .container {
      background-color: #ffffff;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 16px;
    }
    h1 {
      color: #111827;
      font-size: 28px;
      margin: 0 0 16px 0;
    }
    .greeting {
      color: #6b7280;
      font-size: 16px;
      margin-bottom: 30px;
    }
    .card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      padding: 30px;
      color: white;
      margin: 30px 0;
    }
    .card h2 {
      margin: 0 0 16px 0;
      font-size: 22px;
    }
    .card p {
      margin: 0;
      opacity: 0.95;
      line-height: 1.7;
    }
    .steps {
      margin: 30px 0;
    }
    .step {
      display: flex;
      align-items: start;
      margin-bottom: 24px;
      padding: 20px;
      background-color: #f9fafb;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
    .step-number {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      flex-shrink: 0;
      margin-right: 16px;
    }
    .step-content h3 {
      margin: 0 0 8px 0;
      color: #111827;
      font-size: 16px;
    }
    .step-content p {
      margin: 0;
      color: #6b7280;
      font-size: 14px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .tips {
      background-color: #fef3c7;
      border: 1px solid #fbbf24;
      border-radius: 8px;
      padding: 20px;
      margin: 30px 0;
    }
    .tips h3 {
      color: #92400e;
      margin: 0 0 12px 0;
      font-size: 16px;
      display: flex;
      align-items: center;
    }
    .tips h3::before {
      content: "💡";
      margin-right: 8px;
      font-size: 20px;
    }
    .tips p {
      color: #78350f;
      margin: 0;
      font-size: 14px;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 30px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      body {
        padding: 10px;
      }
      .container {
        padding: 24px;
      }
      h1 {
        font-size: 24px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">R</div>
      <h1>Welcome to Recoup! 🎉</h1>
      <p class="greeting">Hi ${data.name}, we're thrilled to have ${data.businessName} on board!</p>
    </div>

    <div class="card">
      <h2>You're all set to start getting paid faster</h2>
      <p>
        Recoup helps freelancers and small businesses like yours get paid on time, every time.
        We'll handle the reminders, track your invoices, and help you recover late payments automatically.
      </p>
    </div>

    <div class="steps">
      <h2 style="color: #111827; margin-bottom: 20px;">Get Started in 3 Easy Steps:</h2>

      <div class="step">
        <div class="step-number">1</div>
        <div class="step-content">
          <h3>Create Your First Invoice</h3>
          <p>Use our simple invoice builder to create professional invoices in minutes. You can even use voice input!</p>
        </div>
      </div>

      <div class="step">
        <div class="step-number">2</div>
        <div class="step-content">
          <h3>Enable Automatic Reminders</h3>
          <p>Set it and forget it. We'll automatically send friendly reminders to your clients when payments are due.</p>
        </div>
      </div>

      <div class="step">
        <div class="step-number">3</div>
        <div class="step-content">
          <h3>Track Everything in Your Dashboard</h3>
          <p>See all your invoices, payments, and cash flow predictions in one beautiful dashboard.</p>
        </div>
      </div>
    </div>

    <div style="text-align: center;">
      <a href="https://recoup.app/dashboard" class="cta-button">Go to Your Dashboard →</a>
    </div>

    <div class="tips">
      <h3>Pro Tip</h3>
      <p>
        Enable Collections Mode to automatically escalate overdue invoices. Our smart system will handle the entire
        payment recovery process, so you can focus on your work instead of chasing payments.
      </p>
    </div>

    <div style="margin-top: 30px; color: #6b7280; font-size: 14px;">
      <p><strong>Need help getting started?</strong></p>
      <ul style="line-height: 1.8;">
        <li>Check out our <a href="https://recoup.app/help" style="color: #667eea; text-decoration: none;">Help Center</a></li>
        <li>Watch our <a href="https://recoup.app/help/getting-started" style="color: #667eea; text-decoration: none;">Getting Started Video</a></li>
        <li>Join our <a href="https://recoup.app/community" style="color: #667eea; text-decoration: none;">Community Forum</a></li>
        <li>Contact us at <a href="mailto:support@recoup.app" style="color: #667eea; text-decoration: none;">support@recoup.app</a></li>
      </ul>
    </div>

    <div class="footer">
      <p>
        <strong>Recoup</strong><br>
        Get paid faster, the smart way<br>
        <a href="https://recoup.app">recoup.app</a>
      </p>
      <p style="margin-top: 16px; font-size: 12px;">
        You're receiving this email because you just signed up for Recoup.<br>
        <a href="https://recoup.app/settings/notifications">Manage email preferences</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateWelcomeEmailText(data: WelcomeEmailData): string {
  return `
Welcome to Recoup! 🎉

Hi ${data.name}, we're thrilled to have ${data.businessName} on board!

You're all set to start getting paid faster. Recoup helps freelancers and small businesses like yours get paid on time, every time. We'll handle the reminders, track your invoices, and help you recover late payments automatically.

GET STARTED IN 3 EASY STEPS:

1. Create Your First Invoice
   Use our simple invoice builder to create professional invoices in minutes. You can even use voice input!

2. Enable Automatic Reminders
   Set it and forget it. We'll automatically send friendly reminders to your clients when payments are due.

3. Track Everything in Your Dashboard
   See all your invoices, payments, and cash flow predictions in one beautiful dashboard.

Go to your dashboard: https://recoup.app/dashboard

💡 PRO TIP
Enable Collections Mode to automatically escalate overdue invoices. Our smart system will handle the entire payment recovery process, so you can focus on your work instead of chasing payments.

NEED HELP GETTING STARTED?
- Help Center: https://recoup.app/help
- Getting Started Video: https://recoup.app/help/getting-started
- Community Forum: https://recoup.app/community
- Email us: support@recoup.app

---
Recoup - Get paid faster, the smart way
https://recoup.app

You're receiving this email because you just signed up for Recoup.
Manage email preferences: https://recoup.app/settings/notifications
  `.trim();
}
