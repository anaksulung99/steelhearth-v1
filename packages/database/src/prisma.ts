import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const packageRoot = path.resolve(currentDir, "..");
let envBaseDir = process.cwd();

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  dotenv.config({ path: filePath, override: false });
  envBaseDir = path.dirname(filePath);
}

function normalizeConnectionStringPaths(
  rawConnectionString: string,
  baseDir: string,
): string {
  const [base, query] = rawConnectionString.split("?", 2);

  if (!query) {
    return rawConnectionString;
  }

  const params = new URLSearchParams(query);
  const certKeys = ["sslrootcert", "sslcert", "sslkey"] as const;

  for (const key of certKeys) {
    const value = params.get(key);

    if (!value || path.isAbsolute(value)) {
      continue;
    }

    params.set(key, path.resolve(baseDir, value));
  }

  return `${base}?${params.toString()}`;
}

const envCandidates = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(packageRoot, ".env"),
  path.resolve(packageRoot, "..", ".env"),
  path.resolve(packageRoot, "..", "..", ".env"),
  path.resolve(packageRoot, "..", "..", "..", ".env"),
];

for (const candidate of envCandidates) {
  loadEnvFile(candidate);
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is required to initialize Prisma client in @tb/database",
  );
}

const normalizedConnectionString = normalizeConnectionStringPaths(
  connectionString,
  envBaseDir,
);

declare global {
  // Reuse Prisma client during local development and watch mode.
  // eslint-disable-next-line no-var
  var __tbPrisma__: PrismaClient | undefined;
}

const adapter = new PrismaPg({ connectionString: normalizedConnectionString });

const prisma =
  globalThis.__tbPrisma__ ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__tbPrisma__ = prisma;
}

export { prisma };
export * from "@prisma/client";
