const { Router } = require('express');
const { getStripe } = require('../config/stripe');

function createPaymentRoutes(auth) {
    const router = Router();
    const { verifyFBToken, verifyStudent } = auth;

    router.post('/create-payment-intent', verifyFBToken, verifyStudent, async (req, res) => {
        const { amountInCents } = req.body;

        if (!amountInCents || amountInCents <= 0 || Number.isNaN(Number(amountInCents))) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        try {
            const stripe = getStripe();
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amountInCents,
                currency: 'usd',
                payment_method_types: ['card'],
            });

            res.json({ clientSecret: paymentIntent.client_secret });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
}

module.exports = {
    createPaymentRoutes,
};
