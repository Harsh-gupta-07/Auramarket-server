const express = require("express");
const { UserDB } = require("../db/user/config");
const { authenticate } = require("../middleware/authenticate");

const router = express.Router();

router.post("/", authenticate, async (req, res) => {
    const userId = req.user.id;
    const { addressID } = req.body;

    try {
        let finalAddressID = addressID;

        if (!finalAddressID) {
            const primaryAddress = await UserDB.Address.findFirst({
                where: { userId, isPrimary: true },
            });
            if (primaryAddress) {
                finalAddressID = primaryAddress.id;
            }
        }

        if (!finalAddressID) {
            return res.status(400).json({
                success: false,
                message: "Address ID is required or no primary address found",
            });
        }

        const cartItems = await UserDB.Cart.findMany({
            where: { userId },
        });

        if (cartItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Cart is empty",
            });
        }

        await UserDB.$transaction(async (prisma) => {
            for (const item of cartItems) {
                await prisma.Orders.create({
                    data: {
                        userId,
                        productID: item.productID,
                        quantity: item.quantity,
                        addressID: finalAddressID,
                        status: "Pending",
                    },
                });
            }

            await prisma.Cart.deleteMany({
                where: { userId },
            });
        });

        return res.json({
            success: true,
            message: "Order placed successfully",
        });

    } catch (err) {
        console.error("Failed to place order", err);
        return res.status(500).json({
            success: false,
            message: "Failed to place order",
        });
    }
});

router.post("/cancel", authenticate, async (req, res) => {
    const userId = req.user.id;
    const { orderId } = req.body;

    if (!orderId) {
        return res.status(400).json({
            success: false,
            message: "Order ID is required",
        });
    }

    try {
        const order = await UserDB.Orders.findFirst({
            where: { id: orderId, userId },
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        await UserDB.Orders.update({
            where: { id: orderId },
            data: { status: "Cancelled" },
        });

        return res.json({
            success: true,
            message: "Order cancelled successfully",
        });
    } catch (err) {
        console.error("Failed to cancel order", err);
        return res.status(500).json({
            success: false,
            message: "Failed to cancel order",
        });
    }
});

module.exports = router;
