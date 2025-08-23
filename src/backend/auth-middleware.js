// src/backend/auth-middleware.js
function requireAuth(req, res, next) {
    if (req.session.user && req.session.access_token) {
        next();
    } else {
        res.status(401).json({ error: 'Authentication required' });
    }
}

module.exports = { requireAuth };