const { Router } = require('express');
const { ObjectId } = require('../config/database');

function createSessionRoutes(collections, auth) {
    const router = Router();
    const { sessionsCollection } = collections;
    const {
        verifyFBToken,
        verifyAdmin,
        verifyTutor,
    } = auth;

    router.get('/sessions/available', async (req, res) => {
        try {
            const sessions = await sessionsCollection
                .find({ status: 'approved' })
                .sort({ createdAt: -1 })
                .limit(6)
                .toArray();

            const now = new Date();
            const sessionsWithStatus = sessions.map((session) => {
                const registrationEnd = new Date(session.registrationEnd);
                const status = now < registrationEnd ? 'ongoing' : 'closed';

                return {
                    session,
                    status,
                };
            });

            res.send(sessionsWithStatus);
        } catch (error) {
            res.status(500).send({ message: 'Failed to load sessions', error: error.message });
        }
    });

    router.get('/sessions', verifyFBToken, async (req, res) => {
        try {
            const sessions = await sessionsCollection.find().toArray();
            res.status(200).json(sessions);
        } catch (error) {
            console.error('Error fetching sessions:', error);
            res.status(500).send({ message: 'Failed to fetch sessions' });
        }
    });

    router.get('/study-sessions', async (req, res) => {
        try {
            const sessions = await sessionsCollection.find({ status: 'approved' }).toArray();
            res.status(200).json(sessions);
        } catch (error) {
            console.error('Error fetching approved sessions:', error);
            res.status(500).send({ message: 'Failed to fetch approved sessions' });
        }
    });

    router.post('/session', verifyFBToken, verifyTutor, async (req, res) => {
        try {
            const result = await sessionsCollection.insertOne(req.body);
            res.status(201).send(result);
        } catch (error) {
            console.error('Error inserting Sessions:', error);
            res.status(500).send({ message: 'Failed to create Sessions' });
        }
    });

    router.get('/session/:id', verifyFBToken, async (req, res) => {
        try {
            const id = req.params.id;
            if (!id) {
                return res.status(400).send({ message: 'Session ID is required' });
            }

            const result = await sessionsCollection.findOne({ _id: new ObjectId(id) });
            if (!result) {
                return res.status(404).send({ message: 'Session not found' });
            }

            res.send(result);
        } catch (error) {
            console.error('Error fetching session:', error);
            res.status(500).send({ message: 'Failed to fetch session' });
        }
    });

    router.get('/my-sessions', verifyFBToken, verifyTutor, async (req, res) => {
        try {
            const email = req.query.email;
            if (!email) {
                return res.status(400).send({ message: 'Tutor email is required' });
            }

            const sessions = await sessionsCollection.find({
                tutorEmail: email,
                status: { $in: ['approved', 'rejected'] },
            }).toArray();

            res.status(200).send(sessions);
        } catch (error) {
            console.error('Error fetching tutor sessions:', error);
            res.status(500).send({ message: 'Failed to fetch tutor sessions' });
        }
    });

    router.patch('/sessions/:id/resend', verifyFBToken, verifyTutor, async (req, res) => {
        const { id } = req.params;
        const { status, rejectionReason, rejectionFeedback } = req.body;

        if (status !== 'pending') {
            return res.status(400).send({ error: 'Status can only be reset to pending' });
        }

        try {
            const updateResult = await sessionsCollection.updateOne(
                { _id: new ObjectId(id), status: 'rejected' },
                { $set: { status, rejectionReason, rejectionFeedback } }
            );

            if (updateResult.modifiedCount > 0) {
                res.send({ message: 'Status updated to pending' });
            } else {
                res.status(400).send({ error: 'Failed to update session status' });
            }
        } catch (error) {
            res.status(500).send({ error: 'Server error' });
        }
    });

    router.patch('/sessions/:id/approve', verifyFBToken, async (req, res) => {
        const { id } = req.params;
        const { isPaid, registrationFee } = req.body;

        const result = await sessionsCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { status: 'approved', isPaid, registrationFee } }
        );

        res.send(result);
    });

    router.patch('/sessions/:id/reject', verifyFBToken, async (req, res) => {
        const { id } = req.params;
        const { rejectionReason, rejectionFeedback } = req.body;

        try {
            const result = await sessionsCollection.updateOne(
                { _id: new ObjectId(id) },
                {
                    $set: {
                        status: 'rejected',
                        rejectionReason,
                        rejectionFeedback,
                    },
                }
            );

            res.send(result);
        } catch (error) {
            res.status(500).send({ message: 'Failed to reject session', error: error.message });
        }
    });

    router.get('/sessions/:id', verifyFBToken, async (req, res) => {
        const { id } = req.params;

        try {
            const session = await sessionsCollection.findOne({ _id: new ObjectId(id) });
            if (!session) {
                return res.status(404).send({ message: 'Session not found' });
            }

            res.send(session);
        } catch (error) {
            console.error(error);
            res.status(500).send({ message: 'Internal server error' });
        }
    });

    router.patch('/sessions/:id', verifyFBToken, verifyAdmin, async (req, res) => {
        const { id } = req.params;
        const updateData = { ...req.body };

        if ('_id' in updateData) {
            delete updateData._id;
        }

        try {
            const session = await sessionsCollection.findOne({ _id: new ObjectId(id) });
            if (!session) {
                return res.status(404).send({ message: 'Session not found' });
            }

            if (session.status !== 'approved') {
                return res.status(403).send({ message: 'Only approved sessions can be updated' });
            }

            const result = await sessionsCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updateData }
            );

            res.send({ message: 'Session updated successfully', result });
        } catch (error) {
            console.error('Error updating session:', error);
            res.status(500).send({ message: 'Internal server error' });
        }
    });

    router.delete('/sessions/:id', verifyFBToken, verifyAdmin, async (req, res) => {
        const { id } = req.params;

        try {
            const session = await sessionsCollection.findOne({ _id: new ObjectId(id) });
            if (!session) {
                return res.status(404).send({ message: 'Session not found' });
            }

            if (session.status !== 'approved') {
                return res.status(403).send({ message: 'Only approved sessions can be deleted' });
            }

            const result = await sessionsCollection.deleteOne({ _id: new ObjectId(id) });
            res.send({ message: 'Session deleted successfully', result });
        } catch (error) {
            console.error(error);
            res.status(500).send({ message: 'Internal server error' });
        }
    });

    return router;
}

module.exports = {
    createSessionRoutes,
};
