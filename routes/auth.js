const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { UserDB } = require("../db/user/config");
const { isStrongPassword } = require("../middleware/passwordValidator");

const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log(email, password);
  const details = await UserDB.User.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (!details) {
    return res
      .status(401)
      .json({ status: "failed", message: "User does not exist." });
  }

  const match = await bcrypt.compare(password, details.password);
  if (!match) {
    return res
      .status(401)
      .json({ status: "failed", message: "Invalid Password." });
  }
  const token = jwt.sign(
    { id: details.id, email: details.email, name: details.name },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.status(200).json({ status: "success", token });
});

router.post("/signup", isStrongPassword, async (req, res) => {
  const { name, email, password } = req.body;
  const existingUser = await UserDB.User.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (existingUser) {
    return res
      .status(400)
      .json({ status: "failed", message: "Email already exists" });
  }
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  try {
    const response = await UserDB.User.create({
      data: {
        name: name,
        email: email,
        password: hashedPassword,
      },
    });

    const token = jwt.sign(
      { id: response.id, email: response.email, name: response.name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    return res.status(200).json({ status: "success", token });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ status: "failed", message: err.message });
  }
});

module.exports = router;


