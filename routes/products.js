const express = require("express");
const { ProductDB } = require("../db/products/config");

const router = express.Router();

router.get("/", async (req, res) => {
  res.json({status: "OK"});
});

router.get("/products", async (req, res) => {
  const {
    page = 1,
    limit = 15,
    categories,
    minPrice,
    maxPrice,
    minRating,
    sortBy,
    keyword,
  } = req.query;

  // console.log(req.query);

  try {
    const where = {};

    if (categories) {
      const categoryArray = Array.isArray(categories)
        ? categories
        : [categories];
      where.mainCategory = { in: categoryArray };
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (minRating) {
      where.averageRating = { gte: parseFloat(minRating) };
    }

    if (keyword) {
      where.title = { contains: keyword, mode: "insensitive" };
    }

    let orderBy = { id: "asc" };
    if (sortBy) {
      switch (sortBy) {
        case "id_desc":
          orderBy = { id: "desc" };
          break;
        case "price_desc":
          orderBy = { price: "desc" };
          break;
        case "price_asc":
          orderBy = { price: "asc" };
          break;
        case "rating":
          orderBy = { averageRating: "desc" };
          break;
        default:
          orderBy = { id: "asc" };
      }
    }

    const products = await ProductDB.product.findMany({
      take: parseInt(limit, 10),
      skip: (parseInt(page, 10) - 1) * parseInt(limit, 10),
      where,
      orderBy,
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
    });

    const formatted = products.map((product) => ({
      id: product.id,
      name: product.title,
      price: product.price,
      image: product.images[0]?.hiRes || null,
      mainCategory: product.mainCategory,
      averageRating: product.averageRating,
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Failed to fetch products", error);
    res
      .status(500)
      .json({ success: false, message: "Unable to fetch products" });
  }
});

router.get("/top-rated", async (req, res) => {
  try {
    const products = await ProductDB.product.findMany({
      take: 6,
      orderBy: {
        ratingNumber: "desc",
      },
      select: {
        id: true,
        title: true,
        price: true,
        mainCategory: true,
        averageRating: true,
        ratingNumber: true,
        images: {
          select: {
            hiRes: true,
          },
          take: 1,
        },
      },
    });

    const formatted = products.map((product) => ({
      id: product.id,
      name: product.title,
      price: product.price,
      image: product.images[0]?.hiRes || null,
      mainCategory: product.mainCategory,
      averageRating: product.averageRating,
      ratingNumber: product.ratingNumber,
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Failed to fetch top rated products", error);
    res
      .status(500)
      .json({ success: false, message: "Unable to fetch top rated products" });
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


