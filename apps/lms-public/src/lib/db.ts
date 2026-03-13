let prismaClient: import("@repo/db").PrismaClient | null = null;

export async function getDb() {
  if (prismaClient) return prismaClient;
  try {
    const { prisma } = await import("@repo/db");
    prismaClient = prisma;
    return prisma;
  } catch {
    return null;
  }
}
