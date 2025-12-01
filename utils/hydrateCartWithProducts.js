const { ProductDB } = require("../db/products/config");

const hydrateCartWithProducts = async (cartItems) => {
    if (!cartItems || !cartItems.length) {
        return [];
    }

    const productIds = [
        ...new Set(cartItems.map((item) => item.productID).filter(Boolean)),
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

    return cartItems.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        product: productMap.get(item.productID) || null,
    }));
};

module.exports = { hydrateCartWithProducts };
