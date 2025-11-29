const jwt = require("jsonwebtoken");

// Central auth middleware to keep token handling consistent across routes.
const authenticate = (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res
      .status(401)
      .json({ success: false, message: "Authorization header missing" });
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.substring(7)
    : authHeader;

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, email: payload.email, name: payload.name };
    return next();
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
};

module.exports = { authenticate };


