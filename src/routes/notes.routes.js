const { Router } = require('express');
const { ObjectId } = require('../config/database');

function createNoteRoutes(collections, auth) {
    const router = Router();
    const { notesCollection } = collections;
    const { verifyFBToken, verifyStudent } = auth;

    router.get('/notes', verifyFBToken, verifyStudent, async (req, res) => {
        const { email } = req.query;
        if (!email) {
            return res.status(400).send({ message: 'Email is required' });
        }

        try {
            const notes = await notesCollection.find({ email }).toArray();
            res.send(notes);
        } catch (error) {
            console.error('Error fetching notes:', error);
            res.status(500).send({ message: 'Failed to fetch notes' });
        }
    });

    router.post('/notes', verifyFBToken, verifyStudent, async (req, res) => {
        try {
            const result = await notesCollection.insertOne(req.body);
            res.status(201).send(result);
        } catch (error) {
            console.error('Error adding note:', error);
            res.status(500).send({ message: 'Failed to add note' });
        }
    });

    router.delete('/notes/:id', verifyFBToken, verifyStudent, async (req, res) => {
        try {
            const noteId = req.params.id;
            if (!noteId) {
                return res.status(400).send({ message: 'Note ID is required' });
            }

            const result = await notesCollection.deleteOne({ _id: new ObjectId(noteId) });
            if (result.deletedCount === 0) {
                return res.status(404).send({ message: 'Note not found' });
            }

            res.send({ message: 'Note deleted successfully', result });
        } catch (error) {
            console.error('Error deleting note:', error);
            res.status(500).send({ message: 'Failed to delete note' });
        }
    });

    router.put('/notes/:id', verifyFBToken, verifyStudent, async (req, res) => {
        try {
            const id = req.params.id;
            const { title, description } = req.body;
            const result = await notesCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: { title, description } }
            );

            res.send(result);
        } catch (error) {
            console.error('Error update note:', error);
            res.status(500).send({ message: 'Failed to update note' });
        }
    });

    return router;
}

module.exports = {
    createNoteRoutes,
};
