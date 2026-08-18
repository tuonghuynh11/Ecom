-- DropIndex
DROP INDEX "User_email_key";

-- DropIndex
DROP INDEX "User_totpSecret_key";


--- CreateIndex
CREATE UNIQUE INDEX "User_email_key"
   ON "User" (email)
   WHERE "deletedAt" IS NULL;