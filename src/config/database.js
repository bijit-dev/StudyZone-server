const dns = require('dns');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { env } = require('./env');

let collectionsPromise;

function applyDnsWorkaround() {
    if (dns.getServers().some((server) => server.startsWith('127.'))) {
        dns.setServers(['8.8.8.8', '1.1.1.1']);
    }
}

async function connectToDatabase() {
    if (collectionsPromise) {
        return collectionsPromise;
    }

    applyDnsWorkaround();

    const client = new MongoClient(env.mongodbUri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        },
    });

    collectionsPromise = client.connect()
        .then(() => {
            const db = client.db('studyZone_DB');

            return {
                client,
                ObjectId,
                sessionsCollection: db.collection('sessions'),
                usersCollection: db.collection('users'),
                bookedSessionCollection: db.collection('bookedSession'),
                reviewsCollection: db.collection('sessionReviews'),
                notesCollection: db.collection('notes'),
                materialsCollection: db.collection('materials'),
            };
        })
        .catch((error) => {
            collectionsPromise = null;
            throw error;
        });

    return collectionsPromise;
}

module.exports = {
    connectToDatabase,
    ObjectId,
};
