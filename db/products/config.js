const { PrismaClient } = require("@prisma/client");
const ProductDB = new PrismaClient();

module.exports = {ProductDB}