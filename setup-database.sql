-- Migrations para Expense Tracker
-- Execute este SQL no Neon SQL Editor: https://console.neon.tech

-- CreateTable: User
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Expense
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "fileName" TEXT,
    "filePath" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Category
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: User
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex: Expense
CREATE INDEX "Expense_userId_idx" ON "Expense"("userId");
CREATE INDEX "Expense_date_idx" ON "Expense"("date");
CREATE INDEX "Expense_category_idx" ON "Expense"("category");

-- CreateIndex: Category
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- AddForeignKey: Expense -> User
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;
