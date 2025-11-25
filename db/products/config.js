const { PrismaClient } = require("@prisma/client-products");
const ProductDB = new PrismaClient();

module.exports = {ProductDB}