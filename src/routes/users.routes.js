const { Router } = require('express');
const { ObjectId } = require('../config/database');

function createUserRoutes(collections, auth) {
    const router = Router();
    const { usersCollection } = collections;
    const { verifyFBToken } = auth;

    router.get('/users/:email/role', verifyFBToken, async (req, res) => {
        try {
            const email = req.params.email;
            if (!email) {
                return res.status(400).send({ message: 'Email is required' });
            }

            const user = await usersCollection.findOne({ email });
            if (!user) {
                return res.status(404).send({ message: 'User not found' });
            }

            res.send({ role: user.role || 'student' });
        } catch (error) {
            console.error('Error getting user role:', error);
            res.status(500).send({ message: 'Failed to get role' });
        }
    });

    router.get('/users/:email', verifyFBToken, async (req, res) => {
        const email = req.params.email;

        try {
            const user = await usersCollection.findOne({ email });
            if (user) {
                res.json(user);
            } else {
                res.status(404).send('User not found');
            }
        } catch (error) {
            res.status(500).send('Error retrieving user');
        }
    });

    router.get('/users', verifyFBToken, async (req, res) => {
        const { search } = req.query;

        try {
            let query = {};

            if (search) {
                const regex = new RegExp(search, 'i');
                query = {
                    $or: [
                        { name: { $regex: regex } },
                        { email: { $regex: regex } },
                    ],
                };
            }

            const users = await usersCollection.find(query).toArray();
            res.send(users);
        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).send({ message: 'Failed to fetch users' });
        }
    });

    router.patch('/users/:id/role', verifyFBToken, async (req, res) => {
        const { id } = req.params;
        const { role } = req.body;

        if (!role) {
            return res.status(400).send({ message: 'Role is required' });
        }

        try {
            const result = await usersCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: { role } }
            );

            if (result.modifiedCount === 0) {
                return res.status(404).send({ message: 'User not found or role not updated' });
            }

            res.send({ message: 'User role updated successfully' });
        } catch (error) {
            console.error('Error updating role:', error);
            res.status(500).send({ message: 'Failed to update role' });
        }
    });

    router.get('/tutors', async (req, res) => {
        try {
            const result = await usersCollection.find({ role: 'tutor' }).toArray();
            res.send(result);
        } catch (error) {
            console.error('Error getting user role:', error);
            res.status(500).send({ message: 'Failed to get role' });
        }
    });

    router.post('/users', async (req, res) => {
        try {
            const email = req.body.email;
            if (!email) {
                return res.status(400).send({ message: 'Email is required' });
            }

            const userExists = await usersCollection.findOne({ email });
            if (userExists) {
                return res.status(200).send({ message: 'User already exists', inserted: false });
            }

            const result = await usersCollection.insertOne(req.body);
            res.send(result);
        } catch (error) {
            console.error('Error creating user:', error);
            res.status(500).send({ message: 'Failed to create user' });
        }
    });

    return router;
}

module.exports = {
    createUserRoutes,
};
