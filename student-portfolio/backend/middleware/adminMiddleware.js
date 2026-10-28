/**
 * adminMiddleware
 * Must be used AFTER authMiddleware (requires req.user to be set).
 * Checks that the authenticated user has the 'admin' role via a
 * fresh database lookup — never trusts client-supplied role claims.
 */
const User = require('../models/User');

async function adminMiddleware(req, res, next) {
    try {
        const user = await User.findById(req.user.id).select('role');

        if (!user || user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        req.user.role = 'admin';
        next();
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Authorization check failed'
        });
    }
}

module.exports = adminMiddleware;
