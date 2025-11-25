const { PrismaClient } = require("@prisma/client-user");
const UserDB = new PrismaClient();

module.exports = {UserDB}