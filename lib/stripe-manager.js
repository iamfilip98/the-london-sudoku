/**
 * Stripe Integration Manager
 *
 * Phase 2 Month 7: Premium subscription handling via Stripe
 *
 * Features:
 * - Create checkout sessions ($4.99/mo subscription)
 * - Handle webhooks (subscription created, updated, canceled)
 * - Customer portal management
 * - Subscription status sync with database
 *
 * Environment Variables Required:
 * - STRIPE_SECRET_KEY: Stripe secret key (sk_live_... or sk_test_...)
 * - STRIPE_WEBHOOK_SECRET: Webhook signing secret
 * - STRIPE_PRICE_ID: Price ID for $4.99/mo plan
 *
 * Usage:
 *   const stripe = require('./lib/stripe-manager');
 *   const session = await stripe.createCheckoutSession(username, email);
 *   const success = await stripe.handleWebhook(body, signature);
 */

const Stripe = require('stripe');
const { Pool } = require('pg');

// Initialize Stripe
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Database connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: true
    } : false
});

// Stripe configuration
const STRIPE_CONFIG = {
    priceId: process.env.STRIPE_PRICE_ID || 'price_1234567890', // TODO: Replace with actual price ID
    successUrl: process.env.VERCEL_URL ?
        `https://${process.env.VERCEL_URL}/success?session_id={CHECKOUT_SESSION_ID}` :
        'http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}',
    cancelUrl: process.env.VERCEL_URL ?
        `https://${process.env.VERCEL_URL}/#pricing` :
        'http://localhost:3000/#pricing',
    currency: 'usd',
    billingInterval: 'month'
};

/**
 * Create a Stripe checkout session for premium subscription
 *
 * @param {string} username - User's username
 * @param {string} email - User's email address
 * @returns {Promise<{sessionId: string, url: string}>}
 */
async function createCheckoutSession(username, email) {
    try {
        // Check if user already has a Stripe customer ID
        const userResult = await pool.query(
            'SELECT stripe_customer_id, premium FROM users WHERE username = $1',
            [username]
        );

        if (userResult.rows.length === 0) {
            throw new Error('User not found');
        }

        const user = userResult.rows[0];

        // If already premium, redirect to customer portal
        if (user.premium) {
            throw new Error('User already has premium subscription');
        }

        let customerId = user.stripe_customer_id;

        // Create Stripe customer if doesn't exist
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: email,
                metadata: {
                    username: username
                }
            });

            customerId = customer.id;

            // Save customer ID to database
            await pool.query(
                'UPDATE users SET stripe_customer_id = $1 WHERE username = $2',
                [customerId, username]
            );

        }

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [
                {
                    price: STRIPE_CONFIG.priceId,
                    quantity: 1
                }
            ],
            mode: 'subscription',
            success_url: STRIPE_CONFIG.successUrl,
            cancel_url: STRIPE_CONFIG.cancelUrl,
            metadata: {
                username: username
            },
            subscription_data: {
                metadata: {
                    username: username
                }
            }
        });


        return {
            sessionId: session.id,
            url: session.url
        };
    } catch (error) {
        // Error occurred
        throw error;
    }
}

/**
 * Create a customer portal session for subscription management
 *
 * @param {string} username - User's username
 * @returns {Promise<{url: string}>}
 */
async function createPortalSession(username) {
    try {
        const userResult = await pool.query(
            'SELECT stripe_customer_id, premium FROM users WHERE username = $1',
            [username]
        );

        if (userResult.rows.length === 0) {
            throw new Error('User not found');
        }

        const user = userResult.rows[0];

        if (!user.stripe_customer_id) {
            throw new Error('User does not have a Stripe customer ID');
        }

        const returnUrl = process.env.VERCEL_URL ?
            `https://${process.env.VERCEL_URL}/#settings` :
            'http://localhost:3000/#settings';

        const session = await stripe.billingPortal.sessions.create({
            customer: user.stripe_customer_id,
            return_url: returnUrl
        });

        return {
            url: session.url
        };
    } catch (error) {
        // Error occurred
        throw error;
    }
}

/**
 * Handle Stripe webhook events
 *
 * @param {Buffer} rawBody - Raw request body
 * @param {string} signature - Stripe signature header
 * @returns {Promise<boolean>}
 */
async function handleWebhook(rawBody, signature) {
    try {
        // Verify webhook signature
        const event = stripe.webhooks.constructEvent(
            rawBody,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );


        // Log event to database
        await logWebhookEvent(event);

        // Handle different event types
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutCompleted(event.data.object);
                break;

            case 'customer.subscription.created':
                await handleSubscriptionCreated(event.data.object);
                break;

            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object);
                break;

            case 'invoice.payment_succeeded':
                await handlePaymentSucceeded(event.data.object);
                break;

            case 'invoice.payment_failed':
                await handlePaymentFailed(event.data.object);
                break;

            default:
        }

        // Mark event as processed
        await pool.query(
            'UPDATE subscription_events SET processed = TRUE WHERE event_id = $1',
            [event.id]
        );

        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Log webhook event to database
 */
async function logWebhookEvent(event) {
    try {
        const customerId = event.data.object.customer;
        const subscriptionId = event.data.object.subscription || event.data.object.id;

        // Get username from customer metadata
        let username = null;
        if (event.data.object.metadata?.username) {
            username = event.data.object.metadata.username;
        } else if (customerId) {
            const userResult = await pool.query(
                'SELECT username FROM users WHERE stripe_customer_id = $1',
                [customerId]
            );
            if (userResult.rows.length > 0) {
                username = userResult.rows[0].username;
            }
        }

        await pool.query(
            `INSERT INTO subscription_events (event_id, event_type, customer_id, subscription_id, username, data)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (event_id) DO NOTHING`,
            [event.id, event.type, customerId, subscriptionId, username, JSON.stringify(event.data.object)]
        );
    } catch (error) {
        // Error occurred
    }
}

/**
 * Handle checkout.session.completed
 */
async function handleCheckoutCompleted(session) {
    const username = session.metadata.username;
    const customerId = session.customer;
    const subscriptionId = session.subscription;


    // Subscription details will be handled by subscription.created event
    // Just update customer ID if needed
    await pool.query(
        'UPDATE users SET stripe_customer_id = $1 WHERE username = $2',
        [customerId, username]
    );
}

/**
 * Handle customer.subscription.created
 */
async function handleSubscriptionCreated(subscription) {
    const customerId = subscription.customer;
    const subscriptionId = subscription.id;
    const status = subscription.status;
    const priceId = subscription.items.data[0].price.id;

    // Get username from customer
    const userResult = await pool.query(
        'SELECT username FROM users WHERE stripe_customer_id = $1',
        [customerId]
    );

    if (userResult.rows.length === 0) {
        return;
    }

    const username = userResult.rows[0].username;

    // Update user to premium
    await pool.query(
        `UPDATE users
         SET premium = TRUE,
             stripe_subscription_id = $1,
             subscription_status = $2,
             subscription_start_date = to_timestamp($3),
             stripe_price_id = $4
         WHERE username = $5`,
        [subscriptionId, status, subscription.current_period_start, priceId, username]
    );

}

/**
 * Handle customer.subscription.updated
 */
async function handleSubscriptionUpdated(subscription) {
    const subscriptionId = subscription.id;
    const status = subscription.status;
    const cancelAtPeriodEnd = subscription.cancel_at_period_end;

    await pool.query(
        `UPDATE users
         SET subscription_status = $1,
             subscription_cancel_at_period_end = $2,
             subscription_end_date = CASE
                 WHEN $2 = TRUE THEN to_timestamp($3)
                 ELSE NULL
             END,
             premium = CASE
                 WHEN $1 = 'active' THEN TRUE
                 ELSE FALSE
             END
         WHERE stripe_subscription_id = $4`,
        [status, cancelAtPeriodEnd, subscription.current_period_end, subscriptionId]
    );

}

/**
 * Handle customer.subscription.deleted
 */
async function handleSubscriptionDeleted(subscription) {
    const subscriptionId = subscription.id;

    await pool.query(
        `UPDATE users
         SET premium = FALSE,
             subscription_status = 'canceled',
             subscription_end_date = to_timestamp($1)
         WHERE stripe_subscription_id = $2`,
        [subscription.canceled_at || subscription.ended_at, subscriptionId]
    );

}

/**
 * Handle invoice.payment_succeeded
 */
async function handlePaymentSucceeded(invoice) {
    const customerId = invoice.customer;
    const subscriptionId = invoice.subscription;


    // Ensure user is marked as premium
    await pool.query(
        `UPDATE users
         SET premium = TRUE,
             subscription_status = 'active'
         WHERE stripe_subscription_id = $1`,
        [subscriptionId]
    );
}

/**
 * Handle invoice.payment_failed
 */
async function handlePaymentFailed(invoice) {
    const customerId = invoice.customer;
    const subscriptionId = invoice.subscription;


    // Update subscription status to past_due
    await pool.query(
        `UPDATE users
         SET subscription_status = 'past_due'
         WHERE stripe_subscription_id = $1`,
        [subscriptionId]
    );

    // TODO: Send email notification to user
}

/**
 * Get subscription status for a user
 *
 * @param {string} username
 * @returns {Promise<Object>}
 */
async function getSubscriptionStatus(username) {
    try {
        const result = await pool.query(
            `SELECT
                premium,
                subscription_status,
                subscription_start_date,
                subscription_end_date,
                subscription_cancel_at_period_end,
                stripe_subscription_id
             FROM users
             WHERE username = $1`,
            [username]
        );

        if (result.rows.length === 0) {
            return null;
        }

        return result.rows[0];
    } catch (error) {
        // Error occurred
        throw error;
    }
}

module.exports = {
    createCheckoutSession,
    createPortalSession,
    handleWebhook,
    getSubscriptionStatus
};
