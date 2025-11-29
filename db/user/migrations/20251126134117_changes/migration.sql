/*
  Warnings:

  - You are about to drop the column `product` on the `Cart` table. All the data in the column will be lost.
  - You are about to drop the column `items` on the `Orders` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `Orders` table. All the data in the column will be lost.
  - Added the required column `productID` to the `Cart` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productID` to the `Orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity` to the `Orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Cart" DROP COLUMN "product",
ADD COLUMN     "productID" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Orders" DROP COLUMN "items",
DROP COLUMN "total",
ADD COLUMN     "productID" INTEGER NOT NULL,
ADD COLUMN     "quantity" INTEGER NOT NULL;
