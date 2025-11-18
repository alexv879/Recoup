# REFERRAL PROGRAM BEST PRACTICES FOR SAAS

**Complete Guide: Incentives, Mechanics, UI & Viral Growth**

---

## PART 1: REFERRAL INCENTIVE STRUCTURE

### 1.1 Two-Sided Incentives (Reward Both Parties)

**Why Two-Sided Works Better:**
- 2-3x higher participation than one-sided[154][150]
- Both referrer and referee feel valued
- "Network effect"—each referral strengthens community
- Industry standard for modern SaaS[149][150]

**Examples from Market Leaders:**

| Company | Referrer Reward | Referee Reward | Structure | Why It Works |
|---------|-----------------|----------------|-----------|-------------|
| **Dropbox** | 500 MB storage | 500 MB storage | Symmetrical | Aligned incentives; core product value[149] |
| **Notion** | £5 credit | £10 credit | Asymmetrical | Referee gets more incentive to try[151] |
| **DigitalOcean** | £25 credit | £100 credit | Asymmetrical | Heavy investment in new users[150] |
| **Airtable** | £10 credit | £10 credit | Symmetrical | Simple, equal rewards[151] |
| **Coda** | £10 credit | £10 credit | Symmetrical | Straightforward, easy to explain[151] |
| **Coinbase** | $10 off | $10 off | Symmetrical | Low-friction crypto adoption[155] |
| **Trello** | 1 month Gold | Free service | Asymmetrical | Premium upsell for referrer[151] |
| **GetResponse** | $30 credit | $30 credit | Symmetrical + bonus learning cert[151] |

**Recommendation for Invoicing Software (Relay):**

```
SYMMETRICAL TWO-SIDED (Best for invoicing):
Give £5, Get £5

Referrer:        Referee:
└─ £5 account credit    └─ £5 account credit
                        └─ Valid for upgrade to Pro plan

OR ASYMMETRICAL (If bootstrapping):

Give £5, Get £10

Referrer:        Referee:
└─ £5 credit     └─ £10 credit (30-day trial)
└─ Unlocks      └─ Encourages upgrade
   higher tier
```

**Why £5-£10 Range:**
- Enough to feel valuable (~5-10% of monthly Pro plan)
- Covers cost of acquisition
- Aligned with Notion (£5/£10) and Coda (£10/£10) pricing[150][151]
- Low financial risk while driving adoption[157]

---

### 1.2 One-Sided Incentives (Reward Only Referrer)

**When to Use:**
- Quick CAC reduction without budget
- Lower execution cost
- When "sharing is caring" is cultural fit
- B2C products with high virality

**Why It's Less Effective:**
- Only 30-40% participation vs 70-90% two-sided[154]
- Referee has no incentive—makes referral "cold"
- Perceived as one-way benefit

**Examples:**
- **Airbnb** (early): $25 credit to referrer only (no referee incentive)
- **Uber** (early): $20 to referrer only
- Rarely successful today; most SaaS moved to two-sided[154]

---

### 1.3 Tiered Incentives (Escalating Rewards)

**Best for:** Power users, viral growth targets, high-value customers

**Examples:**

**Alteryx Model[151]:**
```
Tier 1: Sign up for demo        → $15
Tier 2: Complete demo           → $50
Tier 3: Become paying customer  → $150 total
```

**Digital Ocean Model[150]:**
```
Tier 1: First referral converts → $25 credit
Tier 2: 5 referrals convert     → Additional $25 each
Tier 3: 10+ referrals converted → VIP partner status
```

**Recommendation for Invoicing SaaS (Tiered):**

```
TIERED REFERRAL STRUCTURE

Tier 1: Referral signs up (free account)
└─ Referrer: £3 credit (immediate)

Tier 2: Referral creates first invoice
└─ Referrer: Additional £2 credit (£5 total)

Tier 3: Referral converts to Pro plan
└─ Referrer: Additional £10 credit (£15 total)
└─ Plus: 1 free month of Pro (if 5+ tier 3 conversions)

Tier 4: Referral stays paid for 3 months
└─ Referrer: 3 free months Pro subscription
└─ Plus: "Referral champion" badge in-app
```

**Advantages:**
- Drives deeper engagement (not just signup)
- Rewards referrer for high-quality referrals
- Incentivizes referrer to help new user succeed
- Better LTV alignment

---

## PART 2: REFERRAL MECHANICS

### 2.1 Referral Code vs Link

**Unique Referral Code (e.g., RELAY-JOHN123)**

Pros:
- Easy to remember and share verbally
- Works across channels (email, Slack, Discord)
- Feels personal/branded

Cons:
- Requires user to manually enter
- Higher friction than clicking a link
- Not automatically trackable

**Example Usage:**
```
"Sign up with code RELAY-JOHN123 and get £5 credit"

https://relay.co.uk/signup → Enter code: [RELAY-JOHN123]
```

---

**Unique Referral Link (e.g., relay.co.uk/r/john or relay.co.uk?ref=JOHN123)**

Pros:
- One-click signup (no manual entry)
- Automatically tracked via UTM
- Higher conversion (eliminates friction)
- Mobile-friendly

Cons:
- Longer URLs (less shareable verbally)
- Platform-dependent (changes if DNS/domain changes)

**Example Usage:**
```
"Click here to sign up: https://relay.co.uk/r/john-smith-125"

OR with UTM:

https://relay.co.uk/signup?ref=JOHN-SMITH-125&utm_source=referral&utm_medium=friend
```

---

**Recommendation: Hybrid Approach**

Provide both, emphasize the link:

```
REFERRAL MODAL (In-App)

┌─ Share Your Referral Link ─────────────────┐
│                                             │
│  🔗 https://relay.co.uk/r/john-smith-125  │
│     [Copy Link]  [Email]  [Share]         │
│                                             │
│  Or share your referral code:              │
│  Code: RELAY-JOHN-125                     │
│                                             │
│  Friends get £5, you get £5! 🎁          │
└─────────────────────────────────────────────┘
```

---

### 2.2 Referral Code Generation System

**Backend Implementation (Pseudocode):**

```python
# Generate unique referral code for user
def generate_referral_code(user_id, user_name):
    # Format: RELAY-[NAME]-[USER_ID]
    # Example: RELAY-JOHN-12534
    
    sanitized_name = user_name.replace(" ", "-")[:10].upper()
    code = f"RELAY-{sanitized_name}-{user_id}"
    
    # Ensure uniqueness
    while ReferralCode.exists(code):
        code = f"RELAY-{sanitized_name}-{user_id}-{random(1000, 9999)}"
    
    # Store in database
    ReferralCode.create(
        code=code,
        user_id=user_id,
        referral_link=f"https://relay.co.uk/r/{code.lower()}",
        created_at=now(),
        lifetime_referrals=0,
        lifetime_conversions=0
    )
    
    return code

# Track referral conversion
def track_referral_signup(referral_code, new_user_id):
    referral = ReferralCode.get(code=referral_code)
    
    if referral:
        referral.lifetime_referrals += 1
        referral.save()
        
        # Award credit to both
        award_credit(referral.user_id, 5, "referral_signup")
        award_credit(new_user_id, 5, "referred_signup")
        
        # Track for analytics
        log_event("referral_signup", {
            "referrer_id": referral.user_id,
            "referee_id": new_user_id,
            "referral_code": referral_code
        })

# Track conversion to paid
def track_referral_conversion(referral_code, new_user_id):
    referral = ReferralCode.get(code=referral_code)
    
    if referral and referral.user_id != new_user_id:
        referral.lifetime_conversions += 1
        referral.save()
        
        # Award additional credit
        award_credit(referral.user_id, 10, "referral_conversion")
        
        # Check for tier bonuses
        if referral.lifetime_conversions % 5 == 0:
            award_credit(referral.user_id, 50, "referral_milestone_5")
        
        # Track for analytics
        log_event("referral_conversion", {
            "referrer_id": referral.user_id,
            "referee_id": new_user_id,
            "lifetime_conversions": referral.lifetime_conversions
        })
```

---

### 2.3 Referral Tracking Methods

**Method 1: Unique Link (Preferred)**

```
https://relay.co.uk/r/[REFERRAL_CODE]

Tracking Flow:
1. User clicks link with code
2. Set cookie: referral_code = RELAY-JOHN-125
3. User creates account
4. Match cookie to account
5. Award credit
```

**Method 2: UTM Parameters**

```
https://relay.co.uk/signup?utm_source=referral&utm_medium=friend&utm_campaign=[REFERRER_USER_ID]

Tracking Flow:
1. Click link with UTM
2. Google Analytics captures utm_campaign = referrer user ID
3. Link GA data to signup
4. Cross-reference in database
5. Award credit
```

**Method 3: Manual Referral Code Entry (Backup)**

```
Signup form:
┌─ Have a referral code? ──────────────┐
│ [  RELAY-JOHN-125        ]          │
│                                      │
│ [  Continue              ]          │
└──────────────────────────────────────┘

Tracking Flow:
1. User manually enters code
2. Validate code exists
3. Link to referrer account
4. Award credit on signup
```

**Payout Timing:**

**Immediate (Recommended):**
- Award credit upon signup confirmation
- Stronger psychological reward
- Higher likelihood of referrer sharing again
- Example: Dropbox, Notion[149][151]

```
User signs up → Account created → Referrer credit applied immediately
(Within 1-2 seconds)
```

**Delayed (On Conversion):**
- Award credit only after referee converts to paid
- Ensures quality referrals (no spam signups)
- Lower churn risk (qualified leads)
- Higher friction but higher quality

```
User signs up → Referee creates invoice → Credit applied
(Within 24-48 hours)
```

**Recommendation:** Immediate for tier 1 (signup), delayed for tier 3 (paid conversion)

---

## PART 3: REFERRAL PROMOTION & UI

### 3.1 In-App Referral Placement

**Best Practices:**

**Placement 1: Dashboard "Invite Friends" Card (Always Visible)**

```
┌─────────────────────────────────────────┐
│  💰 Earn £5 by Inviting Colleagues     │
│                                        │
│  Your friends get £5 credit.           │
│  You get £5 credit. Win-win!          │
│                                        │
│  [Share Your Link]                    │
└─────────────────────────────────────────┘
```

**Placement 2: Modal After First Success (Trigger)**

**Timing:** After user completes first invoice (activation moment)

```
┌─ Share the Love ──────────────────────┐
│                                       │
│  Great job! Your first invoice sent! │
│  👋                                   │
│                                       │
│  Now share Relay with your team:     │
│                                       │
│  🔗 https://relay.co.uk/r/john-125   │
│     [Copy Link]  [Share on email]   │
│                                       │
│  Both of you get £5 credit! 🎁      │
│                                       │
│         [Maybe Later] [Share Now]   │
└───────────────────────────────────────┘
```

**Placement 3: Settings / Account Menu**

```
Settings
├─ Account
├─ Billing
├─ Notifications
├─ 💰 Referral Program ← Hidden here (secondary)
└─ Help
```

---

### 3.2 In-App Referral Button Design

**Primary Referral Button (Dashboard CTA)**

```css
/* Always visible, prominent placement */
Button Style:
- Background: #28a745 (green, represents growth)
- Text: "Invite Friends & Earn £5"
- Size: 44px height (mobile-friendly tap target)
- Icon: 👥 + 💰
- Position: Top-right of dashboard
- Hover: Slightly darker green (#1e7e34)
- Accessibility: ARIA label "Invite friends to Relay referral program"
```

**Visual Example:**

```
Dashboard Top Right:
┌─────────────────────────────────────────────┐
│  [👥 Invite Friends & Earn £5]  [⚙️Settings] │
└─────────────────────────────────────────────┘
```

---

### 3.3 Referral Modal Design (Best Practices)

**Modal Principles[164][165]:**
- Centered, high-contrast
- Single primary CTA ("Share Now")
- Secondary CTA ("Maybe Later") less prominent
- X button to close
- Clear, benefit-focused copy
- Share buttons for email/social

**Recommended Modal Timing[164]:**
- After first invoice sent (high engagement moment)
- After 5 invoices sent (power user moment)
- When user hits free plan limit (upgrade trigger)
- NOT on page load (too early)
- NOT every session (annoying)

---

### 3.4 Email Referral Campaign Template

**Subject Line Ideas:**
- "Give £5, Get £5 — Share Relay with Colleagues"
- "£5 For You (& Your Friends) 🎁"
- "3 Friends Joined Using Your Link"
- "Ready to Earn Your First £5?"

**Email Template:**

```
Subject: Give £5, Get £5 — Share Relay with Colleagues

---

Hi John,

You've set up Relay to manage invoicing & payments. 
Great choice! 🎉

Now, invite your colleagues and both of you get £5 credit.

Your personal referral link:
🔗 https://relay.co.uk/r/john-smith-125

How it works:
1. Share your link with colleagues
2. They sign up using your link
3. You both get £5 credit
4. If they upgrade to Pro, you get £10 more!

[Button: Copy Link]
[Button: Share on Email]

Questions? Reply to this email or visit our help center.

Best,
The Relay Team

P.S. Your 5 most likely referrers are already on Relay. 
Invite them too! 👥
```

---

## PART 4: VIRAL COEFFICIENT (K-FACTOR)

### 4.1 Viral Coefficient Calculation

**Formula:**

```
K-Factor = (Invitations Sent per User) × (Conversion Rate of Invitations)

Example:
- Each user sends out 10 invitations (on average)
- 8% of those invitations convert to signup
- K-Factor = 10 × 0.08 = 0.8
```

**Interpretation:**

```
K-Factor = 0.5  → Not viral; requires paid acquisition
K-Factor = 0.8  → Moderate; organic growth supports some costs
K-Factor = 1.0  → Self-sustaining; each user generates 1 new user
K-Factor = 1.5  → Highly viral; exponential growth
K-Factor = 2.0+ → Extremely viral (rare; Dropbox, early Slack)[167]
```

**Calculation Example for Invoicing SaaS:**

```
Baseline Metrics:
- Current users: 1,000
- Average invitations sent per user: 5
- Conversion rate of invitations: 15%

K-Factor Calculation:
K = 5 × 0.15 = 0.75

Projection:
Month 1: 1,000 users → 750 new from referral
Month 2: 1,750 users → 1,312 new from referral
Month 3: 3,062 users → 2,297 new from referral

→ Month 3 growth: 206% without paid ads!
```

---

### 4.2 Improving Viral Coefficient

**Levers:**

| Lever | Current | Target | How to Improve |
|-------|---------|--------|----------------|
| Invitations/user | 5 | 10+ | Add referral prompt after each action (invoice sent, payment received) |
| Conversion rate | 15% | 25%+ | Better referral copy, reduce signup friction, offer better incentive |
| K-Factor | 0.75 | 1.5+ | Combine both: 10 × 0.25 = 2.5 |

**Action Plan:**

```
WEEK 1-2: Increase Conversions (15% → 20%)
- Simplify signup form (3 fields → 1 field)
- Add social proof ("500+ teams using Relay")
- Improve referral copy ("Give £5, Get £5")
- A/B test incentive amounts (£5 vs £10)

WEEK 3-4: Increase Invitations (5 → 8)
- Add referral prompt after first invoice sent
- Add referral prompt in payment received notification
- Add referral widget to dashboard
- Email campaign to dormant users

WEEK 5-6: Measure & Iterate
- Track K-factor weekly
- Identify which prompts drive most invitations
- Optimize top-performing channels
- Test tiered incentives
```

---

### 4.3 Viral Coefficient Monitoring Dashboard

**Metrics to Track:**

```
REFERRAL ANALYTICS DASHBOARD

Overall Metrics:
├─ K-Factor (Viral Coefficient):     0.75 ↑
├─ Monthly Active Referrers:        156 users (15%)
├─ Total Referrals Sent:           2,340
├─ Referral Conversion Rate:       18% ↑
└─ Revenue from Referrals:         £8,500 MRR (28% of total)

Breakdown by Source:
├─ Dashboard widget:                45% of invites
├─ Email campaign:                  30%
├─ Post-signup modal:               15%
├─ Settings page:                   10%

Breakdown by Tier:
├─ Tier 1 (signup):                 2,340 invites → 421 signups (18%)
├─ Tier 2 (first invoice):          421 → 85 (20%)
└─ Tier 3 (upgrade):                85 → 28 (33%)

Cohort Analysis:
├─ Users who refer (vs don't):      3.2x higher LTV
├─ Referred users (vs organic):     2.1x higher retention
└─ Revenue per referral loop:       £15/loop
```

---

## PART 5: IMPLEMENTATION CHECKLIST

### Phase 1: Infrastructure (Week 1-2)

- [ ] Design referral code generation system
- [ ] Set up referral link tracking (UTM + code)
- [ ] Build referral credit database tables
- [ ] Implement credit award logic
- [ ] Set up referral analytics events
- [ ] Create referral dashboard view

### Phase 2: UI/UX (Week 2-3)

- [ ] Design referral button (green, prominent)
- [ ] Build referral modal (after first invoice)
- [ ] Add referral card to dashboard
- [ ] Implement share buttons (email, Slack, copy link)
- [ ] Design referral settings page
- [ ] Mobile-optimize all referral UI

### Phase 3: Marketing (Week 3-4)

- [ ] Write email referral campaign
- [ ] Create in-app messaging (banner, prompts)
- [ ] Design referral landing page
- [ ] Write referral program page
- [ ] Create social media graphics
- [ ] Plan launch announcement

### Phase 4: Launch & Measurement (Week 4-5)

- [ ] Set launch date (after 100+ active users minimum)
- [ ] Email announce to all existing users
- [ ] Monitor K-factor weekly
- [ ] A/B test incentive amounts
- [ ] Test referral prompts at different timings
- [ ] Optimize copy/design based on data

### Phase 5: Optimization (Week 5+)

- [ ] Improve K-factor: target 0.8 → 1.2
- [ ] Test tiered incentives
- [ ] Add leaderboard (top referrers)
- [ ] Create "referral champions" program
- [ ] Automate referral rewards via credits
- [ ] Track referral LTV vs organic LTV

---

**Referral Program Version:** 1.0  
**Last Updated:** November 2025  
**Target K-Factor:** 1.0+ (self-sustaining growth)