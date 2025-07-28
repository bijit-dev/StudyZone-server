require('dotenv').config()
const express = require('express')
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// const admin = require("firebase-admin");

const app = express();
const port = process.env.PORT || 5000;

// Middleware 
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ict2m8x.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const db = client.db('studyZone'); // database name
        const sessionsCollection = db.collection("sessions");
        const usersCollection = db.collection('users');
        const bookedSessionCollection = db.collection('bookedSession');
        const reviewsCollection = db.collection('sessionReviews');
        const notesCollection = db.collection('notes');
        const materialsCollection = db.collection("materials");



        // GET: Get user role by email
        app.get('/users/:email/role', async (req, res) => {
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

        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            try {
                const user = await usersCollection.findOne({ email });
                if (user) {
                    res.json(user);
                } else {
                    res.status(404).send("User not found");
                }
            } catch (err) {
                res.status(500).send("Error retrieving user");
            }
        });

        // GET all users with optional search
        app.get('/users', async (req, res) => {
            const { search } = req.query;

            try {
                let query = {};

                if (search) {
                    const regex = new RegExp(search, "i"); // case-insensitive
                    query = {
                        $or: [
                            { name: { $regex: regex } },
                            { email: { $regex: regex } }
                        ]
                    };
                }

                const users = await usersCollection.find(query).toArray();
                res.send(users);
            } catch (error) {
                console.error('Error fetching users:', error);
                res.status(500).send({ message: 'Failed to fetch users' });
            }
        });


        // PATCH update user role
        app.patch('/users/:id/role', async (req, res) => {
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


        // tutors
        app.get('/tutors', async (req, res) => {
            try {
                const result = await usersCollection.find({ role: "tutor" }).toArray();
                res.send(result);
            } catch (error) {
                console.error('Error getting user role:', error);
                res.status(500).send({ message: 'Failed to get role' });
            }
        });

        // POST: Create a new user
        app.post('/users', async (req, res) => {
            const email = req.body.email;
            const userExists = await usersCollection.findOne({ email })
            if (userExists) {
                // update last log in
                return res.status(200).send({ message: 'User already exists', inserted: false });
            }
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })

        // GET: Fetch all sessions
        app.get('/sessions', async (req, res) => {
            try {
                const sessions = await sessionsCollection.find().toArray();
                res.status(200).json(sessions);
            } catch (error) {
                console.error('Error fetching sessions:', error);
                res.status(500).send({ message: 'Failed to fetch sessions' });
            }
        });

        app.post('/session', async (req, res) => {
            try {
                const newSessions = req.body;
                const result = await sessionsCollection.insertOne(newSessions);
                res.status(201).send(result);
            } catch (error) {
                console.error('Error inserting Sessions:', error);
                res.status(500).send({ message: 'Failed to create Sessions' });
            }
        });

        app.get('/session/:id', async (req, res) => {
            try {
                const id = req.params.id;
                if (!id) {
                    return res.status(400).send({ message: 'Session ID is required' });
                }

                const result = await sessionsCollection.findOne({ _id: new ObjectId(id) });
                if (!result) {
                    return res.status(404).send({ message: 'Session not found' });
                }
                res.send(result)

            } catch (error) {
                console.error('Error fetching session:', error);
                res.status(500).send({ message: 'Failed to fetch session' });
            }
        });

        app.get('/booked', async (req, res) => {
            try {
                const { email } = req.query;
                if (!email) return res.status(400).send({ error: "Missing email" });

                const result = await bookedSessionCollection.find({ email }).toArray();
                res.send(result);
            } catch (err) {
                res.status(500).send({ error: "Failed to fetch bookings" });
            }
        });

        app.get('/booked/:id', async (req, res) => {
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

        app.post('/booking', async (req, res) => {
            const bookingData = req.body;
            try {
                const result = await bookedSessionCollection.insertOne(bookingData);
                res.send(result);
            } catch (error) {
                res.status(500).send("Booking failed");
            }
        });

        app.get('/reviews', async (req, res) => {
            const { sessionId } = req.query;
            const reviews = await reviewsCollection.find({ sessionId }).toArray();
            res.send(reviews);
        });

        app.post("/reviews", async (req, res) => {
            try {
                const { sessionId, reviewerEmail } = req.body;
                const exists = await reviewsCollection.findOne({ sessionId, reviewerEmail });

                if (exists) {
                    return res.status(400).send({ message: "You have already reviewed this session." });
                }

                const result = await reviewsCollection.insertOne(req.body);
                res.send(result);
            } catch (error) {
                console.error("Error submitting review:", error);
                res.status(500).send({ message: "Failed to submit review" });
            }
        });

        app.get('/notes', async (req, res) => {
            const { email } = req.query;
            if (!email) {
                return res.status(400).send({ message: 'Session ID is required' });
            }
            try {
                const notes = await notesCollection.find({ email }).toArray();
                res.send(notes);
            } catch (error) {
                console.error('Error fetching notes:', error);
                res.status(500).send({ message: 'Failed to fetch notes' });
            }
        });

        app.post("/notes", async (req, res) => {
            try {
                const note = req.body;
                const result = await notesCollection.insertOne(note);
                res.status(201).send(result);
            } catch (error) {
                console.error("Error adding note:", error);
                res.status(500).send({ message: "Failed to add note" });
            }
        });

        app.delete("/notes/:id", async (req, res) => {
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


        app.put("/notes/:id", async (req, res) => {
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

        app.get('/my-sessions', async (req, res) => {
            try {
                const email = req.query.email;

                if (!email) {
                    return res.status(400).send({ message: 'Tutor email is required' });
                }

                // Fetch only sessions created by this tutor that are either approved or rejected
                const sessions = await sessionsCollection.find({
                    tutorEmail: email,
                    status: { $in: ['approved', 'rejected'] }
                }).toArray();

                res.status(200).send(sessions);
            } catch (error) {
                console.error('Error fetching tutor sessions:', error);
                res.status(500).send({ message: 'Failed to fetch tutor sessions' });
            }
        });

        app.patch('/sessions/:id/resend', async (req, res) => {
            const { id } = req.params;
            const { status } = req.body; // expected to be "pending"

            try {
                const updateResult = await sessionsCollection.updateOne(
                    { _id: new ObjectId(id), status: "rejected" },
                    { $set: { status } }
                );

                if (updateResult.modifiedCount > 0) {
                    res.send({ message: "Status updated to pending" });
                } else {
                    res.status(400).send({ error: "Failed to update session status" });
                }
            } catch (error) {
                res.status(500).send({ error: "Server error" });
            }
        });

        app.post("/materials", async (req, res) => {
            const { title, sessionId, tutorEmail, imageURL, resourceLink } = req.body;

            if (!title || !sessionId || !tutorEmail || !imageURL || !resourceLink) {
                return res.status(400).json({ message: "All fields are required." });
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

        // GET /materials?tutorEmail=...
        app.get('/materials', async (req, res) => {
            try {
                const { email } = req.query;
                if (!email) {
                    return res.status(400).send({ message: 'Tutor email is required' });
                }

                const user = await usersCollection.findOne({ email: email });
                if (user.role === "student") {
                    const result = await bookedSessionCollection.find({ email }).toArray();
                    const sessionIds = result.map(session => session.sessionId);
                    const materials = await materialsCollection.find({ sessionId: { $in: sessionIds } }).toArray();
                    res.send(materials);
                }
                else if (user.role === "tutor") {
                    const materials = await materialsCollection.find({ email }).toArray();
                    res.send(materials);
                }
                else if (user.role === "admin") {
                    const materials = await materialsCollection.find().toArray();
                    res.send(materials);
                }

            } catch (error) {
                console.error('Error fetching materials:', error);
                res.status(500).send({ message: 'Failed to fetch materials' });
            }
        });

        // DELETE /materials/:id
        app.delete('/materials/:id', async (req, res) => {
            const id = req.params.id;
            const result = await materialsCollection.deleteOne({ _id: new ObjectId(id) });
            res.send(result);
        });

        // PATCH /materials/:id
        app.patch('/materials/:id', async (req, res) => {
            const id = req.params.id;
            const updateDoc = {
                $set: {
                    ...req.body,
                    updatedAt: new Date()
                }
            };
            const result = await materialsCollection.updateOne({ _id: new ObjectId(id) }, updateDoc);
            res.send(result);
        });

        // GET /materials/:sessionId
        app.get('/materials/:sessionId', async (req, res) => {
            try {
                const sessionId = req.params.sessionId;
                const materials = await materialsCollection.find({ sessionId }).toArray();
                res.send(materials);
            } catch (error) {
                res.status(500).send({ message: "Failed to fetch materials" });
            }
        });


        // PATCH approve with payment info
        app.patch("/sessions/:id/approve", async (req, res) => {
            const { id } = req.params;
            const { isPaid, registrationFee } = req.body;
            const result = await sessionsCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: { status: "approved", isPaid, registrationFee } }
            );
            res.send(result);
        });

        // PATCH reject
        app.patch("/sessions/:id/reject", async (req, res) => {
            const { id } = req.params;
            const result = await sessionsCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: { status: "rejected" } }
            );
            res.send(result);
        });

        // ✅ Get all sessions
        app.get("/sessions/:id", async (req, res) => {
            const { id } = req.params;

            try {
                const session = await sessionsCollection.findOne({ _id: new ObjectId(id) });

                if (!session) {
                    return res.status(404).send({ message: "Session not found" });
                }

                res.send(session);  // 🔧 Send back the session to frontend
            } catch (err) {
                console.error(err);
                res.status(500).send({ message: "Internal server error" });
            }
        });

        // ✅ Update an approved session
        app.patch("/sessions/:id", async (req, res) => {
            const { id } = req.params;
            let updateData = { ...req.body };

            // Remove _id to prevent immutable field update error
            if ("_id" in updateData) {
                delete updateData._id;
            }

            try {
                const session = await sessionsCollection.findOne({ _id: new ObjectId(id) });

                if (!session) {
                    return res.status(404).send({ message: "Session not found" });
                }

                if (session.status !== "approved") {
                    return res.status(403).send({ message: "Only approved sessions can be updated" });
                }

                const result = await sessionsCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updateData }
                );

                res.send({ message: "Session updated successfully", result });
            } catch (error) {
                console.error("Error updating session:", error);
                res.status(500).send({ message: "Internal server error" });
            }
        });

        // ✅ Delete an approved session
        app.delete("/sessions/:id", async (req, res) => {
            const { id } = req.params;

            try {
                const session = await sessionsCollection.findOne({ _id: new ObjectId(id) });

                if (!session) {
                    return res.status(404).send({ message: "Session not found" });
                }

                if (session.status !== "approved") {
                    return res.status(403).send({ message: "Only approved sessions can be deleted" });
                }

                const result = await sessionsCollection.deleteOne({ _id: new ObjectId(id) });
                res.send({ message: "Session deleted successfully", result });
            } catch (err) {
                console.error(err);
                res.status(500).send({ message: "Internal server error" });
            }
        });




        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
    }
}
run().catch(console.dir);

// Basic route
app.get('/', (req, res) => {
    res.send('Welcome to Study Zone Backend!');
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
