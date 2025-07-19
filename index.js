require('dotenv').config()
const express = require('express')
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
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
