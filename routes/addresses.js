const express = require("express");
const { UserDB } = require("../db/user/config");
const { authenticate } = require("../middleware/authenticate");
const router = express.Router();

router.put("/default", authenticate, async (req, res) => {
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
router.delete("/remove", authenticate, async (req, res) => {
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

router.put("/update", authenticate, async (req, res) => {
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

router.post("/add", authenticate, async (req, res) => {
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