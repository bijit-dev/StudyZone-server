const { Router } = require('express');
const { ObjectId } = require('../config/database');

function createMaterialRoutes(collections, auth) {
    const router = Router();
    const {
        bookedSessionCollection,
        materialsCollection,
        usersCollection,
    } = collections;
    const { verifyFBToken, verifyTutor } = auth;

    router.post('/materials', verifyFBToken, verifyTutor, async (req, res) => {
        const { title, sessionId, tutorEmail, imageURL, resourceLink } = req.body;

        if (!title || !sessionId || !tutorEmail || !imageURL || !resourceLink) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        const result = await materialsCollection.insertOne({
            title,
            sessionId,
            tutorEmail,
            imageURL,
            resourceLink,
            uploadedAt: new Date(),
        });

        res.send({ insertedId: result.insertedId });
    });

    router.get('/materials', verifyFBToken, async (req, res) => {
        try {
            const { email } = req.query;
            if (!email) {
                return res.status(400).send({ message: 'Email is required' });
            }

            const user = await usersCollection.findOne({ email });
            if (!user) {
                return res.status(404).send({ message: 'User not found' });
            }

            if (user.role === 'student') {
                const bookedSessions = await bookedSessionCollection.find({ email }).toArray();
                const sessionIds = bookedSessions.map((session) => session.sessionId);
                const materials = await materialsCollection.find({ sessionId: { $in: sessionIds } }).toArray();
                return res.send(materials);
            }

            if (user.role === 'tutor') {
                const materials = await materialsCollection.find({ tutorEmail: email }).toArray();
                return res.send(materials);
            }

            if (user.role === 'admin') {
                const materials = await materialsCollection.find().toArray();
                return res.send(materials);
            }

            return res.status(403).send({ message: 'Unknown role' });
        } catch (error) {
            console.error('Error fetching materials:', error);
            res.status(500).send({ message: 'Failed to fetch materials' });
        }
    });

    router.delete('/materials/:id', verifyFBToken, async (req, res) => {
        const id = req.params.id;
        const result = await materialsCollection.deleteOne({ _id: new ObjectId(id) });
        res.send(result);
    });

    router.patch('/materials/:id', verifyFBToken, async (req, res) => {
        const id = req.params.id;
        const updateDoc = {
            $set: {
                ...req.body,
                updatedAt: new Date(),
            },
        };

        const result = await materialsCollection.updateOne({ _id: new ObjectId(id) }, updateDoc);
        res.send(result);
    });

    router.get('/materials/:sessionId', verifyFBToken, async (req, res) => {
        try {
            const sessionId = req.params.sessionId;
            const materials = await materialsCollection.find({ sessionId }).toArray();
            res.send(materials);
        } catch (error) {
            res.status(500).send({ message: 'Failed to fetch materials' });
        }
    });

    return router;
}

module.exports = {
    createMaterialRoutes,
};
