const adminOnly = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ status: "failed", message: "Access denied, admin only" });
    }
    next();
};

module.exports = adminOnly;