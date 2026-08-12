const { getFirebaseAdmin } = require('../config/firebase');

function createAuthMiddlewares(usersCollection) {
    const verifyFBToken = async (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).send({ message: 'unauthorized access' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).send({ message: 'unauthorized access' });
        }

        try {
            const admin = getFirebaseAdmin();
            const decoded = await admin.auth().verifyIdToken(token);
            req.decoded = decoded;
            next();
        } catch (error) {
            return res.status(403).send({ message: 'forbidden access' });
        }
    };

    const verifyRole = (role) => async (req, res, next) => {
        try {
            const email = req.decoded.email;
            const user = await usersCollection.findOne({ email });

            if (!user || user.role !== role) {
                return res.status(403).send({ message: 'forbidden access' });
            }

            next();
        } catch (error) {
            return res.status(500).send({ message: 'internal server error' });
        }
    };

    return {
        verifyFBToken,
        verifyAdmin: verifyRole('admin'),
        verifyTutor: verifyRole('tutor'),
        verifyStudent: verifyRole('student'),
    };
}

module.exports = {
    createAuthMiddlewares,
};
