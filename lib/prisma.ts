import { PrismaClient } from "../generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set to connect to the database.");
}

const connectionUrl = new URL(databaseUrl);
const database = decodeURIComponent(connectionUrl.pathname.replace(/^\/+/, ""));

if (!connectionUrl.hostname || !connectionUrl.username || !database) {
  throw new Error("DATABASE_URL must include a host, username, and database.");
}

const adapter = new PrismaMariaDb({
  host: connectionUrl.hostname,
  port: connectionUrl.port ? Number(connectionUrl.port) : 3306,
  user: decodeURIComponent(connectionUrl.username),
  password: decodeURIComponent(connectionUrl.password),
  database,
  connectionLimit: 5,
});

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;