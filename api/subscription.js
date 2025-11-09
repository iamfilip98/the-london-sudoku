/**
 * Subscription API Endpoint
 *
 * Phase 2 Month 7: Premium subscription management via Stripe
 *
 * Endpoints:
 * - POST /api/subscription?action=create-checkout    - Create checkout session
 * - POST /api/subscription?action=create-portal      - Create customer portal
 * - POST /api/subscription?action=webhook            - Handle Stripe webhooks
 * - GET  /api/subscription?username=xxx              - Get subscription status
 *
 * Authentication: Required (except webhooks)
 */

const { setCorsHeaders } = require('../lib/cors');
const stripeManager = require('../lib/stripe-manager');

module.exports = async (req, res) => {
    // Set CORS headers
    setCorsHeaders(req, res);

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { action, username } = req.query;

        // POST: Create checkout session
        if (req.method === 'POST' && action === 'create-checkout') {
            const { username, email } = req.body;

            if (!username || !email) {
                return res.status(400).json({
                    success: false,
                    error: 'username and email are required'
                });
            }

            try {
                const session = await stripeManager.createCheckoutSession(username, email);

                return res.status(200).json({
                    success: true,
                    sessionId: session.sessionId,
                    url: session.url
                });
            } catch (error) {
                console.error('Failed to create checkout session:', error);
                return res.status(500).json({
                    success: false,
                    error: error.message || 'Failed to create checkout session'
                });
            }
        }

        // POST: Create customer portal session
        if (req.method === 'POST' && action === 'create-portal') {
            const { username } = req.body;

            if (!username) {
                return res.status(400).json({
                    success: false,
                    error: 'username is required'
                });
            }

            try {
                const portal = await stripeManager.createPortalSession(username);

                return res.status(200).json({
                    success: true,
                    url: portal.url
                });
            } catch (error) {
                console.error('Failed to create portal session:', error);
                return res.status(500).json({
                    success: false,
                    error: error.message || 'Failed to create portal session'
                });
            }
        }

        // POST: Handle Stripe webhook
        if (req.method === 'POST' && action === 'webhook') {
            const signature = req.headers['stripe-signature'];

            if (!signature) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing stripe-signature header'
                });
            }

            try {
                // Get raw body (Vercel provides this as Buffer)
                const rawBody = req.body;

                const success = await stripeManager.handleWebhook(rawBody, signature);

                if (success) {
                    return res.status(200).json({ received: true });
                } else {
                    return res.status(400).json({ received: false });
                }
            } catch (error) {
                console.error('Webhook handling failed:', error);
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }
        }

        // GET: Get subscription status
        if (req.method === 'GET' && username) {
            try {
                const status = await stripeManager.getSubscriptionStatus(username);

                if (!status) {
                    return res.status(404).json({
                        success: false,
                        error: 'User not found'
                    });
                }

                return res.status(200).json({
                    success: true,
                    premium: status.premium,
                    subscriptionStatus: status.subscription_status,
                    subscriptionStartDate: status.subscription_start_date,
                    subscriptionEndDate: status.subscription_end_date,
                    cancelAtPeriodEnd: status.subscription_cancel_at_period_end
                });
            } catch (error) {
                console.error('Failed to get subscription status:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to get subscription status'
                });
            }
        }

        // Invalid request
        return res.status(400).json({
            success: false,
            error: 'Invalid request. Use ?action=create-checkout, ?action=create-portal, ?action=webhook, or GET with ?username=xxx'
        });

    } catch (error) {
        console.error('Subscription API error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
