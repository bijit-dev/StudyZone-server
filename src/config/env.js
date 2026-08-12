require('dotenv').config();

const env = {
    port: process.env.PORT || 5000,
    mongodbUri: process.env.MONGODB_URI || `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hbxtbz2.mongodb.net/?appName=Cluster0`,
    firebaseServiceKey: process.env.FB_SERVICE_KEY,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
};

module.exports = {
    env,
};
