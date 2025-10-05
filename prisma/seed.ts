import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const id = process.env.DEV_USER_ID || "dev-user-0001";
  const email = process.env.DEV_USER_EMAIL || "dev@example.com";
  await prisma.user.upsert({
    where: { id },
    create: { id, email, name: "Dev User" },
    update: {},
  });
}
main().finally(() => prisma.$disconnect());
