const express = require("express");
const jwt = require("jsonwebtoken");
const { UserDB } = require("../db/user/config");
const { authenticate } = require("../middleware/authenticate");
const { hydrateOrdersWithProducts } = require("../utils/hydrateOrdersWithProducts");

const router = express.Router();

// GET /api/profile
router.get("/profile", authenticate, async (req, res) => {
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


// GET /api/me
router.get("/me", authenticate, async (req, res) => {
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

module.exports = router;


