const express = require("express");
const { UserDB } = require("../db/user/config");
const { authenticate } = require("../middleware/authenticate");
const { hydrateCartWithProducts } = require("../utils/hydrateCartWithProducts");

const router = express.Router();

router.post("/add", authenticate, async (req, res) => {
    const { productId, quantity = 1 } = req.body;
    const userId = req.user.id;

    try {
        const existingCartItem = await UserDB.Cart.findFirst({
            where: { userId, productID: productId },
        });

        if (existingCartItem) {
            return res.status(400).json({ success: false, message: "Item already in cart" });
        } else {
            await UserDB.Cart.create({
                data: {
                    userId,
                    productID: productId,
                    quantity,
                },
            });
        }

        return res.json({ success: true, message: "Added to cart" });
    } catch (err) {
        console.error("Failed to add to cart", err);
        return res.status(500).json({ success: false, message: "Failed to add to cart" });
    }
});

router.delete("/remove", authenticate, async (req, res) => {
    const { cartID } = req.body;
    const userId = req.user.id;

    try {
        const cartItem = await UserDB.Cart.findFirst({
            where: { userId, id: cartID },
        });

        if (cartItem) {
            await UserDB.Cart.delete({
                where: { id: cartItem.id },
            });
        }

        return res.json({ success: true, message: "Removed from cart" });
    } catch (err) {
        console.error("Failed to remove from cart", err);
        return res.status(500).json({ success: false, message: "Failed to remove from cart" });
    }
});

router.put("/increase", authenticate, async (req, res) => {
    const { cartID } = req.body;
    const userId = req.user.id;
    // console.log(userId, productId);
    try {
        const cartItem = await UserDB.Cart.findFirst({
            where: { userId, id: cartID },
        });

        if (cartItem) {
            await UserDB.Cart.update({
                where: { id: cartItem.id },
                data: { quantity: cartItem.quantity + 1 },
            });
            return res.json({ success: true, message: "Quantity increased" });
        }

        return res.status(404).json({ success: false, message: "Item not found in cart" });
    } catch (err) {
        console.error("Failed to increase quantity", err);
        return res.status(500).json({ success: false, message: "Failed to increase quantity" });
    }
});

router.put("/decrease", authenticate, async (req, res) => {
    const { cartID } = req.body;
    const userId = req.user.id;

    try {
        const cartItem = await UserDB.Cart.findFirst({
            where: { userId, id: cartID },
        });

        if (cartItem) {
            if (cartItem.quantity > 1) {
                await UserDB.Cart.update({
                    where: { id: cartItem.id },
                    data: { quantity: cartItem.quantity - 1 },
                });
                return res.json({ success: true, message: "Quantity decreased" });
            } else {
                return res.status(400).json({ success: false, message: "Quantity cannot be less than 1" });
            }
        }

        return res.status(404).json({ success: false, message: "Item not found in cart" });
    } catch (err) {
        console.error("Failed to decrease quantity", err);
        return res.status(500).json({ success: false, message: "Failed to decrease quantity" });
    }
});

router.get("/get", authenticate, async (req, res) => {
    const userId = req.user.id;

    try {
        const cartItems = await UserDB.Cart.findMany({
            where: { userId },
            orderBy: { id: "asc" },
        });

        const formattedCart = await hydrateCartWithProducts(cartItems);

        const arrivalDate = new Date();
        arrivalDate.setDate(arrivalDate.getDate() + 4);

        return res.json({ success: true, cart: formattedCart, arrival: arrivalDate });
    } catch (err) {
        console.error("Failed to fetch cart", err);
        return res.status(500).json({ success: false, message: "Failed to fetch cart" });
    }
});

module.exports = router;
