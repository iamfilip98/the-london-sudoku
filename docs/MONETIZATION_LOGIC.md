# 💰 MONETIZATION LOGIC SPECIFICATION

**Model**: Free-to-Play with Premium Subscription + Ads
**Version**: 1.0
**Last Updated**: November 2025

---

## 📊 MONETIZATION STRATEGY

### Single Product: Premium Subscription ($4.99/month)

**Includes**:
- ✅ Unlimited practice puzzles
- ✅ Access to all variants (X-Sudoku, Killer, etc.)
- ✅ Full battle pass (all rewards)
- ✅ +50% XP boost
- ✅ Ad-free experience
- ✅ Advanced statistics
- ✅ Priority support

**Free Users Get**:
- 3 daily Classic puzzles
- Limited battle pass rewards (every 20th tier)
- Ads (banner + rewarded video)
- Basic statistics

---

## 💳 STRIPE INTEGRATION

### Checkout Flow

**1. User clicks "Upgrade to Premium"**:
```javascript
// POST /api/subscription/create-checkout
const response = await fetch('/api/subscription/create-checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ priceId: 'price_xxx' }) // From env var
});

const { checkout_url } = await response.json();
window.location.href = checkout_url; // Redirect to Stripe
```

**2. Server creates Stripe checkout session**:
```javascript
// /api/subscription/create-checkout.js
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  const { userId } = getAuth(req);
  const user = await getUser(userId);

  // Get or create Stripe customer
  let customerId = user.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { user_id: userId }
    });
    customerId = customer.id;
    await updateUser(userId, { stripe_customer_id: customerId });
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{
      price: process.env.STRIPE_PREMIUM_PRICE_ID, // $4.99/month
      quantity: 1,
    }],
    success_url: `${process.env.BASE_URL}/welcome-premium?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.BASE_URL}/pricing`,
    metadata: { user_id: userId }
  });

  return res.status(200).json({ checkout_url: session.url });
}
```

**3. User completes payment on Stripe**:
- Stripe redirects to `success_url`
- Webhook fires: `customer.subscription.created`

**4. Webhook updates database**:
```javascript
// /api/subscription/webhook.js
import { buffer } from 'micro';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      const subscription = event.data.object;
      await updateSubscription(subscription);
      break;

    case 'customer.subscription.deleted':
      const deletedSub = event.data.object;
      await cancelSubscription(deletedSub);
      break;

    case 'invoice.payment_failed':
      // Handle failed payment (send email, downgrade to free)
      break;
  }

  return res.status(200).json({ received: true });
}

async function updateSubscription(sub) {
  const userId = sub.metadata.user_id;

  await db.query(`
    UPDATE users
    SET subscription_tier = 'premium',
        subscription_status = $1,
        subscription_expires_at = to_timestamp($2),
        stripe_customer_id = $3
    WHERE id = $4
  `, [sub.status, sub.current_period_end, sub.customer, userId]);

  await db.query(`
    INSERT INTO subscriptions (user_id, stripe_subscription_id, stripe_customer_id, stripe_price_id, tier, status, current_period_start, current_period_end)
    VALUES ($1, $2, $3, $4, 'premium', $5, to_timestamp($6), to_timestamp($7))
    ON CONFLICT (stripe_subscription_id)
    DO UPDATE SET status = $5, current_period_end = to_timestamp($7), updated_at = NOW()
  `, [userId, sub.id, sub.customer, sub.items.data[0].price.id, sub.status, sub.current_period_start, sub.current_period_end]);

  // Update battle pass premium access
  await db.query(`
    UPDATE user_battle_pass_progress
    SET has_premium_pass = true
    WHERE user_id = $1 AND season_id = (SELECT id FROM battle_pass_seasons WHERE is_active = true)
  `, [userId]);
}
```

**5. Success page shows confirmation**:
```javascript
// /welcome-premium page
const { session_id } = query;
const session = await stripe.checkout.sessions.retrieve(session_id);

if (session.payment_status === 'paid') {
  showMessage('Welcome to Premium! 🎉');
  // Grant immediate access (already done via webhook)
}
```

### Customer Portal (Cancel/Update)

```javascript
// POST /api/subscription/portal
const session = await stripe.billingPortal.sessions.create({
  customer: user.stripe_customer_id,
  return_url: `${process.env.BASE_URL}/settings`,
});

return res.status(200).json({ portal_url: session.url });
```

---

## 📺 ADS INTEGRATION

### Google AdMob (Rewarded Video)

**Setup**:
```html
<!-- In <head> -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXX"
  crossorigin="anonymous"></script>
```

**Banner Ads** (Free users only):
```html
<!-- Top banner -->
<ins class="adsbygoogle"
  style="display:block"
  data-ad-client="ca-pub-XXXXXXX"
  data-ad-slot="1234567890"
  data-ad-format="horizontal"></ins>

<script>
  if (!isPremium) {
    (adsbygoogle = window.adsbygoogle || []).push({});
  }
</script>
```

**Rewarded Video Ads**:
```javascript
// After user completes 3 daily puzzles
if (dailyCount >= 3 && !isPremium) {
  showModal({
    title: 'Daily Puzzles Complete! 🎉',
    message: 'Come back tomorrow for new puzzles.',
    actions: [
      {
        text: 'Watch 30s ad for 1 bonus puzzle',
        onClick: async () => {
          const rewarded = await showRewardedAd();
          if (rewarded) {
            await grantBonusPuzzle();
          }
        }
      },
      { text: 'Upgrade to Premium (Unlimited)', onClick: showPricing },
      { text: 'Close' }
    ]
  });
}

async function showRewardedAd() {
  return new Promise((resolve) => {
    const adUnitId = 'ca-app-pub-XXXXXXX/rewarded';

    // Load rewarded ad
    const rewardedAd = new google.ima.AdsLoader();
    rewardedAd.addEventListener('loaded', () => {
      rewardedAd.show();
    });

    rewardedAd.addEventListener('rewarded', async () => {
      // Verify server-side
      const verified = await verifyAdReward(adUnitId);
      resolve(verified);
    });

    rewardedAd.addEventListener('error', () => {
      showMessage('Ad failed to load. Try again later.');
      resolve(false);
    });

    rewardedAd.load(adUnitId);
  });
}
```

**Server-side Verification**:
```javascript
// POST /api/ads/reward
export default async function handler(req, res) {
  const { userId } = getAuth(req);
  const { ad_unit_id } = req.body;

  // Check daily limit (max 3 ads/day)
  const today Ads = await db.query(`
    SELECT COUNT(*) FROM ad_rewards
    WHERE user_id = $1 AND viewed_at > NOW() - INTERVAL '24 hours'
  `, [userId]);

  if (todayAds.rows[0].count >= 3) {
    return res.status(429).json({ error: 'Daily ad limit reached (3/day)' });
  }

  // Record ad view
  await db.query(`
    INSERT INTO ad_rewards (user_id, ad_type, reward_type, ad_unit_id)
    VALUES ($1, 'rewarded_video', 'bonus_puzzle', $2)
  `, [userId, ad_unit_id]);

  return res.status(200).json({ bonus_puzzle_granted: true });
}
```

### Ad Block Detection

```javascript
// Non-invasive detection
setTimeout(() => {
  if (typeof window.adsbygoogle === 'undefined' && !isPremium) {
    showBanner({
      type: 'info',
      message: 'We noticed you\'re using an ad blocker. That\'s okay! We rely on ads to keep this free. Consider whitelisting us or upgrading to Premium.',
      actions: [
        { text: 'How to Whitelist', onClick: showWhitelistGuide },
        { text: 'Upgrade to Premium', onClick: showPricing },
        { text: 'Dismiss', dismissible: true }
      ]
    });
  }
}, 2000);
```

**DO NOT**:
- ❌ Block features
- ❌ Prevent playing
- ❌ Show constant popups
- ❌ Be aggressive

---

## 🎯 UPSELL MODALS

### When to Show Upsells

**1. Daily Limit Reached** (highest conversion):
```javascript
if (dailyCount >= 3 && !isPremium) {
  showModal({
    title: 'Daily Limit Reached',
    message: 'You\'ve completed your 3 free puzzles for today!',
    highlight: 'Premium members get unlimited puzzles.',
    cta: 'Upgrade to Premium - $4.99/month',
    benefits: [
      'Unlimited daily & practice puzzles',
      'Access to all variants (Killer, X-Sudoku, etc.)',
      'Full battle pass rewards',
      '+50% XP boost',
      'Ad-free experience'
    ],
    actions: [
      { text: 'Upgrade Now', primary: true, onClick: showCheckout },
      { text: 'Watch Ad for 1 Bonus Puzzle', onClick: showRewardedAd },
      { text: 'Maybe Later' }
    ]
  });
}
```

**2. Locked Variant Click**:
```javascript
onVariantClick('killer') {
  if (!isPremium) {
    showModal({
      title: 'Killer Sudoku - Premium Only',
      message: 'Upgrade to unlock all puzzle variants!',
      preview: showKillerPreview(), // Short demo/animation
      cta: 'Unlock All Variants - $4.99/month',
      actions: [
        { text: 'Upgrade Now', primary: true },
        { text: 'Learn More' }
      ]
    });
  }
}
```

**3. Battle Pass Tier Locked**:
```javascript
onTierClick(tier) {
  if (tier % 20 !== 0 && !isPremium) {
    showModal({
      title: 'Premium Reward Locked',
      message: 'This reward is exclusive to Premium subscribers.',
      reward: getTierReward(tier), // Show what they're missing
      cta: 'Unlock Full Battle Pass - $4.99/month',
      actions: [
        { text: 'Upgrade Now', primary: true },
        { text: 'View All Rewards' }
      ]
    });
  }
}
```

**4. After Great Performance** (celebrate first, then upsell):
```javascript
if (time < personalBest && errors === 0 && !isPremium) {
  showModal({
    title: 'New Personal Record! 🎉',
    message: 'Amazing time! You\'re getting really good at this.',
    highlight: 'Imagine how much better you\'d get with unlimited practice...',
    cta: 'Upgrade to Premium - Practice Unlimited',
    actions: [
      { text: 'Upgrade Now', primary: true },
      { text: 'Continue' }
    ]
  });
}
```

### Frequency Capping

**Don't annoy users**:
```javascript
const UPSELL_COOLDOWN = {
  daily_limit: 0,        // Always show (main conversion point)
  variant_locked: 3600,  // Once per hour
  battle_pass: 7200,     // Once per 2 hours
  performance: 86400     // Once per day
};

function canShowUpsell(type) {
  const lastShown = localStorage.getItem(`upsell_${type}_last_shown`);
  if (!lastShown) return true;

  const cooldown = UPSELL_COOLDOWN[type];
  const elapsed = Date.now() - parseInt(lastShown);

  return elapsed > cooldown * 1000;
}
```

---

## 📊 CONVERSION TRACKING

**PostHog Events**:
```javascript
// Track upsell impressions
posthog.capture('upsell_shown', { type, trigger, user_tier: 'free' });

// Track conversions
posthog.capture('premium_signup_started', { source: 'daily_limit_modal' });
posthog.capture('premium_signup_completed', { plan: 'monthly', price: 4.99 });

// Track drop-offs
posthog.capture('upsell_dismissed', { type, seconds_shown });
```

**Conversion Funnel**:
```
1. Upsell shown → 100%
2. Clicked "Upgrade" → 15%
3. Reached Stripe checkout → 12%
4. Completed payment → 8%
```

**Optimization**:
- A/B test pricing ($3.99 vs $4.99 vs $6.99)
- A/B test messaging ("Unlimited puzzles" vs "Join Premium" vs "Remove Ads")
- Test upsell timing (immediate vs after 3 puzzles vs after 1 week)

---

## ✅ TESTING CHECKLIST

- [ ] Stripe checkout flow completes successfully
- [ ] Webhook updates subscription status
- [ ] Premium features unlock immediately
- [ ] Battle pass grants premium track
- [ ] Ads hidden for Premium users
- [ ] Rewarded ads grant bonus puzzles (max 3/day)
- [ ] Ad block detection shows polite message (no blocking)
- [ ] Upsell modals trigger at correct times
- [ ] Frequency capping prevents spam
- [ ] Customer portal allows cancellation
- [ ] Subscription expires → downgrade to free tier
- [ ] Payment failure → notify user

---

**Monetization must feel fair, never pushy. Free users should enjoy the game. Premium users should feel they're getting great value.**
