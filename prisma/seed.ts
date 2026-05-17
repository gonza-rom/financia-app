// prisma/seed.ts
// Run with: npx tsx prisma/seed.ts
// Note: requires a user to already exist in the DB.
// Usage: SEED_USER_ID=your-user-id npx tsx prisma/seed.ts

import { PrismaClient, TransactionType } from "@prisma/client";

const prisma = new PrismaClient();

const EXPENSE_CATEGORIES = [
  { name: "Housing", color: "#3b82f6", icon: "home" },
  { name: "Food & Dining", color: "#f97316", icon: "utensils" },
  { name: "Transport", color: "#8b5cf6", icon: "car" },
  { name: "Health", color: "#ef4444", icon: "heart" },
  { name: "Entertainment", color: "#ec4899", icon: "music" },
  { name: "Shopping", color: "#f59e0b", icon: "shopping-bag" },
  { name: "Education", color: "#14b8a6", icon: "book" },
  { name: "Utilities", color: "#6b7280", icon: "zap" },
  { name: "Travel", color: "#06b6d4", icon: "plane" },
  { name: "Other", color: "#84cc16", icon: "more-horizontal" },
];

const INCOME_CATEGORIES = [
  { name: "Salary", color: "#22c55e", icon: "briefcase" },
  { name: "Freelance", color: "#10b981", icon: "laptop" },
  { name: "Investments", color: "#3b82f6", icon: "trending-up" },
  { name: "Business", color: "#8b5cf6", icon: "building" },
  { name: "Other Income", color: "#6b7280", icon: "plus-circle" },
];

async function main() {
  const userId = process.env.SEED_USER_ID;

  if (!userId) {
    console.error("❌  Set SEED_USER_ID env var before running seed.");
    console.error("    Example: SEED_USER_ID=your-user-id npx tsx prisma/seed.ts");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    console.error(`❌  User ${userId} not found. Log in to the app first to create your user record.`);
    process.exit(1);
  }

  console.log(`🌱  Seeding categories for ${user.email}…`);

  const existing = await prisma.category.count({ where: { userId } });
  if (existing > 0) {
    console.log(`⚠️   User already has ${existing} categories. Skipping.`);
    return;
  }

  await prisma.category.createMany({
    data: [
      ...EXPENSE_CATEGORIES.map((c) => ({ ...c, type: TransactionType.EXPENSE, userId })),
      ...INCOME_CATEGORIES.map((c) => ({ ...c, type: TransactionType.INCOME, userId })),
    ],
  });

  console.log(`✅  Created ${EXPENSE_CATEGORIES.length} expense + ${INCOME_CATEGORIES.length} income categories.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());