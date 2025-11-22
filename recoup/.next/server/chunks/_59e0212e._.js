module.exports=[355009,e=>e.a(async(t,a)=>{try{var i=e.i(598941),r=e.i(169907),o=e.i(340688),n=t([i]);async function l(e,t){try{await (0,i.sendEmail)({to:e,from:{email:process.env.SENDGRID_FROM_EMAIL||"noreply@relay.app",name:"Alex from Relay"},subject:"Quick guide: Create your first invoice in 2 minutes",html:`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Hi ${t},</h2>

          <p>I noticed you haven't created an invoice yet. No worries - it's super quick!</p>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 24px 0;">
            <h3 style="margin-top: 0;">3 Steps to Your First Invoice:</h3>
            <ol style="padding-left: 20px; line-height: 1.8;">
              <li><strong>Go to Dashboard</strong> → Click "Create Invoice"</li>
              <li><strong>Fill in the details</strong> (client name, amount, due date)</li>
              <li><strong>Click Send</strong> → We'll email it to your client</li>
            </ol>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/invoices/new"
               style="display: inline-block; background: linear-gradient(to right, #7c3aed, #4f46e5); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Create Your First Invoice
            </a>
          </div>

          <p><strong>Pro tip:</strong> Enable automated collections to chase late payments automatically. You'll never have to send awkward reminder emails again.</p>

          <p>Need help? Reply to this email.</p>

          <p>Best,<br>Alex</p>
        </div>
      `,text:`Hi ${t},

I noticed you haven't created an invoice yet. No worries - it's super quick!

3 Steps to Your First Invoice:

1. Go to Dashboard → Click "Create Invoice"
2. Fill in the details (client name, amount, due date)
3. Click Send → We'll email it to your client

👉 Create your first invoice: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/invoices/new

Pro tip: Enable automated collections to chase late payments automatically. You'll never have to send awkward reminder emails again.

Need help? Reply to this email.

Best,
Alex
`}),(0,o.trackEvent)("email_sent",{email_type:"tutorial",day:1}),(0,r.logInfo)("Tutorial email sent",{userEmail:e})}catch(e){throw(0,r.logError)("Failed to send tutorial email",e),e}}async function s(e,t){try{await (0,i.sendEmail)({to:e,from:{email:process.env.SENDGRID_FROM_EMAIL||"noreply@relay.app",name:"Alex from Relay"},subject:"Freelancers using Relay recover payments 40% faster",html:`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Hi ${t},</h2>

          <p>You're not alone in the late payment struggle. Here's what's happening with other UK freelancers on Relay:</p>

          <div style="background: linear-gradient(to right, #eff6ff, #f3e8ff); padding: 24px; border-radius: 12px; margin: 24px 0;">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
              <div>
                <div style="font-size: 32px; font-weight: bold; color: #4f46e5;">\xa318,450</div>
                <div style="color: #6b7280; font-size: 14px;">recovered this week</div>
              </div>
              <div>
                <div style="font-size: 32px; font-weight: bold; color: #7c3aed;">40%</div>
                <div style="color: #6b7280; font-size: 14px;">faster payment</div>
              </div>
              <div>
                <div style="font-size: 32px; font-weight: bold; color: #ec4899;">89%</div>
                <div style="color: #6b7280; font-size: 14px;">recovery rate</div>
              </div>
              <div>
                <div style="font-size: 32px; font-weight: bold; color: #f59e0b;">\xa35,230</div>
                <div style="color: #6b7280; font-size: 14px;">avg recovered per user</div>
              </div>
            </div>
          </div>

          <div style="background: white; border-left: 4px solid #4f46e5; padding: 20px; margin: 24px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <p style="font-style: italic; color: #374151; margin: 0;">
              "I was owed \xa34,200 across 6 clients. Relay's automated reminders recovered all of it in 3 weeks. Game changer."
            </p>
            <p style="color: #6b7280; font-size: 14px; margin-top: 12px; margin-bottom: 0;">
              — Sarah M., Graphic Designer
            </p>
          </div>

          <p><strong>Ready to recover your late payments?</strong> Enable automated collections and let Relay chase for you.</p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/collections"
               style="display: inline-block; background: linear-gradient(to right, #7c3aed, #4f46e5); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Enable Collections Now
            </a>
          </div>

          <p>Best,<br>Alex</p>
        </div>
      `,text:`Hi ${t},

You're not alone in the late payment struggle. Here's what's happening with other UK freelancers on Relay:

💷 \xa318,450 recovered this week
⚡ 40% faster payment on average
📈 89% recovery rate
💰 \xa35,230 avg recovered per user

"I was owed \xa34,200 across 6 clients. Relay's automated reminders recovered all of it in 3 weeks. Game changer."
— Sarah M., Graphic Designer

Ready to recover your late payments? Enable automated collections:
${process.env.NEXT_PUBLIC_APP_URL}/dashboard/collections

Best,
Alex
`}),(0,o.trackEvent)("email_sent",{email_type:"social_proof",day:3}),(0,r.logInfo)("Social proof email sent",{userEmail:e})}catch(e){throw(0,r.logError)("Failed to send social proof email",e),e}}async function d(e,t){try{await (0,i.sendEmail)({to:e,from:{email:process.env.SENDGRID_FROM_EMAIL||"noreply@relay.app",name:"Alex from Relay"},subject:"The secret weapon: AI-powered payment recovery",html:`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Hi ${t},</h2>

          <p>Here's a secret: the best freelancers don't chase payments manually.</p>

          <p>They use Relay's <strong>Premium Collections</strong> to automate the annoying parts:</p>

          <div style="margin: 32px 0;">
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
              <div style="display: flex; align-items: start; gap: 16px;">
                <div style="font-size: 32px;">📱</div>
                <div>
                  <h3 style="margin: 0 0 8px 0; color: #111827;">SMS Reminders</h3>
                  <p style="margin: 0; color: #6b7280; font-size: 14px;">Text messages get 98% open rates (vs 20% email). Perfect for urgent chasing.</p>
                </div>
              </div>
            </div>

            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
              <div style="display: flex; align-items: start; gap: 16px;">
                <div style="font-size: 32px;">🤖</div>
                <div>
                  <h3 style="margin: 0 0 8px 0; color: #111827;">AI Voice Calls</h3>
                  <p style="margin: 0; color: #6b7280; font-size: 14px;">Our AI calls your client, politely requests payment, and even takes card details over the phone.</p>
                </div>
              </div>
            </div>

            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
              <div style="display: flex; align-items: start; gap: 16px;">
                <div style="font-size: 32px;">📮</div>
                <div>
                  <h3 style="margin: 0 0 8px 0; color: #111827;">Physical Letters</h3>
                  <p style="margin: 0; color: #6b7280; font-size: 14px;">For serious cases, we send legal Letter Before Action (LBA) - gets their attention fast.</p>
                </div>
              </div>
            </div>
          </div>

          <div style="background: linear-gradient(to right, #eff6ff, #f3e8ff); padding: 20px; border-radius: 8px; margin: 24px 0;">
            <p style="margin: 0 0 12px 0; font-weight: 600; color: #4f46e5;">📊 Pro Tier Results:</p>
            <ul style="margin: 0; padding-left: 20px; line-height: 1.8; color: #374151;">
              <li>92% recovery rate (vs 67% manual chasing)</li>
              <li>Average 18 days to payment (vs 35 days)</li>
              <li>Save 4+ hours per week on admin</li>
            </ul>
          </div>

          <p><strong>Try Pro for 14 days free</strong> - upgrade any time, cancel any time:</p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/pricing"
               style="display: inline-block; background: linear-gradient(to right, #7c3aed, #4f46e5); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
              View Pricing Plans
            </a>
          </div>

          <p>Questions? Reply to this email.</p>

          <p>Best,<br>Alex</p>
        </div>
      `,text:`Hi ${t},

Here's a secret: the best freelancers don't chase payments manually.

They use Relay's Premium Collections to automate the annoying parts:

📱 SMS Reminders - 98% open rate (vs 20% email)
🤖 AI Voice Calls - Our AI calls, requests payment, takes card details
📮 Physical Letters - Legal Letter Before Action for serious cases

📊 Pro Tier Results:
• 92% recovery rate (vs 67% manual)
• 18 days to payment average (vs 35 days)
• Save 4+ hours per week

Try Pro for 14 days free - upgrade any time, cancel any time:
${process.env.NEXT_PUBLIC_APP_URL}/pricing

Best,
Alex
`}),(0,o.trackEvent)("email_sent",{email_type:"feature_deepdive",day:7}),(0,r.logInfo)("Feature deep-dive email sent",{userEmail:e})}catch(e){throw(0,r.logError)("Failed to send feature deep-dive email",e),e}}async function c(e,t,a=0){let n=Math.round(.76*a),l=Math.round(.89*n),s=l-22;try{await (0,i.sendEmail)({to:e,from:{email:process.env.SENDGRID_FROM_EMAIL||"noreply@relay.app",name:"Alex from Relay"},subject:`${t}, here's how much money you're leaving on the table`,html:`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Hi ${t},</h2>

          <p>I did the math for you. Based on your invoicing activity:</p>

          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 32px; border-radius: 12px; margin: 24px 0; text-align: center;">
            <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">You could recover</div>
            <div style="font-size: 48px; font-weight: bold; margin-bottom: 16px;">\xa3${l.toLocaleString()}</div>
            <div style="font-size: 14px; opacity: 0.9;">in late payments this year with Pro</div>
          </div>

          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0;">
            <h3 style="margin: 0 0 16px 0; font-size: 16px;">The Breakdown:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Your total invoiced:</td>
                <td style="text-align: right; font-weight: 600;">\xa3${a.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Estimated late (76% avg):</td>
                <td style="text-align: right; font-weight: 600;">\xa3${n.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">With Pro recovery (89%):</td>
                <td style="text-align: right; font-weight: 600; color: #10b981;">+\xa3${l.toLocaleString()}</td>
              </tr>
              <tr style="border-top: 2px solid #e5e7eb;">
                <td style="padding: 12px 0; color: #6b7280;">Pro monthly cost:</td>
                <td style="text-align: right; font-weight: 600;">-\xa322</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #111827;">Your monthly ROI:</td>
                <td style="text-align: right; font-weight: 700; color: #10b981; font-size: 18px;">\xa3${s.toLocaleString()}</td>
              </tr>
            </table>
          </div>

          <p>That's a <strong>${Math.round(s/22*100)}x return</strong> on investment. No brainer, right?</p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/pricing"
               style="display: inline-block; background: linear-gradient(to right, #7c3aed, #4f46e5); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Upgrade to Pro (14-day free trial)
            </a>
          </div>

          <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>🏆 Founding Member Offer:</strong> \xa322/month forever (normally \xa345). Only 50 spots available.
            </p>
          </div>

          <p>Questions? Reply to this email.</p>

          <p>Best,<br>Alex</p>
        </div>
      `,text:`Hi ${t},

I did the math for you. Based on your invoicing activity:

You could recover \xa3${l.toLocaleString()} in late payments this year with Pro

The Breakdown:
• Your total invoiced: \xa3${a.toLocaleString()}
• Estimated late (76% avg): \xa3${n.toLocaleString()}
• With Pro recovery (89%): +\xa3${l.toLocaleString()}
• Pro monthly cost: -\xa322
• Your monthly ROI: \xa3${s.toLocaleString()}

That's a ${Math.round(s/22*100)}x return on investment.

Upgrade to Pro (14-day free trial):
${process.env.NEXT_PUBLIC_APP_URL}/pricing

🏆 Founding Member Offer: \xa322/month forever (normally \xa345). Only 50 spots.

Best,
Alex
`}),(0,o.trackEvent)("email_sent",{email_type:"upgrade_pitch",day:14,roi_calculated:s}),(0,r.logInfo)("Upgrade pitch email sent",{userEmail:e,roi:s})}catch(e){throw(0,r.logError)("Failed to send upgrade pitch email",e),e}}async function p(e,t){try{await (0,i.sendEmail)({to:e,from:{email:process.env.SENDGRID_FROM_EMAIL||"noreply@relay.app",name:"Alex from Relay"},subject:`${t}, we miss you!`,text:`Hi ${t},

I noticed you haven't logged in for a while. Everything okay?

If you're stuck or confused about anything, just reply to this email. I'm here to help.

Quick reminder of what Relay can do for you:
• Create professional invoices in 2 minutes
• Automatically chase late payments (so you don't have to)
• Track which invoices are paid/overdue

Login here: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard

Best,
Alex
`}),(0,o.trackEvent)("email_sent",{email_type:"re_engagement_inactive"}),(0,r.logInfo)("Inactive user re-engagement email sent",{userEmail:e})}catch(e){throw(0,r.logError)("Failed to send inactive user email",e),e}}async function u(e,t,a){try{await (0,i.sendEmail)({to:e,from:{email:process.env.SENDGRID_FROM_EMAIL||"noreply@relay.app",name:"Alex from Relay"},subject:"Did you forget to send your invoice?",html:`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Hi ${t},</h2>

          <p>I noticed you created an invoice earlier but haven't sent it yet.</p>

          <p><strong>Quick reminder:</strong> The sooner you send it, the sooner you get paid! 💷</p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/invoices/${a}"
               style="display: inline-block; background: linear-gradient(to right, #7c3aed, #4f46e5); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Send Invoice Now
            </a>
          </div>

          <p>Takes 10 seconds. Then you're done!</p>

          <p>Best,<br>Alex</p>
        </div>
      `,text:`Hi ${t},

I noticed you created an invoice earlier but haven't sent it yet.

Quick reminder: The sooner you send it, the sooner you get paid! 💷

Send it now: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/invoices/${a}

Takes 10 seconds. Then you're done!

Best,
Alex
`}),(0,o.trackEvent)("email_sent",{email_type:"re_engagement_invoice_not_sent",invoice_id:a}),(0,r.logInfo)("Invoice not sent re-engagement email sent",{userEmail:e,invoiceId:a})}catch(e){throw(0,r.logError)("Failed to send invoice not sent email",e),e}}async function m(e,t,a,n,l){try{await (0,i.sendEmail)({to:e,from:{email:process.env.SENDGRID_FROM_EMAIL||"noreply@relay.app",name:"Alex from Relay"},subject:`${t}, you've hit your ${a} tier limit`,html:`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Hi ${t},</h2>

          <p>You've used <strong>${n}/${l} collections</strong> this month on the ${a} tier.</p>

          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0;">
            <p style="margin: 0; color: #92400e;">
              <strong>⚠️ Heads up:</strong> Your next collection attempt will be blocked until you upgrade or wait until next month.
            </p>
          </div>

          <p><strong>Upgrade now</strong> to keep chasing those late payments:</p>

          <ul style="line-height: 1.8;">
            <li>Pro tier: 25 collections/month (\xa322/month)</li>
            <li>Business tier: Unlimited collections (\xa375/month)</li>
          </ul>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/pricing"
               style="display: inline-block; background: linear-gradient(to right, #7c3aed, #4f46e5); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Upgrade Now
            </a>
          </div>

          <p>Best,<br>Alex</p>
        </div>
      `,text:`Hi ${t},

You've used ${n}/${l} collections this month on the ${a} tier.

⚠️ Heads up: Your next collection attempt will be blocked until you upgrade or wait until next month.

Upgrade now to keep chasing those late payments:
• Pro tier: 25 collections/month (\xa322/month)
• Business tier: Unlimited collections (\xa375/month)

Upgrade: ${process.env.NEXT_PUBLIC_APP_URL}/pricing

Best,
Alex
`}),(0,o.trackEvent)("email_sent",{email_type:"quota_limit",current_tier:a,collections_used:n}),(0,r.logInfo)("Quota limit email sent",{userEmail:e,currentTier:a})}catch(e){throw(0,r.logError)("Failed to send quota limit email",e),e}}[i]=n.then?(await n)():n,e.s(["sendFeatureDeepDiveEmail",()=>d,"sendInactiveUserEmail",()=>p,"sendInvoiceNotSentEmail",()=>u,"sendQuotaLimitEmail",()=>m,"sendSocialProofEmail",()=>s,"sendTutorialEmail",()=>l,"sendUpgradePitchEmail",()=>c]),a()}catch(e){a(e)}},!1),822443,e=>e.a(async(t,a)=>{try{var i=e.i(89171),r=e.i(868253),o=e.i(155742),n=e.i(355009),l=e.i(169907),s=t([r,o,n]);async function d(e){let t=Date.now();try{let a=e.headers.get("x-cron-secret"),r=process.env.CRON_SECRET;if(!r)return(0,l.logError)("CRON_SECRET not configured",Error("Missing env var")),i.NextResponse.json({error:"Cron secret not configured"},{status:500});if(a!==r)return(0,l.logError)("Invalid cron secret",Error("Unauthorized cron access")),i.NextResponse.json({error:"Unauthorized"},{status:401});(0,l.logInfo)("Behavioral email cron job started");let o={day1_tutorial:0,day3_social_proof:0,day7_feature_deepdive:0,day14_upgrade_pitch:0,re_engagement_inactive:0,re_engagement_invoice_not_sent:0,quota_limit:0,errors:0};for(let e of(await c()))try{await (0,n.sendTutorialEmail)(e.email,e.name||"there"),await v(e.id,"tutorial",1),o.day1_tutorial++}catch(e){(0,l.logError)("Failed to send Day 1 tutorial email",e),o.errors++}for(let e of(await p()))try{await (0,n.sendSocialProofEmail)(e.email,e.name||"there"),await v(e.id,"social_proof",3),o.day3_social_proof++}catch(e){(0,l.logError)("Failed to send Day 3 social proof email",e),o.errors++}for(let e of(await u()))try{await (0,n.sendFeatureDeepDiveEmail)(e.email,e.name||"there"),await v(e.id,"feature_deepdive",7),o.day7_feature_deepdive++}catch(e){(0,l.logError)("Failed to send Day 7 feature deep-dive email",e),o.errors++}for(let e of(await m()))try{let t=e.totalAmountInvoiced||0;await (0,n.sendUpgradePitchEmail)(e.email,e.name||"there",t),await v(e.id,"upgrade_pitch",14),o.day14_upgrade_pitch++}catch(e){(0,l.logError)("Failed to send Day 14 upgrade pitch email",e),o.errors++}for(let e of(await g()))try{await (0,n.sendInactiveUserEmail)(e.email,e.name||"there"),await v(e.id,"re_engagement_inactive",0),o.re_engagement_inactive++}catch(e){(0,l.logError)("Failed to send inactive user email",e),o.errors++}for(let e of(await h()))try{let t=e.user;await (0,n.sendInvoiceNotSentEmail)(t.email,t.name||"there",e.id),await f(e.id),o.re_engagement_invoice_not_sent++}catch(e){(0,l.logError)("Failed to send invoice not sent email",e),o.errors++}for(let e of(await y()))try{await (0,n.sendQuotaLimitEmail)(e.email,e.name||"there",e.subscriptionTier||"free",e.collectionsUsedThisMonth||0,e.collectionsLimitPerMonth||1),await v(e.id,"quota_limit",0),o.quota_limit++}catch(e){(0,l.logError)("Failed to send quota limit email",e),o.errors++}let s=Date.now()-t;return(0,l.logInfo)("Behavioral email cron job completed",{duration:s,results:o}),i.NextResponse.json({success:!0,message:"Behavioral emails sent",results:o,duration:s,timestamp:new Date().toISOString()})}catch(a){let e=Date.now()-t;return(0,l.logError)("Behavioral email cron job failed",a),i.NextResponse.json({success:!1,error:a.message||"Failed to send behavioral emails",duration:e,timestamp:new Date().toISOString()},{status:500})}}async function c(){let e=new Date;return e.setDate(e.getDate()-1),(await r.db.collection("users").where("createdAt",">=",e).where("createdAt","<",new Date(e.getTime()+864e5)).where("totalInvoicesCreated","==",0).get()).docs.map(e=>({id:e.id,...e.data()})).filter(e=>!e.emailsSent?.includes("tutorial_day1")&&e.email)}async function p(){let e=new Date;return e.setDate(e.getDate()-3),(await r.db.collection("users").where("createdAt",">=",e).where("createdAt","<",new Date(e.getTime()+864e5)).get()).docs.map(e=>({id:e.id,...e.data()})).filter(e=>"free"===e.subscriptionTier&&!e.emailsSent?.includes("social_proof_day3")&&e.email)}async function u(){let e=new Date;return e.setDate(e.getDate()-7),(await r.db.collection("users").where("createdAt",">=",e).where("createdAt","<",new Date(e.getTime()+864e5)).get()).docs.map(e=>({id:e.id,...e.data()})).filter(e=>"free"===e.subscriptionTier&&!e.emailsSent?.includes("feature_deepdive_day7")&&e.email)}async function m(){let e=new Date;return e.setDate(e.getDate()-14),(await r.db.collection("users").where("createdAt",">=",e).where("createdAt","<",new Date(e.getTime()+864e5)).get()).docs.map(e=>({id:e.id,...e.data()})).filter(e=>"free"===e.subscriptionTier&&!e.emailsSent?.includes("upgrade_pitch_day14")&&e.email)}async function g(){let e=new Date;return e.setDate(e.getDate()-7),(await r.db.collection("users").where("lastLoginAt","<",e).where("subscriptionTier","==","free").limit(50).get()).docs.map(e=>({id:e.id,...e.data()})).filter(e=>!e.emailsSent?.includes("re_engagement_inactive_recent")&&e.email)}async function h(){let e=new Date;e.setHours(e.getHours()-6);let t=await r.db.collection("invoices").where("status","==","draft").where("createdAt","<",e).limit(50).get(),a=[];for(let e of t.docs){let t=e.data();if(t.unsentReminderSent)continue;let i=(await r.db.collection("users").doc(t.freelancerId).get()).data();i?.email&&a.push({id:e.id,...t,user:{email:i.email,name:i.name||i.businessName}})}return a}async function y(){return(await r.db.collection("users").where("subscriptionTier","in",["free","starter","growth"]).get()).docs.map(e=>({id:e.id,...e.data()})).filter(e=>{let t=e.collectionsUsedThisMonth||0,a=e.collectionsLimitPerMonth||1;return t/a*100>=80&&!e.emailsSent?.includes("quota_limit_recent")&&e.email})}async function v(e,t,a){let i=a>0?`${t}_day${a}`:t;await r.db.collection("users").doc(e).update({emailsSent:o.FieldValue.arrayUnion(i),lastEmailSentAt:new Date,updatedAt:new Date})}async function f(e){await r.db.collection("invoices").doc(e).update({unsentReminderSent:!0,updatedAt:new Date})}[r,o,n]=s.then?(await s)():s,e.s(["GET",()=>d,"dynamic",0,"force-dynamic"]),a()}catch(e){a(e)}},!1),738843,e=>e.a(async(t,a)=>{try{var i=e.i(747909),r=e.i(174017),o=e.i(996250),n=e.i(759756),l=e.i(561916),s=e.i(114444),d=e.i(837092),c=e.i(869741),p=e.i(316795),u=e.i(487718),m=e.i(995169),g=e.i(47587),h=e.i(666012),y=e.i(570101),v=e.i(626937),f=e.i(10372),x=e.i(193695);e.i(52474);var w=e.i(600220),b=e.i(822443),_=t([b]);[b]=_.then?(await _)():_;let A=new i.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/cron/send-behavioral-emails/route",pathname:"/api/cron/send-behavioral-emails",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/app/api/cron/send-behavioral-emails/route.ts",nextConfigOutput:"",userland:b}),{workAsyncStorage:P,workUnitAsyncStorage:I,serverHooks:k}=A;function E(){return(0,o.patchFetch)({workAsyncStorage:P,workUnitAsyncStorage:I})}async function R(e,t,a){A.isDev&&(0,n.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let i="/api/cron/send-behavioral-emails/route";i=i.replace(/\/index$/,"")||"/";let o=await A.prepare(e,t,{srcPage:i,multiZoneDraftMode:!1});if(!o)return t.statusCode=400,t.end("Bad Request"),null==a.waitUntil||a.waitUntil.call(a,Promise.resolve()),null;let{buildId:b,params:_,nextConfig:E,parsedUrl:R,isDraftMode:P,prerenderManifest:I,routerServerContext:k,isOnDemandRevalidate:T,revalidateOnlyGenerated:S,resolvedPathname:C,clientReferenceManifest:D,serverActionsManifest:U}=o,$=(0,c.normalizeAppPath)(i),L=!!(I.dynamicRoutes[$]||I.routes[C]),N=async()=>((null==k?void 0:k.render404)?await k.render404(e,t,R,!1):t.end("This page could not be found"),null);if(L&&!P){let e=!!I.routes[C],t=I.dynamicRoutes[$];if(t&&!1===t.fallback&&!e){if(E.experimental.adapterPath)return await N();throw new x.NoFallbackError}}let M=null;!L||A.isDev||P||(M=C,M="/index"===M?"/":M);let B=!0===A.isDev||!L,F=L&&!B;U&&D&&(0,s.setReferenceManifestsSingleton)({page:i,clientReferenceManifest:D,serverActionsManifest:U,serverModuleMap:(0,d.createServerModuleMap)({serverActionsManifest:U})});let O=e.method||"GET",H=(0,l.getTracer)(),q=H.getActiveScopeSpan(),z={params:_,prerenderManifest:I,renderOpts:{experimental:{authInterrupts:!!E.experimental.authInterrupts},cacheComponents:!!E.cacheComponents,supportsDynamicResponse:B,incrementalCache:(0,n.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:E.cacheLife,waitUntil:a.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,a,i)=>A.onRequestError(e,t,i,k)},sharedContext:{buildId:b}},j=new p.NodeNextRequest(e),G=new p.NodeNextResponse(t),Y=u.NextRequestAdapter.fromNodeNextRequest(j,(0,u.signalFromNodeResponse)(t));try{let o=async e=>A.handle(Y,z).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let a=H.getRootSpanAttributes();if(!a)return;if(a.get("next.span_type")!==m.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${a.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let r=a.get("next.route");if(r){let t=`${O} ${r}`;e.setAttributes({"next.route":r,"http.route":r,"next.span_name":t}),e.updateName(t)}else e.updateName(`${O} ${i}`)}),s=!!(0,n.getRequestMeta)(e,"minimalMode"),d=async n=>{var l,d;let c=async({previousCacheEntry:r})=>{try{if(!s&&T&&S&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let i=await o(n);e.fetchMetrics=z.renderOpts.fetchMetrics;let l=z.renderOpts.pendingWaitUntil;l&&a.waitUntil&&(a.waitUntil(l),l=void 0);let d=z.renderOpts.collectedTags;if(!L)return await (0,h.sendResponse)(j,G,i,z.renderOpts.pendingWaitUntil),null;{let e=await i.blob(),t=(0,y.toNodeOutgoingHttpHeaders)(i.headers);d&&(t[f.NEXT_CACHE_TAGS_HEADER]=d),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let a=void 0!==z.renderOpts.collectedRevalidate&&!(z.renderOpts.collectedRevalidate>=f.INFINITE_CACHE)&&z.renderOpts.collectedRevalidate,r=void 0===z.renderOpts.collectedExpire||z.renderOpts.collectedExpire>=f.INFINITE_CACHE?void 0:z.renderOpts.collectedExpire;return{value:{kind:w.CachedRouteKind.APP_ROUTE,status:i.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:a,expire:r}}}}catch(t){throw(null==r?void 0:r.isStale)&&await A.onRequestError(e,t,{routerKind:"App Router",routePath:i,routeType:"route",revalidateReason:(0,g.getRevalidateReason)({isStaticGeneration:F,isOnDemandRevalidate:T})},k),t}},p=await A.handleResponse({req:e,nextConfig:E,cacheKey:M,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:I,isRoutePPREnabled:!1,isOnDemandRevalidate:T,revalidateOnlyGenerated:S,responseGenerator:c,waitUntil:a.waitUntil,isMinimalMode:s});if(!L)return null;if((null==p||null==(l=p.value)?void 0:l.kind)!==w.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==p||null==(d=p.value)?void 0:d.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});s||t.setHeader("x-nextjs-cache",T?"REVALIDATED":p.isMiss?"MISS":p.isStale?"STALE":"HIT"),P&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let u=(0,y.fromNodeOutgoingHttpHeaders)(p.value.headers);return s&&L||u.delete(f.NEXT_CACHE_TAGS_HEADER),!p.cacheControl||t.getHeader("Cache-Control")||u.get("Cache-Control")||u.set("Cache-Control",(0,v.getCacheControlHeader)(p.cacheControl)),await (0,h.sendResponse)(j,G,new Response(p.value.body,{headers:u,status:p.value.status||200})),null};q?await d(q):await H.withPropagatedContext(e.headers,()=>H.trace(m.BaseServerSpan.handleRequest,{spanName:`${O} ${i}`,kind:l.SpanKind.SERVER,attributes:{"http.method":O,"http.target":e.url}},d))}catch(t){if(t instanceof x.NoFallbackError||await A.onRequestError(e,t,{routerKind:"App Router",routePath:$,routeType:"route",revalidateReason:(0,g.getRevalidateReason)({isStaticGeneration:F,isOnDemandRevalidate:T})}),L)throw t;return await (0,h.sendResponse)(j,G,new Response(null,{status:500})),null}}e.s(["handler",()=>R,"patchFetch",()=>E,"routeModule",()=>A,"serverHooks",()=>k,"workAsyncStorage",()=>P,"workUnitAsyncStorage",()=>I]),a()}catch(e){a(e)}},!1)];

//# sourceMappingURL=_59e0212e._.js.map