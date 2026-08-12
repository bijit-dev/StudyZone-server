const express = require('express');
const cors = require('cors');
const { createAuthMiddlewares } = require('./middlewares/auth');
const { createBookingRoutes } = require('./routes/bookings.routes');
const { createDashboardRoutes } = require('./routes/dashboard.routes');
const { createMaterialRoutes } = require('./routes/materials.routes');
const { createNoteRoutes } = require('./routes/notes.routes');
const { createPaymentRoutes } = require('./routes/payments.routes');
const { createReviewRoutes } = require('./routes/reviews.routes');
const { createSessionRoutes } = require('./routes/sessions.routes');
const { createUserRoutes } = require('./routes/users.routes');

function createApp(collections) {
    const app = express();
    const auth = createAuthMiddlewares(collections.usersCollection);

    app.use(cors({
        origin: '*',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    }));
    app.use(express.json());

    app.get('/', (req, res) => {
        res.send('Welcome to Study Zone Backend!');
    });

    app.use(createUserRoutes(collections, auth));
    app.use(createSessionRoutes(collections, auth));
    app.use(createBookingRoutes(collections, auth));
    app.use(createDashboardRoutes(collections, auth));
    app.use(createReviewRoutes(collections, auth));
    app.use(createNoteRoutes(collections, auth));
    app.use(createMaterialRoutes(collections, auth));
    app.use(createPaymentRoutes(auth));

    app.use((req, res) => {
        res.status(404).send({ message: 'Route not found' });
    });

    return app;
}

module.exports = {
    createApp,
};
