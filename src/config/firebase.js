const admin = require('firebase-admin');
const { env } = require('./env');

function getFirebaseAdmin() {
    if (!admin.apps.length) {
        if (!env.firebaseServiceKey) {
            throw new Error('FB_SERVICE_KEY is required');
        }

        const decodedKey = Buffer.from(env.firebaseServiceKey, 'base64').toString('utf8');
        const serviceAccount = JSON.parse(decodedKey);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    }

    return admin;
}

module.exports = {
    getFirebaseAdmin,
};
