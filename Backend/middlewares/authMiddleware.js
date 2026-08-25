const jwt = require('jsonwebtoken');
const db = require('../config/connectDB');

const authUser = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            return res.status(401).json({ status: "failed", message: "Not authorized, no token" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Execute query using Turso's db.execute API
        const result = await db.execute({
            sql: 'SELECT id, full_name, email, role, is_active FROM users WHERE id = ?',
            args: [decoded.id]
        });
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ status: "failed", message: "User not found" });
        }
        if (!user.is_active) {
            return res.status(403).json({ status: "failed", message: "Account is deactivated" });
        }
        req.user = user;
        next();
    } catch (error) {
        console.log(error);
        return res.status(401).json({ status: "failed", message: "Not authorized, invalid token" });
    }
};

module.exports = authUser;