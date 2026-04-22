-- Migration: wallet_transactions
-- Move transactions from portfolio scope to user scope.
-- Transactions (DEPOSIT/WITHDRAWAL) belong to the user's global wallet,
-- not to individual portfolios.

-- Step 1: Add user_id column as nullable first (needed for data migration)
ALTER TABLE "transactions" ADD COLUMN "user_id" TEXT;

-- Step 2: Populate user_id from the portfolio owner (data migration)
UPDATE "transactions" t
SET "user_id" = p."user_id"
FROM "portfolios" p
WHERE t."portfolio_id" = p."id";

-- Step 3: Make user_id NOT NULL once populated
ALTER TABLE "transactions" ALTER COLUMN "user_id" SET NOT NULL;

-- Step 4: Drop the portfolio_id FK constraint and column
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_portfolio_id_fkey";
ALTER TABLE "transactions" DROP COLUMN "portfolio_id";

-- Step 5: Add FK constraint from user_id → users
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 6: Drop old index and create new one
DROP INDEX IF EXISTS "transactions_portfolio_id_date_idx";
CREATE INDEX "transactions_user_id_date_idx" ON "transactions"("user_id", "date" DESC);
