-- DropIndex
DROP INDEX "Role_name_key";

-- AlterTable
ALTER TABLE "Role" ALTER COLUMN "description" SET DEFAULT '';

--- CreateIndex
CREATE UNIQUE INDEX "Role_name_key"
   ON "Role" (name)
   WHERE "deletedAt" IS NULL;