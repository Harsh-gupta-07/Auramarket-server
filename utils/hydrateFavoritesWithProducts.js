const { ProductDB } = require("../db/products/config");

const hydrateFavoritesWithProducts = async (favorites) => {
  if (!favorites || !favorites.length) {
    return [];
  }

  // Extract product IDs, converting strings to integers
  const productIds = [
    ...new Set(
      favorites
        .map((fav) => parseInt(fav.product, 10))
        .filter((id) => !isNaN(id))
    ),
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

  return favorites.map((fav) => {
    const productId = parseInt(fav.product, 10);
    return {
      id: fav.id,
      product: productMap.get(productId) || null,
    };
  });
};

module.exports = { hydrateFavoritesWithProducts };
