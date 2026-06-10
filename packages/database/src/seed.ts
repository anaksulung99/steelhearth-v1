import bcrypt from "bcryptjs";
import crypto from "crypto"
import { prisma } from "./prisma.js";

const seedUserEmail = process.env.SEED_USER_EMAIL?.trim() || "admin@traffickboost.local";
const seedUserName = process.env.SEED_USER_NAME?.trim() || "Admin";
const seedUserPassword = process.env.SEED_USER_PASSWORD?.trim() || "password";

// Must match DEFAULT_USER_ID hardcoded in all API route files
const DEFAULT_USER_ID = "cmq7linvb0000k8vqj3iz8gt0";

export const generateLicenseKey = (): string => {
  const timestamp = Date.now().toString()
  const randomHex = crypto.randomBytes(16).toString("hex")

  const rawKey = `ST-${timestamp}${randomHex}`.toUpperCase()
  const formattedKey = rawKey.match(/.{1,4}/g)?.join("-")

  return formattedKey || rawKey
}

async function main() {
  const hashedPassword = await bcrypt.hash(seedUserPassword, 12);

  const user = await prisma.user.upsert({
    where: { email: seedUserEmail },
    update: { name: seedUserName },
    create: {
      id: DEFAULT_USER_ID,
      email: seedUserEmail,
      name: seedUserName,
      password: hashedPassword,
      role: "OWNER",
    },
    select: { id: true, email: true, role: true },
  });

  const license = await prisma.license.upsert({
    where: { userId: user.id },
    update: { licenseKey: generateLicenseKey() },
    create: {
      userId: user.id,
      licenseKey: generateLicenseKey(),
      expiresAt: new Date("2100-01-01T00:00:00Z")
    }
  })

  // Seed default behaviour profiles
  const behaviours = await Promise.all([
    prisma.behaviourProfile.upsert({
      where: { id: "seed-behaviour-reader" },
      update: {},
      create: {
        id: "seed-behaviour-reader",
        userId: user.id,
        name: "Default Reader",
        type: "DEFAULT_READER",
        minDwellSeconds: 15,
        maxDwellSeconds: 90,
        minScrollCount: 3,
        maxScrollCount: 10,
        scrollSpeedMin: 150,
        scrollSpeedMax: 400,
      },
    }),
    prisma.behaviourProfile.upsert({
      where: { id: "seed-behaviour-scanner" },
      update: {},
      create: {
        id: "seed-behaviour-scanner",
        userId: user.id,
        name: "Quick Scanner",
        type: "QUICK_SCANNER",
        minDwellSeconds: 5,
        maxDwellSeconds: 20,
        minScrollCount: 1,
        maxScrollCount: 3,
        scrollSpeedMin: 50,
        scrollSpeedMax: 150,
      },
    }),
    prisma.behaviourProfile.upsert({
      where: { id: "seed-behaviour-engager" },
      update: {},
      create: {
        id: "seed-behaviour-engager",
        userId: user.id,
        name: "Deep Engager",
        type: "DEEP_ENGAGER",
        minDwellSeconds: 60,
        maxDwellSeconds: 300,
        minScrollCount: 5,
        maxScrollCount: 20,
        scrollSpeedMin: 200,
        scrollSpeedMax: 600,
        enableInternalNav: true,
        maxInternalClicks: 3,
      },
    }),
  ]);

  // Seed default fingerprint profile
  const fingerprint = await prisma.fingerprintProfile.upsert({
    where: { id: "seed-fingerprint-default" },
    update: {},
    create: {
      id: "seed-fingerprint-default",
      userId: user.id,
      name: "Default Desktop Chrome",
      deviceType: "DESKTOP",
      osName: "WINDOWS",
      osVersion: "10",
      browserName: "CHROME",
      browserVersion: "120.0.0.0",
      language: "en-US",
      languages: ["en-US", "en"],
      timezone: "America/New_York",
      locale: "en-US",
      viewportWidth: 1280,
      viewportHeight: 720,
      deviceScaleFactor: 1.0,
      hardwareConcurrency: 8,
      deviceMemory: 8,
    },
  });

  console.log(JSON.stringify({
    success: true,
    seededUser: user,
    seederLicense: license,
    seededBehaviours: behaviours.map(b => ({ id: b.id, name: b.name })),
    seededFingerprint: { id: fingerprint.id, name: fingerprint.name },
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
