require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const userRoutes = require("./routes/user");
const addressRoutes = require("./routes/addresses");
const favouritesRoutes = require("./routes/favourites");
const cartRoutes = require("./routes/cart");
const ordersRoutes = require("./routes/orders");
const adminRoutes = require("./routes/admin");
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api", productRoutes);
app.use("/api", userRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/favourites", favouritesRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/admin", adminRoutes);

module.exports = app;

if (require.main === module) {
  const port = process.env.PORT || 10000;
  app.listen(port, () => {
    console.log("Server started at " + port);
  });
}
