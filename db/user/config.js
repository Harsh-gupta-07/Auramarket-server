const { PrismaClient } = require("@prisma/client");
const UserDB = new PrismaClient();

module.exports = {UserDB}