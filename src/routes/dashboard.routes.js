const { Router } = require('express');

function createDashboardRoutes(collections, auth) {
    const router = Router();
    const {
        bookedSessionCollection,
        materialsCollection,
        notesCollection,
        reviewsCollection,
        sessionsCollection,
        usersCollection,
    } = collections;
    const { verifyFBToken } = auth;

    router.get('/dashboard/:email', verifyFBToken, async (req, res) => {
        try {
            const { email } = req.params;
            if (!email) {
                return res.status(400).send({ message: 'Email is required' });
            }

            const user = await usersCollection.findOne({ email });
            if (!user) {
                return res.status(404).send({ message: 'User not found' });
            }

            const role = user.role || 'student';

            if (role === 'admin') {
                const [
                    totalUsers,
                    totalStudents,
                    totalTutors,
                    totalSessions,
                    approvedSessions,
                    pendingSessions,
                    rejectedSessions,
                    totalBookings,
                    totalReviews,
                    totalMaterials,
                ] = await Promise.all([
                    usersCollection.countDocuments(),
                    usersCollection.countDocuments({ role: 'student' }),
                    usersCollection.countDocuments({ role: 'tutor' }),
                    sessionsCollection.countDocuments(),
                    sessionsCollection.countDocuments({ status: 'approved' }),
                    sessionsCollection.countDocuments({ status: 'pending' }),
                    sessionsCollection.countDocuments({ status: 'rejected' }),
                    bookedSessionCollection.countDocuments(),
                    reviewsCollection.countDocuments(),
                    materialsCollection.countDocuments(),
                ]);

                return res.send({
                    role,
                    stats: {
                        totalUsers,
                        totalStudents,
                        totalTutors,
                        totalSessions,
                        approvedSessions,
                        pendingSessions,
                        rejectedSessions,
                        totalBookings,
                        totalReviews,
                        totalMaterials,
                    },
                });
            }

            if (role === 'tutor') {
                const tutorSessions = await sessionsCollection
                    .find({ tutorEmail: email }, { projection: { _id: 1 } })
                    .toArray();
                const sessionIds = tutorSessions.map((session) => session._id.toString());

                const [
                    totalSessions,
                    approvedSessions,
                    pendingSessions,
                    rejectedSessions,
                    totalBookings,
                    totalReviews,
                    totalMaterials,
                ] = await Promise.all([
                    sessionsCollection.countDocuments({ tutorEmail: email }),
                    sessionsCollection.countDocuments({ tutorEmail: email, status: 'approved' }),
                    sessionsCollection.countDocuments({ tutorEmail: email, status: 'pending' }),
                    sessionsCollection.countDocuments({ tutorEmail: email, status: 'rejected' }),
                    bookedSessionCollection.countDocuments({ sessionId: { $in: sessionIds } }),
                    reviewsCollection.countDocuments({ sessionId: { $in: sessionIds } }),
                    materialsCollection.countDocuments({ tutorEmail: email }),
                ]);

                return res.send({
                    role,
                    stats: {
                        totalSessions,
                        approvedSessions,
                        pendingSessions,
                        rejectedSessions,
                        totalBookings,
                        totalReviews,
                        totalMaterials,
                    },
                });
            }

            const bookedSessions = await bookedSessionCollection
                .find({ email }, { projection: { sessionId: 1 } })
                .toArray();
            const sessionIds = bookedSessions.map((session) => session.sessionId);

            const [
                totalBookings,
                totalNotes,
                totalReviews,
                totalMaterials,
            ] = await Promise.all([
                bookedSessionCollection.countDocuments({ email }),
                notesCollection.countDocuments({ email }),
                reviewsCollection.countDocuments({ reviewerEmail: email }),
                materialsCollection.countDocuments({ sessionId: { $in: sessionIds } }),
            ]);

            return res.send({
                role: 'student',
                stats: {
                    totalBookings,
                    totalNotes,
                    totalReviews,
                    totalMaterials,
                },
            });
        } catch (error) {
            console.error('Error fetching dashboard:', error);
            res.status(500).send({ message: 'Failed to fetch dashboard data' });
        }
    });

    return router;
}

module.exports = {
    createDashboardRoutes,
};
