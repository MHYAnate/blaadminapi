-- AlterTable
ALTER TABLE "BusinessProfile" ALTER COLUMN "businessName" DROP NOT NULL,
ALTER COLUMN "businessAddress" DROP NOT NULL;

-- AlterTable
ALTER TABLE "UserProfile" ALTER COLUMN "fullName" DROP NOT NULL,
ALTER COLUMN "address" DROP NOT NULL,
ALTER COLUMN "dob" DROP NOT NULL;
