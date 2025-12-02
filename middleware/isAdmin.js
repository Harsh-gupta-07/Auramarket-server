const { UserDB } = require("../db/user/config");
const isAdmin = async (req, res, next) => {
    try {
        const user = await UserDB.User.findUnique({
            where: { id: req.user.id },
        });

        if (!user || user.role !== "admin") {
            return res.status(403).json({ status: "failed", message: "Access denied" });
        }
        next();
    } catch (err) {
        console.error("Admin check error:", err);
        return res.status(500).json({ status: "failed", message: "Server error during admin check." });
    }
};

module.exports = { isAdmin };
