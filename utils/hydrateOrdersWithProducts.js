const { ProductDB } = require("../db/products/config");

const hydrateOrdersWithProducts = async (orders) => {
  if (!orders.length) {
    return [];
  }

  const productIds = [
    ...new Set(orders.map((order) => order.productID).filter(Boolean)),
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

  return orders.map((order) => ({
    id: order.id,
    quantity: order.quantity,
    orderedAt: order.createdAt,
    product: productMap.get(order.productID) || null,
  }));
};

module.exports = { hydrateOrdersWithProducts };


