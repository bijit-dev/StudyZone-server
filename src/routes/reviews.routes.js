const { Router } = require('express');

function createReviewRoutes(collections, auth) {
    const router = Router();
    const { reviewsCollection } = collections;
    const { verifyFBToken, verifyStudent } = auth;

    router.get('/reviews', verifyFBToken, verifyStudent, async (req, res) => {
        try {
            const { sessionId } = req.query;
            if (!sessionId) {
                return res.status(400).send({ message: 'Session ID is required' });
            }

            const reviews = await reviewsCollection.find({ sessionId }).toArray();
            res.send(reviews);
        } catch (error) {
            console.error('Error fetching reviews:', error);
            res.status(500).send({ message: 'Failed to fetch reviews' });
        }
    });

    router.post('/reviews', verifyFBToken, verifyStudent, async (req, res) => {
        try {
            const { sessionId, reviewerEmail } = req.body;
            const exists = await reviewsCollection.findOne({ sessionId, reviewerEmail });

            if (exists) {
                return res.status(400).send({ message: 'You have already reviewed this session.' });
            }

            const result = await reviewsCollection.insertOne(req.body);
            res.send(result);
        } catch (error) {
            console.error('Error submitting review:', error);
            res.status(500).send({ message: 'Failed to submit review' });
        }
    });

    return router;
}

module.exports = {
    createReviewRoutes,
};
