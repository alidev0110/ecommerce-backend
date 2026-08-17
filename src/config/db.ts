import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "info", "warn", "error"]
      : ["error"],
});

const connectToDatabase = async () => {
  try {
    await prisma.$connect();
    console.log("Successfully connected to the database.");
  } catch (error) {
    console.error("Error connecting to the database:", error);
    throw error;
  }
};

const disconnectFromDatabase = async () => {
  await prisma.$disconnect();
};

export { prisma, connectToDatabase, disconnectFromDatabase };
