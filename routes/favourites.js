const express = require("express");
const { UserDB } = require("../db/user/config");
const { authenticate } = require("../middleware/authenticate");
const router = express.Router();


router.post("/add", authenticate, async (req, res) => {
    const { productId } = req.body;
    if (!productId) {
        return res
            .status(400)
            .json({ success: false, message: "Product ID is required" });
    }

    try {
        const existingFavourite = await UserDB.Favourite.findFirst({
            where: {
                userId: req.user.id,
                product: String(productId),
            },
        });

        if (existingFavourite) {
            return res
                .status(400)
                .json({ success: false, message: "Product is already in favourites" });
        }

        await UserDB.Favourite.create({
            data: {
                userId: req.user.id,
                product: String(productId),
            },
        });

        return res.json({
            success: true,
            message: "Product added to favourites",
        });
    } catch (err) {
        console.error("Failed to add to favourites", err);
        return res
            .status(500)
            .json({ success: false, message: "Failed to add to favourites" });
    }
});

router.delete("/remove", authenticate, async (req, res) => {
    const { productId } = req.body;
    if (!productId) {
        return res
            .status(400)
            .json({ success: false, message: "Product ID is required" });
    }

    try {
        const favourite = await UserDB.Favourite.findFirst({
            where: {
                userId: req.user.id,
                product: String(productId),
            },
        });

        if (!favourite) {
            return res
                .status(404)
                .json({ success: false, message: "Product not found in favourites" });
        }

        await UserDB.Favourite.delete({
            where: { id: favourite.id },
        });

        return res.json({
            success: true,
            message: "Product removed from favourites",
        });
    } catch (err) {
        console.error("Failed to remove from favourites", err);
        return res
            .status(500)
            .json({ success: false, message: "Failed to remove from favourites" });
    }
});

router.get("/check/:productId", authenticate, async (req, res) => {
    const { productId } = req.params;

    try {
        const favourite = await UserDB.Favourite.findFirst({
            where: {
                userId: req.user.id,
                product: String(productId),
            },
        });

        return res.json({
            success: true,
            isFavourite: !!favourite,
        });
    } catch (err) {
        console.error("Failed to check favourite status", err);
        return res
            .status(500)
            .json({ success: false, message: "Failed to check favourite status" });
    }
});

module.exports = router;
