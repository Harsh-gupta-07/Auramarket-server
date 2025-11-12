const express = require("express");
const bcrypt = require("bcryptjs");
const app = express();
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const { isStrongPassword } = require("./middleware/passwordValidator");
const jwt = require("jsonwebtoken");
const prisma = new PrismaClient();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).send("Working");
});

app.get("/prisma", async (req, res) => {
  const response = await prisma.User.findMany();
  res.json(response);
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const details = await prisma.User.findUnique({ where: { email: email.toLowerCase() } });
  if (!details) {
    return res
      .status(401)
      .json({ status: "failed", message: "User does not exist." });
  }

  const match = await bcrypt.compare(password,details.password)
  if (!match){
    return res.status(401).json({status: "failed", message:"Invalid Password."})
  }
  const token = jwt.sign(
      { id: details.id, email: details.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

  res.status(200).json({status: "success",token})
});

app.post("/signup", isStrongPassword, async (req, res) => {
  const { name, email, password } = req.body;
  const existingUser = await prisma.User.findUnique({ where: { email: email.toLowerCase() } });
  if (existingUser) {
    return res
      .status(400)
      .json({ status: "failed", message: "Email already exists" });
  }
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  try {
    const response = await prisma.User.create({
      data: {
        name: name,
        email: email,
        password: hashedPassword,
      },
    });

    const token = jwt.sign(
      { id: response.id, email: response.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    return res.status(200).json({ status: "success", token });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ status: "failed", message: err.message });
  }
});

const port = process.env.PORT || 10000;

app.listen(port, () => {
  console.log("Server started at " + port);
});
