const { Router } = require('express');

function createBookingRoutes(collections, auth) {
    const router = Router();
    const { bookedSessionCollection } = collections;
    const { verifyFBToken, verifyStudent } = auth;

    router.get('/booked', verifyFBToken, verifyStudent, async (req, res) => {
        try {
            const { email } = req.query;
            if (!email) {
                return res.status(400).send({ error: 'Missing email' });
            }

            const result = await bookedSessionCollection.find({ email }).toArray();
            res.send(result);
        } catch (error) {
            res.status(500).send({ error: 'Failed to fetch bookings' });
        }
    });

    router.get('/booked/:id', verifyFBToken, verifyStudent, async (req, res) => {
        try {
            const id = req.params.id;
            if (!id) {
                return res.status(400).send({ message: 'Session ID is required' });
            }

            const result = await bookedSessionCollection.findOne({ sessionId: id });
            if (!result) {
                return res.status(404).send({ message: 'Session not found' });
            }

            res.send(result);
        } catch (error) {
            console.error('Error fetching session:', error);
            res.status(500).send({ message: 'Failed to fetch session' });
        }
    });

    router.post('/booking', verifyFBToken, verifyStudent, async (req, res) => {
        try {
            const result = await bookedSessionCollection.insertOne(req.body);
            res.send(result);
        } catch (error) {
            res.status(500).send('Booking failed');
        }
    });

    return router;
}

module.exports = {
    createBookingRoutes,
};
