const express = require("express");
const { ProductDB } = require("../db/products/config");

const router = express.Router();

router.get("/", async (req, res) => {
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

router.get("/products", async (req, res) => {
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

router.get("/distinct-categories", async (req, res) => {
  try {
    const categories = await ProductDB.product.findMany({
      select: {
        mainCategory: true,
      },
      distinct: ["mainCategory"],
    });
    res.json({
      success: true,
      categories: categories.map((category) => category.mainCategory),
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/product/:id", async (req, res) => {
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

module.exports = router;


