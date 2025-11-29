require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const userRoutes = require("./routes/user");

const app = express();

app.use(cors());
app.use(express.json());

// All API routes are prefixed with /api
app.use("/api/auth", authRoutes);
app.use("/api", productRoutes);
app.use("/api", userRoutes);

const port = process.env.PORT || 10000;

app.listen(port, () => {
  console.log("Server started at " + port);
});
