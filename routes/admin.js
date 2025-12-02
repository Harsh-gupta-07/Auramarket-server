const express = require("express");
const { UserDB } = require("../db/user/config");
const { authenticate } = require("../middleware/authenticate");
const { isAdmin } = require("../middleware/isAdmin");

const router = express.Router();

router.get("/orders", authenticate, isAdmin, async (req, res) => {
    const { page = 1, limit = 15 } = req.query;
    try {
        const orders = await UserDB.orders.findMany({
            take: limit,
            skip: (page - 1) * limit,
            orderBy: { createdAt: "desc" },
            include: {
                user: {
                    select: { name: true, email: true },
                },
            },
        });
        res.status(200).json({ status: "success", orders });
    } catch (err) {
        console.error("Fetch orders error:", err);
        res.status(500).json({ status: "failed", message: "Failed to fetch orders." });
    }
});

router.put("/order/status", authenticate, isAdmin, async (req, res) => {
    const { orderId, status } = req.body;

    if (!orderId || !status) {
        return res.status(400).json({ status: "failed", message: "Order ID and status are required." });
    }

    try {
        const updatedOrder = await UserDB.orders.update({
            where: { id: parseInt(orderId) },
            data: { status },
        });
        res.status(200).json({ status: "success", message: "Order status updated.", order: updatedOrder });
    } catch (err) {
        console.error("Update order status error:", err);
        res.status(500).json({ status: "failed", message: "Failed to update order status." });
    }
});

module.exports = router;
