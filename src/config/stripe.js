const Stripe = require('stripe');
const { env } = require('./env');

let stripeClient;

function getStripe() {
    if (!stripeClient) {
        if (!env.stripeSecretKey) {
            throw new Error('STRIPE_SECRET_KEY is required');
        }

        stripeClient = Stripe(env.stripeSecretKey);
    }

    return stripeClient;
}

module.exports = {
    getStripe,
};
