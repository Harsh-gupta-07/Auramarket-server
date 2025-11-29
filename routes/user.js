const express = require("express");
const jwt = require("jsonwebtoken");
const { UserDB } = require("../db/user/config");
const { authenticate } = require("../middleware/authenticate");
const { hydrateOrdersWithProducts } = require("../utils/hydrateOrdersWithProducts");
const { hydrateFavoritesWithProducts } = require("../utils/hydrateFavoritesWithProducts");

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
            city: true,
            state: true,
            pincode: true,
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
            status: true,
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
    const formattedFavorites = await hydrateFavoritesWithProducts(user.favourites);

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        addresses: user.addresses,
        favourites: formattedFavorites,
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

// PUT /api/user/update
router.put("/user/update", authenticate, async (req, res) => {
  const { name, email } = req.body;
  try {
    const user = await UserDB.User.update({
      where: { id: req.user.id },
      data: { name, email },
    });

    return res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Failed to update profile", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update profile" });
  }
});

// PUT /api/address/default
router.put("/address/default", authenticate, async (req, res) => {
  const { addressId } = req.body;

  if (!addressId) {
    return res
      .status(400)
      .json({ success: false, message: "Address ID is required" });
  }

  try {
    const address = await UserDB.Address.findFirst({
      where: { id: addressId, userId: req.user.id },
    });

    if (!address) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    }

    await UserDB.$transaction([
      UserDB.Address.updateMany({
        where: { userId: req.user.id },
        data: { isPrimary: false },
      }),
      UserDB.Address.update({
        where: { id: addressId },
        data: { isPrimary: true },
      }),
    ]);

    return res.json({ success: true, message: "Default address updated" });
  } catch (err) {
    console.error("Failed to update default address", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});



// DELETE /api/address/remove
router.delete("/address/remove", authenticate, async (req, res) => {
  const { addressId } = req.body;

  if (!addressId) {
    return res
      .status(400)
      .json({ success: false, message: "Address ID is required" });
  }

  try {
    const address = await UserDB.Address.findFirst({
      where: { id: addressId, userId: req.user.id },
    });

    if (!address) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    }

    await UserDB.Address.delete({
      where: { id: addressId },
    });

    return res.json({ success: true, message: "Address removed successfully" });
  } catch (err) {
    console.error("Failed to remove address", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to remove address" });
  }
});

// PUT /api/address/update
router.put("/address/update", authenticate, async (req, res) => {
  console.log(req.body);
  const {
    id,
    label,
    name,
    addressLine,
    city,
    state,
    pincode,
    phone,
    instructions,
    isPrimary,
  } = req.body;

  if (!id) {
    return res
      .status(400)
      .json({ success: false, message: "Address ID is required" });
  }

  try {
    const address = await UserDB.Address.findFirst({
      where: { id: id, userId: req.user.id },
    });

    if (!address) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    }

    if (isPrimary) {
      await UserDB.Address.updateMany({
        where: { userId: req.user.id },
        data: { isPrimary: false },
      });
    }

    const updatedAddress = await UserDB.Address.update({
      where: { id: id },
      data: {
        label,
        name,
        addressLine,
        city,
        state,
        pincode,
        phone,
        instructions,
        isPrimary: isPrimary || false,
      },
    });

    return res.json({
      success: true,
      message: "Address updated successfully",
      address: updatedAddress,
    });
  } catch (err) {
    console.error("Failed to update address", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update address" });
  }
});

// POST /api/address/add
router.post("/address/add", authenticate, async (req, res) => {
  const {
    label,
    name,
    addressLine,
    city,
    state,
    pincode,
    phone,
    instructions,
    isPrimary,
  } = req.body;

  if (!name || !addressLine || !city || !state || !pincode || !phone) {
    return res.status(400).json({
      success: false,
      message: "Please provide all required fields",
    });
  }

  try {
    if (isPrimary) {
      await UserDB.Address.updateMany({
        where: { userId: req.user.id },
        data: { isPrimary: false },
      });
    }

    const address = await UserDB.Address.create({
      data: {
        userId: req.user.id,
        label,
        name,
        addressLine,
        city,
        state,
        pincode,
        phone,
        instructions,
        isPrimary: isPrimary || false,
      },
    });

    return res.json({
      success: true,
      message: "Address added successfully",
      address,
    });
  } catch (err) {
    console.error("Failed to add address", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to add address" });
  }
});

module.exports = router;


