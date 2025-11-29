require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const app = express();
const cors = require("cors");
const { isStrongPassword } = require("./middleware/passwordValidator");
const jwt = require("jsonwebtoken");
const { UserDB } = require("./db/user/config");
const { ProductDB } = require("./db/products/config");
app.use(cors());
app.use(express.json());

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

const hydrateOrdersWithProducts = async (orders) => {
  if (!orders.length) {
    return [];
  }

  const productIds = [
    ...new Set(orders.map((order) => order.productID).filter(Boolean)),
  ];

  let productMap = new Map();

  if (productIds.length) {
    const products = await ProductDB.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        title: true,
        price: true,
        mainCategory: true,
        averageRating: true,
        images: {
          select: { hiRes: true },
          take: 1,
        },
      },
    });

    productMap = new Map(
      products.map((product) => [
        product.id,
        {
          id: product.id,
          name: product.title,
          price: product.price,
          mainCategory: product.mainCategory,
          averageRating: product.averageRating,
          image: product.images[0]?.hiRes || null,
        },
      ])
    );
  }

  return orders.map((order) => ({
    id: order.id,
    quantity: order.quantity,
    orderedAt: order.createdAt,
    product: productMap.get(order.productID) || null,
  }));
};

app.get("/", async (req, res) => {
  const result = await ProductDB.product.aggregate({
    _min: {
      price: true,
    },
    _max: {
      price: true,
    },
  });
  res.json(result);
});

app.get("/products", async (req, res) => {
  const { page = 1, limit = 15 } = req.query;
  try {
    const products = await ProductDB.product.findMany({
      take: parseInt(limit, 10),
      skip: (parseInt(page, 10) - 1) * parseInt(limit, 10),
      select: {
        id: true,
        title: true,
        price: true,
        mainCategory: true,
        averageRating: true,
        images: {
          select: {
            hiRes: true,
          },
          take: 1,
        },
      },
      orderBy: {
        id: "asc",
      },
    });

    const formatted = products.map((product) => ({
      id: product.id,
      name: product.title,
      price: product.price,
      image: product.images[0]?.hiRes || null,
      mainCategory: product.mainCategory,
      averageRating: product.averageRating,
    }));

    res.json(formatted);
  } catch (error) {
    console.error("Failed to fetch products", error);
    res
      .status(500)
      .json({ success: false, message: "Unable to fetch products" });
  }
});


app.post("/login", async (req, res) => {
  const { email, password } = req.body;
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
    { id: details.id, email: details.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.status(200).json({ status: "success", token });
});

app.post("/signup", isStrongPassword, async (req, res) => {
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

app.get("/profile", authenticate, async (req, res) => {
  const user = await UserDB.User.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    return res
      .status(404)
      .json({ success: false, message: "User record not found" });
  }

  return res.json({
    success: true,
    user,
    token: jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    ),
  });
});

app.get("/orders", authenticate, async (req, res) => {
  try {
    const orders = await UserDB.Orders.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });

    const formattedOrders = await hydrateOrdersWithProducts(orders);

    return res.json({ success: true, orders: formattedOrders });
  } catch (err) {
    console.error("Failed to fetch orders", err);
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired token" });
    }
    return res
      .status(500)
      .json({ success: false, message: "Unable to fetch orders" });
  }
});

app.get("/me", authenticate, async (req, res) => {
  try {
    const user = await UserDB.User.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        addresses: {
          orderBy: [{ isPrimary: "desc" }, { id: "asc" }],
          select: {
            id: true,
            label: true,
            name: true,
            addressLine: true,
            cityLine: true,
            phone: true,
            instructions: true,
            isPrimary: true,
          },
        },
        favourites: {
          select: {
            id: true,
            product: true,
          },
        },
        orders: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            productID: true,
            quantity: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User record not found" });
    }

    const formattedOrders = await hydrateOrdersWithProducts(user.orders);

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        addresses: user.addresses,
        favourites: user.favourites,
        orders: formattedOrders,
      },
    });
  } catch (err) {
    console.error("Failed to fetch user profile", err);
    return res
      .status(500)
      .json({ success: false, message: "Unable to fetch user profile" });
  }
});

app.get("/distinct-categories", async (req, res) => {
  try {
    const categories = await ProductDB.product.findMany({
      select: {
        mainCategory: true,
      },
      distinct: ["mainCategory"],
    });
    res.json({success: true, categories: categories.map((category) => category.mainCategory)});
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/product/:id", async (req, res) => {
  // console.log("product id", req.params.id);
  try {
    const { id } = req.params;
    const product = await ProductDB.product.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        images: {
          select: {
            hiRes: true,
          },
        },
        details: true,
      },
    });
    res.json({ success: true, product });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

const port = process.env.PORT || 10000;

app.listen(port, () => {
  console.log("Server started at " + port);
});
