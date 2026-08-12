const { createApp } = require('./src/app');
const { connectToDatabase } = require('./src/config/database');
const { env } = require('./src/config/env');

let appPromise;

async function getApp() {
    if (!appPromise) {
        appPromise = connectToDatabase().then((collections) => createApp(collections));
    }

    return appPromise;
}

if (require.main === module) {
    getApp()
        .then((app) => {
            app.listen(env.port, () => {
                console.log(`Server is running on http://localhost:${env.port}`);
            });
        })
        .catch((error) => {
            console.error('Failed to start server:', error);
            process.exit(1);
        });
}

module.exports = async (req, res) => {
    const app = await getApp();
    return app(req, res);
};
